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

/* We want to ensure that all of Puppeteer's public API is tested via our unit
 * tests but we can't use a tool like Istanbul because the way it instruments code
 * unfortunately breaks in Puppeteer where some of that code is then being executed in a browser context.
 *
 * So instead we maintain this coverage code which does the following:
 * * takes every public method that we expect to be tested
 * * replaces it with a method that calls the original but also updates a Map of calls
 * * in an after() test callback it asserts that every public method was called.
 *
 * We run this when COVERAGE=1.
 */

/**
 * @param {Map<string, boolean>} apiCoverage
 * @param {Object} events
 * @param {string} className
 * @param {!Object} classType
 */
function traceAPICoverage(apiCoverage, events, className, classType) {
  className = className.substring(0, 1).toLowerCase() + className.substring(1);
  for (const methodName of Reflect.ownKeys(classType.prototype)) {
    const method = Reflect.get(classType.prototype, methodName);
    if (methodName === 'constructor' || typeof methodName !== 'string' || methodName.startsWith('_') || typeof method !== 'function')
      continue;
    apiCoverage.set(`${className}.${methodName}`, false);
    Reflect.set(classType.prototype, methodName, function(...args) {
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
    Reflect.set(classType.prototype, 'emit', function(event, ...args) {
      if (typeof event !== 'symbol' && this.listenerCount(event))
        apiCoverage.set(`${className}.emit(${JSON.stringify(event)})`, true);
      return method.call(this, event, ...args);
    });
  }
}

module.exports = function() {
  const coverageMap = new Map();
  before(() => {
    const api = require('../lib/api');
    const events = require('../lib/Events');
    for (const [className, classType] of Object.entries(api))
      traceAPICoverage(coverageMap, events, className, classType);
  });

  after(() => {
    const missingMethods = [];
    for (const method of coverageMap.keys()) {
      if (!coverageMap.get(method))
        missingMethods.push(method);
    }
    if (missingMethods.length) {
      console.error('\nCoverage check failed: not all API methods called. See above ouptut for list of missing methods.');
      console.error(Array.from(missingMethods).join('\n'));
      process.exit(1);
    }
    console.log('\nAll Puppeteer API methods were called. Coverage test passed.\n');
  });
};
