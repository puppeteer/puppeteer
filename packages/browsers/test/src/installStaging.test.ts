/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import childProcess, {spawn} from 'node:child_process';
import {once} from 'node:events';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import http from 'node:http';
import {syncBuiltinESMExports} from 'node:module';
import type {AddressInfo} from 'node:net';
import os from 'node:os';
import path from 'node:path';
import {mock} from 'node:test';
import {setTimeout} from 'node:timers/promises';
import {crc32} from 'node:zlib';

import {IncompleteInstallationError} from '../../lib/install.js';
import {
  Browser,
  BrowserPlatform,
  Cache,
  getInstalledBrowsers,
  install,
} from '../../lib/main.js';
import type {BrowserProvider} from '../../lib/provider.js';

function zip(entries: Array<[string, string, number?]>): Buffer {
  const local: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const [name, contents, compression = 0] of entries) {
    const filename = Buffer.from(name);
    const data = Buffer.from(contents);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(compression, 8);
    header.writeUInt32LE(crc32(data), 14);
    header.writeUInt32LE(data.length, 18);
    header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(filename.length, 26);
    const directory = Buffer.alloc(46);
    directory.writeUInt32LE(0x02014b50);
    directory.writeUInt16LE(20, 4);
    directory.writeUInt16LE(20, 6);
    directory.writeUInt16LE(compression, 10);
    directory.writeUInt32LE(crc32(data), 16);
    directory.writeUInt32LE(data.length, 20);
    directory.writeUInt32LE(data.length, 24);
    directory.writeUInt16LE(filename.length, 28);
    directory.writeUInt32LE(offset, 42);
    local.push(header, filename, data);
    central.push(directory, filename);
    offset += header.length + filename.length + data.length;
  }
  const index = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(index.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, index, end]);
}

const executable = 'chrome-linux64/chrome';
const resource = 'chrome-linux64/resources.pak';
const archive = zip([
  [executable, 'executable'],
  [resource, 'complete resource'],
]);
const corruptArchive = zip([
  [executable, 'executable'],
  [resource, 'unsupported entry', 99],
]);

async function waitForPartial(cacheDir: string): Promise<void> {
  for (let attempt = 0; attempt < 500; attempt++) {
    if (fs.existsSync(cacheDir)) {
      for (const entry of fs.readdirSync(cacheDir, {
        recursive: true,
        withFileTypes: true,
      })) {
        if (
          entry.isFile() &&
          entry.name.endsWith('.zip') &&
          fs.statSync(path.join(entry.parentPath, entry.name)).size > 0
        ) {
          return;
        }
      }
    }
    await setTimeout(10);
  }
  throw new Error('The gated download did not write its partial archive');
}

describe('Installation staging', function () {
  this.timeout(20000);
  let cacheDir: string;
  let server: http.Server;
  let baseUrl: string;
  let originalEnv: NodeJS.ProcessEnv;
  const buildId = '123.0.0.0';

  beforeEach(async () => {
    cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer-staging-'));
    originalEnv = {...process.env};
    process.env['PATH'] = '';
    process.env['SystemRoot'] = path.join(cacheDir, 'no-native-archivers');
    server = http.createServer();
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterEach(async () => {
    for (const key of ['PATH', 'SystemRoot']) {
      if (originalEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnv[key];
      }
    }
    server.closeAllConnections();
    await new Promise<void>(resolve => {
      server.close(() => {
        resolve();
      });
    });
    new Cache(cacheDir).clear();
  });

  const options = () => {
    return {
      cacheDir,
      browser: Browser.CHROME,
      platform: BrowserPlatform.LINUX,
      buildId,
      baseUrl,
    };
  };

  const gateFirstDownload = (data = archive) => {
    let held: http.ServerResponse;
    let requests = 0;
    server.on('request', (_request, response) => {
      requests++;
      response.writeHead(200, {'Content-Length': data.length});
      if (requests === 1) {
        held = response;
        response.write(data.subarray(0, 50));
      } else {
        response.end(data);
      }
    });
    return {
      release() {
        held.end(data.subarray(50));
      },
      disconnect() {
        held.destroy();
      },
      requests() {
        return requests;
      },
    };
  };

  it('publishes complete installations for concurrent callers', async () => {
    const gate = gateFirstDownload();
    const first = install(options()).catch(error => {
      return error as Error;
    });
    await waitForPartial(cacheDir);
    let second;
    try {
      second = await install(options());
      assert.strictEqual(
        fs.readFileSync(path.join(second.path, resource), 'utf8'),
        'complete resource',
      );
    } finally {
      gate.release();
      await first;
    }
    const result = await first;
    assert.ok(!(result instanceof Error));
    assert.strictEqual(result.executablePath, second.executablePath);
    assert.strictEqual(gate.requests(), 2);
    assert.deepStrictEqual(fs.readdirSync(path.join(cacheDir, 'chrome')), [
      `linux-${buildId}`,
    ]);
  });

  it('does not expose a partial archive to archive-only callers', async () => {
    const gate = gateFirstDownload();
    const first = install({...options(), unpack: false}).catch(error => {
      return error as Error;
    });
    await waitForPartial(cacheDir);
    let second;
    try {
      second = await install({...options(), unpack: false});
      assert.deepStrictEqual(fs.readFileSync(second), archive);
    } finally {
      gate.release();
      await first;
    }
    assert.strictEqual(await first, second);
  });

  it('retries after an installer is terminated during download', async () => {
    const gate = gateFirstDownload();
    const childScript = path.join(cacheDir, 'installer.mjs');
    fs.writeFileSync(
      childScript,
      `import {install} from ${JSON.stringify(new URL('../../lib/main.js', import.meta.url).href)}; await install(JSON.parse(process.argv[2]));`,
    );
    const child = spawn(
      process.execPath,
      [childScript, JSON.stringify(options())],
      {
        env: originalEnv,
        stdio: 'ignore',
        windowsHide: true,
      },
    );
    const exited = once(child, 'exit');
    try {
      await waitForPartial(cacheDir);
    } finally {
      child.kill();
      await exited;
      gate.disconnect();
    }
    const result = await install(options());
    assert.strictEqual(
      fs.readFileSync(path.join(result.path, resource), 'utf8'),
      'complete resource',
    );
    assert.strictEqual(gate.requests(), 2);
  });

  it('does not reuse a failed extraction containing only its executable', async () => {
    let requests = 0;
    server.on('request', (_request, response) => {
      requests++;
      response.end(requests === 1 ? corruptArchive : archive);
    });
    await assert.rejects(install(options()), /Extraction failed/);
    assert.ok(
      !fs.existsSync(path.join(cacheDir, 'chrome', `linux-${buildId}`)),
    );
    const result = await install(options());
    assert.strictEqual(
      fs.readFileSync(path.join(result.path, resource), 'utf8'),
      'complete resource',
    );
    assert.strictEqual(requests, 2);
  });

  it('reuses and consumes a completed archive-only download', async () => {
    let requests = 0;
    server.on('request', (_request, response) => {
      requests++;
      response.end(archive);
    });
    const downloaded = await install({...options(), unpack: false});
    const result = await install(options());
    assert.ok(fs.existsSync(result.executablePath));
    assert.ok(!fs.existsSync(downloaded));
    assert.strictEqual(requests, 1);
  });

  function provider(name: string, executablePath: string): BrowserProvider {
    return {
      supports: () => {
        return true;
      },
      getName: () => {
        return name;
      },
      getExecutablePath: () => {
        return executablePath;
      },
      getDownloadUrl: () => {
        return new URL(`${baseUrl}/${name}.zip`);
      },
    };
  }

  it('continues to the next provider after a failed extraction', async () => {
    const requests: string[] = [];
    server.on('request', (request, response) => {
      requests.push(request.url!);
      response.end(request.url === '/bad.zip' ? corruptArchive : archive);
    });
    const result = await install({
      ...options(),
      providers: [provider('bad', executable), provider('good', executable)],
    });
    assert.strictEqual(
      fs.readFileSync(path.join(result.path, resource), 'utf8'),
      'complete resource',
    );
    assert.deepStrictEqual(requests, ['/bad.zip', '/good.zip']);
  });

  for (const [defaultLoser, defaultWinner] of [
    [false, false],
    [true, false],
    [false, true],
  ]) {
    it(`returns a competing ${defaultWinner ? 'default' : 'custom'} winner to a ${defaultLoser ? 'default' : 'custom'} provider`, async () => {
      const slowExecutable = defaultLoser ? executable : 'slow/app';
      const slowArchive = zip([[slowExecutable, 'slow executable']]);
      const fastExecutable = defaultWinner ? executable : 'fast/app';
      const fastArchive = zip([[fastExecutable, 'fast executable']]);
      let held: http.ServerResponse;
      server.on('request', (request, response) => {
        if (
          defaultLoser
            ? request.url?.endsWith('/chrome-linux64.zip')
            : request.url === '/slow.zip'
        ) {
          held = response;
          response.writeHead(200, {'Content-Length': slowArchive.length});
          response.write(slowArchive.subarray(0, 50));
        } else {
          response.end(fastArchive);
        }
      });
      const slow = install({
        ...options(),
        providers: defaultLoser
          ? undefined
          : [provider('slow', slowExecutable)],
      }).catch(error => {
        return error as Error;
      });
      await waitForPartial(cacheDir);
      let fast;
      try {
        fast = await install({
          ...options(),
          providers: defaultWinner
            ? undefined
            : [provider('fast', fastExecutable)],
        });
      } finally {
        held!.end(slowArchive.subarray(50));
        await slow;
      }
      const result = await slow;
      assert.ok(!(result instanceof Error));
      assert.strictEqual(result.executablePath, fast.executablePath);
      assert.strictEqual(
        fs.readFileSync(result.executablePath, 'utf8'),
        'fast executable',
      );
      const [discovered] = await getInstalledBrowsers({cacheDir});
      assert.strictEqual(discovered!.executablePath, fast.executablePath);
      if (defaultWinner) {
        assert.ok(!fs.existsSync(path.join(cacheDir, 'chrome', '.metadata')));
      }
    });
  }

  it('continues to the next provider after a download fails', async () => {
    const requests: string[] = [];
    server.on('request', (request, response) => {
      requests.push(request.url!);
      if (request.url === '/bad.zip') {
        response.writeHead(503);
        response.end();
      } else {
        response.end(archive);
      }
    });
    const result = await install({
      ...options(),
      providers: [provider('bad', executable), provider('good', executable)],
    });
    assert.ok(fs.existsSync(result.executablePath));
    assert.deepStrictEqual(requests, ['/bad.zip', '/good.zip']);
    assert.ok(
      !fs.readdirSync(path.join(cacheDir, 'chrome')).some(name => {
        return name.startsWith('.install.');
      }),
    );
  });

  it('continues to the next provider after publication fails', async () => {
    server.on('request', (_request, response) => {
      response.end(archive);
    });
    const fallback = provider('fallback', executable);
    let fallbackCalled = false;
    fallback.supports = () => {
      fallbackCalled = true;
      return true;
    };
    const rename = fsPromises.rename;
    let blocked = false;
    const publish = mock.method(
      fsPromises,
      'rename',
      async (source: fs.PathLike, target: fs.PathLike) => {
        if (
          !blocked &&
          String(target) ===
            new Cache(cacheDir).installationDir(
              Browser.CHROME,
              BrowserPlatform.LINUX,
              buildId,
            )
        ) {
          blocked = true;
          throw Object.assign(new Error('publication denied'), {
            code: 'EACCES',
          });
        }
        return await rename(source, target);
      },
    );
    syncBuiltinESMExports();
    try {
      const result = await install({
        ...options(),
        providers: [provider('blocked', executable), fallback],
      });
      assert.ok(blocked);
      assert.ok(fallbackCalled);
      assert.strictEqual(
        fs.readFileSync(result.executablePath, 'utf8'),
        'executable',
      );
    } finally {
      publish.mock.restore();
      syncBuiltinESMExports();
    }
  });

  for (const invalidPath of ['../outside', '/outside']) {
    it(`rejects a completion marker with executable ${invalidPath}`, async () => {
      server.on('request', (_request, response) => {
        response.end(archive);
      });
      const result = await install(options());
      fs.writeFileSync(
        path.join(result.path, '.puppeteer-installation.json'),
        JSON.stringify({
          version: 1,
          executablePath: invalidPath,
          defaultProvider: true,
        }),
      );
      await assert.rejects(install(options()), IncompleteInstallationError);
      assert.strictEqual(
        fs.readFileSync(result.executablePath, 'utf8'),
        'executable',
      );
    });
  }

  it('preserves a foreign path created while the archive is downloading', async () => {
    const outputPath = path.join(cacheDir, 'chrome', `linux-${buildId}`);
    server.on('request', (_request, response) => {
      fs.writeFileSync(outputPath, 'preserve');
      response.end(archive);
    });
    await assert.rejects(install(options()), IncompleteInstallationError);
    assert.strictEqual(fs.readFileSync(outputPath, 'utf8'), 'preserve');
  });

  it('rejects an executable linked outside the completed installation', async () => {
    server.on('request', (_request, response) => {
      response.end(archive);
    });
    const result = await install(options());
    const outside = path.join(cacheDir, 'outside');
    fs.mkdirSync(outside);
    fs.writeFileSync(path.join(outside, 'app'), 'preserve');
    fs.symlinkSync(outside, path.join(result.path, 'linked'), 'junction');
    fs.writeFileSync(
      path.join(result.path, '.puppeteer-installation.json'),
      JSON.stringify({
        version: 1,
        executablePath: 'linked/app',
        defaultProvider: true,
      }),
    );
    await assert.rejects(install(options()), IncompleteInstallationError);
    assert.strictEqual(
      fs.readFileSync(path.join(outside, 'app'), 'utf8'),
      'preserve',
    );
  });

  it('rejects an executable replaced with a directory', async () => {
    server.on('request', (_request, response) => {
      response.end(archive);
    });
    const result = await install(options());
    fs.unlinkSync(result.executablePath);
    fs.mkdirSync(result.executablePath);
    await assert.rejects(install(options()), IncompleteInstallationError);
    assert.ok(fs.statSync(result.executablePath).isDirectory());
  });

  it('rejects a corrupt completion marker without removing the installation', async () => {
    server.on('request', (_request, response) => {
      response.end(archive);
    });
    const result = await install(options());
    fs.writeFileSync(
      path.join(result.path, '.puppeteer-installation.json'),
      '{',
    );
    await assert.rejects(install(options()), IncompleteInstallationError);
    assert.ok(fs.existsSync(result.executablePath));
  });

  it('preserves an incomplete legacy cache directory', async () => {
    const outputPath = path.join(cacheDir, 'chrome', `linux-${buildId}`);
    fs.mkdirSync(outputPath, {recursive: true});
    fs.writeFileSync(path.join(outputPath, 'existing-data'), 'preserve');
    await assert.rejects(install(options()), IncompleteInstallationError);
    assert.strictEqual(
      fs.readFileSync(path.join(outputPath, 'existing-data'), 'utf8'),
      'preserve',
    );
  });

  it('reuses a custom installation without rewriting unchanged metadata', async () => {
    let requests = 0;
    server.on('request', (_request, response) => {
      requests++;
      response.end(archive);
    });
    const first = await install({
      ...options(),
      providers: [provider('custom', executable)],
    });
    const metadataPath = path.join(cacheDir, 'chrome', '.metadata');
    const metadata = fs.readFileSync(metadataPath, 'utf8');
    const write = mock.method(fs, 'writeFileSync', () => {
      throw Object.assign(new Error('cache is read-only'), {code: 'EACCES'});
    });
    syncBuiltinESMExports();
    try {
      const cached = await install(options());
      assert.strictEqual(cached.executablePath, first.executablePath);
      assert.strictEqual(fs.readFileSync(metadataPath, 'utf8'), metadata);
      assert.strictEqual(requests, 1);
    } finally {
      write.mock.restore();
      syncBuiltinESMExports();
    }
  });

  it('preserves a completed legacy installation from a different provider', async () => {
    let requests = 0;
    server.on('request', (_request, response) => {
      requests++;
      response.end(archive);
    });
    const first = await install({
      ...options(),
      providers: [provider('original', executable)],
    });
    fs.unlinkSync(path.join(first.path, '.puppeteer-installation.json'));
    const metadataPath = path.join(cacheDir, 'chrome', '.metadata');
    const metadata = fs.readFileSync(metadataPath, 'utf8');
    const cached = await install({
      ...options(),
      providers: [provider('different', 'different/app')],
    });
    assert.strictEqual(cached.executablePath, first.executablePath);
    assert.strictEqual(fs.readFileSync(metadataPath, 'utf8'), metadata);
    assert.strictEqual(requests, 1);
  });

  it('continues to the next provider when attempt creation fails', async () => {
    const requests: string[] = [];
    server.on('request', (request, response) => {
      requests.push(request.url!);
      response.end(archive);
    });
    const create = mock.method(fsPromises, 'mkdtemp');
    create.mock.mockImplementationOnce(async () => {
      throw new Error('attempt creation failed');
    });
    syncBuiltinESMExports();
    try {
      const result = await install({
        ...options(),
        providers: [
          provider('first', executable),
          provider('second', executable),
        ],
      });
      assert.ok(fs.existsSync(result.executablePath));
      assert.deepStrictEqual(requests, ['/second.zip']);
    } finally {
      create.mock.restore();
      syncBuiltinESMExports();
    }
  });

  it('publishes an archive when hard links are unsupported', async () => {
    server.on('request', (_request, response) => {
      response.end(archive);
    });
    const link = mock.method(fsPromises, 'link', async () => {
      throw Object.assign(new Error('links unavailable'), {code: 'ENOTSUP'});
    });
    syncBuiltinESMExports();
    try {
      const result = await install({...options(), unpack: false});
      assert.deepStrictEqual(fs.readFileSync(result), archive);
    } finally {
      link.mock.restore();
      syncBuiltinESMExports();
    }
  });

  for (const succeeds of [true, false]) {
    it(`preserves installation ${succeeds ? 'success' : 'failure'} when cleanup and its logger throw`, async () => {
      server.on('request', (_request, response) => {
        response.end(succeeds ? archive : corruptArchive);
      });
      const remove = mock.method(fsPromises, 'rm', async () => {
        throw new Error('cleanup failed');
      });
      syncBuiltinESMExports();
      try {
        const installing = install({
          ...options(),
          logger: () => {
            return message => {
              if (
                typeof message === 'string' &&
                message.startsWith('Could not remove installation staging')
              ) {
                throw new Error('cleanup logger failed');
              }
            };
          },
        });
        if (succeeds) {
          assert.ok(fs.existsSync((await installing).executablePath));
        } else {
          await assert.rejects(installing, /Extraction failed/);
        }
      } finally {
        remove.mock.restore();
        syncBuiltinESMExports();
      }
    });
  }

  it('runs Windows setup again on a completed cache hit', async function () {
    if (process.platform !== 'win32' || process.arch !== 'x64') {
      this.skip();
    }
    const windowsArchive = zip([
      ['chrome-win64/chrome.exe', 'executable'],
      ['chrome-win64/setup.exe', 'setup'],
    ]);
    server.on('request', (_request, response) => {
      response.end(windowsArchive);
    });
    const setup = mock.method(childProcess, 'spawnSync', () => {
      return {status: 0};
    });
    syncBuiltinESMExports();
    try {
      const config = {...options(), platform: BrowserPlatform.WIN64};
      const result = await install(config);
      await install(config);
      assert.strictEqual(setup.mock.callCount(), 2);
      assert.deepStrictEqual(setup.mock.calls[1]!.arguments.slice(0, 2), [
        path.join(path.dirname(result.executablePath), 'setup.exe'),
        [
          `--configure-browser-in-directory=${path.dirname(result.executablePath)}`,
        ],
      ]);
    } finally {
      setup.mock.restore();
      syncBuiltinESMExports();
    }
  });

  it('installs system dependencies again on a completed cache hit', async function () {
    if (process.platform !== 'linux') {
      this.skip();
    }
    server.on('request', (_request, response) => {
      response.end(
        zip([
          [executable, 'executable'],
          ['chrome-linux64/deb.deps', 'libexample'],
        ]),
      );
    });
    const linuxProcess = process as NodeJS.Process & {getuid: () => number};
    const uid = mock.method(linuxProcess, 'getuid', () => {
      return 0;
    });
    const installSystem = mock.method(childProcess, 'spawnSync', () => {
      return {status: 0};
    });
    syncBuiltinESMExports();
    try {
      const config = {...options(), installDeps: true};
      await install(config);
      await install(config);
      assert.strictEqual(installSystem.mock.callCount(), 4);
      assert.deepStrictEqual(
        installSystem.mock.calls[3]!.arguments.slice(0, 2),
        ['apt-get', ['satisfy', '-y', 'libexample', '--no-install-recommends']],
      );
    } finally {
      uid.mock.restore();
      installSystem.mock.restore();
      syncBuiltinESMExports();
    }
  });
});
