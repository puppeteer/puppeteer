/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import expect from 'expect';

import {disposeSymbol} from '../util/disposable.js';

import {Browser} from './Browser.js';
import {BrowserContext} from './BrowserContext.js';

// @ts-expect-error abstract methods not needed for screenshot mutex test
class MockBrowser extends Browser {
  constructor() {
    super(() => {
      return undefined;
    });
  }
}

// @ts-expect-error abstract methods not needed for screenshot mutex test
class MockBrowserContext extends BrowserContext {
  #browser: Browser;

  constructor(browser: Browser) {
    super(() => {
      return undefined;
    });
    this.#browser = browser;
  }

  override browser(): Browser {
    return this.#browser;
  }
}

describe('Browser screenshot mutex', () => {
  it('serializes screenshot operations across separate BrowserContexts', async () => {
    const browser = new MockBrowser();
    const context1 = new MockBrowserContext(browser);
    const context2 = new MockBrowserContext(browser);

    expect(context1.waitForScreenshotOperations()).toBeUndefined();
    expect(context2.waitForScreenshotOperations()).toBeUndefined();

    const order: string[] = [];

    const guard1Promise = context1.startScreenshot();
    const guard2Promise = context2.startScreenshot().then(guard => {
      order.push('screenshot-2-acquired');
      return guard;
    });
    const waitInContext1 = context1
      .waitForScreenshotOperations()!
      .then(guard => {
        order.push('waiter-acquired');
        guard[disposeSymbol]();
      });

    const guard1 = await guard1Promise;
    order.push('screenshot-1-acquired');
    expect(order).toEqual(['screenshot-1-acquired']);

    guard1[disposeSymbol]();

    const guard2 = await guard2Promise;
    expect(order).toEqual(['screenshot-1-acquired', 'screenshot-2-acquired']);

    guard2[disposeSymbol]();
    await waitInContext1;
    expect(order).toEqual([
      'screenshot-1-acquired',
      'screenshot-2-acquired',
      'waiter-acquired',
    ]);

    expect(context1.waitForScreenshotOperations()).toBeUndefined();
    expect(context2.waitForScreenshotOperations()).toBeUndefined();
  });
});
