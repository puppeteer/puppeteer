/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as Bidi from 'webdriver-bidi-protocol';

/**
 * Emulated bluetooth adapter state.
 */
export type BluetoothAdapterState = 'absent' | 'powered-off' | 'powered-on';

/**
 * Stores the emulated bluetooth device's manufacturer data.
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
 * A peripheral to be emulated.
 */
export class PreconnectedBluetoothPeripheral {
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
 * @internal
 */
export interface BluetoothEmulationManager {
  simulateAdapter(
    state: BluetoothAdapterState,
    leSupported?: boolean,
  ): Promise<void>;

  disableSimulation(): Promise<void>;

  simulatePreconnectedPeripheral(
    preconnectedPeripheral: PreconnectedBluetoothPeripheral,
  ): Promise<void>;
}
