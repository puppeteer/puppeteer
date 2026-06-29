/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import {describe, it} from 'node:test';

import {getBrowserSetting} from './getConfiguration.js';

void describe('getConfiguration', () => {
  void describe('getBrowserSetting', () => {
    void it('picks the correct browser config when local skipDownload is true', () => {
      const result = getBrowserSetting('chrome', {
        chrome: {
          skipDownload: true,
          version: 'latest',
        },
      });

      assert.partialDeepStrictEqual(result, {
        skipDownload: true,
        version: 'latest',
      });
    });

    void it('picks the correct skipDownload when both global and local properties are used', () => {
      const result = getBrowserSetting('chrome', {
        skipDownload: true,
        chrome: {
          skipDownload: false,
          version: 'latest',
        },
        firefox: {
          version: 'stable',
        },
      });

      assert.equal(result.skipDownload, false);
    });

    void it('picks the correct browser config when global skipDownload is true', () => {
      const result = getBrowserSetting('chrome', {
        skipDownload: true,
        chrome: {
          version: 'latest',
        },
      });

      assert.partialDeepStrictEqual(result, {
        skipDownload: true,
        version: 'latest',
      });
    });
  });
});
