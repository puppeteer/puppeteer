/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {setupSeparateTestBrowserHooks} from './mocha-utils.js';

describe('webgl', function () {
  const state = setupSeparateTestBrowserHooks({
    args: [
      // Current flags that enable software rendering.
      '--disable-gpu',
      '--enable-features=AllowSwiftShaderFallback,AllowSoftwareGLFallbackDueToCrashes',
      '--enable-unsafe-swiftshader',
    ],
  });

  describe('Create webgl context', function () {
    it('should work', async () => {
      await state.page.evaluate(() => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        if (!gl) {
          throw new Error('WebGL context not created');
        }
      });
    });
  });
});
