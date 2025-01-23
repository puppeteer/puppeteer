/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
module.exports = {
  logLevel: 'debug',
  spec: 'test/build/**/*.spec.js',
  require: ['./test/build/mocha-utils.js', 'source-map-support/register'],
  exit: !!process.env.CI,
  reporter: 'spec',
  timeout: 10_000,
};
