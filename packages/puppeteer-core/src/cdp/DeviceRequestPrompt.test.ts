/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import {assert} from 'chai';

import type {CDPSessionEvents} from '../api/CDPSession.js';
import {TimeoutError} from '../common/Errors.js';
import {EventEmitter} from '../common/EventEmitter.js';
import {TimeoutSettings} from '../common/TimeoutSettings.js';

import {
  CdpDeviceRequestPrompt,
  CdpDeviceRequestPromptManager,
} from './DeviceRequestPrompt.js';

class MockCDPSession extends EventEmitter<CDPSessionEvents> {
  async send(): Promise<any> {}
  connection() {
    return undefined;
  }
  readonly detached = false;
  async detach() {}
  id() {
    return '1';
  }
  parentSession() {
    return undefined;
  }
}

const DEVICE_0 = {id: '00000000', name: 'Device 0'};
const DEVICE_1 = {id: '11111111', name: 'Device 1'};

describe('DeviceRequestPrompt', function () {
  describe('waitForDevicePrompt', function () {
    it('should return prompt', async () => {
      const client = new MockCDPSession();
      const timeoutSettings = new TimeoutSettings();
      const manager = new CdpDeviceRequestPromptManager(
        client,
        timeoutSettings,
      );

      const [prompt] = await Promise.all([
        manager.waitForDevicePrompt(),
        (() => {
          client.emit('DeviceAccess.deviceRequestPrompted', {
            id: '00000000000000000000000000000000',
            devices: [],
          });
        })(),
      ]);
      assert.ok(prompt);
    });

    it('should respect timeout', async () => {
      const client = new MockCDPSession();
      const timeoutSettings = new TimeoutSettings();
      const manager = new CdpDeviceRequestPromptManager(
        client,
        timeoutSettings,
      );

      let error: unknown;
      let rejected = false;
      try {
        await manager.waitForDevicePrompt({timeout: 1});
      } catch (e) {
        rejected = true;
        error = e;
      }
      assert.isTrue(rejected, 'Expected promise to reject');
      assert.instanceOf(error, TimeoutError);
    });

    it('should respect default timeout when there is no custom timeout', async () => {
      const client = new MockCDPSession();
      const timeoutSettings = new TimeoutSettings();
      const manager = new CdpDeviceRequestPromptManager(
        client,
        timeoutSettings,
      );

      timeoutSettings.setDefaultTimeout(1);
      let error: unknown;
      let rejected = false;
      try {
        await manager.waitForDevicePrompt();
      } catch (e) {
        rejected = true;
        error = e;
      }
      assert.isTrue(rejected, 'Expected promise to reject');
      assert.instanceOf(error, TimeoutError);
    });

    it('should prioritize exact timeout over default timeout', async () => {
      const client = new MockCDPSession();
      const timeoutSettings = new TimeoutSettings();
      const manager = new CdpDeviceRequestPromptManager(
        client,
        timeoutSettings,
      );

      timeoutSettings.setDefaultTimeout(0);
      let error: unknown;
      let rejected = false;
      try {
        await manager.waitForDevicePrompt({timeout: 1});
      } catch (e) {
        rejected = true;
        error = e;
      }
      assert.isTrue(rejected, 'Expected promise to reject');
      assert.instanceOf(error, TimeoutError);
    });

    it('should work with no timeout', async () => {
      const client = new MockCDPSession();
      const timeoutSettings = new TimeoutSettings();
      const manager = new CdpDeviceRequestPromptManager(
        client,
        timeoutSettings,
      );

      const [prompt] = await Promise.all([
        manager.waitForDevicePrompt({timeout: 0}),
        (async () => {
          await new Promise(resolve => {
            setTimeout(resolve, 50);
          });
          client.emit('DeviceAccess.deviceRequestPrompted', {
            id: '00000000000000000000000000000000',
            devices: [],
          });
        })(),
      ]);
      assert.ok(prompt);
    });

    it('should return the same prompt when there are many watchdogs simultaneously', async () => {
      const client = new MockCDPSession();
      const timeoutSettings = new TimeoutSettings();
      const manager = new CdpDeviceRequestPromptManager(
        client,
        timeoutSettings,
      );

      const [prompt1, prompt2] = await Promise.all([
        manager.waitForDevicePrompt(),
        manager.waitForDevicePrompt(),
        (() => {
          client.emit('DeviceAccess.deviceRequestPrompted', {
            id: '00000000000000000000000000000000',
            devices: [],
          });
        })(),
      ]);
      assert.ok(prompt1 === prompt2);
    });

    it('should listen and shortcut when there are no watchdogs', async () => {
      const client = new MockCDPSession();
      const timeoutSettings = new TimeoutSettings();
      const manager = new CdpDeviceRequestPromptManager(
        client,
        timeoutSettings,
      );

      client.emit('DeviceAccess.deviceRequestPrompted', {
        id: '00000000000000000000000000000000',
        devices: [],
      });

      assert.ok(manager);
    });
  });

  describe('DeviceRequestPrompt.devices', function () {
    it('lists devices as they arrive', function () {
      const client = new MockCDPSession();
      const timeoutSettings = new TimeoutSettings();
      const prompt = new CdpDeviceRequestPrompt(client, timeoutSettings, {
        id: '00000000000000000000000000000000',
        devices: [],
      });

      assert.lengthOf(prompt.devices, 0);
      client.emit('DeviceAccess.deviceRequestPrompted', {
        id: '00000000000000000000000000000000',
        devices: [DEVICE_0],
      });
      assert.lengthOf(prompt.devices, 1);
      client.emit('DeviceAccess.deviceRequestPrompted', {
        id: '00000000000000000000000000000000',
        devices: [DEVICE_0, DEVICE_1],
      });
      assert.deepEqual(prompt.devices, [DEVICE_0, DEVICE_1]);
    });

    it('does not list devices from events of another prompt', function () {
      const client = new MockCDPSession();
      const timeoutSettings = new TimeoutSettings();
      const prompt = new CdpDeviceRequestPrompt(client, timeoutSettings, {
        id: '00000000000000000000000000000000',
        devices: [],
      });

      assert.lengthOf(prompt.devices, 0);
      client.emit('DeviceAccess.deviceRequestPrompted', {
        id: '88888888888888888888888888888888',
        devices: [DEVICE_0, DEVICE_1],
      });
      assert.lengthOf(prompt.devices, 0);
    });
  });

  describe('DeviceRequestPrompt.waitForDevice', function () {
    it('should return first matching device', async () => {
      const client = new MockCDPSession();
      const timeoutSettings = new TimeoutSettings();
      const prompt = new CdpDeviceRequestPrompt(client, timeoutSettings, {
        id: '00000000000000000000000000000000',
        devices: [],
      });

      const [device] = await Promise.all([
        prompt.waitForDevice(({name}) => {
          return name.includes('1');
        }),
        (() => {
          client.emit('DeviceAccess.deviceRequestPrompted', {
            id: '00000000000000000000000000000000',
            devices: [DEVICE_0],
          });
          client.emit('DeviceAccess.deviceRequestPrompted', {
            id: '00000000000000000000000000000000',
            devices: [DEVICE_0, DEVICE_1],
          });
        })(),
      ]);
      assert.deepEqual(device, DEVICE_1);
    });

    it('should return first matching device from already known devices', async () => {
      const client = new MockCDPSession();
      const timeoutSettings = new TimeoutSettings();
      const prompt = new CdpDeviceRequestPrompt(client, timeoutSettings, {
        id: '00000000000000000000000000000000',
        devices: [DEVICE_0, DEVICE_1],
      });

      const device = await prompt.waitForDevice(({name}) => {
        return name.includes('1');
      });
      assert.deepEqual(device, DEVICE_1);
    });

    it('should return device in the devices list', async () => {
      const client = new MockCDPSession();
      const timeoutSettings = new TimeoutSettings();
      const prompt = new CdpDeviceRequestPrompt(client, timeoutSettings, {
        id: '00000000000000000000000000000000',
        devices: [],
      });

      const [device] = await Promise.all([
        prompt.waitForDevice(({name}) => {
          return name.includes('1');
        }),
        (() => {
          client.emit('DeviceAccess.deviceRequestPrompted', {
            id: '00000000000000000000000000000000',
            devices: [DEVICE_0, DEVICE_1],
          });
        })(),
      ]);
      assert.include(prompt.devices, device);
    });

    it('should respect timeout', async () => {
      const client = new MockCDPSession();
      const timeoutSettings = new TimeoutSettings();
      const prompt = new CdpDeviceRequestPrompt(client, timeoutSettings, {
        id: '00000000000000000000000000000000',
        devices: [],
      });

      let error: unknown;
      let rejected = false;
      try {
        await prompt.waitForDevice(
          ({name}) => {
            return name.includes('Device');
          },
          {timeout: 1},
        );
      } catch (e) {
        rejected = true;
        error = e;
      }
      assert.isTrue(rejected, 'Expected promise to reject');
      assert.instanceOf(error, TimeoutError);
    });

    it('should respect default timeout when there is no custom timeout', async () => {
      const client = new MockCDPSession();
      const timeoutSettings = new TimeoutSettings();
      const prompt = new CdpDeviceRequestPrompt(client, timeoutSettings, {
        id: '00000000000000000000000000000000',
        devices: [],
      });

      timeoutSettings.setDefaultTimeout(1);
      let error: unknown;
      let rejected = false;
      try {
        await prompt.waitForDevice(
          ({name}) => {
            return name.includes('Device');
          },
          {timeout: 1},
        );
      } catch (e) {
        rejected = true;
        error = e;
      }
      assert.isTrue(rejected, 'Expected promise to reject');
      assert.instanceOf(error, TimeoutError);
    });

    it('should prioritize exact timeout over default timeout', async () => {
      const client = new MockCDPSession();
      const timeoutSettings = new TimeoutSettings();
      const prompt = new CdpDeviceRequestPrompt(client, timeoutSettings, {
        id: '00000000000000000000000000000000',
        devices: [],
      });

      timeoutSettings.setDefaultTimeout(0);
      let error: unknown;
      let rejected = false;
      try {
        await prompt.waitForDevice(
          ({name}) => {
            return name.includes('Device');
          },
          {timeout: 1},
        );
      } catch (e) {
        rejected = true;
        error = e;
      }
      assert.isTrue(rejected, 'Expected promise to reject');
      assert.instanceOf(error, TimeoutError);
    });

    it('should work with no timeout', async () => {
      const client = new MockCDPSession();
      const timeoutSettings = new TimeoutSettings();
      const prompt = new CdpDeviceRequestPrompt(client, timeoutSettings, {
        id: '00000000000000000000000000000000',
        devices: [],
      });

      const [device] = await Promise.all([
        prompt.waitForDevice(
          ({name}) => {
            return name.includes('1');
          },
          {timeout: 0},
        ),
        (() => {
          client.emit('DeviceAccess.deviceRequestPrompted', {
            id: '00000000000000000000000000000000',
            devices: [DEVICE_0],
          });
          client.emit('DeviceAccess.deviceRequestPrompted', {
            id: '00000000000000000000000000000000',
            devices: [DEVICE_0, DEVICE_1],
          });
        })(),
      ]);
      assert.deepEqual(device, DEVICE_1);
    });

    it('should be able to abort', async () => {
      const client = new MockCDPSession();
      const timeoutSettings = new TimeoutSettings();
      const prompt = new CdpDeviceRequestPrompt(client, timeoutSettings, {
        id: '00000000000000000000000000000000',
        devices: [],
      });
      const abortController = new AbortController();

      const task = prompt.waitForDevice(
        () => {
          return false;
        },
        {signal: abortController.signal},
      );
      abortController.abort();
      let error: unknown;
      let rejected = false;
      try {
        await task;
      } catch (e) {
        rejected = true;
        error = e;
      }
      assert.isTrue(rejected, 'Expected promise to reject');
      assert.instanceOf(error, Error);
      assert.match(error.message, /aborted/);
    });

    it('should return same device from multiple watchdogs', async () => {
      const client = new MockCDPSession();
      const timeoutSettings = new TimeoutSettings();
      const prompt = new CdpDeviceRequestPrompt(client, timeoutSettings, {
        id: '00000000000000000000000000000000',
        devices: [],
      });

      const [device1, device2] = await Promise.all([
        prompt.waitForDevice(({name}) => {
          return name.includes('1');
        }),
        prompt.waitForDevice(({name}) => {
          return name.includes('1');
        }),
        (() => {
          client.emit('DeviceAccess.deviceRequestPrompted', {
            id: '00000000000000000000000000000000',
            devices: [DEVICE_0],
          });
          client.emit('DeviceAccess.deviceRequestPrompted', {
            id: '00000000000000000000000000000000',
            devices: [DEVICE_0, DEVICE_1],
          });
        })(),
      ]);
      assert.ok(device1 === device2);
    });
  });

  describe('DeviceRequestPrompt.select', function () {
    it('should succeed with listed device', async () => {
      const client = new MockCDPSession();
      const timeoutSettings = new TimeoutSettings();
      const prompt = new CdpDeviceRequestPrompt(client, timeoutSettings, {
        id: '00000000000000000000000000000000',
        devices: [],
      });

      const [device] = await Promise.all([
        prompt.waitForDevice(({name}) => {
          return name.includes('1');
        }),
        (() => {
          client.emit('DeviceAccess.deviceRequestPrompted', {
            id: '00000000000000000000000000000000',
            devices: [DEVICE_0, DEVICE_1],
          });
        })(),
      ]);
      await prompt.select(device);
    });

    it('should error for device not listed in devices', async () => {
      const client = new MockCDPSession();
      const timeoutSettings = new TimeoutSettings();
      const prompt = new CdpDeviceRequestPrompt(client, timeoutSettings, {
        id: '00000000000000000000000000000000',
        devices: [],
      });

      let error: unknown;
      let rejected = false;
      try {
        await prompt.select(DEVICE_1);
      } catch (e) {
        rejected = true;
        error = e;
      }
      assert.isTrue(rejected, 'Expected promise to reject');
      assert.instanceOf(error, Error);
      assert.include(error.message, 'Cannot select unknown device!');
    });

    it('should fail when selecting prompt twice', async () => {
      const client = new MockCDPSession();
      const timeoutSettings = new TimeoutSettings();
      const prompt = new CdpDeviceRequestPrompt(client, timeoutSettings, {
        id: '00000000000000000000000000000000',
        devices: [],
      });

      const [device] = await Promise.all([
        prompt.waitForDevice(({name}) => {
          return name.includes('1');
        }),
        (() => {
          client.emit('DeviceAccess.deviceRequestPrompted', {
            id: '00000000000000000000000000000000',
            devices: [DEVICE_0, DEVICE_1],
          });
        })(),
      ]);
      await prompt.select(device);
      let error: unknown;
      let rejected = false;
      try {
        await prompt.select(device);
      } catch (e) {
        rejected = true;
        error = e;
      }
      assert.isTrue(rejected, 'Expected promise to reject');
      assert.instanceOf(error, Error);
      assert.include(
        error.message,
        'Cannot select DeviceRequestPrompt which is already handled!',
      );
    });
  });

  describe('DeviceRequestPrompt.cancel', function () {
    it('should succeed on first call', async () => {
      const client = new MockCDPSession();
      const timeoutSettings = new TimeoutSettings();
      const prompt = new CdpDeviceRequestPrompt(client, timeoutSettings, {
        id: '00000000000000000000000000000000',
        devices: [],
      });
      await prompt.cancel();
    });

    it('should fail when canceling prompt twice', async () => {
      const client = new MockCDPSession();
      const timeoutSettings = new TimeoutSettings();
      const prompt = new CdpDeviceRequestPrompt(client, timeoutSettings, {
        id: '00000000000000000000000000000000',
        devices: [],
      });
      await prompt.cancel();
      let error: unknown;
      let rejected = false;
      try {
        await prompt.cancel();
      } catch (e) {
        rejected = true;
        error = e;
      }
      assert.isTrue(rejected, 'Expected promise to reject');
      assert.instanceOf(error, Error);
      assert.include(
        error.message,
        'Cannot cancel DeviceRequestPrompt which is already handled!',
      );
    });
  });
});
