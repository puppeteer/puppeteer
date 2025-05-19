/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'node:path';

import expect from 'expect';

import {setupSeparateTestBrowserHooks} from '../mocha-utils.js';

const extensionPath = path.join(
  __dirname,
  '..',
  '..',
  'assets',
  'simple-extension',
);

describe('extensions', function () {
  const state = setupSeparateTestBrowserHooks(
    {
      enableExtensions: true,
      args: [`--load-extension=${extensionPath}`],
    },
    {createContext: false},
  );

  it('service_worker target type should be available', async function () {
    const {browser} = state;
    const serviceWorkerTarget = await browser.waitForTarget(target => {
      return target.type() === 'service_worker';
    });
    expect(serviceWorkerTarget).toBeTruthy();
  });

  it('can evaluate in the service worker', async function () {
    const {browser} = state;
    const serviceWorkerTarget = await browser.waitForTarget(target => {
      return target.type() === 'service_worker';
    });
    const worker = await serviceWorkerTarget.worker()!;

    let result = '';
    // TODO: Chrome is flaky and MAGIC is sometimes not yet
    // defined. Generally, it should not be the case but it look like
    // there is a race condition between Runtime.evaluate and the
    // worker's main script execution.
    for (let i = 0; i < 5; i++) {
      try {
        result = await worker!.evaluate(() => {
          // @ts-expect-error different context.
          return globalThis.MAGIC;
        });
        break;
      } catch {}
      await new Promise(resolve => {
        return setTimeout(resolve, 200);
      });
    }
    expect(result).toBe(42);
  });
});
