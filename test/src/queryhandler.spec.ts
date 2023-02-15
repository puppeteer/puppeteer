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

import {
  getTestState,
  setupTestBrowserHooks,
  setupTestPageAndContextHooks,
} from './mocha-utils.js';

describe('Query handler tests', function () {
  setupTestBrowserHooks();
  setupTestPageAndContextHooks();

  describe('Pierce selectors', function () {
    beforeEach(async () => {
      const {page} = getTestState();
      await page.setContent(
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
    });
    it('should find first element in shadow', async () => {
      const {page} = getTestState();
      const div = (await page.$('pierce/.foo')) as ElementHandle<HTMLElement>;
      const text = await div.evaluate(element => {
        return element.textContent;
      });
      expect(text).toBe('Hello');
    });
    it('should find all elements in shadow', async () => {
      const {page} = getTestState();
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
      const {page} = getTestState();
      const parentElement = (await page.$('html > div'))!;
      const childElement = (await parentElement.$(
        'pierce/div'
      )) as ElementHandle<HTMLElement>;
      const text = await childElement.evaluate(element => {
        return element.textContent;
      });
      expect(text).toBe('Hello');
    });
    it('should find all child elements', async () => {
      const {page} = getTestState();
      const parentElement = (await page.$('html > div'))!;
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
        const {page} = getTestState();

        await page.setContent('<section>test</section>');

        expect(await page.$('text/test')).toBeTruthy();
        expect((await page.$$('text/test')).length).toBe(1);
      });
      it('should return empty array for non-existing element', async () => {
        const {page} = getTestState();

        expect(await page.$('text/test')).toBeFalsy();
        expect((await page.$$('text/test')).length).toBe(0);
      });
      it('should return first element', async () => {
        const {page} = getTestState();

        await page.setContent('<div id="1">a</div><div>a</div>');

        const element = await page.$('text/a');
        expect(
          await element?.evaluate(e => {
            return e.id;
          })
        ).toBe('1');
      });
      it('should return multiple elements', async () => {
        const {page} = getTestState();

        await page.setContent('<div>a</div><div>a</div>');

        const elements = await page.$$('text/a');
        expect(elements.length).toBe(2);
      });
      it('should pierce shadow DOM', async () => {
        const {page} = getTestState();

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

        const element = await page.$('text/a');
        expect(
          await element?.evaluate(e => {
            return e.textContent;
          })
        ).toBe('a');
      });
      it('should query deeply nested text', async () => {
        const {page} = getTestState();

        await page.setContent('<div><div>a</div><div>b</div></div>');

        const element = await page.$('text/a');
        expect(
          await element?.evaluate(e => {
            return e.textContent;
          })
        ).toBe('a');
      });
      it('should query inputs', async () => {
        const {page} = getTestState();

        await page.setContent('<input value="a">');

        const element = (await page.$(
          'text/a'
        )) as ElementHandle<HTMLInputElement>;
        expect(
          await element?.evaluate(e => {
            return e.value;
          })
        ).toBe('a');
      });
      it('should not query radio', async () => {
        const {page} = getTestState();

        await page.setContent('<radio value="a">');

        expect(await page.$('text/a')).toBeNull();
      });
      it('should query text spanning multiple elements', async () => {
        const {page} = getTestState();

        await page.setContent('<div><span>a</span> <span>b</span><div>');

        const element = await page.$('text/a b');
        expect(
          await element?.evaluate(e => {
            return e.textContent;
          })
        ).toBe('a b');
      });
      it('should clear caches', async () => {
        const {page} = getTestState();

        await page.setContent(
          '<div id=target1>text</div><input id=target2 value=text><div id=target3>text</div>'
        );
        const div = (await page.$('#target1')) as ElementHandle<HTMLDivElement>;
        const input = (await page.$(
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
        const {page} = getTestState();

        await page.setContent('<div class="a"><span>a</span></div>');

        const elementHandle = (await page.$('div'))!;
        expect(await elementHandle.$(`text/a`)).toBeTruthy();
        expect((await elementHandle.$$(`text/a`)).length).toBe(1);
      });

      it('should return null for non-existing element', async () => {
        const {page} = getTestState();

        await page.setContent('<div class="a"></div>');

        const elementHandle = (await page.$('div'))!;
        expect(await elementHandle.$(`text/a`)).toBeFalsy();
        expect((await elementHandle.$$(`text/a`)).length).toBe(0);
      });
    });
  });

  describe('XPath selectors', function () {
    describe('in Page', function () {
      it('should query existing element', async () => {
        const {page} = getTestState();

        await page.setContent('<section>test</section>');

        expect(await page.$('xpath/html/body/section')).toBeTruthy();
        expect((await page.$$('xpath/html/body/section')).length).toBe(1);
      });
      it('should return empty array for non-existing element', async () => {
        const {page} = getTestState();

        expect(
          await page.$('xpath/html/body/non-existing-element')
        ).toBeFalsy();
        expect(
          (await page.$$('xpath/html/body/non-existing-element')).length
        ).toBe(0);
      });
      it('should return first element', async () => {
        const {page} = getTestState();

        await page.setContent('<div>a</div><div></div>');

        const element = await page.$('xpath/html/body/div');
        expect(
          await element?.evaluate(e => {
            return e.textContent === 'a';
          })
        ).toBeTruthy();
      });
      it('should return multiple elements', async () => {
        const {page} = getTestState();

        await page.setContent('<div></div><div></div>');

        const elements = await page.$$('xpath/html/body/div');
        expect(elements.length).toBe(2);
      });
    });
    describe('in ElementHandles', function () {
      it('should query existing element', async () => {
        const {page} = getTestState();

        await page.setContent('<div class="a">a<span></span></div>');

        const elementHandle = (await page.$('div'))!;
        expect(await elementHandle.$(`xpath/span`)).toBeTruthy();
        expect((await elementHandle.$$(`xpath/span`)).length).toBe(1);
      });

      it('should return null for non-existing element', async () => {
        const {page} = getTestState();

        await page.setContent('<div class="a">a</div>');

        const elementHandle = (await page.$('div'))!;
        expect(await elementHandle.$(`xpath/span`)).toBeFalsy();
        expect((await elementHandle.$$(`xpath/span`)).length).toBe(0);
      });
    });
  });

  describe('P selectors', () => {
    beforeEach(async () => {
      const {page} = getTestState();
      await page.setContent('<div>hello <button>world</button></div>');
    });

    it('should work with CSS selectors', async () => {
      const {page} = getTestState();
      const element = await page.$('div > button');
      assert(element, 'Could not find element');
      expect(
        await element.evaluate(element => {
          return element.tagName === 'BUTTON';
        })
      ).toBeTruthy();
    });

    it('should work with text selectors', async () => {
      const {page} = getTestState();
      const element = await page.$('div ::-p-text(world)');
      assert(element, 'Could not find element');
      expect(
        await element.evaluate(element => {
          return element.tagName === 'BUTTON';
        })
      ).toBeTruthy();
    });

    it('should work ARIA selectors', async () => {
      const {page} = getTestState();
      await page.setContent('<div>hello <button>world</button></div>');

      const element = await page.$('div ::-p-aria(world)');
      assert(element, 'Could not find element');
      expect(
        await element.evaluate(element => {
          return element.tagName === 'BUTTON';
        })
      ).toBeTruthy();
    });

    it('should work XPath selectors', async () => {
      const {page} = getTestState();
      await page.setContent('<div>hello <button>world</button></div>');

      const element = await page.$('div ::-p-xpath(//button)');
      assert(element, 'Could not find element');
      expect(
        await element.evaluate(element => {
          return element.tagName === 'BUTTON';
        })
      ).toBeTruthy();
    });

    it('should work with custom selectors', async () => {
      const {page} = getTestState();
      await page.setContent('<div>hello <button>world</button></div>');
      Puppeteer.clearCustomQueryHandlers();
      Puppeteer.registerCustomQueryHandler('div', {
        queryOne() {
          return document.querySelector('div');
        },
      });

      const element = await page.$('::-p-div()');
      assert(element, 'Could not find element');
      expect(
        await element.evaluate(element => {
          return element.tagName === 'DIV';
        })
      ).toBeTruthy();
    });

    it('should work with custom selectors with args', async () => {
      const {page} = getTestState();
      await page.setContent('<div>hello <button>world</button></div>');
      Puppeteer.clearCustomQueryHandlers();
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
        const element = await page.$('::-p-div(true)');
        assert(element, 'Could not find element');
        expect(
          await element.evaluate(element => {
            return element.tagName === 'DIV';
          })
        ).toBeTruthy();
      }
      {
        const element = await page.$('::-p-div("true")');
        assert(element, 'Could not find element');
        expect(
          await element.evaluate(element => {
            return element.tagName === 'DIV';
          })
        ).toBeTruthy();
      }
      {
        const element = await page.$("::-p-div('true')");
        assert(element, 'Could not find element');
        expect(
          await element.evaluate(element => {
            return element.tagName === 'DIV';
          })
        ).toBeTruthy();
      }
      {
        const element = await page.$('::-p-div()');
        assert(element, 'Could not find element');
        expect(
          await element.evaluate(element => {
            return element.tagName === 'BUTTON';
          })
        ).toBeTruthy();
      }
    });

    it('should work with :hover', async () => {
      const {page} = getTestState();
      await page.setContent('<div>hello <button>world</button></div>');

      let button = await page.$('div ::-p-text(world)');
      assert(button, 'Could not find element');
      await button.hover();
      await button.dispose();

      button = await page.$('div ::-p-text(world):hover');
      assert(button, 'Could not find element');
      const value = await button.evaluate(span => {
        return {textContent: span.textContent, tagName: span.tagName};
      });
      expect(value).toMatchObject({textContent: 'world', tagName: 'BUTTON'});
    });
  });
});
