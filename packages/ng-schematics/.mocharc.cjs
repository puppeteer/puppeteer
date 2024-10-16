/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
module.exports = {
  logLevel: 'debug',
  spec: 'test/build/**/*.spec.js',
  exit: !!process.env.CI,
  reporter: process.env.CI ? 'spec' : 'dot',
};
