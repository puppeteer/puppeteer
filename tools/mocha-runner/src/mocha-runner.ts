#! /usr/bin/env -S node

/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {randomUUID} from 'crypto';
import fs from 'fs';
import {spawn} from 'node:child_process';
import os from 'os';
import path from 'path';

import {globSync} from 'glob';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';

import {
  zPlatform,
  zTestSuiteFile,
  type MochaResults,
  type Platform,
  type TestExpectation,
  type TestSuite,
  type TestSuiteFile,
} from './types.js';
import {
  extendProcessEnv,
  filterByParameters,
  filterByPlatform,
  getExpectationUpdates,
  printSuggestions,
  readJSON,
  writeJSON,
  type RecommendedExpectation,
} from './utils.js';

const {
  _: mochaArgs,
  testSuite: testSuiteId,
  saveStatsTo,
  cdpTests: includeCdpTests,
  suggestions: provideSuggestions,
  coverage: useCoverage,
  minTests,
  shard,
  reporter,
  printMemory,
} = yargs(hideBin(process.argv))
  .parserConfiguration({'unknown-options-as-args': true})
  .scriptName('@puppeteer/mocha-runner')
  .option('coverage', {
    boolean: true,
    default: false,
  })
  .option('suggestions', {
    boolean: true,
    default: true,
  })
  .option('cdp-tests', {
    boolean: true,
    default: true,
  })
  .option('save-stats-to', {
    string: true,
    requiresArg: true,
  })
  .option('min-tests', {
    number: true,
    default: 0,
    requiresArg: true,
  })
  .option('test-suite', {
    string: true,
    requiresArg: true,
  })
  .option('shard', {
    string: true,
    requiresArg: true,
  })
  .option('reporter', {
    string: true,
    requiresArg: true,
  })
  .option('print-memory', {
    boolean: true,
    default: false,
  })
  .parseSync();

function getApplicableTestSuites(
  parsedSuitesFile: TestSuiteFile,
  platform: Platform
): TestSuite[] {
  let applicableSuites: TestSuite[] = [];

  if (!testSuiteId) {
    applicableSuites = filterByPlatform(parsedSuitesFile.testSuites, platform);
  } else {
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
  let statsPath = saveStatsTo;
  if (statsPath && statsPath.includes('INSERTID')) {
    statsPath = statsPath.replace(/INSERTID/gi, randomUUID());
  }

  const platform = zPlatform.parse(os.platform());

  const expectations = readJSON(
    path.join(process.cwd(), 'test', 'TestExpectations.json')
  ) as TestExpectation[];

  const parsedSuitesFile = zTestSuiteFile.parse(
    readJSON(path.join(process.cwd(), 'test', 'TestSuites.json'))
  );

  const applicableSuites = getApplicableTestSuites(parsedSuitesFile, platform);

  console.log('Planning to run the following test suites', applicableSuites);
  if (statsPath) {
    console.log('Test stats will be saved to', statsPath);
  }

  let fail = false;
  const recommendations: RecommendedExpectation[] = [];
  try {
    for (const suite of applicableSuites) {
      const parameters = suite.parameters;

      const applicableExpectations = filterByParameters(
        filterByPlatform(expectations, platform),
        parameters
      ).reverse();

      // Add more logging when the GitHub Action Debugging option is set
      // https://docs.github.com/en/actions/learn-github-actions/variables#default-environment-variables
      const githubActionDebugging = process.env['RUNNER_DEBUG']
        ? {
            DEBUG: 'puppeteer:*',
            EXTRA_LAUNCH_OPTIONS: JSON.stringify({
              dumpio: true,
              extraPrefsFirefox: {
                'remote.log.level': 'Trace',
              },
            }),
          }
        : {};

      const env = extendProcessEnv([
        ...parameters.map(param => {
          return parsedSuitesFile.parameterDefinitions[param];
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
        githubActionDebugging,
      ]);

      const tmpDir = fs.mkdtempSync(
        path.join(os.tmpdir(), 'puppeteer-test-runner-')
      );
      const tmpFilename = statsPath
        ? statsPath
        : path.join(tmpDir, 'output.json');
      console.log('Running', JSON.stringify(parameters), tmpFilename);
      const args = [
        '-u',
        path.join(__dirname, 'interface.js'),
        '-R',
        !reporter ? path.join(__dirname, 'reporter.js') : reporter,
        '-O',
        `output=${tmpFilename}`,
        '-n',
        'trace-warnings',
      ];

      if (printMemory) {
        args.push('-n', 'expose-gc');
      }

      const specPattern = 'test/build/**/*.spec.js';
      const specs = globSync(specPattern, {
        ignore: !includeCdpTests ? 'test/build/cdp/**/*.spec.js' : undefined,
      }).sort((a, b) => {
        return a.localeCompare(b);
      });
      if (shard) {
        // Shard ID is 1-based.
        const [shardId, shards] = shard.split('-').map(s => {
          return Number(s);
        }) as [number, number];
        const argsLength = args.length;
        for (let i = 0; i < specs.length; i++) {
          if (i % shards === shardId - 1) {
            args.push(specs[i]!);
          }
        }
        if (argsLength === args.length) {
          throw new Error('Shard did not result in any test files');
        }
        console.log(
          `Running shard ${shardId}-${shards}. Picked ${
            args.length - argsLength
          } files out of ${specs.length}.`
        );
      } else {
        args.push(...specs);
      }
      const handle = spawn(
        'npx',
        [
          ...(useCoverage
            ? [
                'c8',
                '--check-coverage',
                '--lines',
                String(suite.expectedLineCoverage),
                'npx',
              ]
            : []),
          'mocha',
          ...mochaArgs.map(String),
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
        const updates = getExpectationUpdates(results, applicableExpectations, {
          platforms: [os.platform()],
          parameters,
        });
        const totalTests = results.stats.tests;
        results.parameters = parameters;
        results.platform = platform;
        results.date = new Date().toISOString();
        if (updates.length > 0) {
          fail = true;
          recommendations.push(...updates);
          results.updates = updates;
          writeJSON(tmpFilename, results);
        } else {
          if (!shard && totalTests < minTests) {
            fail = true;
            console.log(
              `Test run matches expectations but the number of discovered tests is too low (expected: ${minTests}, actual: ${totalTests}).`
            );
            writeJSON(tmpFilename, results);
            continue;
          }
          console.log('Test run matches expectations');
          writeJSON(tmpFilename, results);
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
    if (!!provideSuggestions) {
      printSuggestions(
        recommendations,
        'add',
        'Add the following to TestExpectations.json to ignore the error:'
      );
      printSuggestions(
        recommendations,
        'remove',
        'Remove the following from the TestExpectations.json to ignore the error:'
      );
      printSuggestions(
        recommendations,
        'update',
        'Update the following expectations in the TestExpectations.json to ignore the error:'
      );
    }
    process.exit(fail ? 1 : 0);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
