/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it, mock, afterEach} from 'node:test';

import expect from 'expect';

import {environment} from '../environment.js';

import {_connectToBrowser, getWSEndpointURL} from './BrowserConnector.js';

describe('BrowserConnector', () => {
  describe('getWSEndpoint via browserURL', () => {
    afterEach(() => {
      mock.restoreAll();
    });

    it('rewrites browser URLs to the version endpoint', () => {
      expect(
        getWSEndpointURL(
          'http://localhost:1234/t/session/?token=secret#ignored',
        ),
      ).toBe('http://localhost:1234/t/session/json/version?token=secret');
    });

    it('should forward headers to the /json/version HTTP request', async () => {
      const capturedRequests: Array<{url: string; init?: RequestInit}> = [];

      mock.method(
        globalThis,
        'fetch',
        async (url: string | URL | Request, init?: RequestInit) => {
          capturedRequests.push({url: String(url), init});
          return new Response(
            JSON.stringify({
              webSocketDebuggerUrl: 'ws://localhost:1234/devtools/browser/1',
            }),
            {status: 200, headers: {'Content-Type': 'application/json'}},
          );
        },
      );

      // We expect this to fail when trying to open the WebSocket, which is fine —
      // we only care that fetch was called with the right headers.
      await _connectToBrowser({
        browserURL: 'http://localhost:1234',
        headers: {Authorization: 'Bearer test-token'},
        logger: () => {
          return undefined;
        },
      }).catch(() => {});

      expect(capturedRequests).toHaveLength(1);
      expect(capturedRequests[0]!.url).toContain('/json/version');
      expect(
        (capturedRequests[0]!.init?.headers as Record<string, string>)?.[
          'Authorization'
        ],
      ).toBe('Bearer test-token');
    });
  });

  describe('_connectToBrowser', () => {
    afterEach(() => {
      mock.restoreAll();
    });

    it('should throw an error when both blocklist and allowlist are specified', async () => {
      await expect(
        _connectToBrowser({
          browserWSEndpoint: 'ws://localhost:1234',
          blocklist: ['test'],
          allowlist: ['test'],
          logger: () => {
            return undefined;
          },
        }),
      ).rejects.toThrow('Cannot specify both blocklist and allowlist');
    });

    it('should reject blocklist for WebDriver BiDi connections', async () => {
      await expect(
        _connectToBrowser({
          browserWSEndpoint: 'ws://localhost:1234',
          protocol: 'webDriverBiDi',
          blocklist: ['https://example.com/*'],
          logger: () => {
            return undefined;
          },
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
          logger: () => {
            return undefined;
          },
        }),
      ).rejects.toThrow(
        'blocklist and allowlist are only supported with the CDP protocol',
      );
    });

    it('reports permission denied when reading DevToolsActivePort fails with EPERM or EACCES', async () => {
      for (const code of ['EPERM', 'EACCES'] as const) {
        const fsError = Object.assign(
          new Error(`${code}: operation not permitted`),
          {code},
        );
        mock.method(environment.value, 'readFile', async () => {
          throw fsError;
        });

        let caught: Error | undefined;
        try {
          await _connectToBrowser({
            channel: 'chrome',
            logger: () => {
              return undefined;
            },
          });
        } catch (err) {
          caught = err as Error;
        }

        expect(caught).toBeDefined();
        expect(caught!.message).toMatch(
          /^Could not read DevToolsActivePort for chrome at .*DevToolsActivePort: permission denied$/,
        );
        expect(caught!.cause).toBe(fsError);
        mock.restoreAll();
      }
    });

    it('reports Could not find DevToolsActivePort when reading fails with ENOENT', async () => {
      const enoentError = Object.assign(
        new Error('ENOENT: no such file or directory'),
        {code: 'ENOENT'},
      );
      mock.method(environment.value, 'readFile', async () => {
        throw enoentError;
      });

      let caught: Error | undefined;
      try {
        await _connectToBrowser({
          channel: 'chrome',
          logger: () => {
            return undefined;
          },
        });
      } catch (err) {
        caught = err as Error;
      }

      expect(caught).toBeDefined();
      expect(caught!.message).toMatch(
        /^Could not find DevToolsActivePort for chrome at .*DevToolsActivePort$/,
      );
      expect(caught!.cause).toBe(enoentError);
    });
  });
});
