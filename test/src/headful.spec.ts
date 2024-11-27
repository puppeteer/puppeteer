/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {mkdtemp} from 'fs/promises';
import os from 'os';
import path from 'path';

import expect from 'expect';
import type {LaunchOptions} from 'puppeteer-core/internal/node/LaunchOptions.js';
import {rmSync} from 'puppeteer-core/internal/node/util/fs.js';

import {getTestState, launch} from './mocha-utils.js';

const TMP_FOLDER = path.join(os.tmpdir(), 'pptr_tmp_folder-');

describe('headful tests', function () {
  /* These tests fire up an actual browser so let's
   * allow a higher timeout
   */
  this.timeout(20_000);

  let headfulOptions: LaunchOptions & {headless: false};
  let headlessOptions: LaunchOptions & {headless: true};

  const browsers: Array<() => Promise<void>> = [];

  beforeEach(async () => {
    const {defaultBrowserOptions} = await getTestState({
      skipLaunch: true,
    });
    headfulOptions = Object.assign({}, defaultBrowserOptions, {
      headless: false as const,
    });
    headlessOptions = Object.assign({}, defaultBrowserOptions, {
      headless: true as const,
    });
  });

  async function launchBrowser(options: any) {
    const {browser, close} = await launch(options);
    browsers.push(close);
    return browser;
  }

  afterEach(async () => {
    await Promise.all(
      browsers.map((close, index) => {
        delete browsers[index];
        return close();
      }),
    );
  });

  describe('HEADFUL', function () {
    it('headless should be able to read cookies written by headful', async () => {
      /* Needs investigation into why but this fails consistently on Windows CI. */
      const {server} = await getTestState({skipLaunch: true});

      const userDataDir = await mkdtemp(TMP_FOLDER);
      // Write a cookie in headful chrome
      const headfulBrowser = await launchBrowser(
        Object.assign({userDataDir}, headfulOptions),
      );
      try {
        const headfulPage = await headfulBrowser.newPage();
        await headfulPage.goto(server.EMPTY_PAGE);
        await headfulPage.evaluate(() => {
          return (document.cookie =
            'foo=true; expires=Fri, 31 Dec 9999 23:59:59 GMT');
        });
      } finally {
        await headfulBrowser.close();
      }
      // Read the cookie from headless chrome
      const headlessBrowser = await launchBrowser(
        Object.assign({userDataDir}, headlessOptions),
      );
      let cookie = '';
      try {
        const headlessPage = await headlessBrowser.newPage();
        await headlessPage.goto(server.EMPTY_PAGE);
        cookie = await headlessPage.evaluate(() => {
          return document.cookie;
        });
      } finally {
        await headlessBrowser.close();
      }
      // This might throw. See https://github.com/puppeteer/puppeteer/issues/2778
      try {
        rmSync(userDataDir);
      } catch {}
      expect(cookie).toBe('foo=true');
    });
  });
});
