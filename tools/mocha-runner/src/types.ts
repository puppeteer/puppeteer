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

import {z} from 'zod';

import type {RecommendedExpectation} from './utils.js';

export const zPlatform = z.enum(['win32', 'linux', 'darwin']);

export type Platform = z.infer<typeof zPlatform>;

export const zTestSuite = z.object({
  id: z.string(),
  platforms: z.array(zPlatform),
  parameters: z.array(z.string()),
  expectedLineCoverage: z.number(),
});

export type TestSuite = z.infer<typeof zTestSuite>;

export const zTestSuiteFile = z.object({
  testSuites: z.array(zTestSuite),
  parameterDefinitions: z.record(z.any()),
});

export type TestSuiteFile = z.infer<typeof zTestSuiteFile>;

export type TestResult = 'PASS' | 'FAIL' | 'TIMEOUT' | 'SKIP';

export interface TestExpectation {
  testIdPattern: string;
  platforms: NodeJS.Platform[];
  parameters: string[];
  expectations: TestResult[];
}

export interface MochaTestResult {
  fullTitle: string;
  title: string;
  file: string;
  err?: {code: string};
}

export interface MochaResults {
  stats: {tests: number};
  pending: MochaTestResult[];
  passes: MochaTestResult[];
  failures: MochaTestResult[];
  // Added by mocha-runner.
  updates?: RecommendedExpectation[];
  parameters?: string[];
  platform?: string;
  date?: string;
}
