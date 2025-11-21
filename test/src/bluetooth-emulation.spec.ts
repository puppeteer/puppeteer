/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import expect from 'expect';

import {setupSeparateTestBrowserHooks} from './mocha-utils.js';

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

describe('request prompt for emulated bluetooth device', function () {
  const state = setupSeparateTestBrowserHooks({
    args: [
      '--enable-features=WebBluetoothNewPermissionsBackend',
      '--enable-features=WebBluetooth',
    ],
    acceptInsecureCerts: true,
  });

  it('can be canceled', async function () {
    const {page} = state;
    await state.page.goto(state.httpsServer.EMPTY_PAGE);

    await page.bluetoothEmulation.simulateAdapter('powered-on');
    await page.bluetoothEmulation.simulatePreconnectedPeripheral(SIMULATED_PERIPHERAL);;

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
    await state.page.goto(state.httpsServer.EMPTY_PAGE);

    await page.bluetoothEmulation.simulateAdapter('powered-on');
    await page.bluetoothEmulation.simulatePreconnectedPeripheral(SIMULATED_PERIPHERAL);;

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
