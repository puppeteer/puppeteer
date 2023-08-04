/**
 * Copyright 2022 Google Inc. All rights reserved.
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

import expect from 'expect';
import {LazyArg} from 'puppeteer-core/internal/common/LazyArg.js';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';

describe('PuppeteerUtil tests', function () {
  setupTestBrowserHooks();

  it('should work', async () => {
    const {page} = await getTestState();

    const world = page.mainFrame().isolatedRealm();
    const value = await world.evaluate(
      PuppeteerUtil => {
        return typeof PuppeteerUtil === 'object';
      },
      LazyArg.create(context => {
        return context.puppeteerUtil;
      })
    );
    expect(value).toBeTruthy();
  });

  describe('createFunction tests', function () {
    it('should work', async () => {
      const {page} = await getTestState();

      const world = page.mainFrame().isolatedRealm();
      const value = await world.evaluate(
        ({createFunction}, fnString) => {
          return createFunction(fnString)(4);
        },
        LazyArg.create(context => {
          return context.puppeteerUtil;
        }),
        (() => {
          return 4;
        }).toString()
      );
      expect(value).toBe(4);
    });
  });
});
