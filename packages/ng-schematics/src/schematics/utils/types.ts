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
