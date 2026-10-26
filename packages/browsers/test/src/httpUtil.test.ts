/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import {createHash} from 'node:crypto';
import {once} from 'node:events';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

import {downloadFile, getText, headHttpRequest} from '../../lib/httpUtil.js';

describe('downloadFile', function () {
  let tmpDir: string;
  let server: http.Server;
  let serverUrl: URL;
  let streamingResponse: http.ServerResponse;

  const testContent = Buffer.from('test browser binary content');
  const correctHash = createHash('sha256').update(testContent).digest('hex');

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer-httputil-test'));
    server = http.createServer((req, res) => {
      if (req.url === '/streaming') {
        streamingResponse = res;
        res.writeHead(200, {'Content-Length': String(testContent.length * 2)});
        res.write(testContent.subarray(0, 4));
        return;
      }
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
    server.closeAllConnections();
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

  it('rejects request errors after the advertised body is received', async () => {
    server.removeAllListeners('request');
    server.on('request', req => {
      // Send raw bytes to include invalid data after a complete response body.
      req.socket.end('HTTP/1.1 200 OK\r\nContent-Length: 4\r\n\r\nbodyJUNK');
    });

    const destPath = path.join(tmpDir, 'download.bin');
    await assert.rejects(downloadFile(serverUrl, destPath), {
      code: 'HPE_INVALID_CONSTANT',
    });
    assert.strictEqual(fs.existsSync(destPath), false);
  });

  it('preserves request errors during a download', async () => {
    let sendInvalidChunk!: () => void;
    server.removeAllListeners('request');
    server.on('request', req => {
      sendInvalidChunk = () => {
        req.socket.end('INVALID\r\n');
      };
      req.socket.write(
        'HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\n1\r\nx\r\n',
      );
    });

    const destPath = path.join(tmpDir, 'download.bin');
    await assert.rejects(
      downloadFile(serverUrl, destPath, () => {
        sendInvalidChunk();
      }),
      {code: 'HPE_INVALID_CHUNK_SIZE'},
    );
    assert.strictEqual(fs.existsSync(destPath), false);
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

  it('preserves a progress callback error and tears down the transfer', async () => {
    const destPath = path.join(tmpDir, 'download.bin');
    const progressError = new Error('progress callback failed');
    let progressCalls = 0;

    await assert.rejects(
      downloadFile(
        new URL('/streaming', serverUrl),
        destPath,
        () => {
          ++progressCalls;
          throw progressError;
        },
        correctHash,
      ),
      (error: unknown) => {
        assert.strictEqual(error, progressError);
        return true;
      },
    );

    assert.strictEqual(progressCalls, 1);
    assert.strictEqual(fs.existsSync(destPath), false);
    if (!streamingResponse.destroyed) {
      await once(streamingResponse, 'close', {
        signal: AbortSignal.timeout(1000),
      });
    }
    assert.strictEqual(streamingResponse.destroyed, true);
  });
});

describe('HTTP request errors', () => {
  let server: http.Server;
  let redirectUrl: URL;

  beforeEach(async () => {
    server = http.createServer((req, res) => {
      if (req.url === '/redirect') {
        res.writeHead(302, {
          Location: '/reset',
        });
        res.end();
        return;
      }
      // Fail the redirected request before sending any response headers.
      req.socket.destroy();
    });
    await new Promise<void>(resolve => {
      server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address() as {port: number};
    redirectUrl = new URL(`http://127.0.0.1:${address.port}/redirect`);
  });

  afterEach(async () => {
    server.closeAllConnections();
    await new Promise<void>(resolve => {
      server.close(() => {
        resolve();
      });
    });
  });

  it('rejects getText when a relatively redirected request fails', async () => {
    await assert.rejects(getText(redirectUrl), {code: 'ECONNRESET'});
  });

  it('resolves HEAD as false when a relatively redirected request fails', async () => {
    assert.strictEqual(await headHttpRequest(redirectUrl), false);
  });
});
