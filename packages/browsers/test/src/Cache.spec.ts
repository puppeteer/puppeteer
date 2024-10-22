/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';

import {Browser, Cache} from '../../lib/cjs/main.js';

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
});
