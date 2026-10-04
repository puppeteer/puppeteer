/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import Mocha from 'mocha';

import {clearCapturedLogs, dumpLogs} from './interface.js';

export function registerLogListeners(runner: Mocha.Runner): void {
  runner.on(Mocha.Runner.constants.EVENT_TEST_BEGIN, () => {
    clearCapturedLogs();
  });
  runner.on(Mocha.Runner.constants.EVENT_HOOK_BEGIN, () => {
    clearCapturedLogs();
  });
  runner.on(Mocha.Runner.constants.EVENT_HOOK_END, () => {
    clearCapturedLogs();
  });
  runner.on(
    Mocha.Runner.constants.EVENT_TEST_FAIL,
    (runnable: Mocha.Runnable) => {
      dumpLogs(runnable);
    },
  );
}

export class SpecJSONReporter extends Mocha.reporters.Spec {
  constructor(runner: Mocha.Runner, options?: Mocha.MochaOptions) {
    super(runner, options);
    new Mocha.reporters.JSON(runner, options);
    registerLogListeners(runner);
  }
}

export default SpecJSONReporter;
