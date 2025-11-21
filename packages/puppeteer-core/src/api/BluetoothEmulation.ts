/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @public
 * Emulated bluetooth adapter state.
 */
export type AdapterState = 'absent' | 'powered-off' | 'powered-on';

/**
 * @public
 * Represents the simulated bluetooth peripheral's manufacturer data.
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
 * A bluetooth peripheral to be simulated.
 */
export class PreconnectedPeripheral {
  address: string;
  name: string;
  manufacturerData: BluetoothManufacturerData[];
  knownServiceUuids: string[];

  constructor(
    address: string,
    name: string,
    manufacturerData: BluetoothManufacturerData[],
    knownServiceUuids: string[],
  ) {
    this.address = address;
    this.name = name;
    this.manufacturerData = manufacturerData;
    this.knownServiceUuids = knownServiceUuids;
  }
}

/**
 * Exposes the bluetooth emulation abilities.
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
 * @experimental
 * @public
 */
export interface BluetoothEmulation {
  /**
   * Emulate Bluetooth adapter. Required for bluetooth simulations
   * https://webbluetoothcg.github.io/web-bluetooth/#bluetooth-simulateAdapter-command
   *
   * @param state - The desired bluetooth adapter state.
   * @param leSupported - Mark if the adapter supports low-energy bluetooth.
   * @experimental
   * @public
   */
  emulateAdapter(
    state: AdapterState,
    leSupported?: boolean,
  ): Promise<void>;

  /**
   * Disable emulated bluetooth adapter.
   * https://webbluetoothcg.github.io/web-bluetooth/#bluetooth-disableSimulation-command
   *
   * @experimental
   * @public
   */
  disableEmulation(): Promise<void>;

  /**
   * Simulated preconnected Bluetooth Peripheral.
   * https://webbluetoothcg.github.io/web-bluetooth/#bluetooth-simulateconnectedperipheral-command
   *
   * @param preconnectedPeripheral - The peripheral to simulate.
   * @experimental
   * @public
   */
  simulatePreconnectedPeripheral(
    preconnectedPeripheral: PreconnectedPeripheral,
  ): Promise<void>;
}
