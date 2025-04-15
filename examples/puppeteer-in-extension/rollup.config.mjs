/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {nodeResolve} from '@rollup/plugin-node-resolve';

export default {
  input: 'background.js',
  output: {
    format: 'esm',
    dir: 'out',
  },
  // If you do not need to use WebDriver BiDi protocol,
  // exclude chromium-bidi/* to minimize the bundle size.
  external: ['chromium-bidi/*'],
  plugins: [
    nodeResolve({
      browser: true,
      resolveOnly: ['puppeteer-core'],
    }),
  ],
};
