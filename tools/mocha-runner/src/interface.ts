/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import Mocha from 'mocha';
import commonInterface from 'mocha/lib/interfaces/common';
import {
  setLogCapture,
  getCapturedLogs,
} from 'puppeteer-core/internal/common/Debug.js';

import {testIdMatchesExpectationPattern} from './utils.js';

type SuiteFunction = ((this: Mocha.Suite) => void) | undefined;
type ExclusiveSuiteFunction = (this: Mocha.Suite) => void;

const skippedTests: Array<{testIdPattern: string; skip: true}> = process.env[
  'PUPPETEER_SKIPPED_TEST_CONFIG'
]
  ? JSON.parse(process.env['PUPPETEER_SKIPPED_TEST_CONFIG'])
  : [];

const deflakeRetries = Number(
  process.env['PUPPETEER_DEFLAKE_RETRIES']
    ? process.env['PUPPETEER_DEFLAKE_RETRIES']
    : 100,
);
const deflakeTestPattern: string | undefined =
  process.env['PUPPETEER_DEFLAKE_TESTS'];

function shouldSkipTest(test: Mocha.Test): boolean {
  // TODO: more efficient lookup.
  const definition = skippedTests.find(skippedTest => {
    return testIdMatchesExpectationPattern(test, skippedTest.testIdPattern);
  });
  if (definition && definition.skip) {
    return true;
  }
  return false;
}

function shouldDeflakeTest(test: Mocha.Test): boolean {
  if (deflakeTestPattern) {
    // TODO: cache if we have seen it already
    return testIdMatchesExpectationPattern(test, deflakeTestPattern);
  }
  return false;
}

function dumpLogsIfFail(this: Mocha.Context) {
  if (this.currentTest?.state === 'failed') {
    console.log(
      `\n"${this.currentTest.fullTitle()}" failed. Here is a debug log:`,
    );
    console.log(getCapturedLogs().join('\n') + '\n');
  }
  setLogCapture(false);
}

function customBDDInterface(suite: Mocha.Suite) {
  const suites: [Mocha.Suite] = [suite];

  suite.on(
    Mocha.Suite.constants.EVENT_FILE_PRE_REQUIRE,
    function (context, file, mocha) {
      const common = commonInterface(suites, context, mocha);

      context['before'] = common.before;
      context['after'] = common.after;
      context['beforeEach'] = common.beforeEach;
      context['afterEach'] = common.afterEach;
      if (mocha.options.delay) {
        context['run'] = common.runWithSuite(suite);
      }
      function describe(title: string, fn: SuiteFunction) {
        return common.suite.create({
          title: title,
          file: file,
          fn: fn,
        });
      }
      describe.only = function (title: string, fn: ExclusiveSuiteFunction) {
        return common.suite.only({
          title: title,
          file: file,
          fn: fn,
          isOnly: true,
        });
      };

      describe.skip = function (title: string, fn: SuiteFunction) {
        return common.suite.skip({
          title: title,
          file: file,
          fn: fn,
        });
      };

      describe.withDebugLogs = function (
        description: string,
        body: (this: Mocha.Suite) => void,
      ): void {
        context['describe']('with Debug Logs', () => {
          context['beforeEach'](() => {
            setLogCapture(true);
          });
          context['afterEach'](dumpLogsIfFail);
          context['describe'](description, body);
        });
      };

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      context['describe'] = describe;

      function it(title: string, fn: Mocha.TestFunction, itOnly = false) {
        const suite = suites[0]! as Mocha.Suite;
        const test = new Mocha.Test(title, suite.isPending() ? undefined : fn);
        test.file = file;
        test.parent = suite;

        const describeOnly = Boolean(
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          suite.parent?._onlySuites.find(child => {
            return child === suite;
          }),
        );
        if (shouldDeflakeTest(test)) {
          const deflakeSuit = Mocha.Suite.create(suite, 'with Debug Logs');
          test.file = file;
          deflakeSuit.beforeEach(function () {
            setLogCapture(true);
          });
          deflakeSuit.afterEach(dumpLogsIfFail);
          for (let i = 0; i < deflakeRetries; i++) {
            deflakeSuit.addTest(test.clone());
          }
          return test;
        } else if (!(itOnly || describeOnly) && shouldSkipTest(test)) {
          const test = new Mocha.Test(title);
          test.file = file;
          suite.addTest(test);
          return test;
        } else {
          suite.addTest(test);
          return test;
        }
      }

      it.only = function (title: string, fn: Mocha.TestFunction) {
        return common.test.only(
          mocha,
          (context['it'] as unknown as typeof it)(title, fn, true),
        );
      };

      it.skip = function (title: string) {
        return context['it'](title);
      };

      function wrapDeflake(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
        func: Function,
      ): (repeats: number, title: string, fn: Mocha.AsyncFunc) => void {
        return (repeats: number, title: string, fn: Mocha.AsyncFunc): void => {
          (context['describe'] as unknown as typeof describe).withDebugLogs(
            'with Debug Logs',
            () => {
              for (let i = 1; i <= repeats; i++) {
                func(`${i}/${title}`, fn);
              }
            },
          );
        };
      }

      it.deflake = wrapDeflake(it);
      it.deflakeOnly = wrapDeflake(it.only);

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      context.it = it;
    },
  );
}

customBDDInterface.description = 'Custom BDD';

module.exports = customBDDInterface;
