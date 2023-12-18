/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

let timeout = process.platform === 'win32' ? 20_000 : 10_000;
if (!!process.env.DEBUGGER_ATTACHED) {
  timeout = 0;
}
module.exports = {
  reporter: 'dot',
  logLevel: 'debug',
  require: ['./test/build/mocha-utils.js', 'source-map-support/register'],
  exit: !!process.env.CI,
  retries: process.env.CI ? 3 : 0,
  parallel: !!process.env.PARALLEL,
  timeout: timeout,
  reporter: process.env.CI ? 'spec' : 'dot',
  // This should make mocha crash on uncaught errors.
  // See https://github.com/mochajs/mocha/blob/master/docs/index.md#--allow-uncaught.
  allowUncaught: true,
  // See https://github.com/mochajs/mocha/blob/master/docs/index.md#--async-only--a.
  asyncOnly: true,
};
