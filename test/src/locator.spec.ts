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
import {
  Locator,
  LocatorEmittedEvents,
} from 'puppeteer-core/internal/api/Locator.js';
import sinon from 'sinon';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';

describe('Locator', function () {
  setupTestBrowserHooks();

  it('should work with a frame', async () => {
    const {page} = await getTestState();

    await page.setViewport({width: 500, height: 500});
    await page.setContent(`
      <button onclick="this.innerText = 'clicked';">test</button>
    `);
    let willClick = false;
    await page
      .mainFrame()
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

  it('should work without preconditions', async () => {
    const {page} = await getTestState();

    await page.setViewport({width: 500, height: 500});
    await page.setContent(`
      <button onclick="this.innerText = 'clicked';">test</button>
    `);
    let willClick = false;
    await page
      .locator('button')
      .setEnsureElementIsInTheViewport(false)
      .setTimeout(0)
      .setVisibility(null)
      .setWaitForEnabled(false)
      .setWaitForStableBoundingBox(false)
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

  describe('Locator.click', function () {
    it('should work', async () => {
      const {page} = await getTestState();

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
      const {page} = await getTestState();

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
      const {page} = await getTestState();

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
      const {page} = await getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.setContent(`
        <button style="display: none;" onclick="this.innerText = 'clicked';">test</button>
      `);
      const button = await page.$('button');
      const result = page
        .locator('button')
        .click()
        .catch(err => {
          return err;
        });
      expect(
        await button?.evaluate(el => {
          return el.innerText;
        })
      ).toBe('test');
      await button?.evaluate(el => {
        el.style.display = 'block';
      });
      const maybeError = await result;
      if (maybeError instanceof Error) {
        throw maybeError;
      }
      expect(
        await button?.evaluate(el => {
          return el.innerText;
        })
      ).toBe('clicked');
    });

    it('should work if the element becomes enabled later', async () => {
      const {page} = await getTestState();

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
      const {page} = await getTestState();

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
      const clock = sinon.useFakeTimers({
        shouldClearNativeTimers: true,
      });
      try {
        const {page} = await getTestState();

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
      const {page} = await getTestState();
      const clock = sinon.useFakeTimers({
        shouldClearNativeTimers: true,
      });
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
      const {page} = await getTestState();
      const clock = sinon.useFakeTimers({
        shouldClearNativeTimers: true,
      });
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

  describe('Locator.hover', function () {
    it('should work', async () => {
      const {page} = await getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.setContent(`
        <button onmouseenter="this.innerText = 'hovered';">test</button>
      `);
      let hovered = false;
      await page
        .locator('button')
        .on(LocatorEmittedEvents.Action, () => {
          hovered = true;
        })
        .hover();
      const button = await page.$('button');
      const text = await button?.evaluate(el => {
        return el.innerText;
      });
      expect(text).toBe('hovered');
      expect(hovered).toBe(true);
    });
  });

  describe('Locator.scroll', function () {
    it('should work', async () => {
      const {page} = await getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.setContent(`
        <div style="height: 500px; width: 500px; overflow: scroll;">
          <div style="height: 1000px; width: 1000px;">test</div>
        </div>
      `);
      let scrolled = false;
      await page
        .locator('div')
        .on(LocatorEmittedEvents.Action, () => {
          scrolled = true;
        })
        .scroll({
          scrollTop: 500,
          scrollLeft: 500,
        });
      const scrollable = await page.$('div');
      const scroll = await scrollable?.evaluate(el => {
        return el.scrollTop + ' ' + el.scrollLeft;
      });
      expect(scroll).toBe('500 500');
      expect(scrolled).toBe(true);
    });
  });

  describe('Locator.change', function () {
    it('should work for selects', async () => {
      const {page} = await getTestState();

      await page.setContent(`
        <select>
          <option value="value1">Option 1</option>
          <option value="value2">Option 2</option>
        <select>
      `);
      let filled = false;
      await page
        .locator('select')
        .on(LocatorEmittedEvents.Action, () => {
          filled = true;
        })
        .fill('value2');
      expect(
        await page.evaluate(() => {
          return document.querySelector('select')?.value === 'value2';
        })
      ).toBe(true);
      expect(filled).toBe(true);
    });

    it('should work for inputs', async () => {
      const {page} = await getTestState();
      await page.setContent(`
        <input>
      `);
      await page.locator('input').fill('test');
      expect(
        await page.evaluate(() => {
          return document.querySelector('input')?.value === 'test';
        })
      ).toBe(true);
    });

    it('should work if the input becomes enabled later', async () => {
      const {page} = await getTestState();

      await page.setContent(`
        <input disabled>
      `);
      const input = await page.$('input');
      const result = page.locator('input').fill('test');
      expect(
        await input?.evaluate(el => {
          return el.value;
        })
      ).toBe('');
      await input?.evaluate(el => {
        el.disabled = false;
      });
      await result;
      expect(
        await input?.evaluate(el => {
          return el.value;
        })
      ).toBe('test');
    });

    it('should work for contenteditable', async () => {
      const {page} = await getTestState();
      await page.setContent(`
        <div contenteditable="true">
      `);
      await page.locator('div').fill('test');
      expect(
        await page.evaluate(() => {
          return document.querySelector('div')?.innerText === 'test';
        })
      ).toBe(true);
    });

    it('should work for pre-filled inputs', async () => {
      const {page} = await getTestState();
      await page.setContent(`
        <input value="te">
      `);
      await page.locator('input').fill('test');
      expect(
        await page.evaluate(() => {
          return document.querySelector('input')?.value === 'test';
        })
      ).toBe(true);
    });

    it('should override pre-filled inputs', async () => {
      const {page} = await getTestState();
      await page.setContent(`
        <input value="wrong prefix">
      `);
      await page.locator('input').fill('test');
      expect(
        await page.evaluate(() => {
          return document.querySelector('input')?.value === 'test';
        })
      ).toBe(true);
    });

    it('should work for non-text inputs', async () => {
      const {page} = await getTestState();
      await page.setContent(`
        <input type="color">
      `);
      await page.locator('input').fill('#333333');
      expect(
        await page.evaluate(() => {
          return document.querySelector('input')?.value === '#333333';
        })
      ).toBe(true);
    });
  });

  describe('Locator.race', () => {
    it('races multiple locators', async () => {
      const {page} = await getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.setContent(`
        <button onclick="window.count++;">test</button>
      `);
      await page.evaluate(() => {
        // @ts-expect-error different context.
        window.count = 0;
      });
      await Locator.race([
        page.locator('button'),
        page.locator('button'),
      ]).click();
      const count = await page.evaluate(() => {
        // @ts-expect-error different context.
        return globalThis.count;
      });
      expect(count).toBe(1);
    });

    it('can be aborted', async () => {
      const {page} = await getTestState();
      const clock = sinon.useFakeTimers({
        shouldClearNativeTimers: true,
      });
      try {
        await page.setViewport({width: 500, height: 500});
        await page.setContent(`
          <button style="display: none;" onclick="this.innerText = 'clicked';">test</button>
        `);
        const abortController = new AbortController();
        const result = Locator.race([
          page.locator('button'),
          page.locator('button'),
        ])
          .setTimeout(5000)
          .click({
            signal: abortController.signal,
          });
        clock.tick(2000);
        abortController.abort();
        await expect(result).rejects.toThrow(/aborted/);
      } finally {
        clock.restore();
      }
    });

    it('should time out when all locators do not match', async () => {
      const clock = sinon.useFakeTimers({
        shouldClearNativeTimers: true,
      });
      try {
        const {page} = await getTestState();
        page.setDefaultTimeout(5000);
        await page.setContent(`<button>test</button>`);
        const result = Locator.race([
          page.locator('not-found'),
          page.locator('not-found'),
        ]).click();
        clock.tick(5100);
        await expect(result).rejects.toEqual(
          new TimeoutError('waitForFunction timed out. The timeout is 5000ms.')
        );
      } finally {
        clock.restore();
      }
    });

    it('should not time out when one of the locators matches', async () => {
      const {page} = await getTestState();
      await page.setContent(`<button>test</button>`);
      const result = Locator.race([
        page.locator('not-found'),
        page.locator('button'),
      ]).click();
      await expect(result).resolves.toEqual(undefined);
    });
  });

  describe('Locator.prototype.expect', () => {
    it('should not resolve if the predicate does not match', async () => {
      const clock = sinon.useFakeTimers({
        shouldClearNativeTimers: true,
      });
      try {
        const {page} = await getTestState();
        page.setDefaultTimeout(5000);
        await page.setContent(`<div>test</div>`);
        const result = page
          .locator('::-p-text(test)')
          .expect((element): Promise<boolean> => {
            return Promise.resolve(
              element.getAttribute('clickable') === 'true'
            );
          })
          .hover();
        clock.tick(5100);
        await expect(result).rejects.toEqual(
          new TimeoutError('waitForFunction timed out. The timeout is 5000ms.')
        );
      } finally {
        clock.restore();
      }
    });

    it('should resolve as soon as the predicate matches', async () => {
      const clock = sinon.useFakeTimers({
        shouldClearNativeTimers: true,
      });
      try {
        const {page} = await getTestState();
        page.setDefaultTimeout(5000);
        await page.setContent(`<div>test</div>`);
        const result = page
          .locator('::-p-text(test)')
          .expect(async element => {
            return element.getAttribute('clickable') === 'true';
          })
          .expect(element => {
            return element.getAttribute('clickable') === 'true';
          })
          .hover();
        clock.tick(2000);
        await page.evaluate(() => {
          document.querySelector('div')?.setAttribute('clickable', 'true');
        });
        clock.tick(2000);
        await expect(result).resolves.toEqual(undefined);
      } finally {
        clock.restore();
      }
    });
  });
});
