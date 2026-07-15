/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it, mock, beforeEach, afterEach} from 'node:test';

import expect from 'expect';

import {_connectToBrowser} from './BrowserConnector.js';

describe('BrowserConnector', () => {
  describe('getWSEndpoint via browserURL', () => {
    let originalFetch: typeof globalThis.fetch;

    beforeEach(() => {
      originalFetch = globalThis.fetch;
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
      mock.restoreAll();
    });

    it('should forward headers to the /json/version HTTP request', async () => {
      const capturedRequests: {url: string; init?: RequestInit}[] = [];

      globalThis.fetch = async (url, init) => {
        capturedRequests.push({url: String(url), init});
        return new Response(
          JSON.stringify({webSocketDebuggerUrl: 'ws://localhost:1234/devtools/browser/1'}),
          {status: 200, headers: {'Content-Type': 'application/json'}},
        );
      };

      // We expect this to fail when trying to open the WebSocket, which is fine —
      // we only care that fetch was called with the right headers.
      await _connectToBrowser({
        browserURL: 'http://localhost:1234',
        headers: {Authorization: 'Bearer test-token'},
      }).catch(() => {});

      expect(capturedRequests).toHaveLength(1);
      expect(capturedRequests[0]!.url).toContain('/json/version');
      expect((capturedRequests[0]!.init?.headers as Record<string, string>)?.['Authorization']).toBe('Bearer test-token');
    });
  });

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
