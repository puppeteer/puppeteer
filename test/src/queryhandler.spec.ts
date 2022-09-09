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
import expect from 'expect';
import {ElementHandle} from '../../lib/cjs/puppeteer/common/ElementHandle.js';
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
});
