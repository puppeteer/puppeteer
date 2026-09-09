/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import expect from 'expect';

import {setupSeparateTestBrowserHooks} from './mocha-utils.js';

const DEVICE_NAME = 'SOME_NAME';
const SIMULATED_PERIPHERAL = {
  address: '09:09:09:09:09:09',
  name: DEVICE_NAME,
  manufacturerData: [
    {
      key: 17,
      data: 'AP8BAX8=',
    },
  ],
  knownServiceUuids: ['12345678-1234-5678-9abc-def123456789'],
};
async function triggerBluetoothDevicePrompt() {
  const device = await (navigator as any).bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: [],
  });
  return device.name;
}

describe('request prompt for emulated bluetooth device', function () {
  const state = setupSeparateTestBrowserHooks({
    args: [
      '--enable-features=WebBluetoothNewPermissionsBackend',
      '--enable-features=WebBluetooth',
    ],
    acceptInsecureCerts: true,
  });

  it('can be canceled', async function () {
    const {page, httpsServer} = state;
    await page.goto(httpsServer.EMPTY_PAGE);

    await page.bluetooth.emulateAdapter('powered-on');
    await page.bluetooth.simulatePreconnectedPeripheral(SIMULATED_PERIPHERAL);

    const devicePromptPromise = page.waitForDevicePrompt();

    const navigatorRequestDevicePromise = page.evaluate(
      triggerBluetoothDevicePrompt,
    );

    const devicePrompt = await devicePromptPromise;
    await devicePrompt.cancel();

    // Expect the navigator request to fail.
    await expect(navigatorRequestDevicePromise).rejects.toThrow();
  });

  it('can be selected', async function () {
    const {page, httpsServer} = state;
    await page.goto(httpsServer.EMPTY_PAGE);

    await page.bluetooth.emulateAdapter('powered-on');
    await page.bluetooth.simulatePreconnectedPeripheral(SIMULATED_PERIPHERAL);

    const devicePromptPromise = page.waitForDevicePrompt();

    const navigatorRequestDevicePromise = page.evaluate(
      triggerBluetoothDevicePrompt,
    );

    // Wait for the device prompt to be shown.
    const devicePrompt = await devicePromptPromise;

    // Select available device.
    await devicePrompt.select(devicePrompt.devices[0]!);

    // Assert the device is accessed.
    expect(await navigatorRequestDevicePromise).toEqual(DEVICE_NAME);
  });
});
