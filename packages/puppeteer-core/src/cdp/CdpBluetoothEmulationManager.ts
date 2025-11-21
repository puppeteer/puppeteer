/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  BluetoothAdapterState,
  BluetoothEmulationManager,
  PreconnectedBluetoothPeripheral,
} from '../api/BluetoothEmulationManager.js';

import type {CdpCDPSession} from './CdpSession.js';
import type {CdpTarget} from './Target.js';

export class CdpBluetoothEmulationManager implements BluetoothEmulationManager {
  #cdpTarget: CdpTarget;
  // Cdp session is created on-demand.
  #cdpSession?: CdpCDPSession;

  constructor(cdpTarget: CdpTarget) {
    this.#cdpTarget = cdpTarget;
  }

  async #getCdpSession() {
    if (!this.#cdpSession) {
      this.#cdpSession = await this.#cdpTarget.createCDPSession();
    }
    return this.#cdpSession;
  }

  async simulateAdapter(
    state: BluetoothAdapterState,
    leSupported: boolean,
  ): Promise<void> {
    // Bluetooth spec requires overriding the existing adapter (step 6). From the CDP
    // perspective, it means disabling the emulation first.
    // https://webbluetoothcg.github.io/web-bluetooth/#bluetooth-simulateAdapter-command
    await (await this.#getCdpSession()).send('BluetoothEmulation.disable');
    await (
      await this.#getCdpSession()
    ).send('BluetoothEmulation.enable', {
      state,
      leSupported,
    });
  }

  async disableSimulation(): Promise<void> {
    await (await this.#getCdpSession()).send('BluetoothEmulation.disable');
  }

  async simulatePreconnectedPeripheral(
    preconnectedPeripheral: PreconnectedBluetoothPeripheral,
  ): Promise<void> {
    await (
      await this.#getCdpSession()
    ).send(
      'BluetoothEmulation.simulatePreconnectedPeripheral',
      preconnectedPeripheral,
    );
  }
}
