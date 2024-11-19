/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {mkdtemp, rmdir} from 'fs/promises';
import {join} from 'path';

import expect from 'expect';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';
import {waitForFileExistence} from './utils.js';

describe('Download', () => {
  setupTestBrowserHooks();
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp('');
  });

  afterEach(async () => {
    await rmdir(tempDir);
  });

  describe('Browser.createBrowserContext', () => {
    it('should download to configured location', async () => {
      const {browser, server} = await getTestState();

      const context = await browser.createBrowserContext({
        downloadBehavior: {
          policy: 'allow',
          downloadPath: tempDir,
        },
      });
      const page = await context.newPage();
      await page.goto(server.PREFIX + '/download.html');
      await page.click('#download');
      await waitForFileExistence(join(tempDir, 'download.txt'));
    });
    it('should not download to location', async () => {
      const {browser, server} = await getTestState();

      const context = await browser.createBrowserContext({
        downloadBehavior: {
          policy: 'deny',
          downloadPath: '/tmp',
        },
      });
      const page = await context.newPage();
      await page.goto(server.PREFIX + '/download.html');
      await page.click('#download');
      await expect(
        waitForFileExistence(join(tempDir, 'download.txt')),
      ).rejects.toThrow();
    });
  });
});
