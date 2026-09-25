/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {assert} from 'chai';
import {Puppeteer} from 'puppeteer';
import type {CustomQueryHandler} from 'puppeteer-core/internal/common/CustomQueryHandler.js';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';
import {html} from './utils.js';

describe('querySelector', function () {
  setupTestBrowserHooks();

  describe('Page.$eval', function () {
    it('should work', async () => {
      const {page} = await getTestState();

      await page.setContent(html`<section id="testAttribute">43543</section>`);
      const idAttribute = await page.$eval('section', e => {
        return e.id;
      });
      assert.strictEqual(idAttribute, 'testAttribute');
    });
    it('should accept arguments', async () => {
      const {page} = await getTestState();

      await page.setContent(html`<section>hello</section>`);
      const text = await page.$eval(
        'section',
        (e, suffix) => {
          return e.textContent! + suffix;
        },
        ' world!',
      );
      assert.strictEqual(text, 'hello world!');
    });
    it('should accept ElementHandles as arguments', async () => {
      const {page} = await getTestState();

      await page.setContent(html`<section>hello</section><div> world</div>`);
      using divHandle = (await page.$('div'))!;
      const text = await page.$eval(
        'section',
        (e, div) => {
          return e.textContent! + div.textContent!;
        },
        divHandle,
      );
      assert.strictEqual(text, 'hello world');
    });
    it('should throw error if no element is found', async () => {
      const {page} = await getTestState();

      let error!: Error;
      await page
        .$eval('section', e => {
          return e.id;
        })
        .catch(error_ => {
          return (error = error_);
        });
      assert.include(
        error.message,
        'failed to find element matching selector "section"',
      );
    });
  });

  // The tests for $$eval are repeated later in this file in the test group 'QueryAll'.
  // This is done to also test a query handler where QueryAll returns an Element[]
  // as opposed to NodeListOf<Element>.
  describe('Page.$$eval', function () {
    it('should work', async () => {
      const {page} = await getTestState();

      await page.setContent(
        html`<div>hello</div>
          <div>beautiful</div>
          <div>world!</div>`,
      );
      const divsCount = await page.$$eval('div', divs => {
        return divs.length;
      });
      assert.strictEqual(divsCount, 3);
    });
    it('should accept extra arguments', async () => {
      const {page} = await getTestState();
      await page.setContent(
        html`<div>hello</div>
          <div>beautiful</div>
          <div>world!</div>`,
      );
      const divsCountPlus5 = await page.$$eval(
        'div',
        (divs, two, three) => {
          return divs.length + (two as number) + (three as number);
        },
        2,
        3,
      );
      assert.strictEqual(divsCountPlus5, 8);
    });
    it('should accept ElementHandles as arguments', async () => {
      const {page} = await getTestState();
      await page.setContent(
        html`<section>2</section>
          <section>2</section>
          <section>1</section>
          <div>3</div>`,
      );
      using divHandle = (await page.$('div'))!;
      const sum = await page.$$eval(
        'section',
        (sections, div) => {
          return (
            sections.reduce((acc, section) => {
              return acc + Number(section.textContent);
            }, 0) + Number(div.textContent)
          );
        },
        divHandle,
      );
      assert.strictEqual(sum, 8);
    });
    it('should handle many elements', async function () {
      this.timeout(25_000);

      const {page} = await getTestState();
      await page.evaluate(
        `
        for (var i = 0; i <= 1000; i++) {
            const section = document.createElement('section');
            section.textContent = i;
            document.body.appendChild(section);
        }
        `,
      );
      const sum = await page.$$eval('section', sections => {
        return sections.reduce((acc, section) => {
          return acc + Number(section.textContent);
        }, 0);
      });
      assert.strictEqual(sum, 500500);
    });
  });

  describe('Page.$', function () {
    it('should query existing element', async () => {
      const {page} = await getTestState();

      await page.setContent(html`<section>test</section>`);
      using element = (await page.$('section'))!;
      assert.ok(element);
    });
    it('should return null for non-existing element', async () => {
      const {page} = await getTestState();

      using element = (await page.$('non-existing-element'))!;
      assert.isNull(element);
    });
  });

  describe('Page.$$', function () {
    it('should query existing elements', async () => {
      const {page} = await getTestState();

      await page.setContent(
        html`<div>A</div>
          <br />
          <div>B</div>`,
      );
      const elements = await page.$$('div');
      assert.lengthOf(elements, 2);
      const promises = elements.map(element => {
        return page.evaluate(e => {
          return e.textContent;
        }, element);
      });
      assert.deepEqual(await Promise.all(promises), ['A', 'B']);
    });

    it('should query existing elements without isolation', async () => {
      const {page} = await getTestState();

      await page.setContent(
        html`<div>A</div>
          <br />
          <div>B</div>`,
      );
      const elements = await page.$$('div', {
        isolate: false,
      });
      assert.lengthOf(elements, 2);
      const promises = elements.map(element => {
        return page.evaluate(e => {
          return e.textContent;
        }, element);
      });
      assert.deepEqual(await Promise.all(promises), ['A', 'B']);
    });

    it('should return empty array if nothing is found', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      const elements = await page.$$('div');
      assert.lengthOf(elements, 0);
    });

    describe('xpath', function () {
      it('should query existing element', async () => {
        const {page} = await getTestState();

        await page.setContent(html`<section>test</section>`);
        const elements = await page.$$('xpath/html/body/section');
        assert.ok(elements[0]);
        assert.lengthOf(elements, 1);
      });
      it('should return empty array for non-existing element', async () => {
        const {page} = await getTestState();

        const element = await page.$$('xpath/html/body/non-existing-element');
        assert.deepEqual(element, []);
      });
      it('should return multiple elements', async () => {
        const {page} = await getTestState();

        await page.setContent(html`<div></div> <div></div>`);
        const elements = await page.$$('xpath/html/body/div');
        assert.lengthOf(elements, 2);
      });
    });
  });

  describe('ElementHandle.$', function () {
    it('should query existing element', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/playground.html');
      await page.setContent(
        html`<html>
          <body>
            <div class="second"><div class="inner">A</div></div>
          </body>
        </html>`,
      );
      using htmlEl = (await page.$('html'))!;
      using second = (await htmlEl.$('.second'))!;
      using inner = await second.$('.inner');
      const content = await page.evaluate(e => {
        return e?.textContent;
      }, inner);
      assert.strictEqual(content, 'A');
    });

    it('should return null for non-existing element', async () => {
      const {page} = await getTestState();

      await page.setContent(
        html`<html>
          <body>
            <div class="second"><div class="inner">B</div></div>
          </body>
        </html>`,
      );
      using htmlEl = (await page.$('html'))!;
      using second = await htmlEl.$('.third');
      assert.isNull(second);
    });
  });
  describe('ElementHandle.$eval', function () {
    it('should work', async () => {
      const {page} = await getTestState();

      await page.setContent(
        html`<html>
          <body>
            <div class="tweet">
              <div class="like">100</div>
              <div class="retweets">10</div>
            </div>
          </body>
        </html>`,
      );
      using tweet = (await page.$('.tweet'))!;
      const content = await tweet.$eval('.like', node => {
        return (node as HTMLElement).innerText;
      });
      assert.strictEqual(content, '100');
    });

    it('should retrieve content from subtree', async () => {
      const {page} = await getTestState();

      const htmlContent =
        '<div class="a">not-a-child-div</div><div id="myId"><div class="a">a-child-div</div></div>';
      await page.setContent(html`${htmlContent}`);
      using elementHandle = (await page.$('#myId'))!;
      const content = await elementHandle.$eval('.a', node => {
        return (node as HTMLElement).innerText;
      });
      assert.strictEqual(content, 'a-child-div');
    });

    it('should throw in case of missing selector', async () => {
      const {page} = await getTestState();

      const htmlContent =
        '<div class="a">not-a-child-div</div><div id="myId"></div>';
      await page.setContent(html`${htmlContent}`);
      using elementHandle = (await page.$('#myId'))!;
      const errorMessage = await elementHandle
        .$eval('.a', node => {
          return (node as HTMLElement).innerText;
        })
        .catch(error => {
          return error.message;
        });
      assert.strictEqual(
        errorMessage,
        `Error: failed to find element matching selector ".a"`,
      );
    });
  });
  describe('ElementHandle.$$eval', function () {
    it('should work', async () => {
      const {page} = await getTestState();

      await page.setContent(
        html`<html>
          <body>
            <div class="tweet">
              <div class="like">100</div>
              <div class="like">10</div>
            </div>
          </body>
        </html>`,
      );
      using tweet = (await page.$('.tweet'))!;
      const content = await tweet.$$eval('.like', nodes => {
        return (nodes as HTMLElement[]).map(n => {
          return n.innerText;
        });
      });
      assert.deepEqual(content, ['100', '10']);
    });

    it('should retrieve content from subtree', async () => {
      const {page} = await getTestState();

      const htmlContent =
        '<div class="a">not-a-child-div</div><div id="myId"><div class="a">a1-child-div</div><div class="a">a2-child-div</div></div>';
      await page.setContent(html`${htmlContent}`);
      using elementHandle = (await page.$('#myId'))!;
      const content = await elementHandle.$$eval('.a', nodes => {
        return (nodes as HTMLElement[]).map(n => {
          return n.innerText;
        });
      });
      assert.deepEqual(content, ['a1-child-div', 'a2-child-div']);
    });

    it('should not throw in case of missing selector', async () => {
      const {page} = await getTestState();

      const htmlContent =
        '<div class="a">not-a-child-div</div><div id="myId"></div>';
      await page.setContent(html`${htmlContent}`);
      using elementHandle = (await page.$('#myId'))!;
      const nodesLength = await elementHandle.$$eval('.a', nodes => {
        return nodes.length;
      });
      assert.strictEqual(nodesLength, 0);
    });
  });

  describe('ElementHandle.$$', function () {
    it('should query existing elements', async () => {
      const {page} = await getTestState();

      await page.setContent(
        html`<html>
          <body>
            <div>A</div>
            <br />
            <div>B</div>
          </body>
        </html>`,
      );
      using htmlEl = (await page.$('html'))!;
      const elements = await htmlEl.$$('div');
      assert.lengthOf(elements, 2);
      const promises = elements.map(element => {
        return page.evaluate(e => {
          return e.textContent;
        }, element);
      });
      assert.deepEqual(await Promise.all(promises), ['A', 'B']);
    });

    it('should return empty array for non-existing elements', async () => {
      const {page} = await getTestState();

      await page.setContent(
        html`<html>
          <body>
            <span>A</span><br /><span>B</span>
          </body>
        </html>`,
      );
      using htmlEl = (await page.$('html'))!;
      const elements = await htmlEl.$$('div');
      assert.lengthOf(elements, 0);
    });

    describe('xpath', function () {
      it('should query existing element', async () => {
        const {page, server} = await getTestState();

        await page.goto(server.PREFIX + '/playground.html');
        await page.setContent(
          html`<html>
            <body>
              <div class="second"><div class="inner">A</div></div>
            </body>
          </html>`,
        );
        using htmlEl = (await page.$('html'))!;
        const second = await htmlEl.$$(
          `xpath/./body/div[contains(@class, 'second')]`,
        );
        const inner = await second[0]!.$$(
          `xpath/./div[contains(@class, 'inner')]`,
        );
        const content = await page.evaluate(e => {
          return e.textContent;
        }, inner[0]!);
        assert.strictEqual(content, 'A');
      });

      it('should return null for non-existing element', async () => {
        const {page} = await getTestState();

        await page.setContent(
          html`<html>
            <body>
              <div class="second"><div class="inner">B</div></div>
            </body>
          </html>`,
        );
        using htmlEl = (await page.$('html'))!;
        const second = await htmlEl.$$(`xpath/div[contains(@class, 'third')]`);
        assert.deepEqual(second, []);
      });
    });
  });
  // This is the same tests for `$$eval` and `$$` as above, but with a queryAll
  // handler that returns an array instead of a list of nodes.
  describe('QueryAll', function () {
    const handler: CustomQueryHandler = {
      queryAll: (element, selector) => {
        return [...(element as Element).querySelectorAll(selector)];
      },
    };
    before(() => {
      Puppeteer.registerCustomQueryHandler('allArray', handler);
    });

    it('should have registered handler', async () => {
      assert.ok(Puppeteer.customQueryHandlerNames().includes('allArray'));
    });
    it('$$ should query existing elements', async () => {
      const {page} = await getTestState();

      await page.setContent(
        html`<html>
          <body>
            <div>A</div>
            <br />
            <div>B</div>
          </body>
        </html>`,
      );
      using htmlEl = (await page.$('html'))!;
      const elements = await htmlEl.$$('allArray/div');
      assert.lengthOf(elements, 2);
      const promises = elements.map(element => {
        return page.evaluate(e => {
          return e.textContent;
        }, element);
      });
      assert.deepEqual(await Promise.all(promises), ['A', 'B']);
    });

    it('$$ should return empty array for non-existing elements', async () => {
      const {page} = await getTestState();

      await page.setContent(
        html`<html>
          <body>
            <span>A</span><br /><span>B</span>
          </body>
        </html>`,
      );
      using htmlEl = (await page.$('html'))!;
      const elements = await htmlEl.$$('allArray/div');
      assert.lengthOf(elements, 0);
    });
    it('$$eval should work', async () => {
      const {page} = await getTestState();

      await page.setContent(
        html`<div>hello</div>
          <div>beautiful</div>
          <div>world!</div>`,
      );
      const divsCount = await page.$$eval('allArray/div', divs => {
        return divs.length;
      });
      assert.strictEqual(divsCount, 3);
    });
    it('$$eval should accept extra arguments', async () => {
      const {page} = await getTestState();
      await page.setContent(
        html`<div>hello</div>
          <div>beautiful</div>
          <div>world!</div>`,
      );
      const divsCountPlus5 = await page.$$eval(
        'allArray/div',
        (divs, two, three) => {
          return divs.length + (two as number) + (three as number);
        },
        2,
        3,
      );
      assert.strictEqual(divsCountPlus5, 8);
    });
    it('$$eval should accept ElementHandles as arguments', async () => {
      const {page} = await getTestState();
      await page.setContent(
        html`<section>2</section>
          <section>2</section>
          <section>1</section>
          <div>3</div>`,
      );
      using divHandle = (await page.$('div'))!;
      const sum = await page.$$eval(
        'allArray/section',
        (sections, div) => {
          return (
            sections.reduce((acc, section) => {
              return acc + Number(section.textContent);
            }, 0) + Number(div.textContent)
          );
        },
        divHandle,
      );
      assert.strictEqual(sum, 8);
    });
    it('$$eval should handle many elements', async function () {
      this.timeout(25_000);

      const {page} = await getTestState();
      await page.evaluate(
        `
        for (var i = 0; i <= 1000; i++) {
            const section = document.createElement('section');
            section.textContent = i;
            document.body.appendChild(section);
        }
        `,
      );
      const sum = await page.$$eval('allArray/section', sections => {
        return sections.reduce((acc, section) => {
          return acc + Number(section.textContent);
        }, 0);
      });
      assert.strictEqual(sum, 500500);
    });
  });
});
