/**
 * @license
 * Copyright 2019 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import expect from 'expect';
import {Deferred} from 'puppeteer-core/internal/util/Deferred.js';

import {getTestState, launch} from '../mocha-utils.js';
import {waitEvent} from '../utils.js';

describe('Puppeteer.launch', function () {
  it('should support the pipe option', async () => {
    const {browser, close} = await launch({pipe: true});
    try {
      expect(await browser.pages()).toHaveLength(1);
      expect(browser.wsEndpoint()).toBe('');
      const page = await browser.newPage();
      expect(await page.evaluate('11 * 11')).toBe(121);
      await page.close();
    } finally {
      await close();
    }
  });
  it('should support the pipe argument', async () => {
    const {defaultBrowserOptions} = await getTestState({skipLaunch: true});
    const options = Object.assign({}, defaultBrowserOptions);
    options.args = ['--remote-debugging-pipe'].concat(options.args || []);
    const {browser, close} = await launch(options);
    try {
      expect(browser.wsEndpoint()).toBe('');
      const page = await browser.newPage();
      expect(await page.evaluate('11 * 11')).toBe(121);
      await page.close();
    } finally {
      await close();
    }
  });
  it('should fire "disconnected" when closing with pipe', async function () {
    const {browser, close} = await launch({pipe: true});
    try {
      const disconnectedEventPromise = waitEvent(browser, 'disconnected');
      // Emulate user exiting browser.
      browser.process()!.kill();
      await Deferred.race([
        disconnectedEventPromise,
        Deferred.create({
          message: `Failed in after Hook`,
          timeout: this.timeout() - 1000,
        }),
      ]);
    } finally {
      await close();
    }
  });
});
