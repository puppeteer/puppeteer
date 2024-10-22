/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';
import {TimeoutError} from 'puppeteer-core';
import {
  Locator,
  LocatorEvent,
} from 'puppeteer-core/internal/api/locators/locators.js';
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
      .on(LocatorEvent.Action, () => {
        willClick = true;
      })
      .click();
    using button = await page.$('button');
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
      .on(LocatorEvent.Action, () => {
        willClick = true;
      })
      .click();
    using button = await page.$('button');
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
        .on(LocatorEvent.Action, () => {
          willClick = true;
        })
        .click();
      using button = await page.$('button');
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
        .on(LocatorEvent.Action, () => {
          clicked = true;
        })
        .click();
      using button = await page.$('button');
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
      using button = await page.$('button');
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
      using button = await page.$('button');
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
      using button = await page.$('button');
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
      using button = await page.$('button');
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
        shouldAdvanceTime: true,
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
          new TimeoutError('Timed out after waiting 5000ms')
        );
      } finally {
        clock.restore();
      }
    });

    it('should retry clicks on errors', async () => {
      const {page} = await getTestState();
      const clock = sinon.useFakeTimers({
        shouldClearNativeTimers: true,
        shouldAdvanceTime: true,
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
          new TimeoutError('Timed out after waiting 5000ms')
        );
      } finally {
        clock.restore();
      }
    });

    it('can be aborted', async () => {
      const {page} = await getTestState();
      const clock = sinon.useFakeTimers({
        shouldClearNativeTimers: true,
        shouldAdvanceTime: true,
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

    it('should work with a OOPIF', async () => {
      const {page} = await getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.setContent(`
        <iframe src="data:text/html,<button onclick=&quot;this.innerText = 'clicked';&quot;>test</button>"></iframe>
      `);
      const frame = await page.waitForFrame(frame => {
        return frame.url().startsWith('data');
      });
      let willClick = false;
      await frame
        .locator('button')
        .on(LocatorEvent.Action, () => {
          willClick = true;
        })
        .click();
      using button = await frame.$('button');
      const text = await button?.evaluate(el => {
        return el.innerText;
      });
      expect(text).toBe('clicked');
      expect(willClick).toBe(true);
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
        .on(LocatorEvent.Action, () => {
          hovered = true;
        })
        .hover();
      using button = await page.$('button');
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
        .on(LocatorEvent.Action, () => {
          scrolled = true;
        })
        .scroll({
          scrollTop: 500,
          scrollLeft: 500,
        });
      using scrollable = await page.$('div');
      const scroll = await scrollable?.evaluate(el => {
        return el.scrollTop + ' ' + el.scrollLeft;
      });
      expect(scroll).toBe('500 500');
      expect(scrolled).toBe(true);
    });
  });

  describe('Locator.fill', function () {
    it('should work for textarea', async () => {
      const {page} = await getTestState();

      await page.setContent(`
        <textarea></textarea>
      `);
      let filled = false;
      await page
        .locator('textarea')
        .on(LocatorEvent.Action, () => {
          filled = true;
        })
        .fill('test');
      expect(
        await page.evaluate(() => {
          return document.querySelector('textarea')?.value === 'test';
        })
      ).toBe(true);
      expect(filled).toBe(true);
    });

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
        .on(LocatorEvent.Action, () => {
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
      using input = await page.$('input');
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
        shouldAdvanceTime: true,
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
        shouldAdvanceTime: true,
      });
      try {
        const {page} = await getTestState();
        await page.setContent(`<button>test</button>`);
        const result = Locator.race([
          page.locator('not-found'),
          page.locator('not-found'),
        ])
          .setTimeout(5000)
          .click();
        clock.tick(5100);
        await expect(result).rejects.toEqual(
          new TimeoutError('Timed out after waiting 5000ms')
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

  describe('Locator.prototype.map', () => {
    it('should work', async () => {
      const {page} = await getTestState();
      await page.setContent(`<div>test</div>`);
      await expect(
        page
          .locator('::-p-text(test)')
          .map(element => {
            return element.getAttribute('clickable');
          })
          .wait()
      ).resolves.toEqual(null);
      await page.evaluate(() => {
        document.querySelector('div')?.setAttribute('clickable', 'true');
      });
      await expect(
        page
          .locator('::-p-text(test)')
          .map(element => {
            return element.getAttribute('clickable');
          })
          .wait()
      ).resolves.toEqual('true');
    });
    it('should work with throws', async () => {
      const {page} = await getTestState();
      await page.setContent(`<div>test</div>`);
      const result = page
        .locator('::-p-text(test)')
        .map(element => {
          const clickable = element.getAttribute('clickable');
          if (!clickable) {
            throw new Error('Missing `clickable` as an attribute');
          }
          return clickable;
        })
        .wait();
      await page.evaluate(() => {
        document.querySelector('div')?.setAttribute('clickable', 'true');
      });
      await expect(result).resolves.toEqual('true');
    });
    it('should work with expect', async () => {
      const {page} = await getTestState();
      await page.setContent(`<div>test</div>`);
      const result = page
        .locator('::-p-text(test)')
        .filter(element => {
          return element.getAttribute('clickable') !== null;
        })
        .map(element => {
          return element.getAttribute('clickable');
        })
        .wait();
      await page.evaluate(() => {
        document.querySelector('div')?.setAttribute('clickable', 'true');
      });
      await expect(result).resolves.toEqual('true');
    });
  });

  describe('Locator.prototype.filter', () => {
    it('should resolve as soon as the predicate matches', async () => {
      const clock = sinon.useFakeTimers({
        shouldClearNativeTimers: true,
        shouldAdvanceTime: true,
      });
      try {
        const {page} = await getTestState();
        await page.setContent(`<div>test</div>`);
        const result = page
          .locator('::-p-text(test)')
          .setTimeout(5000)
          .filter(async element => {
            return element.getAttribute('clickable') === 'true';
          })
          .filter(element => {
            return element.getAttribute('clickable') === 'true';
          })
          .hover();
        clock.tick(2000);
        await page.evaluate(() => {
          document.querySelector('div')?.setAttribute('clickable', 'true');
        });
        clock.restore();
        await expect(result).resolves.toEqual(undefined);
      } finally {
        clock.restore();
      }
    });
  });

  describe('Locator.prototype.wait', () => {
    it('should work', async () => {
      const {page} = await getTestState();
      void page.setContent(`
        <script>
          setTimeout(() => {
            const element = document.createElement("div");
            element.innerText = "test2"
            document.body.append(element);
          }, 50);
        </script>
      `);
      // This shouldn't throw.
      await page.locator('div').wait();
    });
  });

  describe('Locator.prototype.waitHandle', () => {
    it('should work', async () => {
      const {page} = await getTestState();
      void page.setContent(`
        <script>
          setTimeout(() => {
            const element = document.createElement("div");
            element.innerText = "test2"
            document.body.append(element);
          }, 50);
        </script>
      `);
      await expect(page.locator('div').waitHandle()).resolves.toBeDefined();
    });
  });

  describe('Locator.prototype.clone', () => {
    it('should work', async () => {
      const {page} = await getTestState();
      const locator = page.locator('div');
      const clone = locator.clone();
      expect(locator).not.toStrictEqual(clone);
    });
    it('should work internally with delegated locators', async () => {
      const {page} = await getTestState();
      const locator = page.locator('div');
      const delegatedLocators = [
        locator.map(div => {
          return div.textContent;
        }),
        locator.filter(div => {
          return div.textContent?.length === 0;
        }),
      ];
      for (let delegatedLocator of delegatedLocators) {
        delegatedLocator = delegatedLocator.setTimeout(500);
        expect(delegatedLocator.timeout).not.toStrictEqual(locator.timeout);
      }
    });
  });

  describe('FunctionLocator', () => {
    it('should work', async () => {
      const {page} = await getTestState();
      const result = page
        .locator(() => {
          return new Promise<boolean>(resolve => {
            return setTimeout(() => {
              return resolve(true);
            }, 100);
          });
        })
        .wait();
      await expect(result).resolves.toEqual(true);
    });
    it('should work with actions', async () => {
      const {page} = await getTestState();
      await page.setContent(`<div onclick="window.clicked = true">test</div>`);
      await page
        .locator(() => {
          return document.getElementsByTagName('div')[0]!;
        })
        .click();
      await expect(
        page.evaluate(() => {
          return (window as unknown as {clicked: boolean}).clicked;
        })
      ).resolves.toEqual(true);
    });
  });
});
