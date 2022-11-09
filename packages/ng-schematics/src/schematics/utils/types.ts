export enum TestingFramework {
  Jasmine = 'jasmine',
  Jest = 'jest',
  Mocha = 'mocha',
}

export interface SchematicsOptions {
  testingFramework: TestingFramework;
  exportConfig?: boolean;
}
