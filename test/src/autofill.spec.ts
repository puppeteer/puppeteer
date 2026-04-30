/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
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
        }),
      ).toBe('John Smith,4444444444444444,01,2030,Submit');
    });

    it('should fill out an address', async () => {
      const {page, server} = await getTestState();
      await page.goto(server.PREFIX + '/address.html');
      using name = await page.waitForSelector('#name');
      await name!.autofill({
        address: {
          fields: [
            {name: 'NAME_FULL', value: 'Jane Doe'},
            {name: 'ADDRESS_HOME_STREET_ADDRESS', value: '123 Main St'},
            {name: 'ADDRESS_HOME_CITY', value: 'Anytown'},
            {name: 'ADDRESS_HOME_ZIP', value: '12345'},
          ],
        },
      });
      expect(
        await page.evaluate(() => {
          const result = [];
          for (const el of document.querySelectorAll('input')) {
            result.push(el.value);
          }
          return result.join(',');
        }),
      ).toBe('Jane Doe,123 Main St,Anytown,12345,Submit');
    });
  });
});
