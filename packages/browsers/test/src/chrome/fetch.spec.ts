/**
 * Copyright 2023 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import assert from 'assert';
import fs from 'fs';
import http from 'http';
import https from 'https';
import os from 'os';
import path from 'path';

import {
  fetch,
  canFetch,
  Browser,
  BrowserPlatform,
  Cache,
} from '../../../lib/cjs/main.js';
import {getServerUrl, setupTestServer} from '../utils.js';
import {testChromeBuildId} from '../versions.js';

/**
 * Tests in this spec use real download URLs and unpack live browser archives
 * so it requires the network access.
 */
describe('Chrome fetch', () => {
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
      await canFetch({
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
      await canFetch({
        cacheDir: tmpDir,
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: 'unknown',
        baseUrl: getServerUrl(),
      }),
      false
    );
  });

  it('should download a buildId that is a zip archive', async function () {
    this.timeout(60000);
    const expectedOutputPath = path.join(
      tmpDir,
      'chrome',
      `${BrowserPlatform.LINUX}-${testChromeBuildId}`
    );
    assert.strictEqual(fs.existsSync(expectedOutputPath), false);
    let browser = await fetch({
      cacheDir: tmpDir,
      browser: Browser.CHROME,
      platform: BrowserPlatform.LINUX,
      buildId: testChromeBuildId,
      baseUrl: getServerUrl(),
    });
    assert.strictEqual(browser.path, expectedOutputPath);
    assert.ok(fs.existsSync(expectedOutputPath));
    // Second iteration should be no-op.
    browser = await fetch({
      cacheDir: tmpDir,
      browser: Browser.CHROME,
      platform: BrowserPlatform.LINUX,
      buildId: testChromeBuildId,
      baseUrl: getServerUrl(),
    });
    assert.strictEqual(browser.path, expectedOutputPath);
    assert.ok(fs.existsSync(expectedOutputPath));
  });

  describe('with proxy', () => {
    const proxyUrl = new URL(`http://localhost:54321`);
    let proxyServer: http.Server;
    let proxiedRequestUrls: string[] = [];

    beforeEach(() => {
      proxiedRequestUrls = [];
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

    it('can send canFetch requests via a proxy', async () => {
      assert.strictEqual(
        await canFetch({
          cacheDir: tmpDir,
          browser: Browser.CHROME,
          platform: BrowserPlatform.LINUX,
          buildId: testChromeBuildId,
          baseUrl: getServerUrl(),
        }),
        true
      );
      assert.deepStrictEqual(proxiedRequestUrls, [
        getServerUrl() + '/113.0.5672.0/linux64/chrome-linux64.zip',
      ]);
    });

    it('can fetch via a proxy', async function () {
      this.timeout(60000);
      const expectedOutputPath = path.join(
        tmpDir,
        'chrome',
        `${BrowserPlatform.LINUX}-${testChromeBuildId}`
      );
      assert.strictEqual(fs.existsSync(expectedOutputPath), false);
      const browser = await fetch({
        cacheDir: tmpDir,
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: testChromeBuildId,
        baseUrl: getServerUrl(),
      });
      assert.strictEqual(browser.path, expectedOutputPath);
      assert.ok(fs.existsSync(expectedOutputPath));
      assert.deepStrictEqual(proxiedRequestUrls, [
        getServerUrl() + '/113.0.5672.0/linux64/chrome-linux64.zip',
      ]);
    });
  });
});
