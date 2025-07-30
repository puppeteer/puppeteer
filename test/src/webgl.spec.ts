/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';

describe('webgl', function () {
  setupTestBrowserHooks();

  describe('Create webgl context', function () {
    it('should work', async () => {
      const {page} = await getTestState();

      const promise = page.evaluate(() => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        if (!gl) {
          throw new Error('WebGL context not created');
        }
        return true;
      });
      await promise;
      await expect(promise).resolves.toBe(true);
    });
  });
});
