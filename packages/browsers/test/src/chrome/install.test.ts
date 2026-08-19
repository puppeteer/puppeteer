/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import os from 'node:os';
import path from 'node:path';

import {InstallLockError} from '../../../lib/installLock.js';
import {
  install,
  canDownload,
  Browser,
  BrowserPlatform,
  Cache,
  computeExecutablePath,
} from '../../../lib/main.js';
import {getServerUrl, setupTestServer} from '../utils.js';
import {testChromeBuildId} from '../versions.js';

/**
 * Tests in this spec use real download URLs and unpack live browser archives
 * so it requires the network access.
 */
describe('Chrome install', () => {
  setupTestServer();

  let tmpDir = '/tmp/puppeteer-browsers-test';

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer-browsers-test'));
  });

  afterEach(() => {
    new Cache(tmpDir).clear();
  });

  function expectedInstallLockPath(): string {
    return path.join(
      tmpDir,
      'chrome',
      `.installLock-${BrowserPlatform.LINUX}-${testChromeBuildId}`,
    );
  }

  function writeStaleInstallLock(
    lockPath: string,
    owner: {hostname: string; pid: number},
  ): void {
    fs.mkdirSync(lockPath, {recursive: true});
    const heartbeatPath = path.join(lockPath, 'heartbeat');
    fs.writeFileSync(heartbeatPath, `${JSON.stringify(owner)}\n`);
    const staleTime = new Date(Date.now() - 2 * 60 * 1000);
    fs.utimesSync(heartbeatPath, staleTime, staleTime);
  }

  it('should check if a buildId can be downloaded', async () => {
    assert.ok(
      await canDownload({
        cacheDir: tmpDir,
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: testChromeBuildId,
        baseUrl: getServerUrl(),
      }),
    );
  });

  it('should report if a buildId is not downloadable', async () => {
    assert.strictEqual(
      await canDownload({
        cacheDir: tmpDir,
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: 'unknown',
        baseUrl: getServerUrl(),
      }),
      false,
    );
  });

  it('can detect missing executables', async function () {
    this.timeout(60000);
    const expectedOutputPath = path.join(
      tmpDir,
      'chrome',
      `${BrowserPlatform.LINUX}-${testChromeBuildId}`,
    );
    fs.mkdirSync(expectedOutputPath, {recursive: true});
    assert.strictEqual(fs.existsSync(expectedOutputPath), true);
    async function installThatThrows(): Promise<Error | undefined> {
      try {
        await install({
          cacheDir: tmpDir,
          browser: Browser.CHROME,
          platform: BrowserPlatform.LINUX,
          buildId: testChromeBuildId,
        });
        return undefined;
      } catch (err) {
        return err as Error;
      }
    }
    const error = await installThatThrows();
    const expectedMessage = `The browser folder (${expectedOutputPath}) exists but the executable (${computeExecutablePath(
      {
        cacheDir: tmpDir,
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: testChromeBuildId,
      },
    )}) is missing`;
    assert.ok(
      error?.message.includes(expectedMessage),
      `Expected error message to contain "${expectedMessage}" but got "${error?.message}"`,
    );
    assert.doesNotMatch(
      error?.message ?? '',
      /recovering a stale install lock/,
    );
    assert.strictEqual(fs.existsSync(expectedOutputPath), true);
  });

  it('preserves install-lock timeout details without starting installation', async function () {
    this.timeout(60000);
    const lockPath = expectedInstallLockPath();
    const owner = {
      hostname: `${os.hostname()}-remote`,
      pid: process.pid,
    };
    writeStaleInstallLock(lockPath, owner);

    let error: (Error & {cause?: unknown}) | undefined;
    try {
      await install({
        cacheDir: tmpDir,
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: testChromeBuildId,
        installLockTimeout: 0,
        logger: () => {
          return () => {};
        },
      });
    } catch (cause) {
      assert(cause instanceof Error);
      error = cause as Error & {cause?: unknown};
    }

    assert(error);
    const lockError = error.cause;
    assert(lockError instanceof InstallLockError);
    assert.strictEqual(lockError.lockPath, lockPath);
    assert.strictEqual(lockError.reason, 'owner-unverifiable');
    assert.deepStrictEqual(lockError.owner, owner);
    assert.ok(lockError.observedAgeMs! >= 60 * 1000);
    assert.ok(lockError.waitedMs >= 0);

    for (const detail of [
      tmpDir,
      lockPath,
      lockError.reason,
      owner.hostname,
      String(owner.pid),
    ]) {
      assert.ok(
        error.message.includes(detail),
        `Expected install-lock guidance to include ${detail}`,
      );
    }
    assert.match(error.message, /remove[\s\S]*lock[\s\S]*retry/i);
    assert.deepStrictEqual(fs.readdirSync(path.dirname(lockPath)), [
      path.basename(lockPath),
    ]);
    assert.strictEqual(fs.existsSync(lockPath), true);
  });

  it('does not list install lock directories as installed browsers', () => {
    const lockPath = path.join(
      tmpDir,
      'chrome',
      `.installLock-${BrowserPlatform.LINUX}-${testChromeBuildId}`,
    );
    fs.mkdirSync(lockPath, {recursive: true});

    assert.deepStrictEqual(new Cache(tmpDir).getInstalledBrowsers(), []);
  });

  it('should download a buildId that is a zip archive', async function () {
    this.timeout(60000);
    const expectedOutputPath = path.join(
      tmpDir,
      'chrome',
      `${BrowserPlatform.LINUX}-${testChromeBuildId}`,
    );
    assert.strictEqual(fs.existsSync(expectedOutputPath), false);
    let browser = await install({
      cacheDir: tmpDir,
      browser: Browser.CHROME,
      platform: BrowserPlatform.LINUX,
      buildId: testChromeBuildId,
      baseUrl: getServerUrl(),
    });
    assert.strictEqual(browser.path, expectedOutputPath);
    assert.ok(fs.existsSync(expectedOutputPath));
    // Second iteration should be no-op.
    browser = await install({
      cacheDir: tmpDir,
      browser: Browser.CHROME,
      platform: BrowserPlatform.LINUX,
      buildId: testChromeBuildId,
      baseUrl: getServerUrl(),
    });
    assert.strictEqual(browser.path, expectedOutputPath);
    assert.ok(fs.existsSync(expectedOutputPath));
    // Should discover installed browsers.
    const cache = new Cache(tmpDir);
    const installed = cache.getInstalledBrowsers();
    assert.deepStrictEqual(browser, installed[0]);
    assert.deepStrictEqual(
      browser!.executablePath,
      installed[0]?.executablePath,
    );
  });

  it('should serialize concurrent installs for the same buildId', async function () {
    this.timeout(60000);
    const expectedOutputPath = path.join(
      tmpDir,
      'chrome',
      `${BrowserPlatform.LINUX}-${testChromeBuildId}`,
    );
    assert.strictEqual(fs.existsSync(expectedOutputPath), false);

    const browsers = await Promise.all(
      Array.from({length: 3}, () => {
        return install({
          cacheDir: tmpDir,
          browser: Browser.CHROME,
          platform: BrowserPlatform.LINUX,
          buildId: testChromeBuildId,
          baseUrl: getServerUrl(),
        });
      }),
    );

    for (const browser of browsers) {
      assert.strictEqual(browser.path, expectedOutputPath);
      assert.strictEqual(fs.existsSync(browser.executablePath), true);
    }
    const lockPath = path.join(
      tmpDir,
      'chrome',
      `.installLock-${BrowserPlatform.LINUX}-${testChromeBuildId}`,
    );
    assert.strictEqual(fs.existsSync(lockPath), false);
  });

  it('falls back to the chrome-for-testing dashboard URLs if URL is not available', async function () {
    this.timeout(60000);
    const expectedOutputPath = path.join(
      tmpDir,
      'chrome',
      `${BrowserPlatform.LINUX}-${testChromeBuildId}`,
    );
    assert.strictEqual(fs.existsSync(expectedOutputPath), false);
    await install({
      cacheDir: tmpDir,
      browser: Browser.CHROME,
      platform: BrowserPlatform.LINUX,
      buildId: testChromeBuildId,
      baseUrl: 'https://127.0.0.1',
      forceFallbackForTesting: true,
    });
    assert.strictEqual(fs.existsSync(expectedOutputPath), true);
  });

  describe('with proxy', () => {
    const proxyUrl = new URL(`http://localhost:54321`);
    let proxyServer: http.Server;
    let proxiedRequestUrls: string[] = [];
    let proxiedRequestHosts: string[] = [];

    beforeEach(() => {
      proxiedRequestUrls = [];
      proxiedRequestHosts = [];
      proxyServer = http
        .createServer(
          (
            originalRequest: http.IncomingMessage,
            originalResponse: http.ServerResponse,
          ) => {
            const url = originalRequest.url as string;
            const proxyRequest = (
              url.startsWith('http:') ? http : https
            ).request(
              url,
              {
                method: originalRequest.method,
                rejectUnauthorized: false,
              },
              proxyResponse => {
                originalResponse.writeHead(
                  proxyResponse.statusCode as number,
                  proxyResponse.headers,
                );
                proxyResponse.pipe(originalResponse, {end: true});
              },
            );
            originalRequest.pipe(proxyRequest, {end: true});
            proxiedRequestUrls.push(url);
            proxiedRequestHosts.push(originalRequest.headers?.host || '');
          },
        )
        .listen({
          port: proxyUrl.port,
          hostname: proxyUrl.hostname,
        });

      process.env['HTTPS_PROXY'] = proxyUrl.toString();
      process.env['HTTP_PROXY'] = proxyUrl.toString();
    });

    afterEach(async () => {
      await new Promise((resolve, reject) => {
        proxyServer.close(error => {
          if (error) {
            reject(error);
          } else {
            resolve(undefined);
          }
        });
      });
      delete process.env['HTTP_PROXY'];
      delete process.env['HTTPS_PROXY'];
    });

    it('can send canDownload requests via a proxy', async () => {
      assert.strictEqual(
        await canDownload({
          cacheDir: tmpDir,
          browser: Browser.CHROME,
          platform: BrowserPlatform.LINUX,
          buildId: testChromeBuildId,
          baseUrl: getServerUrl(),
        }),
        true,
      );
      assert.deepStrictEqual(proxiedRequestUrls, [
        getServerUrl() + `/${testChromeBuildId}/linux64/chrome-linux64.zip`,
      ]);
      assert.deepStrictEqual(proxiedRequestHosts, [
        getServerUrl().replace('http://', ''),
      ]);
    });

    it('can download via a proxy', async function () {
      this.timeout(120000);
      const expectedOutputPath = path.join(
        tmpDir,
        'chrome',
        `${BrowserPlatform.LINUX}-${testChromeBuildId}`,
      );
      assert.strictEqual(fs.existsSync(expectedOutputPath), false);
      const browser = await install({
        cacheDir: tmpDir,
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: testChromeBuildId,
        baseUrl: getServerUrl(),
      });
      assert.strictEqual(browser.path, expectedOutputPath);
      assert.ok(fs.existsSync(expectedOutputPath));
      assert.deepStrictEqual(proxiedRequestUrls, [
        getServerUrl() + `/${testChromeBuildId}/linux64/chrome-linux64.zip`,
      ]);
      assert.deepStrictEqual(proxiedRequestHosts, [
        getServerUrl().replace('http://', ''),
      ]);
    });
  });
});
