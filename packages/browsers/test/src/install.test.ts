/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import childProcess from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import {syncBuiltinESMExports} from 'node:module';
import type {AddressInfo} from 'node:net';
import os from 'node:os';
import path from 'node:path';

import sinon from 'sinon';

import {executablePathByBrowser} from '../../lib/browser-data/browser-data.js';
import {internalConstantsForTesting as fileUtilConstants} from '../../lib/fileUtil.js';
import {IncompleteInstallationError} from '../../lib/install.js';
import {
  INSTALL_MARKER_FILE,
  writeInstallMarker,
} from '../../lib/installMarker.js';
import {internalConstantsForTesting} from '../../lib/installStaging.js';
import {
  Browser,
  BrowserPlatform,
  Cache,
  install,
  type BrowserProvider,
  type DownloadOptions,
} from '../../lib/main.js';

import {createTestZipBuffer, testZipEntries} from './zip.js';

describe('install', () => {
  let tmpDir: string;
  let archive: Buffer;
  let server: http.Server;
  let serverUrl: URL;

  before(async () => {
    archive = createTestZipBuffer(testZipEntries);
    server = http.createServer((request, response) => {
      if (request.url === '/invalid.zip') {
        response.writeHead(200, {'content-length': 7});
        response.end('invalid');
        return;
      }
      if (request.url !== '/test.zip' && request.url !== '/test.dmg') {
        response.writeHead(404).end();
        return;
      }
      response.writeHead(200, {'content-length': archive.length});
      response.end(archive);
    });
    await new Promise<void>(resolve => {
      server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address() as AddressInfo;
    serverUrl = new URL(`http://127.0.0.1:${address.port}/test.zip`);
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close(error => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  });

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer-staging-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 500,
    });
  });

  it('publishes a completed tree with an install marker', async () => {
    const provider = new TestProvider(serverUrl);

    const installedBrowser = await install({
      cacheDir: tmpDir,
      browser: Browser.CHROME,
      platform: BrowserPlatform.LINUX,
      buildId: '123',
      buildIdAlias: 'latest',
      providers: [provider],
      baseUrl: serverUrl.origin,
    });

    assert.strictEqual(
      fs.readFileSync(installedBrowser.executablePath, 'utf8'),
      '#!/bin/sh\necho chrome\n',
    );
    assert.deepStrictEqual(
      JSON.parse(
        fs.readFileSync(
          path.join(installedBrowser.path, INSTALL_MARKER_FILE),
          'utf8',
        ),
      ),
      {version: 1, relativeExecutablePath: path.join('browser', 'chrome')},
    );
    assert.deepStrictEqual(
      fs.readdirSync(path.join(tmpDir, Browser.CHROME, '.staging')),
      [],
    );
    assert.strictEqual(
      new Cache(tmpDir).readExecutablePath(
        Browser.CHROME,
        BrowserPlatform.LINUX,
        '123',
      ),
      path.join('browser', 'chrome'),
    );
    assert.strictEqual(
      new Cache(tmpDir).resolveAlias(Browser.CHROME, 'latest'),
      '123',
    );
  });

  it('uses the install marker on a cache hit without asking for a new executable path', async () => {
    const provider = new TestProvider(serverUrl);
    const options = {
      cacheDir: tmpDir,
      browser: Browser.CHROME,
      platform: BrowserPlatform.LINUX,
      buildId: '123',
      providers: [provider],
      baseUrl: serverUrl.origin,
    };
    const first = await install(options);
    const second = await install(options);

    assert.strictEqual(second.executablePath, first.executablePath);
    assert.strictEqual(provider.executablePathCalls, 1);
  });

  it('converges concurrent installs on a completed tree', async () => {
    const firstProvider = new TestProvider(serverUrl);
    const secondProvider = new TestProvider(serverUrl);
    const options = {
      cacheDir: tmpDir,
      browser: Browser.CHROME,
      platform: BrowserPlatform.LINUX,
      buildId: '123',
      baseUrl: serverUrl.origin,
    };

    const [first, second] = await Promise.all([
      install({...options, providers: [firstProvider]}),
      install({...options, providers: [secondProvider]}),
    ]);

    assert.strictEqual(first.path, second.path);
    assert.strictEqual(
      fs.readFileSync(first.executablePath, 'utf8'),
      '#!/bin/sh\necho chrome\n',
    );
    assert.deepStrictEqual(
      fs.readdirSync(path.join(tmpDir, Browser.CHROME, '.staging')),
      [],
    );
  });

  it('rejects an invalid build ID before creating an archive download attempt', async () => {
    const provider = new TestProvider(serverUrl);

    await assert.rejects(
      install({
        cacheDir: tmpDir,
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: '../outside',
        providers: [provider],
        baseUrl: serverUrl.origin,
        unpack: false,
      }),
      /Invalid buildId/,
    );

    assert.deepStrictEqual(
      fs.readdirSync(path.join(tmpDir, Browser.CHROME)),
      [],
    );
    assert.strictEqual(provider.executablePathCalls, 0);
  });

  it('publishes an archive without exposing the private download path', async () => {
    const archivePath = await install({
      cacheDir: tmpDir,
      browser: Browser.CHROME,
      platform: BrowserPlatform.LINUX,
      buildId: '123',
      providers: [new TestProvider(serverUrl)],
      baseUrl: serverUrl.origin,
      unpack: false,
    });

    assert.deepStrictEqual(fs.readFileSync(archivePath), archive);
    assert.deepStrictEqual(
      fs.readdirSync(path.join(tmpDir, Browser.CHROME, '.staging')),
      [],
    );
  });

  it('accepts a legacy installation without backfilling a marker', async () => {
    const cache = new Cache(tmpDir);
    const installationDir = cache.installationDir(
      Browser.CHROME,
      BrowserPlatform.LINUX,
      '123',
    );
    const relativeExecutablePath = path.join('browser', 'chrome');
    const executablePath = path.join(installationDir, relativeExecutablePath);
    fs.mkdirSync(path.dirname(executablePath), {recursive: true});
    fs.writeFileSync(executablePath, 'legacy');
    cache.writeExecutablePath(
      Browser.CHROME,
      BrowserPlatform.LINUX,
      '123',
      relativeExecutablePath,
    );

    const installedBrowser = await install({
      cacheDir: tmpDir,
      browser: Browser.CHROME,
      platform: BrowserPlatform.LINUX,
      buildId: '123',
      providers: [new TestProvider(serverUrl)],
      baseUrl: serverUrl.origin,
    });

    assert.strictEqual(installedBrowser.executablePath, executablePath);
    assert.strictEqual(
      fs.existsSync(path.join(installationDir, INSTALL_MARKER_FILE)),
      false,
    );
  });

  for (const withMarker of [false, true]) {
    it(`accepts an existing ${withMarker ? 'completed' : 'legacy'} installation junction`, async () => {
      const cache = new Cache(tmpDir);
      const installationDir = cache.installationDir(
        Browser.CHROME,
        BrowserPlatform.LINUX,
        '123',
      );
      const target = path.join(tmpDir, 'external');
      const relativeExecutablePath = path.join('browser', 'chrome');
      const executablePath = path.join(target, relativeExecutablePath);
      fs.mkdirSync(path.dirname(executablePath), {recursive: true});
      fs.writeFileSync(executablePath, 'existing');
      if (withMarker) {
        writeInstallMarker(target, relativeExecutablePath);
      } else {
        cache.writeExecutablePath(
          Browser.CHROME,
          BrowserPlatform.LINUX,
          '123',
          relativeExecutablePath,
        );
      }
      fs.mkdirSync(cache.browserRoot(Browser.CHROME), {recursive: true});
      fs.symlinkSync(target, installationDir, 'junction');
      const markerPath = path.join(target, INSTALL_MARKER_FILE);
      const marker = withMarker ? fs.readFileSync(markerPath) : undefined;
      const provider = new TestProvider(serverUrl);

      const browser = await install({
        cacheDir: tmpDir,
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: '123',
        providers: [provider],
        baseUrl: serverUrl.origin,
      });

      assert.strictEqual(
        browser.executablePath,
        path.join(installationDir, relativeExecutablePath),
      );
      assert.strictEqual(fs.lstatSync(installationDir).isSymbolicLink(), true);
      assert.strictEqual(
        fs.realpathSync(browser.path),
        fs.realpathSync(target),
      );
      assert.strictEqual(fs.readFileSync(executablePath, 'utf8'), 'existing');
      if (withMarker) {
        assert.deepStrictEqual(fs.readFileSync(markerPath), marker);
      } else {
        assert.strictEqual(fs.existsSync(markerPath), false);
      }
      assert.strictEqual(provider.executablePathCalls, 0);
      assert.strictEqual(
        fs.existsSync(path.join(cache.browserRoot(Browser.CHROME), '.staging')),
        false,
      );
    });
  }

  it('rejects an installation junction appearing during install without provider fallback', async () => {
    const cache = new Cache(tmpDir);
    const installationDir = cache.installationDir(
      Browser.CHROME,
      BrowserPlatform.LINUX,
      '123',
    );
    const target = path.join(tmpDir, 'external');
    const relativeExecutablePath = path.join('browser', 'chrome');
    const executablePath = path.join(target, relativeExecutablePath);
    fs.mkdirSync(path.dirname(executablePath), {recursive: true});
    fs.writeFileSync(executablePath, 'existing');
    writeInstallMarker(target, relativeExecutablePath);
    const markerPath = path.join(target, INSTALL_MARKER_FILE);
    const marker = fs.readFileSync(markerPath);
    const firstProvider = new TestProvider(serverUrl, () => {
      // The initial cache lookup has already observed no installation.
      fs.symlinkSync(target, installationDir, 'junction');
    });
    const fallbackProvider = new TestProvider(serverUrl);

    await assert.rejects(
      install({
        cacheDir: tmpDir,
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: '123',
        providers: [firstProvider, fallbackProvider],
        baseUrl: serverUrl.origin,
      }),
      (error: unknown) => {
        assert.ok(error instanceof IncompleteInstallationError);
        assert.match(
          error.message,
          /Installation path is not a regular directory/,
        );
        return true;
      },
    );

    assert.strictEqual(fallbackProvider.supportsCalls, 0);
    assert.strictEqual(fs.lstatSync(installationDir).isSymbolicLink(), true);
    assert.strictEqual(
      fs.realpathSync(installationDir),
      fs.realpathSync(target),
    );
    assert.strictEqual(fs.readFileSync(executablePath, 'utf8'), 'existing');
    assert.deepStrictEqual(fs.readFileSync(markerPath), marker);
    assert.deepStrictEqual(
      fs.readdirSync(path.join(cache.browserRoot(Browser.CHROME), '.staging')),
      [],
    );
  });

  it('removes a stale global custom path for a new default-layout tree', async () => {
    const cache = new Cache(tmpDir);
    const installationDir = cache.installationDir(
      Browser.CHROME,
      BrowserPlatform.LINUX,
      '123',
    );
    const relativeExecutablePath = executablePathByBrowser[Browser.CHROME](
      BrowserPlatform.LINUX,
      '123',
    );
    const executablePath = path.join(installationDir, relativeExecutablePath);
    fs.mkdirSync(path.dirname(executablePath), {recursive: true});
    fs.writeFileSync(executablePath, 'browser');
    writeInstallMarker(installationDir, relativeExecutablePath);
    cache.writeExecutablePath(
      Browser.CHROME,
      BrowserPlatform.LINUX,
      '123',
      path.join('stale', 'browser'),
    );

    await install({
      cacheDir: tmpDir,
      browser: Browser.CHROME,
      platform: BrowserPlatform.LINUX,
      buildId: '123',
      providers: [new TestProvider(serverUrl)],
      baseUrl: serverUrl.origin,
    });

    assert.strictEqual(
      cache.readExecutablePath(Browser.CHROME, BrowserPlatform.LINUX, '123'),
      null,
    );
  });

  it('treats an invalid install marker as terminal without provider fallback', async () => {
    const cache = new Cache(tmpDir);
    const installationDir = cache.installationDir(
      Browser.CHROME,
      BrowserPlatform.LINUX,
      '123',
    );
    fs.mkdirSync(installationDir, {recursive: true});
    fs.writeFileSync(
      path.join(installationDir, INSTALL_MARKER_FILE),
      JSON.stringify({
        version: 2,
        relativeExecutablePath: path.join('browser', 'chrome'),
      }),
    );
    const firstProvider = new TestProvider(serverUrl);
    const secondProvider = new TestProvider(serverUrl);

    await assert.rejects(
      install({
        cacheDir: tmpDir,
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: '123',
        providers: [firstProvider, secondProvider],
        baseUrl: serverUrl.origin,
      }),
      IncompleteInstallationError,
    );
    assert.strictEqual(firstProvider.supportsCalls, 1);
    assert.strictEqual(secondProvider.supportsCalls, 0);
    assert.strictEqual(fs.existsSync(installationDir), true);
  });

  it('keeps a tree when post-publication global metadata reconciliation fails', async () => {
    const cache = new Cache(tmpDir);
    fs.mkdirSync(cache.metadataFile(Browser.CHROME), {recursive: true});
    const installationDir = cache.installationDir(
      Browser.CHROME,
      BrowserPlatform.LINUX,
      '123',
    );
    const firstProvider = new TestProvider(serverUrl);
    const secondProvider = new TestProvider(serverUrl);

    await assert.rejects(
      install({
        cacheDir: tmpDir,
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: '123',
        providers: [firstProvider, secondProvider],
        baseUrl: serverUrl.origin,
      }),
    );
    assert.strictEqual(firstProvider.supportsCalls, 1);
    // Fallback could fail on the same metadata, so rejection alone does not
    // prove that the post-publication error is terminal.
    assert.strictEqual(secondProvider.supportsCalls, 0);
    assert.strictEqual(
      fs.existsSync(path.join(installationDir, INSTALL_MARKER_FILE)),
      true,
    );
    assert.strictEqual(
      fs.existsSync(path.join(installationDir, 'browser', 'chrome')),
      true,
    );
  });

  it('does not replace install success with an attempt cleanup error', async () => {
    const originalRm = internalConstantsForTesting.rm;
    const messages: string[] = [];
    internalConstantsForTesting.rm = async () => {
      throw new Error('cleanup failed');
    };
    try {
      const installedBrowser = await install({
        cacheDir: tmpDir,
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: '123',
        providers: [new TestProvider(serverUrl)],
        baseUrl: serverUrl.origin,
        logger: () => {
          return (...args: unknown[]) => {
            messages.push(args.join(' '));
          };
        },
      });

      assert.strictEqual(fs.existsSync(installedBrowser.executablePath), true);
      assert.ok(
        messages.some(message => {
          return message.includes('cleanup failed');
        }),
      );
    } finally {
      internalConstantsForTesting.rm = originalRm;
    }
  });

  it('publishes a completed DMG tree when detach retries are exhausted', async () => {
    const originalDmgExecFile = fileUtilConstants.dmgExecFile;
    const originalDmgReaddir = fileUtilConstants.dmgReaddir;
    const originalDelay = fileUtilConstants.delay;
    let detachCalls = 0;
    const messages: string[] = [];
    fileUtilConstants.dmgReaddir = async () => {
      return ['Browser.app'];
    };
    fileUtilConstants.delay = async () => {};
    fileUtilConstants.dmgExecFile = async (file, args) => {
      if (file === 'cp') {
        const outputPath = args[2]!;
        fs.mkdirSync(path.join(outputPath, 'browser'), {recursive: true});
        fs.writeFileSync(path.join(outputPath, 'browser', 'chrome'), 'browser');
        return {stdout: '', stderr: ''};
      }
      if (args[0] === 'attach') {
        return {stdout: '/dev/disk1\t/Volumes/Browser\n', stderr: ''};
      }
      if (args[0] === 'detach') {
        ++detachCalls;
        throw new Error('resource busy');
      }
      throw new Error(`Unexpected command: ${file} ${args.join(' ')}`);
    };

    try {
      const installedBrowser = await install({
        cacheDir: tmpDir,
        browser: Browser.CHROME,
        platform: BrowserPlatform.MAC,
        buildId: '123',
        providers: [new TestProvider(new URL('/test.dmg', serverUrl))],
        baseUrl: serverUrl.origin,
        logger: () => {
          return (...args: unknown[]) => {
            messages.push(args.join(' '));
          };
        },
      });

      assert.strictEqual(
        fs.readFileSync(installedBrowser.executablePath, 'utf8'),
        'browser',
      );
      assert.strictEqual(detachCalls, 3);
      assert.strictEqual(
        fs.readdirSync(path.join(tmpDir, Browser.CHROME, '.staging')).length,
        1,
      );
      assert.ok(
        messages.some(message => {
          return message.includes('Retaining DMG mount');
        }),
      );
    } finally {
      fileUtilConstants.dmgExecFile = originalDmgExecFile;
      fileUtilConstants.dmgReaddir = originalDmgReaddir;
      fileUtilConstants.delay = originalDelay;
    }
  });

  it('does not try another provider after copy and detach both fail', async () => {
    const originalDmgExecFile = fileUtilConstants.dmgExecFile;
    const originalDmgReaddir = fileUtilConstants.dmgReaddir;
    const originalDelay = fileUtilConstants.delay;
    const firstProvider = new TestProvider(new URL('/test.dmg', serverUrl));
    const secondProvider = new TestProvider(serverUrl);
    const copyError = new Error('copy failed');
    fileUtilConstants.dmgReaddir = async () => {
      return ['Browser.app'];
    };
    fileUtilConstants.delay = async () => {};
    fileUtilConstants.dmgExecFile = async (file, args) => {
      if (file === 'cp') {
        throw copyError;
      }
      if (args[0] === 'attach') {
        return {stdout: '/dev/disk1\t/Volumes/Browser\n', stderr: ''};
      }
      if (args[0] === 'detach') {
        throw new Error('resource busy');
      }
      throw new Error(`Unexpected command: ${file} ${args.join(' ')}`);
    };

    try {
      await assert.rejects(
        install({
          cacheDir: tmpDir,
          browser: Browser.CHROME,
          platform: BrowserPlatform.MAC,
          buildId: '123',
          providers: [firstProvider, secondProvider],
          baseUrl: serverUrl.origin,
        }),
        (error: unknown) => {
          assert.ok(error instanceof Error);
          assert.match(error.message, /copy failed/);
          assert.strictEqual(
            (error as Error & {cause?: unknown}).cause,
            copyError,
          );
          return true;
        },
      );
      assert.strictEqual(firstProvider.supportsCalls, 1);
      assert.strictEqual(secondProvider.supportsCalls, 0);
      assert.strictEqual(
        fs.readdirSync(path.join(tmpDir, Browser.CHROME, '.staging')).length,
        1,
      );
    } finally {
      fileUtilConstants.dmgExecFile = originalDmgExecFile;
      fileUtilConstants.dmgReaddir = originalDmgReaddir;
      fileUtilConstants.delay = originalDelay;
    }
  });

  it('cleans a failed attempt before provider fallback', async function () {
    this.timeout(30_000);
    const invalidUrl = new URL('/invalid.zip', serverUrl);
    const stagingPath = path.join(tmpDir, Browser.CHROME, '.staging');
    const fallbackProvider = new TestProvider(serverUrl);
    let stagingAtFallback: string[] | undefined;
    const supports = fallbackProvider.supports.bind(fallbackProvider);
    fallbackProvider.supports = options => {
      stagingAtFallback = fs.readdirSync(stagingPath);
      return supports(options);
    };

    const installedBrowser = await install({
      cacheDir: tmpDir,
      browser: Browser.CHROME,
      platform: BrowserPlatform.LINUX,
      buildId: '123',
      providers: [new TestProvider(invalidUrl), fallbackProvider],
      baseUrl: serverUrl.origin,
    });

    assert.deepStrictEqual(stagingAtFallback, []);
    assert.strictEqual(fs.existsSync(installedBrowser.executablePath), true);
    assert.deepStrictEqual(fs.readdirSync(stagingPath), []);
  });

  it('rejects an ambiguous marker-less final and preserves it', async () => {
    const cache = new Cache(tmpDir);
    const installationDir = cache.installationDir(
      Browser.CHROME,
      BrowserPlatform.LINUX,
      '123',
    );
    const firstProvider = new TestProvider(serverUrl, () => {
      fs.mkdirSync(installationDir, {recursive: true});
    });
    const secondProvider = new TestProvider(serverUrl);

    await assert.rejects(
      install({
        cacheDir: tmpDir,
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: '123',
        providers: [firstProvider, secondProvider],
        baseUrl: serverUrl.origin,
      }),
      IncompleteInstallationError,
    );
    assert.strictEqual(firstProvider.supportsCalls, 1);
    // Fallback could report the same error type when inspecting the final,
    // so rejection alone does not prove that the publication error is terminal.
    assert.strictEqual(secondProvider.supportsCalls, 0);
    assert.strictEqual(fs.existsSync(installationDir), true);
    assert.strictEqual(
      fs.existsSync(path.join(installationDir, INSTALL_MARKER_FILE)),
      false,
    );
  });

  describe('Windows setup', () => {
    let setup: sinon.SinonStub;
    let prepareOutput: (outputPath: string) => void;

    beforeEach(() => {
      sinon.stub(os, 'platform').returns('win32');
      sinon.stub(os, 'arch').returns('x64');
      setup = sinon.stub(childProcess, 'spawnSync').returns({
        pid: 0,
        output: [],
        stdout: Buffer.alloc(0),
        stderr: Buffer.alloc(0),
        status: 0,
        signal: null,
      });
      syncBuiltinESMExports();
      prepareOutput = outputPath => {
        fs.mkdirSync(path.join(outputPath, 'browser'), {recursive: true});
        fs.writeFileSync(path.join(outputPath, 'browser', 'chrome'), 'browser');
        fs.writeFileSync(
          path.join(outputPath, 'browser', 'setup.exe'),
          'setup',
        );
      };
      sinon.stub(fileUtilConstants, 'dmgReaddir').resolves(['Browser.app']);
      sinon
        .stub(fileUtilConstants, 'dmgExecFile')
        .callsFake(async (file, args) => {
          if (file === 'cp') {
            prepareOutput(args[2]!);
          } else if (args[0] === 'attach') {
            return {stdout: '/dev/disk1\t/Volumes/Browser\n', stderr: ''};
          } else if (args[0] !== 'detach') {
            throw new Error(`Unexpected command: ${file} ${args.join(' ')}`);
          }
          return {stdout: '', stderr: ''};
        });
    });

    afterEach(() => {
      sinon.restore();
      syncBuiltinESMExports();
    });

    function installForWindows(
      relativeExecutablePath = path.join('browser', 'chrome'),
    ) {
      const provider = new TestProvider(new URL('/test.dmg', serverUrl));
      provider.getExecutablePath = () => {
        return relativeExecutablePath;
      };
      return install({
        cacheDir: tmpDir,
        browser: Browser.CHROME,
        platform: BrowserPlatform.WIN64,
        buildId: '123',
        providers: [provider],
        baseUrl: serverUrl.origin,
      });
    }

    it('rejects an escaping executable path before invoking setup', async () => {
      const outside = path.join(tmpDir, 'outside');
      prepareOutput(outside);
      await assert.rejects(
        installForWindows(
          path.join('..', '..', '..', '..', 'outside', 'browser', 'chrome'),
        ),
        /escapes the installation root/,
      );
      assert.strictEqual(setup.called, false);
    });

    it('rejects an executable outside the tree through a junction before setup', async () => {
      const outside = path.join(tmpDir, 'outside');
      prepareOutput(outside);
      prepareOutput = outputPath => {
        fs.symlinkSync(
          path.join(outside, 'browser'),
          path.join(outputPath, 'browser'),
          'junction',
        );
      };
      await assert.rejects(installForWindows(), /resolves outside/);
      assert.strictEqual(setup.called, false);
    });

    it('rejects a setup helper resolving outside the tree', async () => {
      const prepare = prepareOutput;
      prepareOutput = outputPath => {
        prepare(outputPath);
        sinon
          .stub(fs, 'realpathSync')
          .callThrough()
          .withArgs(path.join(outputPath, 'browser', 'setup.exe'))
          .returns(path.join(tmpDir, 'outside', 'setup.exe'));
      };
      await assert.rejects(installForWindows(), /resolves outside/);
      assert.strictEqual(setup.called, false);
    });

    it('rejects a setup helper that is not a regular file', async () => {
      prepareOutput = outputPath => {
        fs.mkdirSync(path.join(outputPath, 'browser', 'setup.exe'), {
          recursive: true,
        });
        fs.writeFileSync(path.join(outputPath, 'browser', 'chrome'), 'browser');
      };
      await assert.rejects(installForWindows(), /not a regular file/);
      assert.strictEqual(setup.called, false);
    });

    it('runs setup before writing the completion marker and publishing', async () => {
      let stagedPath: string | undefined;
      setup.callsFake((file: string, args: string[]) => {
        stagedPath = path.dirname(path.dirname(file));
        assert.deepStrictEqual(args, [
          `--configure-browser-in-directory=${path.dirname(file)}`,
        ]);
        assert.strictEqual(
          fs.existsSync(path.join(stagedPath, INSTALL_MARKER_FILE)),
          false,
        );
        assert.strictEqual(
          fs.existsSync(path.join(tmpDir, 'chrome', 'win64-123')),
          false,
        );
        return {status: 0};
      });
      const browser = await installForWindows();
      assert.strictEqual(setup.calledOnce, true);
      assert.ok(stagedPath);
      assert.strictEqual(fs.existsSync(stagedPath), false);
      assert.strictEqual(
        fs.existsSync(path.join(browser.path, INSTALL_MARKER_FILE)),
        true,
      );
    });

    it('revalidates the executable after setup before writing the marker', async () => {
      setup.callsFake((file: string) => {
        fs.unlinkSync(path.join(path.dirname(file), 'chrome'));
        return {status: 0};
      });
      await assert.rejects(installForWindows(), /ENOENT/);
      assert.strictEqual(setup.calledOnce, true);
      assert.strictEqual(
        fs.existsSync(path.join(tmpDir, 'chrome', 'win64-123')),
        false,
      );
    });

    it('allows an installation without a setup helper', async () => {
      const prepare = prepareOutput;
      prepareOutput = outputPath => {
        prepare(outputPath);
        fs.unlinkSync(path.join(outputPath, 'browser', 'setup.exe'));
      };
      const browser = await installForWindows();
      assert.strictEqual(setup.called, false);
      assert.strictEqual(fs.existsSync(browser.executablePath), true);
    });

    it('validates the setup helper on a legacy cache hit', async () => {
      const cache = new Cache(tmpDir);
      const finalPath = cache.installationDir(
        Browser.CHROME,
        BrowserPlatform.WIN64,
        '123',
      );
      prepareOutput(finalPath);
      cache.writeExecutablePath(
        Browser.CHROME,
        BrowserPlatform.WIN64,
        '123',
        path.join('browser', 'chrome'),
      );
      sinon
        .stub(fs, 'realpathSync')
        .callThrough()
        .withArgs(path.join(finalPath, 'browser', 'setup.exe'))
        .returns(path.join(tmpDir, 'outside', 'setup.exe'));
      await assert.rejects(installForWindows(), /resolves outside/);
      assert.strictEqual(setup.called, false);
      assert.strictEqual(
        fs.existsSync(path.join(finalPath, 'browser', 'chrome')),
        true,
      );
    });
  });

  class TestProvider implements BrowserProvider {
    executablePathCalls = 0;
    supportsCalls = 0;

    #url: URL;
    #beforeExecutablePath?: () => void;

    constructor(url: URL, beforeExecutablePath?: () => void) {
      this.#url = url;
      this.#beforeExecutablePath = beforeExecutablePath;
    }

    supports(_options: DownloadOptions): boolean {
      this.supportsCalls++;
      return true;
    }

    getDownloadUrl(_options: DownloadOptions): URL {
      return this.#url;
    }

    getExecutablePath(_options: DownloadOptions): string {
      this.executablePathCalls++;
      this.#beforeExecutablePath?.();
      return path.join('browser', 'chrome');
    }

    getName(): string {
      return 'TestProvider';
    }
  }
});
