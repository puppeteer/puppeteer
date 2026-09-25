/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from 'chai';
import {TimeoutError} from 'puppeteer-core';
import {
  Locator,
  LocatorEvent,
} from 'puppeteer-core/internal/api/locators/locators.js';
import sinon from 'sinon';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';
import {assertRejects, html} from './utils.js';

describe('Locator', function () {
  setupTestBrowserHooks();

  it('should work with a frame', async () => {
    const {page} = await getTestState();

    await page.setViewport({width: 500, height: 500});
    await page.setContent(html`
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
    assert.strictEqual(text, 'clicked');
    assert.isTrue(willClick);
  });

  it('should work without preconditions', async () => {
    const {page} = await getTestState();

    await page.setViewport({width: 500, height: 500});
    await page.setContent(html`
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
    assert.strictEqual(text, 'clicked');
    assert.isTrue(willClick);
  });

  describe('Locator.click', function () {
    it('should work', async () => {
      const {page} = await getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.setContent(html`
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
      assert.strictEqual(text, 'clicked');
      assert.isTrue(willClick);
    });

    it('should work for multiple selectors', async () => {
      const {page} = await getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.setContent(html`
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
      assert.strictEqual(text, 'clicked');
      assert.isTrue(clicked);
    });

    it('should work if the element is out of viewport', async () => {
      const {page} = await getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.setContent(html`
        <button
          style="margin-top: 600px;"
          onclick="this.innerText = 'clicked';"
        >
          test
        </button>
      `);
      await page.locator('button').click();
      using button = await page.$('button');
      const text = await button?.evaluate(el => {
        return el.innerText;
      });
      assert.strictEqual(text, 'clicked');
    });

    it('should work with element handles', async () => {
      const {page} = await getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.setContent(html`
        <button
          style="margin-top: 600px;"
          onclick="this.innerText = 'clicked';"
        >
          test
        </button>
      `);
      using button = await page.$('button');
      if (!button) {
        throw new Error('button not found');
      }
      await button.asLocator().click();
      const text = await button?.evaluate(el => {
        return el.innerText;
      });
      assert.strictEqual(text, 'clicked');
    });

    it('should work if the element becomes visible later', async () => {
      const {page} = await getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.setContent(html`
        <button
          style="display: none;"
          onclick="this.innerText = 'clicked';"
          >test</button
        >
      `);
      using button = await page.$('button');
      const result = page
        .locator('button')
        .click()
        .catch(err => {
          return err;
        });
      assert.strictEqual(
        await button?.evaluate(el => {
          return el.innerText;
        }),
        'test',
      );
      await button?.evaluate(el => {
        el.style.display = 'block';
      });
      const maybeError = await result;
      if (maybeError instanceof Error) {
        throw maybeError;
      }
      assert.strictEqual(
        await button?.evaluate(el => {
          return el.innerText;
        }),
        'clicked',
      );
    });

    it('should work if the element becomes enabled later', async () => {
      const {page} = await getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.setContent(html`
        <button
          disabled
          onclick="this.innerText = 'clicked';"
          >test</button
        >
      `);
      using button = await page.$('button');
      const result = page.locator('button').click();
      assert.strictEqual(
        await button?.evaluate(el => {
          return el.innerText;
        }),
        'test',
      );
      await button?.evaluate(el => {
        el.disabled = false;
      });
      await result;
      assert.strictEqual(
        await button?.evaluate(el => {
          return el.innerText;
        }),
        'clicked',
      );
    });

    it('should work if multiple conditions are satisfied later', async () => {
      const {page} = await getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.setContent(html`
        <button
          style="margin-top: 600px;"
          style="display: none;"
          disabled
          onclick="this.innerText = 'clicked';"
        >
          test
        </button>
      `);
      using button = await page.$('button');
      const result = page.locator('button').click();
      assert.strictEqual(
        await button?.evaluate(el => {
          return el.innerText;
        }),
        'test',
      );
      await button?.evaluate(el => {
        el.disabled = false;
        el.style.display = 'block';
      });
      await result;
      assert.strictEqual(
        await button?.evaluate(el => {
          return el.innerText;
        }),
        'clicked',
      );
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
        await page.setContent(html`
          <button
            style="display: none;"
            onclick="this.innerText = 'clicked';"
          >
            test
          </button>
        `);
        const result = page.locator('button').click();
        clock.tick(5100);
        const error = await assertRejects(result);
        assert.instanceOf(error, TimeoutError);
        assert.strictEqual(error.message, 'Timed out after waiting 5000ms');
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
        await page.setContent(html`
          <button
            style="display: none;"
            onclick="this.innerText = 'clicked';"
          >
            test
          </button>
        `);
        const result = page.locator('button').click();
        clock.tick(5100);
        const error = await assertRejects(result);
        assert.instanceOf(error, TimeoutError);
        assert.strictEqual(error.message, 'Timed out after waiting 5000ms');
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
        await page.setContent(html`
          <button
            style="display: none;"
            onclick="this.innerText = 'clicked';"
          >
            test
          </button>
        `);
        const abortController = new AbortController();
        const result = page.locator('button').click({
          signal: abortController.signal,
        });
        clock.tick(2000);
        abortController.abort();
        const error = await assertRejects(result);
        assert.match(error.message, /aborted/);
      } finally {
        clock.restore();
      }
    });

    it('should work with a OOPIF', async () => {
      const {page} = await getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.setContent(html`
        <iframe
          src="data:text/html,<button onclick=&quot;this.innerText = 'clicked';&quot;>test</button>"
        ></iframe>
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
      assert.strictEqual(text, 'clicked');
      assert.isTrue(willClick);
    });
  });

  describe('Locator.hover', function () {
    it('should work', async () => {
      const {page} = await getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.setContent(html`
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
      assert.strictEqual(text, 'hovered');
      assert.isTrue(hovered);
    });
  });

  describe('Locator.scroll', function () {
    it('should work', async () => {
      const {page} = await getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.setContent(html`
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
      assert.strictEqual(scroll, '500 500');
      assert.isTrue(scrolled);
    });
  });

  describe('Locator.fill', function () {
    it('should work for textarea', async () => {
      const {page} = await getTestState();

      await page.setContent(html` <textarea></textarea> `);
      let filled = false;
      await page
        .locator('textarea')
        .on(LocatorEvent.Action, () => {
          filled = true;
        })
        .fill('test');
      assert.isTrue(
        await page.evaluate(() => {
          return document.querySelector('textarea')?.value === 'test';
        }),
      );
      assert.isTrue(filled);
    });

    it('should work for selects', async () => {
      const {page} = await getTestState();

      await page.setContent(html`
        <select>
          <option value="value1">Option 1</option>
          <option value="value2">Option 2</option>
        </select>
      `);
      let filled = false;
      await page
        .locator('select')
        .on(LocatorEvent.Action, () => {
          filled = true;
        })
        .fill('value2');
      assert.isTrue(
        await page.evaluate(() => {
          return document.querySelector('select')?.value === 'value2';
        }),
      );
      assert.isTrue(filled);
    });

    it('should work for inputs', async () => {
      const {page} = await getTestState();
      await page.setContent(html`<input />`);
      await page.locator('input').fill('test');
      assert.isTrue(
        await page.evaluate(() => {
          return document.querySelector('input')?.value === 'test';
        }),
      );
    });

    it('should work if the input becomes enabled later', async () => {
      const {page} = await getTestState();

      await page.setContent(html` <input disabled /> `);
      using input = await page.$('input');
      const result = page.locator('input').fill('test');
      assert.strictEqual(
        await input?.evaluate(el => {
          return el.value;
        }),
        '',
      );
      await input?.evaluate(el => {
        el.disabled = false;
      });
      await result;
      assert.strictEqual(
        await input?.evaluate(el => {
          return el.value;
        }),
        'test',
      );
    });

    it('should work for contenteditable', async () => {
      const {page} = await getTestState();
      await page.setContent(html` <div contenteditable="true"></div> `);
      await page.locator('div').fill('test');
      assert.isTrue(
        await page.evaluate(() => {
          return document.querySelector('div')?.innerText === 'test';
        }),
      );
    });

    it('should work for pre-filled inputs', async () => {
      const {page} = await getTestState();
      await page.setContent(html` <input value="te" /> `);
      await page.locator('input').fill('test');
      assert.isTrue(
        await page.evaluate(() => {
          return document.querySelector('input')?.value === 'test';
        }),
      );
    });

    it('should override pre-filled inputs', async () => {
      const {page} = await getTestState();
      await page.setContent(html` <input value="wrong prefix" /> `);
      await page.locator('input').fill('test');
      assert.isTrue(
        await page.evaluate(() => {
          return document.querySelector('input')?.value === 'test';
        }),
      );
    });

    it('should work for non-text inputs', async () => {
      const {page} = await getTestState();
      await page.setContent(html` <input type="color" /> `);
      await page.locator('input').fill('#333333');
      assert.isTrue(
        await page.evaluate(() => {
          return document.querySelector('input')?.value === '#333333';
        }),
      );
    });

    it('should work for large text', async () => {
      const {page} = await getTestState();
      await page.setContent(html` <textarea></textarea> `);
      const largeText = 'a'.repeat(1000);
      await page.locator('textarea').fill(largeText);
      assert.isTrue(
        await page.evaluate(() => {
          return document.querySelector('textarea')?.value.length === 1000;
        }),
      );
    });

    it('should work for large text in contenteditable', async () => {
      const {page} = await getTestState();
      await page.setContent(html` <div contenteditable="true"></div> `);
      const largeText = 'a'.repeat(1000);
      await page.locator('div').fill(largeText);
      assert.isTrue(
        await page.evaluate(() => {
          return (
            (document.querySelector('div') as HTMLElement).innerText.length ===
            1000
          );
        }),
      );
    });

    it('should work with a custom typing threshold', async () => {
      const {page} = await getTestState();
      await page.setContent(html` <input /> `);
      const text = 'abc';
      // threshold is 10, so it should type it.
      await page.locator('input').fill(text, {typingThreshold: 10});
      assert.strictEqual(
        await page.evaluate(() => {
          return (document.querySelector('input') as HTMLInputElement).value;
        }),
        text,
      );

      await page.setContent(html` <input /> `);
      // threshold is 2, so it should fill it directly.
      await page.locator('input').fill(text, {typingThreshold: 2});
      assert.strictEqual(
        await page.evaluate(() => {
          return (document.querySelector('input') as HTMLInputElement).value;
        }),
        text,
      );
    });

    it('should work for checkboxes', async () => {
      const {page} = await getTestState();
      await page.setContent(html`<input type="checkbox" />`);

      await page.locator('input').fill(true);
      assert.isTrue(
        await page.evaluate(() => {
          return document.querySelector('input')?.checked === true;
        }),
      );

      await page.locator('input').fill(false);
      assert.isFalse(
        await page.evaluate(() => {
          return document.querySelector('input')?.checked === true;
        }),
      );
    });

    it('should work for radio buttons', async () => {
      const {page} = await getTestState();
      await page.setContent(html`<input type="radio" />`);

      await page.locator('input').fill(true);
      assert.isTrue(
        await page.evaluate(() => {
          return document.querySelector('input')?.checked === true;
        }),
      );
    });

    it('should work for custom ARIA checkboxes', async () => {
      const {page} = await getTestState();
      await page.setContent(
        html`<div
          role="checkbox"
          style="width: 100px; height: 100px;"
          onclick="this.setAttribute('aria-checked', this.getAttribute('aria-checked') !== 'true')"
          aria-checked="false"
        ></div>`,
      );

      await page.locator('[role="checkbox"]').fill(true);
      assert.isTrue(
        await page.evaluate(() => {
          return (
            document
              .querySelector('[role="checkbox"]')
              ?.getAttribute('aria-checked') === 'true'
          );
        }),
      );

      await page.locator('[role="checkbox"]').fill(false);
      assert.isTrue(
        await page.evaluate(() => {
          return (
            document
              .querySelector('[role="checkbox"]')
              ?.getAttribute('aria-checked') === 'false'
          );
        }),
      );
    });

    it('should work for custom ARIA radio buttons', async () => {
      const {page} = await getTestState();
      await page.setContent(
        html`<div
          role="radio"
          style="width: 100px; height: 100px;"
          onclick="this.setAttribute('aria-checked', 'true')"
          aria-checked="false"
        ></div>`,
      );

      await page.locator('[role="radio"]').fill(true);
      assert.isTrue(
        await page.evaluate(() => {
          return (
            document
              .querySelector('[role="radio"]')
              ?.getAttribute('aria-checked') === 'true'
          );
        }),
      );
    });

    it('should work for custom ARIA switches', async () => {
      const {page} = await getTestState();
      await page.setContent(
        html`<div
          role="switch"
          style="width: 100px; height: 100px;"
          onclick="this.setAttribute('aria-checked', this.getAttribute('aria-checked') !== 'true')"
          aria-checked="false"
        ></div>`,
      );

      await page.locator('[role="switch"]').fill(true);
      assert.isTrue(
        await page.evaluate(() => {
          // Verify the ARIA attribute was updated by the fill command
          return (
            document
              .querySelector('[role="switch"]')
              ?.getAttribute('aria-checked') === 'true'
          );
        }),
      );

      await page.locator('[role="switch"]').fill(false);
      assert.isTrue(
        await page.evaluate(() => {
          return (
            document
              .querySelector('[role="switch"]')
              ?.getAttribute('aria-checked') === 'false'
          );
        }),
      );
    });

    it('should work for custom ARIA mixed checkboxes', async () => {
      const {page} = await getTestState();
      await page.setContent(
        html`<div
          role="checkbox"
          style="width: 100px; height: 100px;"
          onclick="const next = {'mixed': 'true', 'true': 'false', 'false': 'true'}; this.setAttribute('aria-checked', next[this.getAttribute('aria-checked')])"
          aria-checked="mixed"
        ></div>`,
      );

      await page.locator('[role="checkbox"]').fill(true);
      assert.isTrue(
        await page.evaluate(() => {
          return (
            document
              .querySelector('[role="checkbox"]')
              ?.getAttribute('aria-checked') === 'true'
          );
        }),
      );

      await page.locator('[role="checkbox"]').fill(false);
      assert.isTrue(
        await page.evaluate(() => {
          return (
            document
              .querySelector('[role="checkbox"]')
              ?.getAttribute('aria-checked') === 'false'
          );
        }),
      );
    });
  });

  describe('Locator.race', () => {
    it('races multiple locators', async () => {
      const {page} = await getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.setContent(html`
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
      assert.strictEqual(count, 1);
    });

    it('can be aborted', async () => {
      const {page} = await getTestState();
      const clock = sinon.useFakeTimers({
        shouldClearNativeTimers: true,
        shouldAdvanceTime: true,
      });
      try {
        await page.setViewport({width: 500, height: 500});
        await page.setContent(html`
          <button
            style="display: none;"
            onclick="this.innerText = 'clicked';"
          >
            test
          </button>
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
        const error = await assertRejects(result);
        assert.match(error.message, /aborted/);
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
        await page.setContent(html`<button>test</button>`);
        const result = Locator.race([
          page.locator('not-found'),
          page.locator('not-found'),
        ])
          .setTimeout(5000)
          .click();
        clock.tick(5100);
        const error = await assertRejects(result);
        assert.instanceOf(error, TimeoutError);
        assert.strictEqual(error.message, 'Timed out after waiting 5000ms');
      } finally {
        clock.restore();
      }
    });

    it('should not time out when one of the locators matches', async () => {
      const {page} = await getTestState();
      await page.setContent(html`<button>test</button>`);
      const result = Locator.race([
        page.locator('not-found'),
        page.locator('button'),
      ]).click();
      assert.isUndefined(await result);
    });
  });

  describe('Locator.prototype.map', () => {
    it('should work', async () => {
      const {page} = await getTestState();
      await page.setContent(html`<div>test</div>`);
      assert.isNull(
        await page
          .locator('::-p-text(test)')
          .map(element => {
            return element.getAttribute('clickable');
          })
          .wait(),
      );
      await page.evaluate(() => {
        document.querySelector('div')?.setAttribute('clickable', 'true');
      });
      assert.strictEqual(
        await page
          .locator('::-p-text(test)')
          .map(element => {
            return element.getAttribute('clickable');
          })
          .wait(),
        'true',
      );
    });
    it('should work with throws', async () => {
      const {page} = await getTestState();
      await page.setContent(html`<div>test</div>`);
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
      assert.strictEqual(await result, 'true');
    });
    it('should work with expect', async () => {
      const {page} = await getTestState();
      await page.setContent(html`<div>test</div>`);
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
      assert.strictEqual(await result, 'true');
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
        await page.setContent(html`<div>test</div>`);
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
        assert.isUndefined(await result);
      } finally {
        clock.restore();
      }
    });
  });

  describe('Locator.prototype.wait', () => {
    it('should work', async () => {
      const {page} = await getTestState();
      void page.setContent(html`
        <script>
          setTimeout(() => {
            const element = document.createElement('div');
            element.innerText = 'test2';
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
      void page.setContent(html`
        <script>
          setTimeout(() => {
            const element = document.createElement('div');
            element.innerText = 'test2';
            document.body.append(element);
          }, 50);
        </script>
      `);
      assert.isDefined(await page.locator('div').waitHandle());
    });
  });

  describe('Locator.prototype.clone', () => {
    it('should work', async () => {
      const {page} = await getTestState();
      const locator = page.locator('div');
      const clone = locator.clone();
      assert.notDeepEqual(locator, clone);
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
        assert.notDeepEqual(delegatedLocator.timeout, locator.timeout);
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
      assert.isTrue(await result);
    });
    it('should work with actions', async () => {
      const {page} = await getTestState();
      await page.setContent(
        html`<div onclick="window.clicked = true">test</div>`,
      );
      await page
        .locator(() => {
          return document.getElementsByTagName('div')[0]!;
        })
        .click();
      assert.isTrue(
        await page.evaluate(() => {
          return (window as unknown as {clicked: boolean}).clicked;
        }),
      );
    });
  });
});
