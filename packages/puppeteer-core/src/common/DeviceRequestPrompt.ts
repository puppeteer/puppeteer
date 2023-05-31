/**
 * Copyright 2022 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Protocol from 'devtools-protocol';

import {WaitTimeoutOptions} from '../api/Page.js';
import {assert} from '../util/assert.js';
import {Deferred} from '../util/Deferred.js';

import {CDPSession} from './Connection.js';
import {TimeoutSettings} from './TimeoutSettings.js';

/**
 * Device in a request prompt.
 *
 * @public
 */
export class DeviceRequestPromptDevice {
  /**
   * Device id during a prompt.
   */
  id: string;

  /**
   * Device name as it appears in a prompt.
   */
  name: string;

  /**
   * @internal
   */
  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}

/**
 * Device request prompts let you respond to the page requesting for a device
 * through an API like WebBluetooth.
 *
 * @remarks
 * `DeviceRequestPrompt` instances are returned via the
 * {@link Page.waitForDevicePrompt} method.
 *
 * @example
 *
 * ```ts
 * const [deviceRequest] = Promise.all([
 *   page.waitForDevicePrompt(),
 *   page.click('#connect-bluetooth'),
 * ]);
 * await devicePrompt.select(
 *   await devicePrompt.waitForDevice(({name}) => name.includes('My Device'))
 * );
 * ```
 *
 * @public
 */
export class DeviceRequestPrompt {
  #client: CDPSession | null;
  #timeoutSettings: TimeoutSettings;
  #id: string;
  #handled = false;
  #updateDevicesHandle = this.#updateDevices.bind(this);
  #waitForDevicePromises = new Set<{
    filter: (device: DeviceRequestPromptDevice) => boolean;
    promise: Deferred<DeviceRequestPromptDevice>;
  }>();

  /**
   * Current list of selectable devices.
   */
  devices: DeviceRequestPromptDevice[] = [];

  /**
   * @internal
   */
  constructor(
    client: CDPSession,
    timeoutSettings: TimeoutSettings,
    firstEvent: Protocol.DeviceAccess.DeviceRequestPromptedEvent
  ) {
    this.#client = client;
    this.#timeoutSettings = timeoutSettings;
    this.#id = firstEvent.id;

    this.#client.on(
      'DeviceAccess.deviceRequestPrompted',
      this.#updateDevicesHandle
    );
    this.#client.on('Target.detachedFromTarget', () => {
      this.#client = null;
    });

    this.#updateDevices(firstEvent);
  }

  #updateDevices(event: Protocol.DeviceAccess.DeviceRequestPromptedEvent) {
    if (event.id !== this.#id) {
      return;
    }

    for (const rawDevice of event.devices) {
      if (
        this.devices.some(device => {
          return device.id === rawDevice.id;
        })
      ) {
        continue;
      }

      const newDevice = new DeviceRequestPromptDevice(
        rawDevice.id,
        rawDevice.name
      );
      this.devices.push(newDevice);

      for (const waitForDevicePromise of this.#waitForDevicePromises) {
        if (waitForDevicePromise.filter(newDevice)) {
          waitForDevicePromise.promise.resolve(newDevice);
        }
      }
    }
  }

  /**
   * Resolve to the first device in the prompt matching a filter.
   */
  async waitForDevice(
    filter: (device: DeviceRequestPromptDevice) => boolean,
    options: WaitTimeoutOptions = {}
  ): Promise<DeviceRequestPromptDevice> {
    for (const device of this.devices) {
      if (filter(device)) {
        return device;
      }
    }

    const {timeout = this.#timeoutSettings.timeout()} = options;
    const deferred = Deferred.create<DeviceRequestPromptDevice>({
      message: `Waiting for \`DeviceRequestPromptDevice\` failed: ${timeout}ms exceeded`,
      timeout,
    });
    const handle = {filter, promise: deferred};
    this.#waitForDevicePromises.add(handle);
    try {
      return await deferred.valueOrThrow();
    } finally {
      this.#waitForDevicePromises.delete(handle);
    }
  }

  /**
   * Select a device in the prompt's list.
   */
  async select(device: DeviceRequestPromptDevice): Promise<void> {
    assert(
      this.#client !== null,
      'Cannot select device through detached session!'
    );
    assert(this.devices.includes(device), 'Cannot select unknown device!');
    assert(
      !this.#handled,
      'Cannot select DeviceRequestPrompt which is already handled!'
    );
    this.#client.off(
      'DeviceAccess.deviceRequestPrompted',
      this.#updateDevicesHandle
    );
    this.#handled = true;
    return this.#client.send('DeviceAccess.selectPrompt', {
      id: this.#id,
      deviceId: device.id,
    });
  }

  /**
   * Cancel the prompt.
   */
  async cancel(): Promise<void> {
    assert(
      this.#client !== null,
      'Cannot cancel prompt through detached session!'
    );
    assert(
      !this.#handled,
      'Cannot cancel DeviceRequestPrompt which is already handled!'
    );
    this.#client.off(
      'DeviceAccess.deviceRequestPrompted',
      this.#updateDevicesHandle
    );
    this.#handled = true;
    return this.#client.send('DeviceAccess.cancelPrompt', {id: this.#id});
  }
}

/**
 * @internal
 */
export class DeviceRequestPromptManager {
  #client: CDPSession | null;
  #timeoutSettings: TimeoutSettings;
  #deviceRequestPrompDeferreds = new Set<Deferred<DeviceRequestPrompt>>();

  /**
   * @internal
   */
  constructor(client: CDPSession, timeoutSettings: TimeoutSettings) {
    this.#client = client;
    this.#timeoutSettings = timeoutSettings;

    this.#client.on('DeviceAccess.deviceRequestPrompted', event => {
      this.#onDeviceRequestPrompted(event);
    });
    this.#client.on('Target.detachedFromTarget', () => {
      this.#client = null;
    });
  }

  /**
   * Wait for device prompt created by an action like calling WebBluetooth's
   * requestDevice.
   */
  async waitForDevicePrompt(
    options: WaitTimeoutOptions = {}
  ): Promise<DeviceRequestPrompt> {
    assert(
      this.#client !== null,
      'Cannot wait for device prompt through detached session!'
    );
    const needsEnable = this.#deviceRequestPrompDeferreds.size === 0;
    let enablePromise: Promise<void> | undefined;
    if (needsEnable) {
      enablePromise = this.#client.send('DeviceAccess.enable');
    }

    const {timeout = this.#timeoutSettings.timeout()} = options;
    const deferred = Deferred.create<DeviceRequestPrompt>({
      message: `Waiting for \`DeviceRequestPrompt\` failed: ${timeout}ms exceeded`,
      timeout,
    });
    this.#deviceRequestPrompDeferreds.add(deferred);

    try {
      const [result] = await Promise.all([
        deferred.valueOrThrow(),
        enablePromise,
      ]);
      return result;
    } finally {
      this.#deviceRequestPrompDeferreds.delete(deferred);
    }
  }

  /**
   * @internal
   */
  #onDeviceRequestPrompted(
    event: Protocol.DeviceAccess.DeviceRequestPromptedEvent
  ) {
    if (!this.#deviceRequestPrompDeferreds.size) {
      return;
    }

    assert(this.#client !== null);
    const devicePrompt = new DeviceRequestPrompt(
      this.#client,
      this.#timeoutSettings,
      event
    );
    for (const promise of this.#deviceRequestPrompDeferreds) {
      promise.resolve(devicePrompt);
    }
    this.#deviceRequestPrompDeferreds.clear();
  }
}
