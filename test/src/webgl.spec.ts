/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';

import {setupSeparateTestBrowserHooks} from './mocha-utils.js';

describe('webgl', function () {
  const state = setupSeparateTestBrowserHooks({
    args: [
      '--disable-gpu',
      '--enable-features=AllowSwiftShaderFallback,AllowSoftwareGLFallbackDueToCrashes',
      '--enable-unsafe-swiftshader',
    ],
  });

  describe('Create webgl context', function () {
    it('should work', async () => {
      const promise = state.page.evaluate(() => {
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
