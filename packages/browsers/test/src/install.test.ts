/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';

import {
  Browser,
  BrowserPlatform,
  Cache,
  getInstalledBrowsers,
  install,
} from '../../lib/main.js';

interface TestZipEntry {
  name: string;
  content: Buffer | string;
  mode?: number;
}

/**
 * Builds an uncompressed (STORE) PKZIP archive in memory so tests run
 * without external zip tooling across platforms.
 */
function createTestZipBuffer(entries: TestZipEntry[]): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let localOffset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf8');
    const dataBuf =
      typeof entry.content === 'string'
        ? Buffer.from(entry.content, 'utf8')
        : entry.content;
    const crc = zlib.crc32(dataBuf);
    const unixMode = fs.constants.S_IFREG | (entry.mode ?? 0o644);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0x0021, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(dataBuf.length, 18);
    localHeader.writeUInt32LE(dataBuf.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, nameBuf, dataBuf);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE((3 << 8) | 20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0x0021, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(dataBuf.length, 20);
    centralHeader.writeUInt32LE(dataBuf.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE((unixMode << 16) >>> 0, 38);
    centralHeader.writeUInt32LE(localOffset, 42);
    centralParts.push(centralHeader, nameBuf);

    localOffset += localHeader.length + nameBuf.length + dataBuf.length;
  }

  const centralDir = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDir.length, 12);
  eocd.writeUInt32LE(localOffset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDir, eocd]);
}

describe('install staging', () => {
  const buildId = '139.0.7258.66';
  const expectedUrlPath = `/${buildId}/linux64/chrome-linux64.zip`;
  const validZip = createTestZipBuffer([
    {
      name: 'chrome-linux64/chrome',
      content: '#!/bin/sh\necho chrome\n',
      mode: 0o755,
    },
    {
      name: 'chrome-linux64/payload.bin',
      content: Buffer.alloc(64 * 1024, 0x41),
    },
  ]);

  let tmpDir: string;
  let server: http.Server;
  let baseUrl: string;
  let servedBody: Buffer;
  let chunkDelayMs: number;
  let requestCount: number;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'puppeteer-install-staging-test'),
    );
    servedBody = validZip;
    chunkDelayMs = 100;
    requestCount = 0;

    server = http.createServer((req, res) => {
      if (req.url !== expectedUrlPath) {
        res.writeHead(404);
        res.end();
        return;
      }
      requestCount++;
      const body = servedBody;
      res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-Length': String(body.length),
      });
      if (chunkDelayMs > 0 && body.length > 1) {
        const mid = Math.floor(body.length / 2);
        res.write(body.subarray(0, mid));
        setTimeout(() => {
          res.end(body.subarray(mid));
        }, chunkDelayMs);
      } else {
        res.end(body);
      }
    });

    await new Promise<void>(resolve => {
      server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address() as {port: number};
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    await new Promise<void>(resolve => {
      server.close(() => {
        return resolve();
      });
    });
    new Cache(tmpDir).clear();
  });

  it('succeeds when concurrent installs target the same buildId', async () => {
    const options = {
      cacheDir: tmpDir,
      browser: Browser.CHROME,
      platform: BrowserPlatform.LINUX,
      buildId,
      baseUrl,
    };

    const first = install({...options});
    await new Promise(resolve => {
      setTimeout(resolve, 30);
    });
    const second = install({...options});
    const third = install({...options});

    const [result1, result2, result3] = await Promise.all([
      first,
      second,
      third,
    ]);

    assert.strictEqual(result1.path, result2.path);
    assert.strictEqual(result2.path, result3.path);
    assert.strictEqual(fs.existsSync(result1.executablePath), true);
    assert.strictEqual(
      fs.readFileSync(result1.executablePath, 'utf8'),
      '#!/bin/sh\necho chrome\n',
    );

    const installed = await getInstalledBrowsers({cacheDir: tmpDir});
    assert.strictEqual(installed.length, 1);
    assert.strictEqual(installed[0]?.buildId, buildId);

    // No staging directories or stray archives should remain in browserRoot.
    const browserRootEntries = fs.readdirSync(path.join(tmpDir, 'chrome'));
    assert.deepStrictEqual(browserRootEntries, [
      `${BrowserPlatform.LINUX}-${buildId}`,
    ]);
  });

  it('succeeds when concurrent archive-only installs target the same buildId', async () => {
    const options = {
      cacheDir: tmpDir,
      browser: Browser.CHROME,
      platform: BrowserPlatform.LINUX,
      buildId,
      baseUrl,
      unpack: false as const,
    };

    const first = install({...options}).then(archivePath => {
      assert.deepStrictEqual(fs.readFileSync(archivePath), validZip);
      return archivePath;
    });
    await new Promise(resolve => {
      setTimeout(resolve, 30);
    });
    const second = install({...options}).then(archivePath => {
      // Verify the returned archive is already complete when the promise resolves,
      // not a partially written file from the in-flight first download.
      assert.deepStrictEqual(fs.readFileSync(archivePath), validZip);
      return archivePath;
    });

    const [archivePath1, archivePath2] = await Promise.all([first, second]);
    assert.strictEqual(archivePath1, archivePath2);
    assert.deepStrictEqual(fs.readFileSync(archivePath1), validZip);

    const browserRootEntries = fs.readdirSync(path.join(tmpDir, 'chrome'));
    assert.deepStrictEqual(browserRootEntries, [
      `${buildId}-chrome-linux64.zip`,
    ]);
  });

  it('does not leave a partial installation directory when extraction fails', async () => {
    servedBody = Buffer.from('not a valid zip archive');
    chunkDelayMs = 0;

    const options = {
      cacheDir: tmpDir,
      browser: Browser.CHROME,
      platform: BrowserPlatform.LINUX,
      buildId,
      baseUrl,
    };

    await assert.rejects(install({...options}), /All providers failed/);

    const outputPath = path.join(
      tmpDir,
      'chrome',
      `${BrowserPlatform.LINUX}-${buildId}`,
    );
    assert.strictEqual(fs.existsSync(outputPath), false);
    assert.deepStrictEqual(fs.readdirSync(path.join(tmpDir, 'chrome')), []);

    // A subsequent install with a valid archive should succeed cleanly.
    servedBody = validZip;
    const browser = await install({...options});
    assert.strictEqual(fs.existsSync(browser.executablePath), true);
  });

  it('ignores leftover staging directories in getInstalledBrowsers', async () => {
    chunkDelayMs = 0;
    const browserRoot = path.join(tmpDir, 'chrome');
    fs.mkdirSync(path.join(browserRoot, '.install-tmp-ab12cd'), {
      recursive: true,
    });

    const installedBefore = await getInstalledBrowsers({cacheDir: tmpDir});
    assert.deepStrictEqual(installedBefore, []);

    const browser = await install({
      cacheDir: tmpDir,
      browser: Browser.CHROME,
      platform: BrowserPlatform.LINUX,
      buildId,
      baseUrl,
    });
    assert.strictEqual(fs.existsSync(browser.executablePath), true);

    const installedAfter = await getInstalledBrowsers({cacheDir: tmpDir});
    assert.strictEqual(installedAfter.length, 1);
    assert.strictEqual(installedAfter[0]?.buildId, buildId);
  });

  it('reuses and cleans up an existing archive downloaded with unpack: false', async () => {
    chunkDelayMs = 0;
    const options = {
      cacheDir: tmpDir,
      browser: Browser.CHROME,
      platform: BrowserPlatform.LINUX,
      buildId,
      baseUrl,
    };

    const archivePath = await install({...options, unpack: false});
    assert.strictEqual(requestCount, 1);
    assert.strictEqual(fs.existsSync(archivePath), true);

    const browser = await install({...options, unpack: true});
    assert.strictEqual(requestCount, 1);
    assert.strictEqual(fs.existsSync(browser.executablePath), true);
    assert.strictEqual(fs.existsSync(archivePath), false);
  });
});
