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
 * @param {Map<string, boolean>} apiCoverage
 * @param {Object} events
 * @param {string} className
 * @param {!Object} classType
 */
function traceAPICoverage(apiCoverage, events, className, classType) {
  className = className.substring(0, 1).toLowerCase() + className.substring(1);
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

  if (events[classType.name]) {
    for (const event of Object.values(events[classType.name])) {
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
      const api = require('../src/api');
      const events = require('../src/common/Events');
      for (const [className, classType] of Object.entries(api))
        traceAPICoverage(coverageMap, events, className, classType);
    },
    afterAll: () => {
      writeCoverage(coverageMap);
    },
  };
};

module.exports = {
  trackCoverage,
  getCoverageResults,
};
