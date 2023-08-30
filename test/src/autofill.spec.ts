/**
 * Copyright 2023 Google Inc. All rights reserved.
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

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';

describe('Autofill', function () {
  setupTestBrowserHooks();
  describe('ElementHandle.autofill', () => {
    it('should fill out a credit card', async () => {
      const {page, server} = await getTestState();
      await page.goto(server.PREFIX + '/credit-card.html');
      using name = await page.waitForSelector('#name');
      await name!.autofill({
        creditCard: {
          number: '4444444444444444',
          name: 'John Smith',
          expiryMonth: '01',
          expiryYear: '2030',
          cvc: '123',
        },
      });
      expect(
        await page.evaluate(() => {
          const result = [];
          for (const el of document.querySelectorAll('input')) {
            result.push(el.value);
          }
          return result.join(',');
        })
      ).toBe('John Smith,4444444444444444,01,2030,Submit');
    });
  });
});
