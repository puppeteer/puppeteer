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

import { debug } from '../lib/esm/puppeteer/common/Debug.js';
import expect from '../node_modules/expect/build-es5/index.js';

describe('debug', () => {
  let originalLog;
  let logs;
  beforeEach(() => {
    originalLog = console.log;
    logs = [];
    console.log = (...args) => {
      logs.push(args);
    };
  });

  afterEach(() => {
    console.log = originalLog;
  });

  it('should return a function', async () => {
    expect(debug('foo')).toBeInstanceOf(Function);
  });

  it('does not log to the console if __PUPPETEER_DEBUG global is not set', async () => {
    const debugFn = debug('foo');
    debugFn('lorem', 'ipsum');

    expect(logs.length).toEqual(0);
  });

  it('logs to the console if __PUPPETEER_DEBUG global is set to *', async () => {
    globalThis.__PUPPETEER_DEBUG = '*';
    const debugFn = debug('foo');
    debugFn('lorem', 'ipsum');

    expect(logs.length).toEqual(1);
    expect(logs).toEqual([['foo:', 'lorem', 'ipsum']]);
  });

  it('logs only messages matching the __PUPPETEER_DEBUG prefix', async () => {
    globalThis.__PUPPETEER_DEBUG = 'foo';
    const debugFoo = debug('foo');
    const debugBar = debug('bar');
    debugFoo('a');
    debugBar('b');

    expect(logs.length).toEqual(1);
    expect(logs).toEqual([['foo:', 'a']]);
  });
});
