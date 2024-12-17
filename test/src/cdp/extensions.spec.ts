/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'path';

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
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
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
    const worker = await serviceWorkerTarget.worker();
    expect(
      await worker!.evaluate(() => {
        // @ts-expect-error different context.
        return globalThis.MAGIC;
      }),
    ).toBe(42);
  });
});
