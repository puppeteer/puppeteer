/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';
import {LazyArg} from 'puppeteer-core/internal/common/LazyArg.js';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';

describe('PuppeteerUtil tests', function () {
  setupTestBrowserHooks();

  it('should work', async () => {
    const {page} = await getTestState();

    const world = page.mainFrame().isolatedRealm();
    const value = await world.evaluate(
      PuppeteerUtil => {
        return typeof PuppeteerUtil === 'object';
      },
      LazyArg.create(context => {
        return context.puppeteerUtil;
      })
    );
    expect(value).toBeTruthy();
  });

  describe('createFunction tests', function () {
    it('should work', async () => {
      const {page} = await getTestState();

      const world = page.mainFrame().isolatedRealm();
      const value = await world.evaluate(
        ({createFunction}, fnString) => {
          return createFunction(fnString)(4);
        },
        LazyArg.create(context => {
          return context.puppeteerUtil;
        }),
        (() => {
          return 4;
        }).toString()
      );
      expect(value).toBe(4);
    });
  });
});
