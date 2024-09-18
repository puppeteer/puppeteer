/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {getBabelOutputPlugin} from '@rollup/plugin-babel';
import {nodeResolve} from '@rollup/plugin-node-resolve';

export default {
  input: 'main.mjs',
  output: {
    format: 'iife',
    dir: 'out',
    name: 'Puppeteer',
  },
  external: (id, parent, isResolved) => {
    if (id.includes('BrowserConnector')) {
      return false;
    }
    if (id.includes('BrowserWebSocketTransport')) {
      return false;
    }
    if (id.includes('puppeteer/node')) {
      return true;
    }
    if (id.includes('chromium-bidi') || id.includes('puppeteer/bidi')) {
      return true;
    }
    return false;
  },
  plugins: [
    nodeResolve({
      browser: true,
    }),
    // Only-specific transforms.
    getBabelOutputPlugin({
      plugins: [
        '@babel/plugin-transform-class-static-block',
        '@babel/plugin-transform-private-methods',
        '@babel/plugin-transform-private-property-in-object',
        '@babel/plugin-transform-class-properties',
        '@babel/plugin-transform-dynamic-import',
        '@babel/plugin-transform-modules-commonjs',
      ],
      allowAllFormats: true,
    }),
    // getBabelOutputPlugin({
    //   "presets": [
    //     ["@babel/preset-env", {
    //       "exclude": ["transform-regenerator"]
    //     }]
    //   ],
    //   allowAllFormats: true,
    // }),
  ],
};
