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

import {
  TestExpectation,
  MochaResults,
  zTestSuiteFile,
  zPlatform,
  TestSuite,
  TestSuiteFile,
  Platform,
} from './types.js';

import path from 'path';
import fs from 'fs';
import os from 'os';
import {spawn} from 'node:child_process';
import {
  extendProcessEnv,
  filterByPlatform,
  prettyPrintJSON,
  readJSON,
  filterByParameters,
  getExpectationUpdates,
} from './utils.js';

function getApplicableTestSuites(
  parsedSuitesFile: TestSuiteFile,
  platform: Platform
): TestSuite[] {
  const testSuiteArgIdx = process.argv.indexOf('--test-suite');
  let applicableSuites: TestSuite[] = [];

  if (testSuiteArgIdx === -1) {
    applicableSuites = filterByPlatform(parsedSuitesFile.testSuites, platform);
  } else {
    const testSuiteId = process.argv[testSuiteArgIdx + 1];
    const testSuite = parsedSuitesFile.testSuites.find(suite => {
      return suite.id === testSuiteId;
    });

    if (!testSuite) {
      console.error(`Test suite ${testSuiteId} is not defined`);
      process.exit(1);
    }

    if (!testSuite.platforms.includes(platform)) {
      console.warn(
        `Test suite ${testSuiteId} is not enabled for your platform. Running it anyway.`
      );
    }

    applicableSuites = [testSuite];
  }

  return applicableSuites;
}

async function main() {
  const noCoverage = process.argv.indexOf('--no-coverage') !== -1;

  const platform = zPlatform.parse(os.platform());

  const expectations = readJSON(
    path.join(process.cwd(), 'test', 'TestExpectations.json')
  ) as TestExpectation[];

  const parsedSuitesFile = zTestSuiteFile.parse(
    readJSON(path.join(process.cwd(), 'test', 'TestSuites.json'))
  );

  const applicableSuites = getApplicableTestSuites(parsedSuitesFile, platform);

  console.log('Planning to run the following test suites', applicableSuites);

  let fail = false;
  const recommendations = [];
  try {
    for (const suite of applicableSuites) {
      const parameters = suite.parameters;

      const applicableExpectations = filterByParameters(
        filterByPlatform(expectations, platform),
        parameters
      );

      const env = extendProcessEnv([
        ...parameters.map(param => {
          return parsedSuitesFile.parameterDefinitons[param];
        }),
        {
          PUPPETEER_SKIPPED_TEST_CONFIG: JSON.stringify(
            applicableExpectations.map(ex => {
              return {
                testIdPattern: ex.testIdPattern,
                skip: ex.expectations.includes('SKIP'),
              };
            })
          ),
        },
      ]);

      const tmpDir = fs.mkdtempSync(
        path.join(os.tmpdir(), 'puppeteer-test-runner-')
      );
      const tmpFilename = path.join(tmpDir, 'output.json');
      console.log('Running', JSON.stringify(parameters), tmpFilename);
      const args = [
        '-u',
        path.join(__dirname, 'interface.js'),
        '-R',
        path.join(__dirname, 'reporter.js'),
        '-O',
        'output=' + tmpFilename,
      ];
      const handle = noCoverage
        ? spawn('npx', ['mocha', ...args])
        : spawn(
            'npx',
            [
              'c8',
              '--check-coverage',
              '--lines',
              String(suite.expectedLineCoverage),
              'npx mocha',
              ...args,
            ],
            {
              shell: true,
              cwd: process.cwd(),
              stdio: 'inherit',
              env,
            }
          );
      await new Promise<void>((resolve, reject) => {
        handle.on('error', err => {
          reject(err);
        });
        handle.on('close', () => {
          resolve();
        });
      });
      console.log('Finished', JSON.stringify(parameters));
      try {
        const results = readJSON(tmpFilename) as MochaResults;
        const recommendation = getExpectationUpdates(
          results,
          applicableExpectations,
          {
            platforms: [os.platform()],
            parameters,
          }
        );
        if (recommendation.length > 0) {
          fail = true;
          recommendations.push(...recommendation);
        } else {
          console.log('Test run matches expecations');
          continue;
        }
      } catch (err) {
        fail = true;
        console.error(err);
      }
    }
  } catch (err) {
    fail = true;
    console.error(err);
  } finally {
    const toAdd = recommendations.filter(item => {
      return item.action === 'add';
    });
    if (toAdd.length) {
      console.log(
        'Add the following to TestExpecations.json to ignore the error:'
      );
      prettyPrintJSON(
        toAdd.map(item => {
          return item.expectation;
        })
      );
    }
    const toRemove = recommendations.filter(item => {
      return item.action === 'remove';
    });
    if (toRemove.length) {
      console.log(
        'Remove the following from the TestExpecations.json to ignore the error:'
      );
      prettyPrintJSON(
        toRemove.map(item => {
          return item.expectation;
        })
      );
    }
    const toUpdate = recommendations.filter(item => {
      return item.action === 'update';
    });
    if (toUpdate.length) {
      console.log(
        'Update the following expectations in the TestExpecations.json to ignore the error:'
      );
      prettyPrintJSON(
        toUpdate.map(item => {
          return item.expectation;
        })
      );
    }
    process.exit(fail ? 1 : 0);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
