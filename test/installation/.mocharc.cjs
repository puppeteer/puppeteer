/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @type {import('mocha').MochaOptions}
 */
module.exports = {
  spec: ['build/**/*.spec.js'],
  require: ['source-map-support/register'],
  exit: !!process.env.CI,
  timeout: 240_000,
  // This should make mocha crash on uncaught errors.
  // See https://github.com/mochajs/mocha/blob/master/docs/index.md#--allow-uncaught.
  allowUncaught: true,
  // See https://github.com/mochajs/mocha/blob/master/docs/index.md#--async-only--a.
  asyncOnly: true,
};
