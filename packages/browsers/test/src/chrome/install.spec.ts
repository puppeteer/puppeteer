/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert';
import fs from 'fs';
import http from 'http';
import https from 'https';
import os from 'os';
import path from 'path';

import {
  install,
  canDownload,
  Browser,
  BrowserPlatform,
  Cache,
  computeExecutablePath,
} from '../../../lib/cjs/main.js';
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

  it('should check if a buildId can be downloaded', async () => {
    assert.ok(
      await canDownload({
        cacheDir: tmpDir,
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: testChromeBuildId,
        baseUrl: getServerUrl(),
      })
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
      false
    );
  });

  it('can detect missing executables', async function () {
    this.timeout(60000);
    const expectedOutputPath = path.join(
      tmpDir,
      'chrome',
      `${BrowserPlatform.LINUX}-${testChromeBuildId}`
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
    assert.strictEqual(
      (await installThatThrows())?.message,
      `The browser folder (${expectedOutputPath}) exists but the executable (${computeExecutablePath(
        {
          cacheDir: tmpDir,
          browser: Browser.CHROME,
          platform: BrowserPlatform.LINUX,
          buildId: testChromeBuildId,
        }
      )}) is missing`
    );
    assert.strictEqual(fs.existsSync(expectedOutputPath), true);
  });

  it('should download a buildId that is a zip archive', async function () {
    this.timeout(60000);
    const expectedOutputPath = path.join(
      tmpDir,
      'chrome',
      `${BrowserPlatform.LINUX}-${testChromeBuildId}`
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
      installed[0]?.executablePath
    );
  });

  it('falls back to the chrome-for-testing dashboard URLs if URL is not available', async function () {
    this.timeout(60000);
    const expectedOutputPath = path.join(
      tmpDir,
      'chrome',
      `${BrowserPlatform.LINUX}-${testChromeBuildId}`
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
            originalResponse: http.ServerResponse
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
                  proxyResponse.headers
                );
                proxyResponse.pipe(originalResponse, {end: true});
              }
            );
            originalRequest.pipe(proxyRequest, {end: true});
            proxiedRequestUrls.push(url);
            proxiedRequestHosts.push(originalRequest.headers?.host || '');
          }
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
        true
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
        `${BrowserPlatform.LINUX}-${testChromeBuildId}`
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
