/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */


import Mocha from 'mocha';

class SpecJSONReporter extends Mocha.reporters.Spec {
  constructor(runner: Mocha.Runner, options?: Mocha.MochaOptions) {
    super(runner, options);
    new Mocha.reporters.JSON(runner, options);
  }
}

export default SpecJSONReporter;
