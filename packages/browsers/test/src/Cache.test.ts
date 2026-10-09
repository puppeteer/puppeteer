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
