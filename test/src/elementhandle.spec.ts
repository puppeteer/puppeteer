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
import sinon from 'sinon';
import {ElementHandle} from '../../lib/cjs/puppeteer/common/ElementHandle.js';
import {
  getTestState,
  setupTestBrowserHooks,
  setupTestPageAndContextHooks,
} from './mocha-utils.js';

import utils from './utils.js';

describe('ElementHandle specs', function () {
  setupTestBrowserHooks();
  setupTestPageAndContextHooks();

  describe('ElementHandle.boundingBox', function () {
    it('should work', async () => {
      const {page, server} = getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.goto(server.PREFIX + '/grid.html');
      const elementHandle = (await page.$('.box:nth-of-type(13)'))!;
      const box = await elementHandle.boundingBox();
      expect(box).toEqual({x: 100, y: 50, width: 50, height: 50});
    });
    it('should handle nested frames', async () => {
      const {page, server, isChrome} = getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.goto(server.PREFIX + '/frames/nested-frames.html');
      const nestedFrame = page.frames()[1]!.childFrames()[1]!;
      const elementHandle = (await nestedFrame.$('div'))!;
      const box = await elementHandle.boundingBox();
      if (isChrome) {
        expect(box).toEqual({x: 28, y: 182, width: 264, height: 18});
      } else {
        expect(box).toEqual({x: 28, y: 182, width: 254, height: 18});
      }
    });
    it('should return null for invisible elements', async () => {
      const {page} = getTestState();

      await page.setContent('<div style="display:none">hi</div>');
      const element = (await page.$('div'))!;
      expect(await element.boundingBox()).toBe(null);
    });
    it('should force a layout', async () => {
      const {page} = getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.setContent(
        '<div style="width: 100px; height: 100px">hello</div>'
      );
      const elementHandle = (await page.$('div'))!;
      await page.evaluate((element: HTMLElement) => {
        return (element.style.height = '200px');
      }, elementHandle);
      const box = await elementHandle.boundingBox();
      expect(box).toEqual({x: 8, y: 8, width: 100, height: 200});
    });
    it('should work with SVG nodes', async () => {
      const {page} = getTestState();

      await page.setContent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="500" height="500">
          <rect id="theRect" x="30" y="50" width="200" height="300"></rect>
        </svg>
      `);
      const element = (await page.$(
        '#therect'
      )) as ElementHandle<SVGRectElement>;
      const pptrBoundingBox = await element.boundingBox();
      const webBoundingBox = await page.evaluate(e => {
        const rect = e.getBoundingClientRect();
        return {x: rect.x, y: rect.y, width: rect.width, height: rect.height};
      }, element);
      expect(pptrBoundingBox).toEqual(webBoundingBox);
    });
  });

  describe('ElementHandle.boxModel', function () {
    it('should work', async () => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/resetcss.html');

      // Step 1: Add Frame and position it absolutely.
      await utils.attachFrame(page, 'frame1', server.PREFIX + '/resetcss.html');
      await page.evaluate(() => {
        const frame = document.querySelector<HTMLElement>('#frame1')!;
        frame.style.position = 'absolute';
        frame.style.left = '1px';
        frame.style.top = '2px';
      });

      // Step 2: Add div and position it absolutely inside frame.
      const frame = page.frames()[1]!;
      const divHandle = (
        await frame.evaluateHandle(() => {
          const div = document.createElement('div');
          document.body.appendChild(div);
          div.style.boxSizing = 'border-box';
          div.style.position = 'absolute';
          div.style.borderLeft = '1px solid black';
          div.style.paddingLeft = '2px';
          div.style.marginLeft = '3px';
          div.style.left = '4px';
          div.style.top = '5px';
          div.style.width = '6px';
          div.style.height = '7px';
          return div;
        })
      ).asElement()!;

      // Step 3: query div's boxModel and assert box values.
      const box = (await divHandle.boxModel())!;
      expect(box.width).toBe(6);
      expect(box.height).toBe(7);
      expect(box.margin[0]!).toEqual({
        x: 1 + 4, // frame.left + div.left
        y: 2 + 5,
      });
      expect(box.border[0]!).toEqual({
        x: 1 + 4 + 3, // frame.left + div.left + div.margin-left
        y: 2 + 5,
      });
      expect(box.padding[0]!).toEqual({
        x: 1 + 4 + 3 + 1, // frame.left + div.left + div.marginLeft + div.borderLeft
        y: 2 + 5,
      });
      expect(box.content[0]!).toEqual({
        x: 1 + 4 + 3 + 1 + 2, // frame.left + div.left + div.marginLeft + div.borderLeft + dif.paddingLeft
        y: 2 + 5,
      });
    });

    it('should return null for invisible elements', async () => {
      const {page} = getTestState();

      await page.setContent('<div style="display:none">hi</div>');
      const element = (await page.$('div'))!;
      expect(await element.boxModel()).toBe(null);
    });
  });

  describe('ElementHandle.contentFrame', function () {
    it('should work', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await utils.attachFrame(page, 'frame1', server.EMPTY_PAGE);
      const elementHandle = (await page.$('#frame1'))!;
      const frame = await elementHandle.contentFrame();
      expect(frame).toBe(page.frames()[1]!);
    });
  });

  describe('ElementHandle.click', function () {
    // See https://github.com/puppeteer/puppeteer/issues/7175
    it('should work', async () => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/input/button.html');
      const button = (await page.$('button'))!;
      await button.click();
      expect(
        await page.evaluate(() => {
          return (globalThis as any).result;
        })
      ).toBe('Clicked');
    });
    it('should work for Shadow DOM v1', async () => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/shadow.html');
      const buttonHandle = await page.evaluateHandle(() => {
        // @ts-expect-error button is expected to be in the page's scope.
        return button as HTMLButtonElement;
      });
      await buttonHandle.click();
      expect(
        await page.evaluate(() => {
          // @ts-expect-error clicked is expected to be in the page's scope.
          return clicked;
        })
      ).toBe(true);
    });
    it('should not work for TextNodes', async () => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/input/button.html');
      const buttonTextNode = await page.evaluateHandle(() => {
        return document.querySelector('button')!.firstChild as HTMLElement;
      });
      let error!: Error;
      await buttonTextNode.click().catch(error_ => {
        return (error = error_);
      });
      expect(error.message).toBe('Node is not of type HTMLElement');
    });
    it('should throw for detached nodes', async () => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/input/button.html');
      const button = (await page.$('button'))!;
      await page.evaluate((button: HTMLElement) => {
        return button.remove();
      }, button);
      let error!: Error;
      await button.click().catch(error_ => {
        return (error = error_);
      });
      expect(error.message).toBe('Node is detached from document');
    });
    it('should throw for hidden nodes', async () => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/input/button.html');
      const button = (await page.$('button'))!;
      await page.evaluate((button: HTMLElement) => {
        return (button.style.display = 'none');
      }, button);
      const error = await button.click().catch(error_ => {
        return error_;
      });
      expect(error.message).toBe(
        'Node is either not clickable or not an HTMLElement'
      );
    });
    it('should throw for recursively hidden nodes', async () => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/input/button.html');
      const button = (await page.$('button'))!;
      await page.evaluate((button: HTMLElement) => {
        return (button.parentElement!.style.display = 'none');
      }, button);
      const error = await button.click().catch(error_ => {
        return error_;
      });
      expect(error.message).toBe(
        'Node is either not clickable or not an HTMLElement'
      );
    });
    it('should throw for <br> elements', async () => {
      const {page} = getTestState();

      await page.setContent('hello<br>goodbye');
      const br = (await page.$('br'))!;
      const error = await br.click().catch(error_ => {
        return error_;
      });
      expect(error.message).toBe(
        'Node is either not clickable or not an HTMLElement'
      );
    });
  });

  describe('Element.waitForSelector', () => {
    it('should wait correctly with waitForSelector on an element', async () => {
      const {page} = getTestState();
      const waitFor = page.waitForSelector('.foo') as Promise<
        ElementHandle<HTMLDivElement>
      >;
      // Set the page content after the waitFor has been started.
      await page.setContent(
        '<div id="not-foo"></div><div class="bar">bar2</div><div class="foo">Foo1</div>'
      );
      let element = (await waitFor)!;
      expect(element).toBeDefined();

      const innerWaitFor = element.waitForSelector('.bar') as Promise<
        ElementHandle<HTMLDivElement>
      >;
      await element.evaluate(el => {
        el.innerHTML = '<div class="bar">bar1</div>';
      });
      element = (await innerWaitFor)!;
      expect(element).toBeDefined();
      expect(
        await element.evaluate(el => {
          return (el as HTMLElement).innerText;
        })
      ).toStrictEqual('bar1');
    });
  });

  describe('Element.waitForXPath', () => {
    it('should wait correctly with waitForXPath on an element', async () => {
      const {page} = getTestState();
      // Set the page content after the waitFor has been started.
      await page.setContent(
        `<div id=el1>
          el1
          <div id=el2>
            el2
          </div>
        </div>
        <div id=el3>
          el3
        </div>`
      );

      const el1 = (await page.waitForSelector(
        '#el1'
      )) as ElementHandle<HTMLDivElement>;

      for (const path of ['//div', './/div']) {
        const e = (await el1.waitForXPath(
          path
        )) as ElementHandle<HTMLDivElement>;
        expect(
          await e.evaluate(el => {
            return el.id;
          })
        ).toStrictEqual('el2');
      }
    });
  });

  describe('ElementHandle.hover', function () {
    it('should work', async () => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/input/scrollable.html');
      const button = (await page.$('#button-6'))!;
      await button.hover();
      expect(
        await page.evaluate(() => {
          return document.querySelector('button:hover')!.id;
        })
      ).toBe('button-6');
    });
  });

  describe('ElementHandle.isIntersectingViewport', function () {
    it('should work', async () => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/offscreenbuttons.html');
      for (let i = 0; i < 11; ++i) {
        const button = (await page.$('#btn' + i))!;
        // All but last button are visible.
        const visible = i < 10;
        expect(await button.isIntersectingViewport()).toBe(visible);
      }
    });
    it('should work with threshold', async () => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/offscreenbuttons.html');
      // a button almost cannot be seen
      // sometimes we expect to return false by isIntersectingViewport1
      const button = (await page.$('#btn11'))!;
      expect(
        await button.isIntersectingViewport({
          threshold: 0.001,
        })
      ).toBe(false);
    });
    it('should work with threshold of 1', async () => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/offscreenbuttons.html');
      // a button almost cannot be seen
      // sometimes we expect to return false by isIntersectingViewport1
      const button = (await page.$('#btn0'))!;
      expect(
        await button.isIntersectingViewport({
          threshold: 1,
        })
      ).toBe(true);
    });
  });

  describe('Custom queries', function () {
    this.afterEach(() => {
      const {puppeteer} = getTestState();
      puppeteer.clearCustomQueryHandlers();
    });
    it('should register and unregister', async () => {
      const {page, puppeteer} = getTestState();
      await page.setContent('<div id="not-foo"></div><div id="foo"></div>');

      // Register.
      puppeteer.registerCustomQueryHandler('getById', {
        queryOne: (_element, selector) => {
          return document.querySelector(`[id="${selector}"]`);
        },
      });
      const element = (await page.$(
        'getById/foo'
      )) as ElementHandle<HTMLDivElement>;
      expect(
        await page.evaluate(element => {
          return element.id;
        }, element)
      ).toBe('foo');
      const handlerNamesAfterRegistering = puppeteer.customQueryHandlerNames();
      expect(handlerNamesAfterRegistering.includes('getById')).toBeTruthy();

      // Unregister.
      puppeteer.unregisterCustomQueryHandler('getById');
      try {
        await page.$('getById/foo');
        throw new Error('Custom query handler name not set - throw expected');
      } catch (error) {
        expect(error).not.toStrictEqual(
          new Error('Custom query handler name not set - throw expected')
        );
      }
      const handlerNamesAfterUnregistering =
        puppeteer.customQueryHandlerNames();
      expect(handlerNamesAfterUnregistering.includes('getById')).toBeFalsy();
    });
    it('should throw with invalid query names', () => {
      try {
        const {puppeteer} = getTestState();
        puppeteer.registerCustomQueryHandler('1/2/3', {
          queryOne: () => {
            return document.querySelector('foo');
          },
        });
        throw new Error(
          'Custom query handler name was invalid - throw expected'
        );
      } catch (error) {
        expect(error).toStrictEqual(
          new Error('Custom query handler names may only contain [a-zA-Z]')
        );
      }
    });
    it('should work for multiple elements', async () => {
      const {page, puppeteer} = getTestState();
      await page.setContent(
        '<div id="not-foo"></div><div class="foo">Foo1</div><div class="foo baz">Foo2</div>'
      );
      puppeteer.registerCustomQueryHandler('getByClass', {
        queryAll: (_element, selector) => {
          return [...document.querySelectorAll(`.${selector}`)];
        },
      });
      const elements = (await page.$$('getByClass/foo')) as Array<
        ElementHandle<HTMLDivElement>
      >;
      const classNames = await Promise.all(
        elements.map(async element => {
          return await page.evaluate(element => {
            return element.className;
          }, element);
        })
      );

      expect(classNames).toStrictEqual(['foo', 'foo baz']);
    });
    it('should eval correctly', async () => {
      const {page, puppeteer} = getTestState();
      await page.setContent(
        '<div id="not-foo"></div><div class="foo">Foo1</div><div class="foo baz">Foo2</div>'
      );
      puppeteer.registerCustomQueryHandler('getByClass', {
        queryAll: (_element, selector) => {
          return [...document.querySelectorAll(`.${selector}`)];
        },
      });
      const elements = await page.$$eval('getByClass/foo', divs => {
        return divs.length;
      });

      expect(elements).toBe(2);
    });
    it('should wait correctly with waitForSelector', async () => {
      const {page, puppeteer} = getTestState();
      puppeteer.registerCustomQueryHandler('getByClass', {
        queryOne: (element, selector) => {
          return (element as Element).querySelector(`.${selector}`);
        },
      });
      const waitFor = page.waitForSelector('getByClass/foo');

      // Set the page content after the waitFor has been started.
      await page.setContent(
        '<div id="not-foo"></div><div class="foo">Foo1</div>'
      );
      const element = await waitFor;

      expect(element).toBeDefined();
    });

    it('should wait correctly with waitForSelector on an element', async () => {
      const {page, puppeteer} = getTestState();
      puppeteer.registerCustomQueryHandler('getByClass', {
        queryOne: (element, selector) => {
          return (element as Element).querySelector(`.${selector}`);
        },
      });
      const waitFor = page.waitForSelector('getByClass/foo') as Promise<
        ElementHandle<HTMLElement>
      >;

      // Set the page content after the waitFor has been started.
      await page.setContent(
        '<div id="not-foo"></div><div class="bar">bar2</div><div class="foo">Foo1</div>'
      );
      let element = (await waitFor)!;
      expect(element).toBeDefined();

      const innerWaitFor = element.waitForSelector('getByClass/bar') as Promise<
        ElementHandle<HTMLElement>
      >;

      await element.evaluate(el => {
        el.innerHTML = '<div class="bar">bar1</div>';
      });

      element = (await innerWaitFor)!;
      expect(element).toBeDefined();
      expect(
        await element.evaluate(el => {
          return el.innerText;
        })
      ).toStrictEqual('bar1');
    });

    it('should wait correctly with waitFor', async () => {
      /* page.waitFor is deprecated so we silence the warning to avoid test noise */
      sinon.stub(console, 'warn').callsFake(() => {});
      const {page, puppeteer} = getTestState();
      puppeteer.registerCustomQueryHandler('getByClass', {
        queryOne: (element, selector) => {
          return (element as Element).querySelector(`.${selector}`);
        },
      });
      const waitFor = page.waitForSelector('getByClass/foo');

      // Set the page content after the waitFor has been started.
      await page.setContent(
        '<div id="not-foo"></div><div class="foo">Foo1</div>'
      );
      const element = await waitFor;

      expect(element).toBeDefined();
    });
    it('should work when both queryOne and queryAll are registered', async () => {
      const {page, puppeteer} = getTestState();
      await page.setContent(
        '<div id="not-foo"></div><div class="foo"><div id="nested-foo" class="foo"/></div><div class="foo baz">Foo2</div>'
      );
      puppeteer.registerCustomQueryHandler('getByClass', {
        queryOne: (element, selector) => {
          return (element as Element).querySelector(`.${selector}`);
        },
        queryAll: (element, selector) => {
          return [...(element as Element).querySelectorAll(`.${selector}`)];
        },
      });

      const element = (await page.$('getByClass/foo'))!;
      expect(element).toBeDefined();

      const elements = await page.$$('getByClass/foo');
      expect(elements.length).toBe(3);
    });
    it('should eval when both queryOne and queryAll are registered', async () => {
      const {page, puppeteer} = getTestState();
      await page.setContent(
        '<div id="not-foo"></div><div class="foo">text</div><div class="foo baz">content</div>'
      );
      puppeteer.registerCustomQueryHandler('getByClass', {
        queryOne: (element, selector) => {
          return (element as Element).querySelector(`.${selector}`);
        },
        queryAll: (element, selector) => {
          return [...(element as Element).querySelectorAll(`.${selector}`)];
        },
      });

      const txtContent = await page.$eval('getByClass/foo', div => {
        return div.textContent;
      });
      expect(txtContent).toBe('text');

      const txtContents = await page.$$eval('getByClass/foo', divs => {
        return divs
          .map(d => {
            return d.textContent;
          })
          .join('');
      });
      expect(txtContents).toBe('textcontent');
    });
  });
});
