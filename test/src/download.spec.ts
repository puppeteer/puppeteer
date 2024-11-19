/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';
import {waitForFileExistence} from './utils.js';

describe("Download", () => {
    setupTestBrowserHooks();

    describe("Browser.createBrowserContext", () => {
        it('should download to configured location', async () => {
            const {browser, server} = await getTestState();
      
            const context = await browser.createBrowserContext({
              downloadBehavior: {
                policy: 'allow',
                downloadPath: '/tmp',
              },
            });
            const page = await context.newPage();
            await page.goto(server.PREFIX + '/download.html');
            await page.click('#download');
            await waitForFileExistence('/tmp/download.txt');
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
            expect(waitForFileExistence('/tmp/download.txt')).rejects.toThrow();
          });
    });
});