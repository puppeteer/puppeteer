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
    function install(
      browser: Browser,
      platform: BrowserPlatform,
      buildId: string,
    ): void {
      fs.mkdirSync(path.join(tmpDir, browser, `${platform}-${buildId}`), {
        recursive: true,
      });
    }

    function installed(): string[] {
      return cache
        .getInstalledBrowsers()
        .map(browser => {
          return `${browser.browser}/${browser.platform}-${browser.buildId}`;
        })
        .sort();
    }

    it('keeps the newest versions of each browser and platform', () => {
      install(Browser.CHROME, BrowserPlatform.LINUX, '123.0.0.1');
      install(Browser.CHROME, BrowserPlatform.LINUX, '124.0.0.2');
      install(Browser.CHROME, BrowserPlatform.LINUX, '123.5.0.3');
      install(Browser.CHROME, BrowserPlatform.WIN64, '120.0.0.1');
      install(Browser.CHROME, BrowserPlatform.WIN64, '121.0.0.2');
      install(Browser.CHROMEHEADLESSSHELL, BrowserPlatform.LINUX, '119.0.0.1');

      const removed = cache.clearOld(1);

      assert.deepStrictEqual(
        removed
          .map(browser => {
            return browser.buildId;
          })
          .sort(),
        ['120.0.0.1', '123.0.0.1', '123.5.0.3'],
      );
      assert.deepStrictEqual(installed(), [
        'chrome-headless-shell/linux-119.0.0.1',
        'chrome/linux-124.0.0.2',
        'chrome/win64-121.0.0.2',
      ]);
    });

    it('removes nothing when fewer versions than the limit are installed', () => {
      install(Browser.CHROME, BrowserPlatform.LINUX, '123.0.0.1');

      assert.deepStrictEqual(cache.clearOld(2), []);
      assert.deepStrictEqual(installed(), ['chrome/linux-123.0.0.1']);
    });

    it('rejects a keep that is not a non-negative integer', () => {
      install(Browser.CHROME, BrowserPlatform.LINUX, '123.0.0.1');

      for (const keep of [-1, 1.5, Number.NaN]) {
        assert.throws(() => {
          return cache.clearOld(keep);
        }, /keep must be a non-negative integer/);
      }
      assert.deepStrictEqual(installed(), ['chrome/linux-123.0.0.1']);
    });

    it('leaves versions the comparator cannot order untouched', () => {
      // Chromium compares revisions numerically, so a non-numeric one is not
      // orderable; Chrome's comparator rejects anything that is not a version.
      install(Browser.CHROMIUM, BrowserPlatform.LINUX, '1000');
      install(Browser.CHROMIUM, BrowserPlatform.LINUX, '999');
      install(Browser.CHROMIUM, BrowserPlatform.LINUX, 'abc');
      install(Browser.CHROME, BrowserPlatform.LINUX, '124.0.0.2');
      install(Browser.CHROME, BrowserPlatform.LINUX, '123.0.0.1');
      install(Browser.CHROME, BrowserPlatform.LINUX, 'junk');

      const removed = cache.clearOld(1);

      assert.deepStrictEqual(
        removed
          .map(browser => {
            return browser.buildId;
          })
          .sort(),
        ['123.0.0.1', '999'],
      );
      assert.deepStrictEqual(installed(), [
        'chrome/linux-124.0.0.2',
        'chrome/linux-junk',
        'chromium/linux-1000',
        'chromium/linux-abc',
      ]);
    });

    it('removes the metadata of the browsers it uninstalls', () => {
      install(Browser.CHROME, BrowserPlatform.LINUX, '123.0.0.1');
      install(Browser.CHROME, BrowserPlatform.LINUX, '124.0.0.2');
      cache.writeMetadata(Browser.CHROME, {
        aliases: {old: '123.0.0.1', latest: '124.0.0.2'},
      });

      cache.clearOld(1);

      assert.deepStrictEqual(cache.readMetadata(Browser.CHROME), {
        aliases: {latest: '124.0.0.2'},
      });
    });
  });

  it('prevents path traversal in installationDir and uninstall', () => {
    const siblingDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'puppeteer-browsers-sibling'),
    );
    try {
      const traversalBuildId = `../../../../${path.relative('/', siblingDir)}`;
      assert.throws(() => {
        cache.installationDir(
          Browser.CHROME,
          BrowserPlatform.LINUX,
          traversalBuildId,
        );
      }, /Invalid buildId/);

      assert.throws(() => {
        cache.installationDir(
          Browser.CHROME,
          BrowserPlatform.LINUX,
          '../.metadata',
        );
      }, /Invalid buildId/);

      assert.throws(() => {
        cache.uninstall(
          Browser.CHROME,
          BrowserPlatform.LINUX,
          traversalBuildId,
        );
      }, /Invalid buildId/);

      assert.strictEqual(fs.existsSync(siblingDir), true);
    } finally {
      fs.rmSync(siblingDir, {recursive: true, force: true});
    }
  });
});
