/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
process.env.NODE_DEBUG = 'puppeteer:*';

module.exports = {
  logLevel: 'debug',
  spec: 'test/build/**/*.test.js',
  require: ['source-map-support/register'],
  exit: !!process.env.CI,
  reporter: 'spec',
  timeout: 10_000,
};
