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
  MochaTestResult,
  TestExpectation,
  MochaResults,
  TestResult,
} from './types.js';
import path from 'path';
import fs from 'fs';

export function extendProcessEnv(envs: object[]): NodeJS.ProcessEnv {
  return envs.reduce(
    (acc: object, item: object) => {
      Object.assign(acc, item);
      return acc;
    },
    {
      ...process.env,
    }
  ) as NodeJS.ProcessEnv;
}

export function getFilename(file: string): string {
  return path.basename(file).replace(path.extname(file), '');
}

export function readJSON(path: string): unknown {
  return JSON.parse(fs.readFileSync(path, 'utf-8'));
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
  return expectations
    .filter(expectation => {
      return (
        '' === expectation.testIdPattern ||
        getTestId(result.file) === expectation.testIdPattern ||
        getTestId(result.file, result.fullTitle) === expectation.testIdPattern
      );
    })
    .pop();
}

type RecommendedExpecation = {
  expectation: TestExpectation;
  test: MochaTestResult;
  action: 'remove' | 'add' | 'update';
};

export function getExpectationUpdates(
  results: MochaResults,
  expecations: TestExpectation[],
  context: {
    platforms: NodeJS.Platform[];
    parameters: string[];
  }
): RecommendedExpecation[] {
  const output: RecommendedExpecation[] = [];

  for (const pass of results.passes) {
    const expectation = findEffectiveExpectationForTest(expecations, pass);
    if (expectation && !expectation.expectations.includes('PASS')) {
      output.push({
        expectation,
        test: pass,
        action: 'remove',
      });
    }
  }

  for (const failure of results.failures) {
    const expectation = findEffectiveExpectationForTest(expecations, failure);
    if (expectation) {
      if (
        !expectation.expectations.includes(getTestResultForFailure(failure))
      ) {
        output.push({
          expectation: {
            ...expectation,
            expectations: [
              ...expectation.expectations,
              getTestResultForFailure(failure),
            ],
          },
          test: failure,
          action: 'update',
        });
      }
    } else {
      output.push({
        expectation: {
          testIdPattern: getTestId(failure.file, failure.fullTitle),
          platforms: context.platforms,
          parameters: context.parameters,
          expectations: [getTestResultForFailure(failure)],
        },
        test: failure,
        action: 'add',
      });
    }
  }
  return output;
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
