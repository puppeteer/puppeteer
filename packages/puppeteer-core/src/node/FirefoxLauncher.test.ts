/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {mkdtempSync, readdirSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {describe, it} from 'node:test';

import expect from 'expect';

import {FirefoxLauncher} from './FirefoxLauncher.js';
import type {PuppeteerNode} from './PuppeteerNode.js';

describe('FirefoxLauncher', function () {
  describe('getPreferences', function () {
    it('should return preferences for WebDriver BiDi', async () => {
      const prefs: Record<string, unknown> = FirefoxLauncher.getPreferences({
        test: 1,
      });
      expect(prefs['test']).toBe(1);
      expect(prefs['fission.bfcacheInParent']).toBe(undefined);
      expect(prefs['fission.webContentIsolationStrategy']).toBe(0);
    });
  });

  describe('launch', function () {
    it('should reject blocklist for the default Firefox WebDriver BiDi protocol', async () => {
      const launcher = new FirefoxLauncher({} as PuppeteerNode, () => {
        return undefined;
      });

      await expect(
        launcher.launch({
          blocklist: ['https://example.com/*'],
        }),
      ).rejects.toThrow(
        'blocklist and allowlist are only supported with the CDP protocol',
      );
    });

    it('should remove the temporary profile when pipe connections are rejected', async () => {
      const temporaryDirectory = mkdtempSync(
        join(tmpdir(), 'puppeteer-firefox-pipe-'),
      );
      const launcher = new FirefoxLauncher(
        {
          configuration: () => {
            return Promise.resolve({temporaryDirectory});
          },
        } as unknown as PuppeteerNode,
        () => {
          return undefined;
        },
      );

      await expect(
        launcher.launch({
          executablePath: process.execPath,
          args: ['--remote-debugging-pipe'],
        }),
      ).rejects.toThrow(
        'Pipe connections are not supported with Firefox and WebDriver BiDi',
      );

      expect(readdirSync(temporaryDirectory)).toEqual([]);
      rmSync(temporaryDirectory, {recursive: true, force: true});
    });
  });
});
