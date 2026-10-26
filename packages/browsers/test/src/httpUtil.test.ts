/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

import {downloadFile, getText, headHttpRequest} from '../../lib/httpUtil.js';

describe('downloadFile', function () {
  let tmpDir: string;
  let server: http.Server;
  let serverUrl: URL;

  const testContent = Buffer.from('test browser binary content');
  const correctHash = createHash('sha256').update(testContent).digest('hex');

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer-httputil-test'));
    server = http.createServer((_req, res) => {
      res.writeHead(200, {'Content-Length': String(testContent.length)});
      res.end(testContent);
    });
    await new Promise<void>(resolve => {
      server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address() as {port: number};
    serverUrl = new URL(`http://127.0.0.1:${address.port}/test`);
  });

  afterEach(async () => {
    await new Promise<void>(resolve => {
      server.close(() => {
        return resolve();
      });
    });
    try {
      fs.rmSync(tmpDir, {
        force: true,
        recursive: true,
        maxRetries: 10,
        retryDelay: 500,
      });
    } catch {}
  });

  it('downloads a file without hash verification', async () => {
    const destPath = path.join(tmpDir, 'download.bin');
    await downloadFile(serverUrl, destPath);
    assert.ok(fs.existsSync(destPath));
    assert.deepStrictEqual(fs.readFileSync(destPath), testContent);
  });

  for (const [name, getLocation, expectedPath] of [
    [
      'root-relative',
      () => {
        return '/file.bin';
      },
      '/file.bin',
    ],
    [
      'path-relative',
      () => {
        return 'file.bin';
      },
      '/downloads/file.bin',
    ],
    [
      'parent-relative',
      () => {
        return '../file.bin';
      },
      '/file.bin',
    ],
    [
      'query-relative',
      () => {
        return '?download=1';
      },
      '/downloads/start?download=1',
    ],
    [
      'absolute',
      (url: URL) => {
        return new URL('/file.bin', url).href;
      },
      '/file.bin',
    ],
    [
      'scheme-relative',
      (url: URL) => {
        return `//${url.host}/file.bin`;
      },
      '/file.bin',
    ],
  ] as const) {
    it(`downloads a file through ${name} redirects`, async () => {
      serverUrl = new URL('/downloads/start', serverUrl);
      const requests: string[] = [];
      server.removeAllListeners('request');
      server.on('request', (req, res) => {
        requests.push(req.url!);
        if (requests.length === 1) {
          res.writeHead(302, {Location: getLocation(serverUrl)});
          res.end();
          return;
        }
        res.writeHead(200, {'Content-Length': String(testContent.length)});
        res.end(testContent);
      });

      const destPath = path.join(tmpDir, 'download.bin');
      await downloadFile(serverUrl, destPath);
      assert.deepStrictEqual(requests, ['/downloads/start', expectedPath]);
      assert.deepStrictEqual(fs.readFileSync(destPath), testContent);
    });
  }

  it('resolves each redirect against the current request URL', async () => {
    const requests: string[] = [];
    server.removeAllListeners('request');
    server.on('request', (req, res) => {
      requests.push(req.url!);
      if (req.url === '/test') {
        res.writeHead(301, {Location: '/downloads/start'});
      } else if (req.url === '/downloads/start') {
        res.writeHead(307, {Location: 'file.bin?download=1'});
      } else {
        res.writeHead(200);
        res.end(testContent);
        return;
      }
      res.end();
    });

    assert.strictEqual(await getText(serverUrl), testContent.toString());
    assert.deepStrictEqual(requests, [
      '/test',
      '/downloads/start',
      '/downloads/file.bin?download=1',
    ]);
  });

  it('preserves the HEAD method through a relative redirect', async () => {
    const methods: string[] = [];
    server.removeAllListeners('request');
    server.on('request', (req, res) => {
      methods.push(req.method!);
      res.writeHead(req.url === '/test' ? 308 : 200, {
        Location: '/file.bin',
      });
      res.end();
    });

    assert.strictEqual(await headHttpRequest(serverUrl), true);
    assert.deepStrictEqual(methods, ['HEAD', 'HEAD']);
  });

  describe('when the redirect target is unreachable', () => {
    beforeEach(async () => {
      const closedServer = http.createServer();
      await new Promise<void>(resolve => {
        closedServer.listen(0, '127.0.0.1', resolve);
      });
      const {port} = closedServer.address() as {port: number};
      await new Promise<void>(resolve => {
        closedServer.close(() => {
          return resolve();
        });
      });
      server.removeAllListeners('request');
      server.on('request', (_req, res) => {
        res.writeHead(302, {Location: `http://127.0.0.1:${port}/file.bin`});
        res.end();
      });
    });

    it('rejects downloadFile', async () => {
      await assert.rejects(
        () => {
          return downloadFile(serverUrl, path.join(tmpDir, 'download.bin'));
        },
        {code: 'ECONNREFUSED'},
      );
    });

    it('rejects getText', async () => {
      await assert.rejects(
        () => {
          return getText(serverUrl);
        },
        {code: 'ECONNREFUSED'},
      );
    });

    it('resolves headHttpRequest to false', async () => {
      assert.strictEqual(await headHttpRequest(serverUrl), false);
    });
  });

  it('rejects when the response ends before the content length is reached', async () => {
    await new Promise<void>(resolve => {
      server.close(() => {
        return resolve();
      });
    });
    server = http.createServer((_req, res) => {
      res.writeHead(200, {'Content-Length': String(testContent.length + 1)});
      res.write(testContent, () => {
        res.destroy();
      });
    });
    await new Promise<void>(resolve => {
      server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address() as {port: number};
    serverUrl = new URL(`http://127.0.0.1:${address.port}/test`);

    const destPath = path.join(tmpDir, 'download.bin');
    await assert.rejects(
      () => {
        return downloadFile(serverUrl, destPath);
      },
      (error: Error & {cause?: unknown}) => {
        assert.match(
          error.message,
          /Download failed: expected \d+ bytes, received \d+ bytes/,
        );
        assert.ok(error.cause instanceof Error);
        return true;
      },
    );
    assert.ok(!fs.existsSync(destPath));
  });

  it('closes the response when writing the file fails', async () => {
    await new Promise<void>(resolve => {
      server.close(() => {
        return resolve();
      });
    });
    let resolveResponseClosed!: () => void;
    const responseClosed = new Promise<void>(resolve => {
      resolveResponseClosed = resolve;
    });
    server = http.createServer((_req, res) => {
      res.on('close', resolveResponseClosed);
      res.writeHead(200, {'Content-Length': String(testContent.length + 1)});
      res.write(testContent);
    });
    await new Promise<void>(resolve => {
      server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address() as {port: number};
    serverUrl = new URL(`http://127.0.0.1:${address.port}/test`);

    await assert.rejects(() => {
      return downloadFile(serverUrl, tmpDir);
    });
    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(
            new Error('Response was not closed after the file write failed'),
          );
        }, 1000);
        void responseClosed.then(() => {
          clearTimeout(timeout);
          resolve();
        });
      });
    } finally {
      server.closeAllConnections();
    }
  });

  it('downloads a file and resolves when the hash matches', async () => {
    const destPath = path.join(tmpDir, 'download.bin');
    await downloadFile(serverUrl, destPath, undefined, correctHash);
    assert.ok(fs.existsSync(destPath));
    assert.deepStrictEqual(fs.readFileSync(destPath), testContent);
  });

  it('rejects with an integrity error when the hash mismatches', async () => {
    const destPath = path.join(tmpDir, 'download.bin');
    const wrongHash = 'a'.repeat(64);
    await assert.rejects(
      () => {
        return downloadFile(serverUrl, destPath, undefined, wrongHash);
      },
      (err: Error) => {
        assert.ok(
          err.message.includes('Integrity check failed'),
          `Expected "Integrity check failed" in: ${err.message}`,
        );
        assert.ok(
          err.message.includes(wrongHash),
          `Expected wrong hash in error message`,
        );
        assert.ok(
          err.message.includes(correctHash),
          `Expected actual hash in error message`,
        );
        return true;
      },
    );
  });

  it('deletes the downloaded file when the hash mismatches', async () => {
    const destPath = path.join(tmpDir, 'download.bin');
    const wrongHash = 'b'.repeat(64);
    await assert.rejects(() => {
      return downloadFile(serverUrl, destPath, undefined, wrongHash);
    });
    assert.ok(
      !fs.existsSync(destPath),
      'File should be deleted after hash mismatch',
    );
  });

  it('accepts an uppercase expected hash', async () => {
    const destPath = path.join(tmpDir, 'download.bin');
    await downloadFile(
      serverUrl,
      destPath,
      undefined,
      correctHash.toUpperCase(),
    );
    assert.ok(fs.existsSync(destPath));
  });
});
