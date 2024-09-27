/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import path from 'path';

import {getBabelOutputPlugin} from '@rollup/plugin-babel';
import {nodeResolve} from '@rollup/plugin-node-resolve';

const cwd = process.cwd();

export default {
  input: 'lib/esm/puppeteer/puppeteer-core-browser.js',
  output: {
    format: 'iife',
    file: 'lib/es5-iife/puppeteer-core-browser.js',
    name: 'Puppeteer',
  },
  external: (id, parent, isResolved) => {
    if (id.includes('BrowserConnector')) {
      return false;
    }
    if (id.includes('BrowserWebSocketTransport')) {
      return false;
    }
    if (id.includes('node_modules')) {
      return true;
    }
    if (id.startsWith(path.join(cwd, `lib`, `esm`, `puppeteer`, `bidi`))) {
      return true;
    }
    if (id.startsWith(path.join(cwd, `lib`, `esm`, `puppeteer`, `node`))) {
      return true;
    }
    return false;
  },
  plugins: [
    nodeResolve({
      browser: true,
    }),
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
      compact: false,
    }),
  ],
};
