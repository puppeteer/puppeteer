/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

export enum TestRunner {
  Jasmine = 'jasmine',
  Jest = 'jest',
  Mocha = 'mocha',
  Node = 'node',
}

export interface SchematicsOptions {
  testRunner: TestRunner;
}

export interface PuppeteerSchematicsConfig {
  builder: string;
  options: {
    port: number;
    testRunner: TestRunner;
  };
}
export interface AngularProject {
  projectType: 'application' | 'library';
  root: string;
  architect: {
    e2e?: PuppeteerSchematicsConfig;
    puppeteer?: PuppeteerSchematicsConfig;
    serve: {
      options: {
        ssl: string;
        port: number;
      };
    };
  };
}
export interface AngularJson {
  projects: Record<string, AngularProject>;
}

export interface SchematicsSpec {
  name: string;
  project?: string;
  route?: string;
}
