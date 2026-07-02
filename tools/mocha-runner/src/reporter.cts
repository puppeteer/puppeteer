/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * This file needs to be kept CJS until Mocha starts accepting ESM
 * for custom reporters
 */

import Mocha from 'mocha';

class SpecJSONReporter extends Mocha.reporters.Spec {
  constructor(runner: Mocha.Runner, options?: Mocha.MochaOptions) {
    super(runner, options);
    Mocha.reporters.JSON.call(this, runner, options);
  }
}

module.exports = SpecJSONReporter;
