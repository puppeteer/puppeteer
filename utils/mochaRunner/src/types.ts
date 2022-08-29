export type TestDimensionValue = object;

export type TestDimension = TestDimensionValue[];

export type TestSuite = {
  platforms: NodeJS.Platform[];
  dimensions: TestDimension[];
};

export type TestResult = 'PASS' | 'FAIL' | 'TIMEOUT' | 'SKIP';

export type TestExpectation = {
  fullTitle: string;
  filename: string;
  platforms: NodeJS.Platform[];
  modifiers: TestDimensionValue[];
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
