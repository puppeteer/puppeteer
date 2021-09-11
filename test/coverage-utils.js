/**
 * Copyright 2020 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// TODO (@jackfranklin): convert this to TypeScript and enable type-checking
// @ts-nocheck

/* We want to ensure that all of Puppeteer's public API is tested via our unit
 * tests but we can't use a tool like Istanbul because the way it instruments
 * code unfortunately breaks in Puppeteer where some of that code is then being
 * executed in a browser context.
 *
 * So instead we maintain this coverage code which does the following:
 * * takes every public method that we expect to be tested
 * * replaces it with a method that calls the original but also updates a Map of calls
 * * in an after() test callback it asserts that every public method was called.
 *
 * We run this when COVERAGE=1.
 */

const path = require('path');
const fs = require('fs');

/**
 * This object is also used by DocLint to know which classes to check are
 * documented. It's a pretty hacky solution but DocLint is going away soon as
 * part of the TSDoc migration.
 */
const MODULES_TO_CHECK_FOR_COVERAGE = {
  Accessibility: '../lib/cjs/puppeteer/common/Accessibility',
  Browser: '../lib/cjs/puppeteer/common/Browser',
  BrowserContext: '../lib/cjs/puppeteer/common/Browser',
  BrowserFetcher: '../lib/cjs/puppeteer/node/BrowserFetcher',
  CDPSession: '../lib/cjs/puppeteer/common/Connection',
  ConsoleMessage: '../lib/cjs/puppeteer/common/ConsoleMessage',
  Coverage: '../lib/cjs/puppeteer/common/Coverage',
  Dialog: '../lib/cjs/puppeteer/common/Dialog',
  ElementHandle: '../lib/cjs/puppeteer/common/JSHandle',
  ExecutionContext: '../lib/cjs/puppeteer/common/ExecutionContext',
  EventEmitter: '../lib/cjs/puppeteer/common/EventEmitter',
  FileChooser: '../lib/cjs/puppeteer/common/FileChooser',
  Frame: '../lib/cjs/puppeteer/common/FrameManager',
  JSHandle: '../lib/cjs/puppeteer/common/JSHandle',
  Keyboard: '../lib/cjs/puppeteer/common/Input',
  Mouse: '../lib/cjs/puppeteer/common/Input',
  Page: '../lib/cjs/puppeteer/common/Page',
  Puppeteer: '../lib/cjs/puppeteer/common/Puppeteer',
  PuppeteerNode: '../lib/cjs/puppeteer/node/Puppeteer',
  HTTPRequest: '../lib/cjs/puppeteer/common/HTTPRequest',
  HTTPResponse: '../lib/cjs/puppeteer/common/HTTPResponse',
  SecurityDetails: '../lib/cjs/puppeteer/common/SecurityDetails',
  Target: '../lib/cjs/puppeteer/common/Target',
  TimeoutError: '../lib/cjs/puppeteer/common/Errors',
  Touchscreen: '../lib/cjs/puppeteer/common/Input',
  Tracing: '../lib/cjs/puppeteer/common/Tracing',
  WebWorker: '../lib/cjs/puppeteer/common/WebWorker',
};

function traceAPICoverage(apiCoverage, className, modulePath) {
  const loadedModule = require(modulePath);
  const classType = loadedModule[className];

  if (!classType || !classType.prototype) {
    console.error(
      `Coverage error: could not find class for ${className}. Is src/api.ts up to date?`
    );
    process.exit(1);
  }
  for (const methodName of Reflect.ownKeys(classType.prototype)) {
    const method = Reflect.get(classType.prototype, methodName);
    if (
      methodName === 'constructor' ||
      typeof methodName !== 'string' ||
      methodName.startsWith('_') ||
      typeof method !== 'function'
    )
      continue;
    apiCoverage.set(`${className}.${methodName}`, false);
    Reflect.set(classType.prototype, methodName, function (...args) {
      apiCoverage.set(`${className}.${methodName}`, true);
      return method.call(this, ...args);
    });
  }

  /**
   * If classes emit events, those events are exposed via an object in the same
   * module named XEmittedEvents, where X is the name of the class. For example,
   * the Page module exposes PageEmittedEvents.
   */
  const eventsName = `${className}EmittedEvents`;
  if (loadedModule[eventsName]) {
    for (const event of Object.values(loadedModule[eventsName])) {
      if (typeof event !== 'symbol')
        apiCoverage.set(`${className}.emit(${JSON.stringify(event)})`, false);
    }
    const method = Reflect.get(classType.prototype, 'emit');
    Reflect.set(classType.prototype, 'emit', function (event, ...args) {
      if (typeof event !== 'symbol' && this.listenerCount(event))
        apiCoverage.set(`${className}.emit(${JSON.stringify(event)})`, true);
      return method.call(this, event, ...args);
    });
  }
}

const coverageLocation = path.join(__dirname, 'coverage.json');

const clearOldCoverage = () => {
  try {
    fs.unlinkSync(coverageLocation);
  } catch (error) {
    // do nothing, the file didn't exist
  }
};
const writeCoverage = (coverage) => {
  fs.writeFileSync(coverageLocation, JSON.stringify([...coverage.entries()]));
};

const getCoverageResults = () => {
  let contents;
  try {
    contents = fs.readFileSync(coverageLocation, { encoding: 'utf8' });
  } catch (error) {
    console.error('Warning: coverage file does not exist or is not readable.');
  }

  const coverageMap = new Map(JSON.parse(contents));
  return coverageMap;
};

const trackCoverage = () => {
  clearOldCoverage();
  const coverageMap = new Map();

  return {
    beforeAll: () => {
      for (const [className, moduleFilePath] of Object.entries(
        MODULES_TO_CHECK_FOR_COVERAGE
      )) {
        traceAPICoverage(coverageMap, className, moduleFilePath);
      }
    },
    afterAll: () => {
      writeCoverage(coverageMap);
    },
  };
};

module.exports = {
  trackCoverage,
  getCoverageResults,
  MODULES_TO_CHECK_FOR_COVERAGE,
};
