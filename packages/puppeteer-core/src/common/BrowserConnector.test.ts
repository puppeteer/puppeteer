/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import expect from 'expect';

import {_connectToBrowser} from './BrowserConnector.js';

describe('BrowserConnector', () => {
  describe('_connectToBrowser', () => {
    it('should throw an error when both blocklist and allowlist are specified', async () => {
      await expect(
        _connectToBrowser({
          browserWSEndpoint: 'ws://localhost:1234',
          blocklist: ['test'],
          allowlist: ['test'],
        }),
      ).rejects.toThrow('Cannot specify both blocklist and allowlist');
    });

    it('should reject blocklist for WebDriver BiDi connections', async () => {
      await expect(
        _connectToBrowser({
          browserWSEndpoint: 'ws://localhost:1234',
          protocol: 'webDriverBiDi',
          blocklist: ['https://example.com/*'],
        }),
      ).rejects.toThrow(
        'blocklist and allowlist are only supported with the CDP protocol',
      );
    });

    it('should reject allowlist for WebDriver BiDi connections', async () => {
      await expect(
        _connectToBrowser({
          browserWSEndpoint: 'ws://localhost:1234',
          protocol: 'webDriverBiDi',
          allowlist: ['https://example.com/*'],
        }),
      ).rejects.toThrow(
        'blocklist and allowlist are only supported with the CDP protocol',
      );
    });
  });
});
