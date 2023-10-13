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

import fs from 'fs';
import path from 'path';

import type {
  MochaTestResult,
  TestExpectation,
  MochaResults,
  TestResult,
} from './types.js';

export function extendProcessEnv(envs: object[]): NodeJS.ProcessEnv {
  const env = envs.reduce(
    (acc: object, item: object) => {
      Object.assign(acc, item);
      return acc;
    },
    {
      ...process.env,
    }
  );

  if (process.env['CI']) {
    const puppeteerEnv = Object.entries(env).reduce(
      (acc, [key, value]) => {
        if (key.startsWith('PUPPETEER_')) {
          acc[key] = value;
        }

        return acc;
      },
      {} as Record<string, unknown>
    );

    console.log(
      'PUPPETEER env:\n',
      JSON.stringify(puppeteerEnv, null, 2),
      '\n'
    );
  }

  return env as NodeJS.ProcessEnv;
}

export function getFilename(file: string): string {
  return path.basename(file).replace(path.extname(file), '');
}

export function readJSON(path: string): unknown {
  return JSON.parse(fs.readFileSync(path, 'utf-8'));
}

export function writeJSON(path: string, json: unknown): unknown {
  return fs.writeFileSync(path, JSON.stringify(json, null, 2));
}

export function filterByPlatform<T extends {platforms: NodeJS.Platform[]}>(
  items: T[],
  platform: NodeJS.Platform
): T[] {
  return items.filter(item => {
    return item.platforms.includes(platform);
  });
}

export function prettyPrintJSON(json: unknown): void {
  console.log(JSON.stringify(json, null, 2));
}

export function printSuggestions(
  recommendations: RecommendedExpectation[],
  action: RecommendedExpectation['action'],
  message: string
): void {
  const toPrint = recommendations.filter(item => {
    return item.action === action;
  });
  if (toPrint.length) {
    console.log(message);
    prettyPrintJSON(
      toPrint.map(item => {
        return item.expectation;
      })
    );
    if (action !== 'remove') {
      console.log(
        'The recommendations are based on the following applied expectations:'
      );
      prettyPrintJSON(
        toPrint.map(item => {
          return item.basedOn;
        })
      );
    }
  }
}

export function filterByParameters(
  expectations: TestExpectation[],
  parameters: string[]
): TestExpectation[] {
  const querySet = new Set(parameters);
  return expectations.filter(ex => {
    return ex.parameters.every(param => {
      return querySet.has(param);
    });
  });
}

/**
 * The last expectation that matches an empty string as all tests pattern
 * or the name of the file or the whole name of the test the filter wins.
 */
export function findEffectiveExpectationForTest(
  expectations: TestExpectation[],
  result: MochaTestResult
): TestExpectation | undefined {
  return expectations.find(expectation => {
    return testIdMatchesExpectationPattern(result, expectation.testIdPattern);
  });
}

export interface RecommendedExpectation {
  expectation: TestExpectation;
  action: 'remove' | 'add' | 'update';
  basedOn?: TestExpectation;
}

export function isWildCardPattern(testIdPattern: string): boolean {
  return testIdPattern.includes('*');
}

export function getExpectationUpdates(
  results: MochaResults,
  expectations: TestExpectation[],
  context: {
    platforms: NodeJS.Platform[];
    parameters: string[];
  }
): RecommendedExpectation[] {
  const output = new Map<string, RecommendedExpectation>();

  const passesByKey = results.passes.reduce((acc, pass) => {
    acc.add(getTestId(pass.file, pass.fullTitle));
    return acc;
  }, new Set());

  for (const pass of results.passes) {
    const expectationEntry = findEffectiveExpectationForTest(
      expectations,
      pass
    );
    if (expectationEntry && !expectationEntry.expectations.includes('PASS')) {
      if (isWildCardPattern(expectationEntry.testIdPattern)) {
        addEntry({
          expectation: {
            testIdPattern: getTestId(pass.file, pass.fullTitle),
            platforms: context.platforms,
            parameters: context.parameters,
            expectations: ['PASS'],
          },
          action: 'add',
          basedOn: expectationEntry,
        });
      } else {
        addEntry({
          expectation: expectationEntry,
          action: 'remove',
          basedOn: expectationEntry,
        });
      }
    }
  }

  for (const failure of results.failures) {
    // If an error occurs during a hook
    // the error not have a file associated with it
    if (!failure.file) {
      console.error('Hook failed:', failure.err);
      addEntry({
        expectation: {
          testIdPattern: failure.fullTitle,
          platforms: context.platforms,
          parameters: context.parameters,
          expectations: [],
        },
        action: 'add',
      });
      continue;
    }

    if (passesByKey.has(getTestId(failure.file, failure.fullTitle))) {
      continue;
    }

    const expectationEntry = findEffectiveExpectationForTest(
      expectations,
      failure
    );
    if (expectationEntry && !expectationEntry.expectations.includes('SKIP')) {
      if (
        !expectationEntry.expectations.includes(
          getTestResultForFailure(failure)
        )
      ) {
        // If the effective explanation is a wildcard, we recommend adding a new
        // expectation instead of updating the wildcard that might affect multiple
        // tests.
        if (isWildCardPattern(expectationEntry.testIdPattern)) {
          addEntry({
            expectation: {
              testIdPattern: getTestId(failure.file, failure.fullTitle),
              platforms: context.platforms,
              parameters: context.parameters,
              expectations: [getTestResultForFailure(failure)],
            },
            action: 'add',
            basedOn: expectationEntry,
          });
        } else {
          addEntry({
            expectation: {
              ...expectationEntry,
              expectations: [
                ...expectationEntry.expectations,
                getTestResultForFailure(failure),
              ],
            },
            action: 'update',
            basedOn: expectationEntry,
          });
        }
      }
    } else if (!expectationEntry) {
      addEntry({
        expectation: {
          testIdPattern: getTestId(failure.file, failure.fullTitle),
          platforms: context.platforms,
          parameters: context.parameters,
          expectations: [getTestResultForFailure(failure)],
        },
        action: 'add',
      });
    }
  }

  function addEntry(value: RecommendedExpectation) {
    const key = JSON.stringify(value);
    if (!output.has(key)) {
      output.set(key, value);
    }
  }

  return [...output.values()];
}

export function getTestResultForFailure(
  test: Pick<MochaTestResult, 'err'>
): TestResult {
  return test.err?.code === 'ERR_MOCHA_TIMEOUT' ? 'TIMEOUT' : 'FAIL';
}

export function getTestId(file: string, fullTitle?: string): string {
  return fullTitle
    ? `[${getFilename(file)}] ${fullTitle}`
    : `[${getFilename(file)}]`;
}

export function testIdMatchesExpectationPattern(
  test: MochaTestResult | Mocha.Test,
  pattern: string
): boolean {
  const patternRegExString = pattern
    // Replace `*` with non special character
    .replace(/\*/g, '--STAR--')
    // Escape special characters https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Replace placeholder with greedy match
    .replace(/--STAR--/g, '(.*)?');
  // Match beginning and end explicitly
  const patternRegEx = new RegExp(`^${patternRegExString}$`);
  const fullTitle =
    typeof test.fullTitle === 'string' ? test.fullTitle : test.fullTitle();

  return patternRegEx.test(getTestId(test.file ?? '', fullTitle));
}
