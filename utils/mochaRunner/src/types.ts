import {z} from 'zod';

export const zPlatform = z.enum(['win32', 'linux', 'darwin']);

export type Platform = z.infer<typeof zPlatform>;

export const zTestSuite = z.object({
  id: z.string(),
  platforms: z.array(zPlatform),
  parameters: z.array(z.string()),
});

export type TestSuite = z.infer<typeof zTestSuite>;

export const zTestSuiteFile = z.object({
  testSuites: z.array(zTestSuite),
  parameterDefinitons: z.record(z.any()),
});

export type TestSuiteFile = z.infer<typeof zTestSuiteFile>;

export type TestResult = 'PASS' | 'FAIL' | 'TIMEOUT' | 'SKIP';

export type TestExpectation = {
  testIdPattern: string;
  platforms: NodeJS.Platform[];
  parameters: string[];
  expectations: TestResult[];
};

export type MochaTestResult = {
  fullTitle: string;
  file: string;
  err?: {code: string};
};

export type MochaResults = {
  stats: unknown;
  pending: MochaTestResult[];
  passes: MochaTestResult[];
  failures: MochaTestResult[];
};
