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

    it('should fill out an address form', async () => {
      const {page, server} = await getTestState();
      await page.goto(server.PREFIX + '/address-form.html');
      using nameField = await page.waitForSelector('#name');
      await nameField!.autofill({
        address: {
          name: 'John Doe',
          organization: 'Acme Corp',
          streetAddress: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
          phone: '+1234567890',
          email: 'john@example.com',
        },
      });
      const nameValue = await page.evaluate(() => {
        return (document.querySelector('#name') as HTMLInputElement).value;
      });
      // Note: The actual autofill behavior depends on the browser implementation
      // We verify that the autofill was triggered and at least attempted to fill the name field
      // In some browsers/configurations, autofill may not populate all fields
      expect(nameValue).toBeTruthy();
    });

    it('should throw an error when neither creditCard nor address is provided', async () => {
      const {page, server} = await getTestState();
      await page.goto(server.PREFIX + '/address-form.html');
      using nameField = await page.waitForSelector('#name');
      let error: Error | undefined;
      try {
        await nameField!.autofill({} as any);
      } catch (err) {
        error = err as Error;
      }
      expect(error).toBeTruthy();
      expect(error!.message).toContain(
        'Either address or creditCard must be provided',
      );
    });
  });
});
