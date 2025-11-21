/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as Bidi from 'webdriver-bidi-protocol';

/**
 * @public
 * Emulated bluetooth adapter state.
 */
export type AdapterState = 'absent' | 'powered-off' | 'powered-on';

/**
 * @public
 * Stores the simulated bluetooth device's manufacturer data.
 */
export interface BluetoothManufacturerData {
  /**
   * Company identifier
   * https://bitbucket.org/bluetooth-SIG/public/src/main/assigned_numbers/company_identifiers/company_identifiers.yaml https://usb.org/developers
   */
  key: number;
  /**
   * Base64-encoded JSON representing the manufacturer’s data.
   */
  data: string;
}

/**
 * @public
 * A peripheral to be simulated.
 */
export class PreconnectedPeripheral {
  address: string;
  name: string;
  manufacturerData: [...Bidi.Bluetooth.BluetoothManufacturerData[]];
  knownServiceUuids: [...Bidi.Bluetooth.BluetoothUuid[]];

  constructor(
    address: string,
    name: string,
    manufacturerData: [...Bidi.Bluetooth.BluetoothManufacturerData[]],
    knownServiceUuids: [...Bidi.Bluetooth.BluetoothUuid[]],
  ) {
    this.address = address;
    this.name = name;
    this.manufacturerData = manufacturerData;
    this.knownServiceUuids = knownServiceUuids;
  }
}

/**
 * The BluetoothEmulation class exposes the bluetooth emulation abilities.
 * @remarks
 * @example
 *
 * ```ts
 * await page.bluetoothEmulation.emulateAdapter('powered-on');
 * await page.bluetoothEmulation.simulatePreconnectedPeripheral({
 *   address: '09:09:09:09:09:09',
 *   name: 'SOME_NAME',
 *   manufacturerData: [{
 *     key: 17,
 *     data: 'AP8BAX8=',
 *   }],
 *   knownServiceUuids: ['12345678-1234-5678-9abc-def123456789'],
 * });
 * await page.bluetoothEmulation.disableEmulation();
 * ```
 *
 * @public
 * @experimental
 */
export interface BluetoothEmulation {
  emulateAdapter(
    state: AdapterState,
    leSupported?: boolean,
  ): Promise<void>;

  disableEmulation(): Promise<void>;

  simulatePreconnectedPeripheral(
    preconnectedPeripheral: PreconnectedPeripheral,
  ): Promise<void>;
}
