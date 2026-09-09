/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

export default {
  mode: 'production',
  entry: './index.js',
  target: 'node',
  externals: 'typescript',
  output: {
    path: process.cwd(),
    filename: 'bundle.js',
  },
};
