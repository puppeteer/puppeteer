/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
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
