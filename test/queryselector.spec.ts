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
import {
  getTestState,
  setupTestBrowserHooks,
  setupTestPageAndContextHooks,
} from './mocha-utils'; // eslint-disable-line import/extensions
import { CustomQueryHandler } from '../lib/cjs/puppeteer/common/QueryHandler.js';

describe('querySelector', function () {
  setupTestBrowserHooks();
  setupTestPageAndContextHooks();
  describe('Page.$eval', function () {
    it('should work', async () => {
      const { page } = getTestState();

      await page.setContent('<section id="testAttribute">43543</section>');
      const idAttribute = await page.$eval('section', (e) => e.id);
      expect(idAttribute).toBe('testAttribute');
    });
    it('should accept arguments', async () => {
      const { page } = getTestState();

      await page.setContent('<section>hello</section>');
      const text = await page.$eval(
        'section',
        (e, suffix) => e.textContent + suffix,
        ' world!'
      );
      expect(text).toBe('hello world!');
    });
    it('should accept ElementHandles as arguments', async () => {
      const { page } = getTestState();

      await page.setContent('<section>hello</section><div> world</div>');
      const divHandle = await page.$('div');
      const text = await page.$eval(
        'section',
        (e, div: HTMLElement) => e.textContent + div.textContent,
        divHandle
      );
      expect(text).toBe('hello world');
    });
    it('should throw error if no element is found', async () => {
      const { page } = getTestState();

      let error = null;
      await page
        .$eval('section', (e) => e.id)
        .catch((error_) => (error = error_));
      expect(error.message).toContain(
        'failed to find element matching selector "section"'
      );
    });
  });

  describe('pierceHandler', function () {
    beforeEach(async () => {
      const { page } = getTestState();
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
      const { page } = getTestState();
      const div = await page.$('pierce/.foo');
      const text = await div.evaluate(
        (element: Element) => element.textContent
      );
      expect(text).toBe('Hello');
    });
    it('should find all elements in shadow', async () => {
      const { page } = getTestState();
      const divs = await page.$$('pierce/.foo');
      const text = await Promise.all(
        divs.map((div) =>
          div.evaluate((element: Element) => element.textContent)
        )
      );
      expect(text.join(' ')).toBe('Hello World');
    });
  });

  // The tests for $$eval are repeated later in this file in the test group 'QueryAll'.
  // This is done to also test a query handler where QueryAll returns an Element[]
  // as opposed to NodeListOf<Element>.
  describe('Page.$$eval', function () {
    it('should work', async () => {
      const { page } = getTestState();

      await page.setContent(
        '<div>hello</div><div>beautiful</div><div>world!</div>'
      );
      const divsCount = await page.$$eval('div', (divs) => divs.length);
      expect(divsCount).toBe(3);
    });
    it('should accept extra arguments', async () => {
      const { page } = getTestState();
      await page.setContent(
        '<div>hello</div><div>beautiful</div><div>world!</div>'
      );
      const divsCountPlus5 = await page.$$eval(
        'div',
        (divs, two: number, three: number) => divs.length + two + three,
        2,
        3
      );
      expect(divsCountPlus5).toBe(8);
    });
    it('should accept ElementHandles as arguments', async () => {
      const { page } = getTestState();
      await page.setContent(
        '<section>2</section><section>2</section><section>1</section><div>3</div>'
      );
      const divHandle = await page.$('div');
      const sum = await page.$$eval(
        'section',
        (sections, div: HTMLElement) =>
          sections.reduce(
            (acc, section) => acc + Number(section.textContent),
            0
          ) + Number(div.textContent),
        divHandle
      );
      expect(sum).toBe(8);
    });
    it('should handle many elements', async () => {
      const { page } = getTestState();
      await page.evaluate(
        `
        for (var i = 0; i <= 1000; i++) {
            const section = document.createElement('section');
            section.textContent = i;
            document.body.appendChild(section);
        }
        `
      );
      const sum = await page.$$eval('section', (sections) =>
        sections.reduce((acc, section) => acc + Number(section.textContent), 0)
      );
      expect(sum).toBe(500500);
    });
  });

  describe('Page.$', function () {
    it('should query existing element', async () => {
      const { page } = getTestState();

      await page.setContent('<section>test</section>');
      const element = await page.$('section');
      expect(element).toBeTruthy();
    });
    it('should return null for non-existing element', async () => {
      const { page } = getTestState();

      const element = await page.$('non-existing-element');
      expect(element).toBe(null);
    });
  });

  describe('Page.$$', function () {
    it('should query existing elements', async () => {
      const { page } = getTestState();

      await page.setContent('<div>A</div><br/><div>B</div>');
      const elements = await page.$$('div');
      expect(elements.length).toBe(2);
      const promises = elements.map((element) =>
        page.evaluate((e: HTMLElement) => e.textContent, element)
      );
      expect(await Promise.all(promises)).toEqual(['A', 'B']);
    });
    it('should return empty array if nothing is found', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const elements = await page.$$('div');
      expect(elements.length).toBe(0);
    });
  });

  describe('Path.$x', function () {
    it('should query existing element', async () => {
      const { page } = getTestState();

      await page.setContent('<section>test</section>');
      const elements = await page.$x('/html/body/section');
      expect(elements[0]).toBeTruthy();
      expect(elements.length).toBe(1);
    });
    it('should return empty array for non-existing element', async () => {
      const { page } = getTestState();

      const element = await page.$x('/html/body/non-existing-element');
      expect(element).toEqual([]);
    });
    it('should return multiple elements', async () => {
      const { page } = getTestState();

      await page.setContent('<div></div><div></div>');
      const elements = await page.$x('/html/body/div');
      expect(elements.length).toBe(2);
    });
  });

  describe('ElementHandle.$', function () {
    it('should query existing element', async () => {
      const { page, server } = getTestState();

      await page.goto(server.PREFIX + '/playground.html');
      await page.setContent(
        '<html><body><div class="second"><div class="inner">A</div></div></body></html>'
      );
      const html = await page.$('html');
      const second = await html.$('.second');
      const inner = await second.$('.inner');
      const content = await page.evaluate(
        (e: HTMLElement) => e.textContent,
        inner
      );
      expect(content).toBe('A');
    });

    it('should return null for non-existing element', async () => {
      const { page } = getTestState();

      await page.setContent(
        '<html><body><div class="second"><div class="inner">B</div></div></body></html>'
      );
      const html = await page.$('html');
      const second = await html.$('.third');
      expect(second).toBe(null);
    });
  });
  describe('ElementHandle.$eval', function () {
    it('should work', async () => {
      const { page } = getTestState();

      await page.setContent(
        '<html><body><div class="tweet"><div class="like">100</div><div class="retweets">10</div></div></body></html>'
      );
      const tweet = await page.$('.tweet');
      const content = await tweet.$eval(
        '.like',
        (node: HTMLElement) => node.innerText
      );
      expect(content).toBe('100');
    });

    it('should retrieve content from subtree', async () => {
      const { page } = getTestState();

      const htmlContent =
        '<div class="a">not-a-child-div</div><div id="myId"><div class="a">a-child-div</div></div>';
      await page.setContent(htmlContent);
      const elementHandle = await page.$('#myId');
      const content = await elementHandle.$eval(
        '.a',
        (node: HTMLElement) => node.innerText
      );
      expect(content).toBe('a-child-div');
    });

    it('should throw in case of missing selector', async () => {
      const { page } = getTestState();

      const htmlContent =
        '<div class="a">not-a-child-div</div><div id="myId"></div>';
      await page.setContent(htmlContent);
      const elementHandle = await page.$('#myId');
      const errorMessage = await elementHandle
        .$eval('.a', (node: HTMLElement) => node.innerText)
        .catch((error) => error.message);
      expect(errorMessage).toBe(
        `Error: failed to find element matching selector ".a"`
      );
    });
  });
  describe('ElementHandle.$$eval', function () {
    it('should work', async () => {
      const { page } = getTestState();

      await page.setContent(
        '<html><body><div class="tweet"><div class="like">100</div><div class="like">10</div></div></body></html>'
      );
      const tweet = await page.$('.tweet');
      const content = await tweet.$$eval('.like', (nodes: HTMLElement[]) =>
        nodes.map((n) => n.innerText)
      );
      expect(content).toEqual(['100', '10']);
    });

    it('should retrieve content from subtree', async () => {
      const { page } = getTestState();

      const htmlContent =
        '<div class="a">not-a-child-div</div><div id="myId"><div class="a">a1-child-div</div><div class="a">a2-child-div</div></div>';
      await page.setContent(htmlContent);
      const elementHandle = await page.$('#myId');
      const content = await elementHandle.$$eval('.a', (nodes: HTMLElement[]) =>
        nodes.map((n) => n.innerText)
      );
      expect(content).toEqual(['a1-child-div', 'a2-child-div']);
    });

    it('should not throw in case of missing selector', async () => {
      const { page } = getTestState();

      const htmlContent =
        '<div class="a">not-a-child-div</div><div id="myId"></div>';
      await page.setContent(htmlContent);
      const elementHandle = await page.$('#myId');
      const nodesLength = await elementHandle.$$eval(
        '.a',
        (nodes) => nodes.length
      );
      expect(nodesLength).toBe(0);
    });
  });

  describe('ElementHandle.$$', function () {
    it('should query existing elements', async () => {
      const { page } = getTestState();

      await page.setContent(
        '<html><body><div>A</div><br/><div>B</div></body></html>'
      );
      const html = await page.$('html');
      const elements = await html.$$('div');
      expect(elements.length).toBe(2);
      const promises = elements.map((element) =>
        page.evaluate((e: HTMLElement) => e.textContent, element)
      );
      expect(await Promise.all(promises)).toEqual(['A', 'B']);
    });

    it('should return empty array for non-existing elements', async () => {
      const { page } = getTestState();

      await page.setContent(
        '<html><body><span>A</span><br/><span>B</span></body></html>'
      );
      const html = await page.$('html');
      const elements = await html.$$('div');
      expect(elements.length).toBe(0);
    });
  });

  describe('ElementHandle.$x', function () {
    it('should query existing element', async () => {
      const { page, server } = getTestState();

      await page.goto(server.PREFIX + '/playground.html');
      await page.setContent(
        '<html><body><div class="second"><div class="inner">A</div></div></body></html>'
      );
      const html = await page.$('html');
      const second = await html.$x(`./body/div[contains(@class, 'second')]`);
      const inner = await second[0].$x(`./div[contains(@class, 'inner')]`);
      const content = await page.evaluate(
        (e: HTMLElement) => e.textContent,
        inner[0]
      );
      expect(content).toBe('A');
    });

    it('should return null for non-existing element', async () => {
      const { page } = getTestState();

      await page.setContent(
        '<html><body><div class="second"><div class="inner">B</div></div></body></html>'
      );
      const html = await page.$('html');
      const second = await html.$x(`/div[contains(@class, 'third')]`);
      expect(second).toEqual([]);
    });
  });

  // This is the same tests for `$$eval` and `$$` as above, but with a queryAll
  // handler that returns an array instead of a list of nodes.
  describe('QueryAll', function () {
    const handler: CustomQueryHandler = {
      queryAll: (element: Element, selector: string) =>
        Array.from(element.querySelectorAll(selector)),
    };
    before(() => {
      const { puppeteer } = getTestState();
      puppeteer.registerCustomQueryHandler('allArray', handler);
    });

    it('should have registered handler', async () => {
      const { puppeteer } = getTestState();
      expect(
        puppeteer.customQueryHandlerNames().includes('allArray')
      ).toBeTruthy();
    });
    it('$$ should query existing elements', async () => {
      const { page } = getTestState();

      await page.setContent(
        '<html><body><div>A</div><br/><div>B</div></body></html>'
      );
      const html = await page.$('html');
      const elements = await html.$$('allArray/div');
      expect(elements.length).toBe(2);
      const promises = elements.map((element) =>
        page.evaluate((e: HTMLElement) => e.textContent, element)
      );
      expect(await Promise.all(promises)).toEqual(['A', 'B']);
    });

    it('$$ should return empty array for non-existing elements', async () => {
      const { page } = getTestState();

      await page.setContent(
        '<html><body><span>A</span><br/><span>B</span></body></html>'
      );
      const html = await page.$('html');
      const elements = await html.$$('allArray/div');
      expect(elements.length).toBe(0);
    });
    it('$$eval should work', async () => {
      const { page } = getTestState();

      await page.setContent(
        '<div>hello</div><div>beautiful</div><div>world!</div>'
      );
      const divsCount = await page.$$eval(
        'allArray/div',
        (divs) => divs.length
      );
      expect(divsCount).toBe(3);
    });
    it('$$eval should accept extra arguments', async () => {
      const { page } = getTestState();
      await page.setContent(
        '<div>hello</div><div>beautiful</div><div>world!</div>'
      );
      const divsCountPlus5 = await page.$$eval(
        'allArray/div',
        (divs, two: number, three: number) => divs.length + two + three,
        2,
        3
      );
      expect(divsCountPlus5).toBe(8);
    });
    it('$$eval should accept ElementHandles as arguments', async () => {
      const { page } = getTestState();
      await page.setContent(
        '<section>2</section><section>2</section><section>1</section><div>3</div>'
      );
      const divHandle = await page.$('div');
      const sum = await page.$$eval(
        'allArray/section',
        (sections, div: HTMLElement) =>
          sections.reduce(
            (acc, section) => acc + Number(section.textContent),
            0
          ) + Number(div.textContent),
        divHandle
      );
      expect(sum).toBe(8);
    });
    it('$$eval should handle many elements', async () => {
      const { page } = getTestState();
      await page.evaluate(
        `
        for (var i = 0; i <= 1000; i++) {
            const section = document.createElement('section');
            section.textContent = i;
            document.body.appendChild(section);
        }
        `
      );
      const sum = await page.$$eval('allArray/section', (sections) =>
        sections.reduce((acc, section) => acc + Number(section.textContent), 0)
      );
      expect(sum).toBe(500500);
    });
  });
});
