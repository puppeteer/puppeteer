/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from 'chai';
import {Puppeteer} from 'puppeteer-core';
import type {ElementHandle} from 'puppeteer-core/internal/api/ElementHandle.js';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';
import {assertMatchObject, html} from './utils.js';

describe('Query handler tests', function () {
  setupTestBrowserHooks();

  describe('Pierce selectors', function () {
    async function setUpPage(): ReturnType<typeof getTestState> {
      const state = await getTestState();
      await state.page.setContent(
        `<script>
         const div = document.createElement('div');
         const shadowRoot = div.attachShadow({mode: 'open'});
         const div1 = document.createElement('div');
         div1.textContent = 'Hello';
         div1.className = 'foo';
         const div2 = document.createElement('div');
         div2.textContent = 'World';
         div2.className = 'foo';
         shadowRoot.appendChild(div1);
         shadowRoot.appendChild(div2);
         document.documentElement.appendChild(div);
         </script>`,
      );
      return state;
    }
    it('should find first element in shadow', async () => {
      const {page} = await setUpPage();
      using div = (await page.$('pierce/.foo')) as ElementHandle<HTMLElement>;
      const text = await div.evaluate(element => {
        return element.textContent;
      });
      assert.strictEqual(text, 'Hello');
    });
    it('should find all elements in shadow', async () => {
      const {page} = await setUpPage();
      const divs = (await page.$$('pierce/.foo')) as Array<
        ElementHandle<HTMLElement>
      >;
      const text = await Promise.all(
        divs.map(div => {
          return div.evaluate(element => {
            return element.textContent;
          });
        }),
      );
      assert.strictEqual(text.join(' '), 'Hello World');
    });
    it('should find first child element', async () => {
      const {page} = await setUpPage();
      using parentElement = (await page.$('html > div'))!;
      using childElement = (await parentElement.$(
        'pierce/div',
      )) as ElementHandle<HTMLElement>;
      const text = await childElement.evaluate(element => {
        return element.textContent;
      });
      assert.strictEqual(text, 'Hello');
    });
    it('should find all child elements', async () => {
      const {page} = await setUpPage();
      using parentElement = (await page.$('html > div'))!;
      const childElements = (await parentElement.$$('pierce/div')) as Array<
        ElementHandle<HTMLElement>
      >;
      const text = await Promise.all(
        childElements.map(div => {
          return div.evaluate(element => {
            return element.textContent;
          });
        }),
      );
      assert.strictEqual(text.join(' '), 'Hello World');
    });
  });

  describe('Text selectors', function () {
    describe('in Page', function () {
      it('should query existing element', async () => {
        const {page} = await getTestState();

        await page.setContent(html`<section>test</section>`);

        assert.ok(await page.$('text/test'));
        assert.lengthOf(await page.$$('text/test'), 1);
      });
      it('should return empty array for non-existing element', async () => {
        const {page} = await getTestState();

        assert.notOk(await page.$('text/test'));
        assert.lengthOf(await page.$$('text/test'), 0);
      });
      it('should return first element', async () => {
        const {page} = await getTestState();

        await page.setContent(html`<div id="1">a</div> <div>a</div>`);

        using element = await page.$('text/a');
        assert.strictEqual(
          await element?.evaluate(e => {
            return e.id;
          }),
          '1',
        );
      });
      it('should return multiple elements', async () => {
        const {page} = await getTestState();

        await page.setContent(html`<div>a</div> <div>a</div>`);

        const elements = await page.$$('text/a');
        assert.lengthOf(elements, 2);
      });
      it('should pierce shadow DOM', async () => {
        const {page} = await getTestState();

        await page.evaluate(() => {
          const div = document.createElement('div');
          const shadow = div.attachShadow({mode: 'open'});
          const diva = document.createElement('div');
          shadow.append(diva);
          const divb = document.createElement('div');
          shadow.append(divb);
          diva.innerHTML = 'a';
          divb.innerHTML = 'b';
          document.body.append(div);
        });

        using element = await page.$('text/a');
        assert.strictEqual(
          await element?.evaluate(e => {
            return e.textContent;
          }),
          'a',
        );
      });
      it('should query deeply nested text', async () => {
        const {page} = await getTestState();

        await page.setContent(
          html`<div>
            <div>a</div>
            <div>b</div>
          </div>`,
        );

        using element = await page.$('text/a');
        assert.strictEqual(
          await element?.evaluate(e => {
            return e.textContent;
          }),
          'a',
        );
      });
      it('should query inputs', async () => {
        const {page} = await getTestState();

        await page.setContent(html`<input value="a" />`);

        using element = (await page.$(
          'text/a',
        )) as ElementHandle<HTMLInputElement>;
        assert.strictEqual(
          await element?.evaluate(e => {
            return e.value;
          }),
          'a',
        );
      });
      it('should not query radio', async () => {
        const {page} = await getTestState();

        await page.setContent(html`<radio value="a"></radio>`);

        assert.isNull(await page.$('text/a'));
      });
      it('should query text spanning multiple elements', async () => {
        const {page} = await getTestState();

        await page.setContent(html`<div><span>a</span> <span>b</span></div>`);

        using element = await page.$('text/a b');
        assert.strictEqual(
          await element?.evaluate(e => {
            return e.textContent;
          }),
          'a b',
        );
      });
      it('should clear caches', async () => {
        const {page} = await getTestState();

        await page.setContent(
          html`<div id="target1">text</div>
            <input
              id="target2"
              value="text"
            />
            <div id="target3">text</div>`,
        );
        using div = (await page.$('#target1')) as ElementHandle<HTMLDivElement>;
        using input = (await page.$(
          '#target2',
        )) as ElementHandle<HTMLInputElement>;

        await div.evaluate(div => {
          div.textContent = 'text';
        });
        assert.strictEqual(
          await page.$eval(`text/text`, e => {
            return e.id;
          }),
          'target1',
        );
        await div.evaluate(div => {
          div.textContent = 'foo';
        });
        assert.strictEqual(
          await page.$eval(`text/text`, e => {
            return e.id;
          }),
          'target2',
        );
        await input.evaluate(input => {
          input.value = '';
        });
        await input.type('foo');
        assert.strictEqual(
          await page.$eval(`text/text`, e => {
            return e.id;
          }),
          'target3',
        );

        await div.evaluate(div => {
          div.textContent = 'text';
        });
        await input.evaluate(input => {
          input.value = '';
        });
        await input.type('text');
        assert.strictEqual(
          await page.$$eval(`text/text`, es => {
            return es.length;
          }),
          3,
        );
        await div.evaluate(div => {
          div.textContent = 'foo';
        });
        assert.strictEqual(
          await page.$$eval(`text/text`, es => {
            return es.length;
          }),
          2,
        );
        await input.evaluate(input => {
          input.value = '';
        });
        await input.type('foo');
        assert.strictEqual(
          await page.$$eval(`text/text`, es => {
            return es.length;
          }),
          1,
        );
      });
    });
    describe('in ElementHandles', function () {
      it('should query existing element', async () => {
        const {page} = await getTestState();

        await page.setContent(html`<div class="a"><span>a</span></div>`);

        using elementHandle = (await page.$('div'))!;
        assert.ok(await elementHandle.$(`text/a`));
        assert.lengthOf(await elementHandle.$$(`text/a`), 1);
      });

      it('should return null for non-existing element', async () => {
        const {page} = await getTestState();

        await page.setContent(html`<div class="a"></div>`);

        using elementHandle = (await page.$('div'))!;
        assert.notOk(await elementHandle.$(`text/a`));
        assert.lengthOf(await elementHandle.$$(`text/a`), 0);
      });
    });
  });

  describe('XPath selectors', function () {
    describe('in Page', function () {
      it('should query existing element', async () => {
        const {page} = await getTestState();

        await page.setContent(html`<section>test</section>`);

        assert.ok(await page.$('xpath/html/body/section'));
        assert.lengthOf(await page.$$('xpath/html/body/section'), 1);
      });
      it('should return empty array for non-existing element', async () => {
        const {page} = await getTestState();

        assert.notOk(await page.$('xpath/html/body/non-existing-element'));
        assert.lengthOf(
          await page.$$('xpath/html/body/non-existing-element'),
          0,
        );
      });
      it('should return first element', async () => {
        const {page} = await getTestState();

        await page.setContent(html`<div>a</div> <div></div>`);

        using element = await page.$('xpath/html/body/div');
        assert.ok(
          await element?.evaluate(e => {
            return e.textContent === 'a';
          }),
        );
      });
      it('should return multiple elements', async () => {
        const {page} = await getTestState();

        await page.setContent(html`<div></div> <div></div>`);

        const elements = await page.$$('xpath/html/body/div');
        assert.lengthOf(elements, 2);
      });
    });
    describe('in ElementHandles', function () {
      it('should query existing element', async () => {
        const {page} = await getTestState();

        await page.setContent(html`<div class="a">a<span></span></div>`);

        using elementHandle = (await page.$('div'))!;
        assert.ok(await elementHandle.$(`xpath/span`));
        assert.lengthOf(await elementHandle.$$(`xpath/span`), 1);
      });

      it('should return null for non-existing element', async () => {
        const {page} = await getTestState();

        await page.setContent(html`<div class="a">a</div>`);

        using elementHandle = (await page.$('div'))!;
        assert.notOk(await elementHandle.$(`xpath/span`));
        assert.lengthOf(await elementHandle.$$(`xpath/span`), 0);
      });
    });
  });

  describe('P selectors', () => {
    beforeEach(async () => {
      Puppeteer.clearCustomQueryHandlers();
    });

    it('should work with CSS selectors', async () => {
      const {server, page} = await getTestState();
      await page.goto(`${server.PREFIX}/p-selectors.html`);
      using element = await page.$('div > button');
      assert(element, 'Could not find element');
      assert.ok(
        await element.evaluate(element => {
          return element.id === 'b';
        }),
      );

      using root = await page.$('div');
      using button = await root!.$('& > button');
      assert(button, 'Could not find element');
      assert.ok(
        await button.evaluate(element => {
          return element.id === 'b';
        }),
      );

      // Should parse more complex CSS selectors. Listing a few problematic
      // cases from bug reports.
      for (const selector of [
        '.user_row[data-user-id="\\38 "]:not(.deactivated_user)',
        `input[value='Search']:not([class='hidden'])`,
        `[data-test-id^="test-"]:not([data-test-id^="test-foo"])`,
        `& > table`,
      ]) {
        await page.$$(selector);
      }
    });

    it('should work with puppeteer pseudo classes', async () => {
      const {server, page} = await getTestState();
      await page.goto(`${server.PREFIX}/p-selectors.html`);
      using element = await page.$('button::-p-text(world)');
      assert(element, 'Could not find element');
      assert.ok(
        await element.evaluate(element => {
          return element.id === 'b';
        }),
      );
    });

    it('should work with deep combinators', async () => {
      const {server, page} = await getTestState();
      await page.goto(`${server.PREFIX}/p-selectors.html`);
      {
        using element = await page.$('div >>>> div');
        assert(element, 'Could not find element');
        assert.ok(
          await element.evaluate(element => {
            return element.id === 'c';
          }),
        );
      }
      {
        const elements = await page.$$('div >>> div');
        assert(elements[1], 'Could not find element');
        assert.ok(
          await elements[1]?.evaluate(element => {
            return element.id === 'd';
          }),
        );
      }
      {
        const elements = await page.$$('#c >>>> div');
        assert(elements[0], 'Could not find element');
        assert.ok(
          await elements[0]?.evaluate(element => {
            return element.id === 'd';
          }),
        );
      }
      {
        const elements = await page.$$('#c >>> div');
        assert(elements[0], 'Could not find element');
        assert.ok(
          await elements[0]?.evaluate(element => {
            return element.id === 'd';
          }),
        );
      }
    });

    it('should work with text selectors', async () => {
      const {server, page} = await getTestState();
      await page.goto(`${server.PREFIX}/p-selectors.html`);
      using element = await page.$('div ::-p-text(world)');
      assert(element, 'Could not find element');
      assert.ok(
        await element.evaluate(element => {
          return element.id === 'b';
        }),
      );
    });

    it('should work ARIA selectors', async () => {
      const {server, page} = await getTestState();
      await page.goto(`${server.PREFIX}/p-selectors.html`);
      using element = await page.$('div ::-p-aria(world)');
      assert(element, 'Could not find element');
      assert.ok(
        await element.evaluate(element => {
          return element.id === 'b';
        }),
      );
    });

    it('should work for ARIA selectors in multiple isolated worlds', async () => {
      const {server, page} = await getTestState();
      await page.goto(`${server.PREFIX}/p-selectors.html`);
      using element = await page.waitForSelector('::-p-aria(world)');
      assert(element, 'Could not find element');
      assert.ok(
        await element.evaluate(element => {
          return element.id === 'b';
        }),
      );
      // $ would add ARIA query handler to the main world.
      await element.$('::-p-aria(world)');
      using element2 = await page.waitForSelector('::-p-aria(world)');
      assert(element2, 'Could not find element');
      assert.ok(
        await element2.evaluate(element => {
          return element.id === 'b';
        }),
      );
    });

    it('should work ARIA selectors with role', async () => {
      const {server, page} = await getTestState();
      await page.goto(`${server.PREFIX}/p-selectors.html`);
      using element = await page.$('::-p-aria(world[role="button"])');
      assert(element, 'Could not find element');
      assert.ok(
        await element.evaluate(element => {
          return element.id === 'b';
        }),
      );
    });

    it('should work ARIA selectors with name and role', async () => {
      const {server, page} = await getTestState();
      await page.goto(`${server.PREFIX}/p-selectors.html`);
      using element = await page.$('::-p-aria([name="world"][role="button"])');
      assert(element, 'Could not find element');
      assert.ok(
        await element.evaluate(element => {
          return element.id === 'b';
        }),
      );
    });

    it('should work XPath selectors', async () => {
      const {server, page} = await getTestState();
      await page.goto(`${server.PREFIX}/p-selectors.html`);
      using element = await page.$('div ::-p-xpath(//button)');
      assert(element, 'Could not find element');
      assert.ok(
        await element.evaluate(element => {
          return element.id === 'b';
        }),
      );
    });

    it('should work with custom selectors', async () => {
      Puppeteer.registerCustomQueryHandler('div', {
        queryOne() {
          return document.querySelector('div');
        },
      });

      const {server, page} = await getTestState();
      await page.goto(`${server.PREFIX}/p-selectors.html`);
      using element = await page.$('::-p-div');
      assert(element, 'Could not find element');
      assert.ok(
        await element.evaluate(element => {
          return element.id === 'a';
        }),
      );
    });

    it('should work with custom selectors with args', async () => {
      const {server, page} = await getTestState();
      await page.goto(`${server.PREFIX}/p-selectors.html`);
      Puppeteer.registerCustomQueryHandler('div', {
        queryOne(_, selector) {
          if (selector === 'true') {
            return document.querySelector('div');
          } else {
            return document.querySelector('button');
          }
        },
      });

      {
        using element = await page.$('::-p-div(true)');
        assert(element, 'Could not find element');
        assert.ok(
          await element.evaluate(element => {
            return element.id === 'a';
          }),
        );
      }
      {
        using element = await page.$('::-p-div("true")');
        assert(element, 'Could not find element');
        assert.ok(
          await element.evaluate(element => {
            return element.id === 'a';
          }),
        );
      }
      {
        using element = await page.$("::-p-div('true')");
        assert(element, 'Could not find element');
        assert.ok(
          await element.evaluate(element => {
            return element.id === 'a';
          }),
        );
      }
      {
        using element = await page.$('::-p-div');
        assert(element, 'Could not find element');
        assert.ok(
          await element.evaluate(element => {
            return element.id === 'b';
          }),
        );
      }
    });

    it('should work with :hover', async () => {
      const {server, page} = await getTestState();
      await page.goto(`${server.PREFIX}/p-selectors.html`);
      using button = await page.$('div ::-p-text(world)');
      assert(button, 'Could not find element');
      await button.hover();

      using button2 = await page.$('div ::-p-text(world):hover');
      assert(button2, 'Could not find element');
      const value = await button2.evaluate(span => {
        return {textContent: span.textContent, tagName: span.tagName};
      });
      assertMatchObject(value, {textContent: 'world', tagName: 'BUTTON'});
    });

    it('should work with selector lists', async () => {
      const {server, page} = await getTestState();
      await page.goto(`${server.PREFIX}/p-selectors.html`);
      const elements = await page.$$('div, ::-p-text(world)');
      assert.lengthOf(elements, 3);
    });

    const permute = <T>(inputs: T[]): T[][] => {
      const results: T[][] = [];
      for (let i = 0; i < inputs.length; ++i) {
        const permutation = permute(
          inputs.slice(0, i).concat(inputs.slice(i + 1)),
        );
        const value = inputs[i] as T;
        if (permutation.length === 0) {
          results.push([value]);
          continue;
        }
        for (const part of permutation) {
          results.push([value].concat(part));
        }
      }
      return results;
    };

    it('should match querySelector* ordering', async () => {
      const {server, page} = await getTestState();
      await page.goto(`${server.PREFIX}/p-selectors.html`);
      for (const list of permute(['div', 'button', 'span'])) {
        const elements = await page.$$(
          list
            .map(selector => {
              return selector === 'button' ? '::-p-text(world)' : selector;
            })
            .join(','),
        );
        const actual = await Promise.all(
          elements.map(element => {
            return element.evaluate(element => {
              return element.id;
            });
          }),
        );
        assert.deepEqual(actual.join(), 'a,b,f,c');
      }
    });

    it('should not have duplicate elements from selector lists', async () => {
      const {server, page} = await getTestState();
      await page.goto(`${server.PREFIX}/p-selectors.html`);
      const elements = await page.$$('::-p-text(world), button');
      assert.lengthOf(elements, 1);
    });

    it('should handle escapes', async () => {
      const {server, page} = await getTestState();
      await page.goto(`${server.PREFIX}/p-selectors.html`);
      using element = await page.$(
        ':scope >>> ::-p-text(My name is Jun \\(pronounced like "June"\\))',
      );
      assert.ok(element);
      using element2 = await page.$(
        ':scope >>> ::-p-text("My name is Jun (pronounced like \\"June\\")")',
      );
      assert.ok(element2);
      using element3 = await page.$(
        ':scope >>> ::-p-text(My name is Jun \\(pronounced like "June"\\)")',
      );
      assert.notOk(element3);
      using element4 = await page.$(
        ':scope >>> ::-p-text("My name is Jun \\(pronounced like "June"\\))',
      );
      assert.notOk(element4);
    });
  });
});
