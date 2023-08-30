/**
 * Copyright 2018 Google Inc. All rights reserved.
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
import assert from 'assert';

import expect from 'expect';
import {Puppeteer} from 'puppeteer-core';
import {ElementHandle} from 'puppeteer-core/internal/api/ElementHandle.js';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';

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
         </script>`
      );
      return state;
    }
    it('should find first element in shadow', async () => {
      const {page} = await setUpPage();
      using div = (await page.$('pierce/.foo')) as ElementHandle<HTMLElement>;
      const text = await div.evaluate(element => {
        return element.textContent;
      });
      expect(text).toBe('Hello');
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
        })
      );
      expect(text.join(' ')).toBe('Hello World');
    });
    it('should find first child element', async () => {
      const {page} = await setUpPage();
      using parentElement = (await page.$('html > div'))!;
      using childElement = (await parentElement.$(
        'pierce/div'
      )) as ElementHandle<HTMLElement>;
      const text = await childElement.evaluate(element => {
        return element.textContent;
      });
      expect(text).toBe('Hello');
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
        })
      );
      expect(text.join(' ')).toBe('Hello World');
    });
  });

  describe('Text selectors', function () {
    describe('in Page', function () {
      it('should query existing element', async () => {
        const {page} = await getTestState();

        await page.setContent('<section>test</section>');

        expect(await page.$('text/test')).toBeTruthy();
        expect(await page.$$('text/test')).toHaveLength(1);
      });
      it('should return empty array for non-existing element', async () => {
        const {page} = await getTestState();

        expect(await page.$('text/test')).toBeFalsy();
        expect(await page.$$('text/test')).toHaveLength(0);
      });
      it('should return first element', async () => {
        const {page} = await getTestState();

        await page.setContent('<div id="1">a</div><div>a</div>');

        using element = await page.$('text/a');
        expect(
          await element?.evaluate(e => {
            return e.id;
          })
        ).toBe('1');
      });
      it('should return multiple elements', async () => {
        const {page} = await getTestState();

        await page.setContent('<div>a</div><div>a</div>');

        const elements = await page.$$('text/a');
        expect(elements).toHaveLength(2);
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
        expect(
          await element?.evaluate(e => {
            return e.textContent;
          })
        ).toBe('a');
      });
      it('should query deeply nested text', async () => {
        const {page} = await getTestState();

        await page.setContent('<div><div>a</div><div>b</div></div>');

        using element = await page.$('text/a');
        expect(
          await element?.evaluate(e => {
            return e.textContent;
          })
        ).toBe('a');
      });
      it('should query inputs', async () => {
        const {page} = await getTestState();

        await page.setContent('<input value="a">');

        using element = (await page.$(
          'text/a'
        )) as ElementHandle<HTMLInputElement>;
        expect(
          await element?.evaluate(e => {
            return e.value;
          })
        ).toBe('a');
      });
      it('should not query radio', async () => {
        const {page} = await getTestState();

        await page.setContent('<radio value="a">');

        expect(await page.$('text/a')).toBeNull();
      });
      it('should query text spanning multiple elements', async () => {
        const {page} = await getTestState();

        await page.setContent('<div><span>a</span> <span>b</span><div>');

        using element = await page.$('text/a b');
        expect(
          await element?.evaluate(e => {
            return e.textContent;
          })
        ).toBe('a b');
      });
      it('should clear caches', async () => {
        const {page} = await getTestState();

        await page.setContent(
          '<div id=target1>text</div><input id=target2 value=text><div id=target3>text</div>'
        );
        using div = (await page.$('#target1')) as ElementHandle<HTMLDivElement>;
        using input = (await page.$(
          '#target2'
        )) as ElementHandle<HTMLInputElement>;

        await div.evaluate(div => {
          div.textContent = 'text';
        });
        expect(
          await page.$eval(`text/text`, e => {
            return e.id;
          })
        ).toBe('target1');
        await div.evaluate(div => {
          div.textContent = 'foo';
        });
        expect(
          await page.$eval(`text/text`, e => {
            return e.id;
          })
        ).toBe('target2');
        await input.evaluate(input => {
          input.value = '';
        });
        await input.type('foo');
        expect(
          await page.$eval(`text/text`, e => {
            return e.id;
          })
        ).toBe('target3');

        await div.evaluate(div => {
          div.textContent = 'text';
        });
        await input.evaluate(input => {
          input.value = '';
        });
        await input.type('text');
        expect(
          await page.$$eval(`text/text`, es => {
            return es.length;
          })
        ).toBe(3);
        await div.evaluate(div => {
          div.textContent = 'foo';
        });
        expect(
          await page.$$eval(`text/text`, es => {
            return es.length;
          })
        ).toBe(2);
        await input.evaluate(input => {
          input.value = '';
        });
        await input.type('foo');
        expect(
          await page.$$eval(`text/text`, es => {
            return es.length;
          })
        ).toBe(1);
      });
    });
    describe('in ElementHandles', function () {
      it('should query existing element', async () => {
        const {page} = await getTestState();

        await page.setContent('<div class="a"><span>a</span></div>');

        using elementHandle = (await page.$('div'))!;
        expect(await elementHandle.$(`text/a`)).toBeTruthy();
        expect(await elementHandle.$$(`text/a`)).toHaveLength(1);
      });

      it('should return null for non-existing element', async () => {
        const {page} = await getTestState();

        await page.setContent('<div class="a"></div>');

        using elementHandle = (await page.$('div'))!;
        expect(await elementHandle.$(`text/a`)).toBeFalsy();
        expect(await elementHandle.$$(`text/a`)).toHaveLength(0);
      });
    });
  });

  describe('XPath selectors', function () {
    describe('in Page', function () {
      it('should query existing element', async () => {
        const {page} = await getTestState();

        await page.setContent('<section>test</section>');

        expect(await page.$('xpath/html/body/section')).toBeTruthy();
        expect(await page.$$('xpath/html/body/section')).toHaveLength(1);
      });
      it('should return empty array for non-existing element', async () => {
        const {page} = await getTestState();

        expect(
          await page.$('xpath/html/body/non-existing-element')
        ).toBeFalsy();
        expect(
          await page.$$('xpath/html/body/non-existing-element')
        ).toHaveLength(0);
      });
      it('should return first element', async () => {
        const {page} = await getTestState();

        await page.setContent('<div>a</div><div></div>');

        using element = await page.$('xpath/html/body/div');
        expect(
          await element?.evaluate(e => {
            return e.textContent === 'a';
          })
        ).toBeTruthy();
      });
      it('should return multiple elements', async () => {
        const {page} = await getTestState();

        await page.setContent('<div></div><div></div>');

        const elements = await page.$$('xpath/html/body/div');
        expect(elements).toHaveLength(2);
      });
    });
    describe('in ElementHandles', function () {
      it('should query existing element', async () => {
        const {page} = await getTestState();

        await page.setContent('<div class="a">a<span></span></div>');

        using elementHandle = (await page.$('div'))!;
        expect(await elementHandle.$(`xpath/span`)).toBeTruthy();
        expect(await elementHandle.$$(`xpath/span`)).toHaveLength(1);
      });

      it('should return null for non-existing element', async () => {
        const {page} = await getTestState();

        await page.setContent('<div class="a">a</div>');

        using elementHandle = (await page.$('div'))!;
        expect(await elementHandle.$(`xpath/span`)).toBeFalsy();
        expect(await elementHandle.$$(`xpath/span`)).toHaveLength(0);
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
      expect(
        await element.evaluate(element => {
          return element.id === 'b';
        })
      ).toBeTruthy();

      // Should parse more complex CSS selectors. Listing a few problematic
      // cases from bug reports.
      for (const selector of [
        '.user_row[data-user-id="\\38 "]:not(.deactivated_user)',
        `input[value='Search']:not([class='hidden'])`,
        `[data-test-id^="test-"]:not([data-test-id^="test-foo"])`,
      ]) {
        await page.$$(selector);
      }
    });

    it('should work with deep combinators', async () => {
      const {server, page} = await getTestState();
      await page.goto(`${server.PREFIX}/p-selectors.html`);
      {
        using element = await page.$('div >>>> div');
        assert(element, 'Could not find element');
        expect(
          await element.evaluate(element => {
            return element.id === 'c';
          })
        ).toBeTruthy();
      }
      {
        const elements = await page.$$('div >>> div');
        assert(elements[1], 'Could not find element');
        expect(
          await elements[1]?.evaluate(element => {
            return element.id === 'd';
          })
        ).toBeTruthy();
      }
      {
        const elements = await page.$$('#c >>>> div');
        assert(elements[0], 'Could not find element');
        expect(
          await elements[0]?.evaluate(element => {
            return element.id === 'd';
          })
        ).toBeTruthy();
      }
      {
        const elements = await page.$$('#c >>> div');
        assert(elements[0], 'Could not find element');
        expect(
          await elements[0]?.evaluate(element => {
            return element.id === 'd';
          })
        ).toBeTruthy();
      }
    });

    it('should work with text selectors', async () => {
      const {server, page} = await getTestState();
      await page.goto(`${server.PREFIX}/p-selectors.html`);
      using element = await page.$('div ::-p-text(world)');
      assert(element, 'Could not find element');
      expect(
        await element.evaluate(element => {
          return element.id === 'b';
        })
      ).toBeTruthy();
    });

    it('should work ARIA selectors', async () => {
      const {server, page} = await getTestState();
      await page.goto(`${server.PREFIX}/p-selectors.html`);
      using element = await page.$('div ::-p-aria(world)');
      assert(element, 'Could not find element');
      expect(
        await element.evaluate(element => {
          return element.id === 'b';
        })
      ).toBeTruthy();
    });

    it('should work for ARIA selectors in multiple isolated worlds', async () => {
      const {server, page} = await getTestState();
      await page.goto(`${server.PREFIX}/p-selectors.html`);
      using element = await page.waitForSelector('::-p-aria(world)');
      assert(element, 'Could not find element');
      expect(
        await element.evaluate(element => {
          return element.id === 'b';
        })
      ).toBeTruthy();
      // $ would add ARIA query handler to the main world.
      await element.$('::-p-aria(world)');
      using element2 = await page.waitForSelector('::-p-aria(world)');
      assert(element2, 'Could not find element');
      expect(
        await element2.evaluate(element => {
          return element.id === 'b';
        })
      ).toBeTruthy();
    });

    it('should work ARIA selectors with role', async () => {
      const {server, page} = await getTestState();
      await page.goto(`${server.PREFIX}/p-selectors.html`);
      using element = await page.$('::-p-aria(world[role="button"])');
      assert(element, 'Could not find element');
      expect(
        await element.evaluate(element => {
          return element.id === 'b';
        })
      ).toBeTruthy();
    });

    it('should work ARIA selectors with name and role', async () => {
      const {server, page} = await getTestState();
      await page.goto(`${server.PREFIX}/p-selectors.html`);
      using element = await page.$('::-p-aria([name="world"][role="button"])');
      assert(element, 'Could not find element');
      expect(
        await element.evaluate(element => {
          return element.id === 'b';
        })
      ).toBeTruthy();
    });

    it('should work XPath selectors', async () => {
      const {server, page} = await getTestState();
      await page.goto(`${server.PREFIX}/p-selectors.html`);
      using element = await page.$('div ::-p-xpath(//button)');
      assert(element, 'Could not find element');
      expect(
        await element.evaluate(element => {
          return element.id === 'b';
        })
      ).toBeTruthy();
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
      expect(
        await element.evaluate(element => {
          return element.id === 'a';
        })
      ).toBeTruthy();
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
        expect(
          await element.evaluate(element => {
            return element.id === 'a';
          })
        ).toBeTruthy();
      }
      {
        using element = await page.$('::-p-div("true")');
        assert(element, 'Could not find element');
        expect(
          await element.evaluate(element => {
            return element.id === 'a';
          })
        ).toBeTruthy();
      }
      {
        using element = await page.$("::-p-div('true')");
        assert(element, 'Could not find element');
        expect(
          await element.evaluate(element => {
            return element.id === 'a';
          })
        ).toBeTruthy();
      }
      {
        using element = await page.$('::-p-div');
        assert(element, 'Could not find element');
        expect(
          await element.evaluate(element => {
            return element.id === 'b';
          })
        ).toBeTruthy();
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
      expect(value).toMatchObject({textContent: 'world', tagName: 'BUTTON'});
    });

    it('should work with selector lists', async () => {
      const {server, page} = await getTestState();
      await page.goto(`${server.PREFIX}/p-selectors.html`);
      const elements = await page.$$('div, ::-p-text(world)');
      expect(elements).toHaveLength(3);
    });

    const permute = <T>(inputs: T[]): T[][] => {
      const results: T[][] = [];
      for (let i = 0; i < inputs.length; ++i) {
        const permutation = permute(
          inputs.slice(0, i).concat(inputs.slice(i + 1))
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
            .join(',')
        );
        const actual = await Promise.all(
          elements.map(element => {
            return element.evaluate(element => {
              return element.id;
            });
          })
        );
        expect(actual.join()).toStrictEqual('a,b,f,c');
      }
    });

    it('should not have duplicate elements from selector lists', async () => {
      const {server, page} = await getTestState();
      await page.goto(`${server.PREFIX}/p-selectors.html`);
      const elements = await page.$$('::-p-text(world), button');
      expect(elements).toHaveLength(1);
    });

    it('should handle escapes', async () => {
      const {server, page} = await getTestState();
      await page.goto(`${server.PREFIX}/p-selectors.html`);
      using element = await page.$(
        ':scope >>> ::-p-text(My name is Jun \\(pronounced like "June"\\))'
      );
      expect(element).toBeTruthy();
      using element2 = await page.$(
        ':scope >>> ::-p-text("My name is Jun (pronounced like \\"June\\")")'
      );
      expect(element2).toBeTruthy();
      using element3 = await page.$(
        ':scope >>> ::-p-text(My name is Jun \\(pronounced like "June"\\)")'
      );
      expect(element3).toBeFalsy();
      using element4 = await page.$(
        ':scope >>> ::-p-text("My name is Jun \\(pronounced like "June"\\))'
      );
      expect(element4).toBeFalsy();
    });
  });
});
