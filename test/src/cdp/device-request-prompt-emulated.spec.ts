/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import expect from 'expect';
import type {CDPSession} from 'puppeteer-core/internal/api/CDPSession.js';

import {setupSeparateTestBrowserHooks} from '../mocha-utils.js';

const SIMULATED_PERIPHERAL = {
  address: '09:09:09:09:09:09',
  name: 'SOME_NAME',
  manufacturerData: [
    {
      key: 17,
      data: 'AP8BAX8=',
    },
  ],
  knownServiceUuids: ['12345678-1234-5678-9abc-def123456789'],
};

describe('device request prompt with emulated device', function () {
  const state = setupSeparateTestBrowserHooks({
    args: [
      '--enable-features=WebBluetoothNewPermissionsBackend',
      '--enable-features=WebBluetooth',
    ],
    acceptInsecureCerts: true,
  });

  // `browserSession` should be clean up between tests to prevent state leak.
  let browserSession: CDPSession | null = null;

  beforeEach(async () => {
    await state.page.goto(state.httpsServer.EMPTY_PAGE);

    browserSession = await state.browser.target().createCDPSession();
    await browserSession.send('BluetoothEmulation.disable');
    await browserSession.send('BluetoothEmulation.enable', {
      state: 'powered-on',
      leSupported: true,
    });
    await browserSession.send(
      'BluetoothEmulation.simulatePreconnectedPeripheral',
      SIMULATED_PERIPHERAL,
    );
  });

  afterEach(async () => {
    await browserSession?.detach();
  });

  it('can be canceled', async function () {
    const {page} = state;

    const devicePromptPromise = page.waitForDevicePrompt();

    const navigatorRequestDevicePromise =
      page.evaluate(`navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [],
      })`);

    const devicePrompt = await devicePromptPromise;
    await devicePrompt.cancel();

    // Expect the navigator request to fail.
    await expect(navigatorRequestDevicePromise).rejects.toThrow();
  });

  it('can be selected', async function () {
    const {page} = state;

    const devicePromptPromise = page.waitForDevicePrompt();

    // Trigger bluetooth device prompt.
    const navigatorRequestDevicePromise =
      page.evaluate(`navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: [],
        })`);

    // Wait for the device prompt to be shown.
    const devicePrompt = await devicePromptPromise;

    // Select available device.
    await devicePrompt.select(devicePrompt.devices[0]!);

    // Assert the navigator request is finished.
    expect(await navigatorRequestDevicePromise).toBeTruthy();
  });
});
