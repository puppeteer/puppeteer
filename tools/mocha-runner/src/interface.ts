/**
 * Copyright 2022 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Mocha from 'mocha';
import commonInterface from 'mocha/lib/interfaces/common';

import {testIdMatchesExpectationPattern} from './utils.js';

type SuiteFunction = ((this: Mocha.Suite) => void) | undefined;
type ExclusiveSuiteFunction = (this: Mocha.Suite) => void;

const skippedTests: Array<{testIdPattern: string; skip: true}> = process.env[
  'PUPPETEER_SKIPPED_TEST_CONFIG'
]
  ? JSON.parse(process.env['PUPPETEER_SKIPPED_TEST_CONFIG'])
  : [];

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

function customBDDInterface(suite: Mocha.Suite) {
  const suites = [suite];

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

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      context['describe'] = describe;

      function it(title: string, fn: Mocha.TestFunction, itOnly = false) {
        const suite = suites[0]!;
        const test = new Mocha.Test(title, suite.isPending() ? undefined : fn);
        test.file = file;
        test.parent = suite;

        const describeOnly = Boolean(
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          suite.parent?._onlySuites.find(child => {
            return child === suite;
          })
        );

        if (shouldSkipTest(test) && !(itOnly || describeOnly)) {
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
          (context['it'] as typeof it)(title, fn, true)
        );
      };

      it.skip = function (title: string) {
        return context['it'](title);
      };

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      context.it = it;
    }
  );
}

customBDDInterface.description = 'Custom BDD';

module.exports = customBDDInterface;
