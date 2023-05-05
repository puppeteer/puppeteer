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
import {TimeoutError} from 'puppeteer-core';
import {LocatorEmittedEvents} from 'puppeteer-core/internal/api/Locator.js';
import sinon from 'sinon';

import {
  getTestState,
  setupTestBrowserHooks,
  setupTestPageAndContextHooks,
} from './mocha-utils.js';

describe('Locator', function () {
  setupTestBrowserHooks();
  setupTestPageAndContextHooks();

  describe('Locator.click', function () {
    it('should work', async () => {
      const {page} = getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.setContent(`
        <button onclick="this.innerText = 'clicked';">test</button>
      `);
      let willClick = false;
      await page
        .locator('button')
        .on(LocatorEmittedEvents.Action, () => {
          willClick = true;
        })
        .click();
      const button = await page.$('button');
      const text = await button?.evaluate(el => {
        return el.innerText;
      });
      expect(text).toBe('clicked');
      expect(willClick).toBe(true);
    });

    it('should work for multiple selectors', async () => {
      const {page} = getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.setContent(`
        <button onclick="this.innerText = 'clicked';">test</button>
      `);
      let clicked = false;
      await page
        .locator('::-p-text(test), ::-p-xpath(/button)')
        .on(LocatorEmittedEvents.Action, () => {
          clicked = true;
        })
        .click();
      const button = await page.$('button');
      const text = await button?.evaluate(el => {
        return el.innerText;
      });
      expect(text).toBe('clicked');
      expect(clicked).toBe(true);
    });

    it('should work if the element is out of viewport', async () => {
      const {page} = getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.setContent(`
        <button style="margin-top: 600px;" onclick="this.innerText = 'clicked';">test</button>
      `);
      await page.locator('button').click();
      const button = await page.$('button');
      const text = await button?.evaluate(el => {
        return el.innerText;
      });
      expect(text).toBe('clicked');
    });

    it('should work if the element becomes visible later', async () => {
      const {page} = getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.setContent(`
        <button style="display: none;" onclick="this.innerText = 'clicked';">test</button>
      `);
      const button = await page.$('button');
      const result = page.locator('button').click();
      expect(
        await button?.evaluate(el => {
          return el.innerText;
        })
      ).toBe('test');
      await button?.evaluate(el => {
        el.style.display = 'block';
      });
      await result;
      expect(
        await button?.evaluate(el => {
          return el.innerText;
        })
      ).toBe('clicked');
    });

    it('should work if the element becomes enabled later', async () => {
      const {page} = getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.setContent(`
        <button disabled onclick="this.innerText = 'clicked';">test</button>
      `);
      const button = await page.$('button');
      const result = page.locator('button').click();
      expect(
        await button?.evaluate(el => {
          return el.innerText;
        })
      ).toBe('test');
      await button?.evaluate(el => {
        el.disabled = false;
      });
      await result;
      expect(
        await button?.evaluate(el => {
          return el.innerText;
        })
      ).toBe('clicked');
    });

    it('should work if multiple conditions are satisfied later', async () => {
      const {page} = getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.setContent(`
        <button style="margin-top: 600px;" style="display: none;" disabled onclick="this.innerText = 'clicked';">test</button>
      `);
      const button = await page.$('button');
      const result = page.locator('button').click();
      expect(
        await button?.evaluate(el => {
          return el.innerText;
        })
      ).toBe('test');
      await button?.evaluate(el => {
        el.disabled = false;
        el.style.display = 'block';
      });
      await result;
      expect(
        await button?.evaluate(el => {
          return el.innerText;
        })
      ).toBe('clicked');
    });

    it('should time out', async () => {
      const clock = sinon.useFakeTimers();
      try {
        const {page} = getTestState();

        page.setDefaultTimeout(5000);
        await page.setViewport({width: 500, height: 500});
        await page.setContent(`
          <button style="display: none;" onclick="this.innerText = 'clicked';">test</button>
        `);
        const result = page.locator('button').click();
        clock.tick(5100);
        await expect(result).rejects.toEqual(
          new TimeoutError('waitForFunction timed out. The timeout is 5000ms.')
        );
      } finally {
        clock.restore();
      }
    });

    it('should retry clicks on errors', async () => {
      const {page} = getTestState();
      const clock = sinon.useFakeTimers();
      try {
        page.setDefaultTimeout(5000);
        await page.setViewport({width: 500, height: 500});
        await page.setContent(`
          <button style="display: none;" onclick="this.innerText = 'clicked';">test</button>
        `);
        const result = page.locator('button').click();
        clock.tick(5100);
        await expect(result).rejects.toEqual(
          new TimeoutError('waitForFunction timed out. The timeout is 5000ms.')
        );
      } finally {
        clock.restore();
      }
    });

    it('can be aborted', async () => {
      const {page} = getTestState();
      const clock = sinon.useFakeTimers();
      try {
        page.setDefaultTimeout(5000);

        await page.setViewport({width: 500, height: 500});
        await page.setContent(`
          <button style="display: none;" onclick="this.innerText = 'clicked';">test</button>
        `);
        const abortController = new AbortController();
        const result = page.locator('button').click({
          signal: abortController.signal,
        });
        clock.tick(2000);
        abortController.abort();
        await expect(result).rejects.toThrow(/aborted/);
      } finally {
        clock.restore();
      }
    });
  });
});
