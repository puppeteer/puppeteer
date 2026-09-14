/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {Browser, BrowserPlatform, Cache} from '../../lib/main.js';

describe('Cache', () => {
  let tmpDir = '/tmp/puppeteer-browsers-test';
  let cache: Cache;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer-browsers-test'));
    cache = new Cache(tmpDir);
  });

  afterEach(() => {
    cache.clear();
  });

  it('return empty metadata if .metadata file does not exist', async function () {
    assert.deepStrictEqual(cache.readMetadata(Browser.CHROME), {
      aliases: {},
    });
  });

  it('throw an error if .metadata is malformed', async function () {
    // @ts-expect-error wrong type on purpose;
    cache.writeMetadata(Browser.CHROME, 'metadata');
    assert.throws(() => {
      return cache.readMetadata(Browser.CHROME);
    }, new Error(`.metadata is not an object`));
  });

  it('writes and reads .metadata', async function () {
    cache.writeMetadata(Browser.CHROME, {
      aliases: {
        canary: '123.0.0.0',
      },
    });
    assert.deepStrictEqual(cache.readMetadata(Browser.CHROME), {
      aliases: {
        canary: '123.0.0.0',
      },
    });

    assert.deepStrictEqual(
      cache.resolveAlias(Browser.CHROME, 'canary'),
      '123.0.0.0',
    );
  });

  it('resolves latest', async function () {
    cache.writeMetadata(Browser.CHROME, {
      aliases: {
        canary: '115.0.5789',
        stable: '114.0.5789',
      },
    });

    assert.deepStrictEqual(
      cache.resolveAlias(Browser.CHROME, 'latest'),
      '115.0.5789',
    );
  });

  describe('clearOld', () => {
    function installVersion(
      browser: Browser,
      platform: string,
      buildId: string,
    ): string {
      const dir = path.join(tmpDir, browser, `${platform}-${buildId}`);
      fs.mkdirSync(dir, {recursive: true});
      return dir;
    }

    it('removes all versions when keep is 0', function () {
      installVersion(Browser.CHROME, BrowserPlatform.LINUX, '123.0.0.1');
      installVersion(Browser.CHROME, BrowserPlatform.LINUX, '124.0.0.2');

      const removed = cache.clearOld(0);

      assert.deepStrictEqual(
        removed.map(b => {
          return b.buildId;
        }),
        ['123.0.0.1', '124.0.0.2'],
      );
      assert.deepStrictEqual(cache.getInstalledBrowsers(), []);
    });

    it('keeps the latest versions per browser and platform', function () {
      const oldest = installVersion(
        Browser.CHROME,
        BrowserPlatform.LINUX,
        '123.0.0.1',
      );
      const newest = installVersion(
        Browser.CHROME,
        BrowserPlatform.LINUX,
        '124.0.0.2',
      );
      const middle = installVersion(
        Browser.CHROME,
        BrowserPlatform.LINUX,
        '123.5.0.3',
      );
      // Different platform: its own group.
      const winVersion = installVersion(
        Browser.CHROME,
        BrowserPlatform.WIN64,
        '123.0.0.1',
      );
      // Different browser: its own group.
      const firefoxVersion = installVersion(
        Browser.FIREFOX,
        BrowserPlatform.LINUX,
        '130.0',
      );

      const removed = cache.clearOld(1);

      // Only the chrome/linux group has more than one version, so only its
      // two oldest versions are removed. The single versions in the other
      // groups are the latest of their group and are kept.
      assert.deepStrictEqual(
        removed.map(b => {
          return b.path;
        }),
        [oldest, middle],
      );
      assert.strictEqual(fs.existsSync(oldest), false);
      assert.strictEqual(fs.existsSync(middle), false);
      assert.strictEqual(fs.existsSync(newest), true);
      assert.strictEqual(fs.existsSync(winVersion), true);
      assert.strictEqual(fs.existsSync(firefoxVersion), true);
    });

    it('keeps the N latest versions per browser and platform', function () {
      const oldest = installVersion(
        Browser.CHROME,
        BrowserPlatform.LINUX,
        '123.0.0.1',
      );
      const middle = installVersion(
        Browser.CHROME,
        BrowserPlatform.LINUX,
        '123.5.0.3',
      );
      const newest = installVersion(
        Browser.CHROME,
        BrowserPlatform.LINUX,
        '124.0.0.2',
      );

      const removed = cache.clearOld(2);

      assert.deepStrictEqual(
        removed.map(b => {
          return b.path;
        }),
        [oldest],
      );
      assert.strictEqual(fs.existsSync(oldest), false);
      assert.strictEqual(fs.existsSync(middle), true);
      assert.strictEqual(fs.existsSync(newest), true);
    });
  });
});
