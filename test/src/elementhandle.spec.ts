/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';
import {Puppeteer} from 'puppeteer';
import type {Point, Quad} from 'puppeteer-core/internal/api/ElementHandle.js';
import {ElementHandle} from 'puppeteer-core/internal/api/ElementHandle.js';
import {
  asyncDisposeSymbol,
  disposeSymbol,
} from 'puppeteer-core/internal/util/disposable.js';
import sinon from 'sinon';

import {
  getTestState,
  setupTestBrowserHooks,
  shortWaitForArrayToHaveAtLeastNElements,
} from './mocha-utils.js';
import {initializeTouchEventReport} from './touch-event-utils.js';
import {attachFrame} from './utils.js';

describe('ElementHandle specs', function () {
  setupTestBrowserHooks();

  describe('ElementHandle.boundingBox', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.goto(server.PREFIX + '/grid.html');
      using elementHandle = (await page.$('.box:nth-of-type(13)'))!;
      const box = await elementHandle.boundingBox();
      expect(box).toEqual({x: 100, y: 50, width: 50, height: 50});
    });
    it('should handle nested frames', async () => {
      const {page, server} = await getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.goto(server.PREFIX + '/frames/nested-frames.html');
      const nestedFrame = page.frames()[1]!.childFrames()[1]!;
      using elementHandle = (await nestedFrame.$('div'))!;
      const box = await elementHandle.boundingBox();
      expect(box).toEqual({x: 28, y: 182, width: 300, height: 18});
    });
    it('should return null for invisible elements', async () => {
      const {page} = await getTestState();

      await page.setContent('<div style="display:none">hi</div>');
      using element = (await page.$('div'))!;
      expect(await element.boundingBox()).toBe(null);
    });
    it('should force a layout', async () => {
      const {page} = await getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.setContent(
        '<div style="width: 100px; height: 100px">hello</div>',
      );
      using elementHandle = (await page.$('div'))!;
      await page.evaluate(element => {
        return (element.style.height = '200px');
      }, elementHandle);
      const box = await elementHandle.boundingBox();
      expect(box).toEqual({x: 8, y: 8, width: 100, height: 200});
    });
    it('should work with SVG nodes', async () => {
      const {page} = await getTestState();

      await page.setContent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="500" height="500">
          <rect id="theRect" x="30" y="50" width="200" height="300"></rect>
        </svg>
      `);
      using element = (await page.$(
        '#therect',
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
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/resetcss.html');

      // Step 1: Add Frame and position it absolutely.
      await attachFrame(page, 'frame1', server.PREFIX + '/resetcss.html');
      await page.evaluate(() => {
        const frame = document.querySelector<HTMLElement>('#frame1')!;
        frame.style.position = 'absolute';
        frame.style.left = '1px';
        frame.style.top = '2px';
      });

      // Step 2: Add div and position it absolutely inside frame.
      const frame = page.frames()[1]!;
      using divHandle = (
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
      expect(box.margin[0]).toEqual({
        x: 1 + 4, // frame.left + div.left
        y: 2 + 5,
      });
      expect(box.border[0]).toEqual({
        x: 1 + 4 + 3, // frame.left + div.left + div.margin-left
        y: 2 + 5,
      });
      expect(box.padding[0]).toEqual({
        x: 1 + 4 + 3 + 1, // frame.left + div.left + div.marginLeft + div.borderLeft
        y: 2 + 5,
      });
      expect(box.content[0]).toEqual({
        x: 1 + 4 + 3 + 1 + 2, // frame.left + div.left + div.marginLeft + div.borderLeft + div.paddingLeft
        y: 2 + 5,
      });
    });

    it('should return null for invisible elements', async () => {
      const {page} = await getTestState();

      await page.setContent('<div style="display:none">hi</div>');
      using element = (await page.$('div'))!;
      expect(await element.boxModel()).toBe(null);
    });

    it('should correctly compute box model with offsets', async () => {
      const {page} = await getTestState();
      const border = 10;
      const padding = 11;
      const margin = 12;
      const width = 200;
      const height = 100;
      const verticalOffset = 100;
      const horizontalOffset = 100;
      await page.setContent(`<div
        style='position:absolute; left: ${horizontalOffset}px; top: ${verticalOffset}px; width: ${width}px; height: ${height}px; border: ${border}px solid green; padding: ${padding}px; margin: ${margin}px;'
        id='box'>
      </div>`);
      using element = (await page.$('#box'))!;
      const boxModel = await element.boxModel();

      function makeQuad(topLeft: Point, bottomRight: Point): Quad {
        return [
          {
            x: topLeft.x,
            y: topLeft.y,
          },
          {
            x: bottomRight.x,
            y: topLeft.y,
          },
          {
            x: bottomRight.x,
            y: bottomRight.y,
          },
          {
            x: topLeft.x,
            y: bottomRight.y,
          },
        ];
      }

      expect(boxModel).toEqual({
        content: makeQuad(
          {
            x: horizontalOffset + padding + margin + border,
            y: verticalOffset + padding + margin + border,
          },
          {
            x: horizontalOffset + width + padding + margin + border,
            y: verticalOffset + height + padding + margin + border,
          },
        ),
        padding: makeQuad(
          {
            x: horizontalOffset + margin + border,
            y: verticalOffset + margin + border,
          },
          {
            x: horizontalOffset + width + padding * 2 + margin + border,
            y: verticalOffset + padding * 2 + height + margin + border,
          },
        ),
        border: makeQuad(
          {
            x: horizontalOffset + margin,
            y: verticalOffset + margin,
          },
          {
            x: horizontalOffset + width + padding * 2 + margin + border * 2,
            y: verticalOffset + padding * 2 + height + margin + border * 2,
          },
        ),
        margin: makeQuad(
          {
            x: horizontalOffset,
            y: verticalOffset,
          },
          {
            x: horizontalOffset + width + padding * 2 + margin * 2 + border * 2,
            y: verticalOffset + padding * 2 + height + margin * 2 + border * 2,
          },
        ),
        width: width + padding * 2 + border * 2,
        height: height + padding * 2 + border * 2,
      });
    });
  });

  describe('ElementHandle.contentFrame', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await attachFrame(page, 'frame1', server.EMPTY_PAGE);
      using elementHandle = (await page.$('#frame1'))!;
      const frame = await elementHandle.contentFrame();
      expect(frame).toBe(page.frames()[1]);
    });
  });

  describe('ElementHandle.isVisible and ElementHandle.isHidden', function () {
    it('should work', async () => {
      const {page} = await getTestState();
      await page.setContent('<div style="display: none">text</div>');
      using element = (await page.waitForSelector('div'))!;
      await expect(element.isVisible()).resolves.toBeFalsy();
      await expect(element.isHidden()).resolves.toBeTruthy();
      await element.evaluate(e => {
        e.style.removeProperty('display');
      });
      await expect(element.isVisible()).resolves.toBeTruthy();
      await expect(element.isHidden()).resolves.toBeFalsy();
    });
  });

  describe('ElementHandle.click', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/input/button.html');
      using button = (await page.$('button'))!;
      await button.click();
      expect(
        await page.evaluate(() => {
          return (globalThis as any).result;
        }),
      ).toBe('Clicked');
    });
    it('should return Point data', async () => {
      const {page} = await getTestState();

      const clicks: Array<[x: number, y: number]> = [];

      await page.exposeFunction('reportClick', (x: number, y: number): void => {
        clicks.push([x, y]);
      });

      await page.evaluate(() => {
        document.body.style.padding = '0';
        document.body.style.margin = '0';
        document.body.innerHTML = `
          <div style="cursor: pointer; width: 120px; height: 60px; margin: 30px; padding: 15px;"></div>
        `;
        document.body.addEventListener('click', e => {
          (window as any).reportClick(e.clientX, e.clientY);
        });
      });

      using divHandle = (await page.$('div'))!;
      await divHandle.click();
      await divHandle.click({
        offset: {
          x: 10,
          y: 15,
        },
      });
      await shortWaitForArrayToHaveAtLeastNElements(clicks, 2);
      expect(clicks).toEqual([
        [45 + 60, 45 + 30], // margin + middle point offset
        [30 + 10, 30 + 15], // margin + offset
      ]);
    });
    it('should work for Shadow DOM v1', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/shadow.html');
      using buttonHandle = await page.evaluateHandle(() => {
        // @ts-expect-error button is expected to be in the page's scope.
        return button as HTMLButtonElement;
      });
      await buttonHandle.click();
      expect(
        await page.evaluate(() => {
          // @ts-expect-error clicked is expected to be in the page's scope.
          return clicked;
        }),
      ).toBe(true);
    });
    it('should not work for TextNodes', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/input/button.html');
      using buttonTextNode = await page.evaluateHandle(() => {
        return document.querySelector('button')!.firstChild as HTMLElement;
      });
      let error!: Error;
      await buttonTextNode.click().catch(error_ => {
        return (error = error_);
      });
      expect(error.message).atLeastOneToContain([
        'Node is not of type HTMLElement',
        'no such node',
      ]);
    });
    it('should throw for detached nodes', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/input/button.html');
      using button = (await page.$('button'))!;
      await page.evaluate(button => {
        return button.remove();
      }, button);
      let error!: Error;
      await button.click().catch(error_ => {
        return (error = error_);
      });
      expect(error.message).atLeastOneToContain([
        'Node is detached from document',
        'no such node',
      ]);
    });
    it('should throw for hidden nodes', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/input/button.html');
      using button = (await page.$('button'))!;
      await page.evaluate(button => {
        return (button.style.display = 'none');
      }, button);
      const error = await button.click().catch(error_ => {
        return error_;
      });
      expect(error.message).atLeastOneToContain([
        'Node is either not clickable or not an Element',
        'no such element',
      ]);
    });
    it('should throw for recursively hidden nodes', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/input/button.html');
      using button = (await page.$('button'))!;
      await page.evaluate(button => {
        return (button.parentElement!.style.display = 'none');
      }, button);
      const error = await button.click().catch(error_ => {
        return error_;
      });
      expect(error.message).atLeastOneToContain([
        'Node is either not clickable or not an Element',
        'no such element',
      ]);
    });
    it('should throw for <br> elements', async () => {
      const {page} = await getTestState();

      await page.setContent('hello<br>goodbye');
      using br = (await page.$('br'))!;
      const error = await br.click().catch(error_ => {
        return error_;
      });
      expect(error.message).atLeastOneToContain([
        'Node is either not clickable or not an Element',
        'no such node',
      ]);
    });
  });

  describe('ElementHandle.touchStart', () => {
    it('should work', async () => {
      const {page} = await getTestState();
      const {events} = await initializeTouchEventReport(page);

      await page.evaluate(() => {
        document.body.style.padding = '0';
        document.body.style.margin = '0';
        document.body.innerHTML = `
          <div style="cursor: pointer; width: 120px; height: 60px; margin: 30px; padding: 15px;"></div>
        `;
      });

      using divHandle = (await page.$('div'))!;
      await divHandle.touchStart();
      await shortWaitForArrayToHaveAtLeastNElements(events, 1);

      const expectedTouchLocation = [45 + 60, 45 + 30]; // margin + middle point offset

      expect(events).toEqual([
        {
          changed: [expectedTouchLocation],
          touches: [expectedTouchLocation],
        },
      ]);
    });

    it('should work with the returned Touch', async () => {
      const {page} = await getTestState();
      const {events} = await initializeTouchEventReport(page);

      await page.evaluate(() => {
        document.body.style.padding = '0';
        document.body.style.margin = '0';
        document.body.innerHTML = `
          <div style="cursor: pointer; width: 120px; height: 60px; margin: 30px; padding: 15px;"></div>
        `;
      });

      using divHandle = (await page.$('div'))!;
      const touch = await divHandle.touchStart();
      await touch.move(150, 150);

      await shortWaitForArrayToHaveAtLeastNElements(events, 2);

      const expectedTouchLocation = [45 + 60, 45 + 30]; // margin + middle point offset

      expect(events).toEqual([
        {
          changed: [expectedTouchLocation],
          touches: [expectedTouchLocation],
        },
        {
          changed: [[150, 150]],
          touches: [[150, 150]],
        },
      ]);
    });
  });

  describe('ElementHandle.touchMove', () => {
    it('should work', async () => {
      const {page} = await getTestState();
      const {events} = await initializeTouchEventReport(page);

      await page.evaluate(() => {
        document.body.style.padding = '0';
        document.body.style.margin = '0';
        document.body.innerHTML = `
          <div style="cursor: pointer; width: 120px; height: 60px; margin: 30px; padding: 15px;"></div>
        `;
      });

      using divHandle = (await page.$('div'))!;

      await page.touchscreen.touchStart(200, 200);
      await divHandle.touchMove();

      await shortWaitForArrayToHaveAtLeastNElements(events, 2);

      const expectedDivTouchLocation = [45 + 60, 45 + 30]; // margin + middle point offset
      expect(events).toEqual([
        {
          changed: [[200, 200]],
          touches: [[200, 200]],
        },
        {
          changed: [expectedDivTouchLocation],
          touches: [expectedDivTouchLocation],
        },
      ]);
    });

    it('should work with a pre-existing Touch', async () => {
      const {page} = await getTestState();
      const {events} = await initializeTouchEventReport(page);

      await page.evaluate(() => {
        document.body.style.padding = '0';
        document.body.style.margin = '0';
        document.body.innerHTML = `
          <div style="cursor: pointer; width: 120px; height: 60px; margin: 30px; padding: 15px;"></div>
        `;
      });

      using divHandle = (await page.$('div'))!;
      await page.touchscreen.touchStart(200, 200);
      const secondTouch = await page.touchscreen.touchStart(200, 100);
      await divHandle.touchMove(secondTouch);

      await shortWaitForArrayToHaveAtLeastNElements(events, 3);

      const expectedDivTouchLocation = [45 + 60, 45 + 30]; // margin + middle point offset

      expect(events).toEqual([
        {
          changed: [[200, 200]],
          touches: [[200, 200]],
        },
        {
          changed: [[200, 100]],
          touches: [
            [200, 200],
            [200, 100],
          ],
        },
        {
          changed: [expectedDivTouchLocation],
          touches: [[200, 200], expectedDivTouchLocation],
        },
      ]);
    });
  });

  describe('ElementHandle.touchEnd', () => {
    it('should work', async () => {
      const {page} = await getTestState();
      const {events} = await initializeTouchEventReport(page);

      await page.evaluate(() => {
        document.body.style.padding = '0';
        document.body.style.margin = '0';
        document.body.innerHTML = `
          <div style="cursor: pointer; width: 120px; height: 60px; margin: 30px; padding: 15px;"></div>
        `;
      });

      using divHandle = (await page.$('div'))!;

      await page.touchscreen.touchStart(100, 100);
      await divHandle.touchEnd();
      await shortWaitForArrayToHaveAtLeastNElements(events, 2);

      expect(events).toEqual([
        {
          changed: [[100, 100]],
          touches: [[100, 100]],
        },
        {
          changed: [[100, 100]],
          touches: [],
        },
      ]);
    });
  });

  describe('ElementHandle.clickablePoint', function () {
    it('should work', async () => {
      const {page} = await getTestState();

      await page.evaluate(() => {
        document.body.style.padding = '0';
        document.body.style.margin = '0';
        document.body.innerHTML = `
          <div style="cursor: pointer; width: 120px; height: 60px; margin: 30px; padding: 15px;"></div>
        `;
      });
      await page.evaluate(async () => {
        return await new Promise(resolve => {
          return window.requestAnimationFrame(resolve);
        });
      });
      using divHandle = (await page.$('div'))!;
      expect(await divHandle.clickablePoint()).toEqual({
        x: 45 + 60, // margin + middle point offset
        y: 45 + 30, // margin + middle point offset
      });
      expect(
        await divHandle.clickablePoint({
          x: 10,
          y: 15,
        }),
      ).toEqual({
        x: 30 + 10, // margin + offset
        y: 30 + 15, // margin + offset
      });
    });

    it('should not work if the click box is not visible', async () => {
      const {page} = await getTestState();

      await page.setContent(
        '<button style="width: 10px; height: 10px; position: absolute; left: -20px"></button>',
      );
      using handle = await page.locator('button').waitHandle();
      await expect(handle.clickablePoint()).rejects.toBeInstanceOf(Error);

      await page.setContent(
        '<button style="width: 10px; height: 10px; position: absolute; right: -20px"></button>',
      );
      using handle2 = await page.locator('button').waitHandle();
      await expect(handle2.clickablePoint()).rejects.toBeInstanceOf(Error);

      await page.setContent(
        '<button style="width: 10px; height: 10px; position: absolute; top: -20px"></button>',
      );
      using handle3 = await page.locator('button').waitHandle();
      await expect(handle3.clickablePoint()).rejects.toBeInstanceOf(Error);

      await page.setContent(
        '<button style="width: 10px; height: 10px; position: absolute; bottom: -20px"></button>',
      );
      using handle4 = await page.locator('button').waitHandle();
      await expect(handle4.clickablePoint()).rejects.toBeInstanceOf(Error);
    });

    it('should not work if the click box is not visible due to the iframe', async () => {
      const {page} = await getTestState();

      await page.setContent(
        `<iframe name='frame' style='position: absolute; left: -100px' srcdoc="<button style='width: 10px; height: 10px;'></button>"></iframe>`,
      );
      const frame = await page.waitForFrame(async frame => {
        using element = await frame.frameElement();
        if (!element) {
          return false;
        }
        const name = await element.evaluate(frame => {
          return frame.name;
        });
        return name === 'frame';
      });

      using handle = await frame.locator('button').waitHandle();
      await expect(handle.clickablePoint()).rejects.toBeInstanceOf(Error);

      await page.setContent(
        `<iframe name='frame2' style='position: absolute; top: -100px' srcdoc="<button style='width: 10px; height: 10px;'></button>"></iframe>`,
      );
      const frame2 = await page.waitForFrame(async frame => {
        using element = await frame.frameElement();
        if (!element) {
          return false;
        }
        const name = await element.evaluate(frame => {
          return frame.name;
        });
        return name === 'frame2';
      });

      using handle2 = await frame2.locator('button').waitHandle();
      await expect(handle2.clickablePoint()).rejects.toBeInstanceOf(Error);
    });

    it('should work for iframes', async () => {
      const {page} = await getTestState();
      await page.evaluate(() => {
        document.body.style.padding = '10px';
        document.body.style.margin = '10px';
        document.body.innerHTML = `
          <iframe style="border: none; margin: 0; padding: 0;" seamless sandbox srcdoc="<style>* { margin: 0; padding: 0;}</style><div style='cursor: pointer; width: 120px; height: 60px; margin: 30px; padding: 15px;' />"></iframe>
        `;
      });
      await page.evaluate(async () => {
        return await new Promise(resolve => {
          return window.requestAnimationFrame(resolve);
        });
      });
      const frame = page.frames()[1]!;
      using divHandle = (await frame.$('div'))!;
      expect(await divHandle.clickablePoint()).toEqual({
        x: 20 + 45 + 60, // iframe pos + margin + middle point offset
        y: 20 + 45 + 30, // iframe pos + margin + middle point offset
      });
      expect(
        await divHandle.clickablePoint({
          x: 10,
          y: 15,
        }),
      ).toEqual({
        x: 20 + 30 + 10, // iframe pos + margin + offset
        y: 20 + 30 + 15, // iframe pos + margin + offset
      });
    });
  });

  describe('Element.waitForSelector', () => {
    it('should wait correctly with waitForSelector on an element', async () => {
      const {page} = await getTestState();
      const waitFor = page.waitForSelector('.foo').catch(err => {
        return err;
      }) as Promise<ElementHandle<HTMLDivElement>>;
      // Set the page content after the waitFor has been started.
      await page.setContent(
        '<div id="not-foo"></div><div class="bar">bar2</div><div class="foo">Foo1</div>',
      );
      using element = (await waitFor)!;
      if (element instanceof Error) {
        throw element;
      }
      expect(element).toBeDefined();

      const innerWaitFor = element.waitForSelector('.bar').catch(err => {
        return err;
      }) as Promise<ElementHandle<HTMLDivElement>>;
      await element.evaluate(el => {
        el.innerHTML = '<div class="bar">bar1</div>';
      });
      using element2 = (await innerWaitFor)!;
      if (element2 instanceof Error) {
        throw element2;
      }
      expect(element2).toBeDefined();
      expect(
        await element2.evaluate(el => {
          return el.innerText;
        }),
      ).toStrictEqual('bar1');
    });

    it('should wait correctly with waitForSelector and xpath on an element', async () => {
      const {page} = await getTestState();
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
        </div>`,
      );

      using elById = (await page.waitForSelector(
        '#el1',
      )) as ElementHandle<HTMLDivElement>;

      using elByXpath = (await elById.waitForSelector(
        'xpath/.//div',
      )) as ElementHandle<HTMLDivElement>;
      expect(
        await elByXpath.evaluate(el => {
          return el.id;
        }),
      ).toStrictEqual('el2');
    });
  });

  describe('ElementHandle.hover', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/input/scrollable.html');
      using button = (await page.$('#button-6'))!;
      await button.hover();
      expect(
        await page.evaluate(() => {
          return document.querySelector('button:hover')!.id;
        }),
      ).toBe('button-6');
    });
  });

  describe('ElementHandle.isIntersectingViewport', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();

      async function getVisibilityForButton(selector: string) {
        using button = (await page.$(selector))!;
        return await button.isIntersectingViewport();
      }

      await page.goto(server.PREFIX + '/offscreenbuttons.html');
      const buttonsPromises = [];
      // Firefox seems slow when using `isIntersectingViewport`
      // so we do all the tasks asynchronously
      for (let i = 0; i < 11; ++i) {
        buttonsPromises.push(getVisibilityForButton('#btn' + i));
      }
      const buttonVisibility = await Promise.all(buttonsPromises);
      for (let i = 0; i < 11; ++i) {
        // All but last button are visible.
        const visible = i < 10;
        expect(buttonVisibility[i]).toBe(visible);
      }
    });
    it('should work with threshold', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/offscreenbuttons.html');
      // a button almost cannot be seen
      // sometimes we expect to return false by isIntersectingViewport1
      using button = (await page.$('#btn11'))!;
      expect(
        await button.isIntersectingViewport({
          threshold: 0.001,
        }),
      ).toBe(false);
    });
    it('should work with threshold of 1', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/offscreenbuttons.html');
      // a button almost cannot be seen
      // sometimes we expect to return false by isIntersectingViewport1
      using button = (await page.$('#btn0'))!;
      expect(
        await button.isIntersectingViewport({
          threshold: 1,
        }),
      ).toBe(true);
    });
    it('should work with svg elements', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/inline-svg.html');
      const [visibleCircle, visibleSvg] = await Promise.all([
        page.$('circle'),
        page.$('svg'),
      ]);

      // Firefox seems slow when using `isIntersectingViewport`
      // so we do all the tasks asynchronously
      const [
        circleThresholdOne,
        circleThresholdZero,
        svgThresholdOne,
        svgThresholdZero,
      ] = await Promise.all([
        visibleCircle!.isIntersectingViewport({
          threshold: 1,
        }),
        visibleCircle!.isIntersectingViewport({
          threshold: 0,
        }),
        visibleSvg!.isIntersectingViewport({
          threshold: 1,
        }),
        visibleSvg!.isIntersectingViewport({
          threshold: 0,
        }),
      ]);

      expect(circleThresholdOne).toBe(true);
      expect(circleThresholdZero).toBe(true);
      expect(svgThresholdOne).toBe(true);
      expect(svgThresholdZero).toBe(true);

      const [invisibleCircle, invisibleSvg] = await Promise.all([
        page.$('div circle'),
        page.$('div svg'),
      ]);

      // Firefox seems slow when using `isIntersectingViewport`
      // so we do all the tasks asynchronously
      const [
        invisibleCircleThresholdOne,
        invisibleCircleThresholdZero,
        invisibleSvgThresholdOne,
        invisibleSvgThresholdZero,
      ] = await Promise.all([
        invisibleCircle!.isIntersectingViewport({
          threshold: 1,
        }),
        invisibleCircle!.isIntersectingViewport({
          threshold: 0,
        }),
        invisibleSvg!.isIntersectingViewport({
          threshold: 1,
        }),
        invisibleSvg!.isIntersectingViewport({
          threshold: 0,
        }),
      ]);

      expect(invisibleCircleThresholdOne).toBe(false);
      expect(invisibleCircleThresholdZero).toBe(false);
      expect(invisibleSvgThresholdOne).toBe(false);
      expect(invisibleSvgThresholdZero).toBe(false);
    });
  });

  describe('Custom queries', function () {
    afterEach(() => {
      Puppeteer.clearCustomQueryHandlers();
    });
    it('should register and unregister', async () => {
      const {page} = await getTestState();
      await page.setContent('<div id="not-foo"></div><div id="foo"></div>');

      // Register.
      Puppeteer.registerCustomQueryHandler('getById', {
        queryOne: (_element, selector) => {
          return document.querySelector(`[id="${selector}"]`);
        },
      });
      using element = (await page.$(
        'getById/foo',
      )) as ElementHandle<HTMLDivElement>;
      expect(
        await page.evaluate(element => {
          return element.id;
        }, element),
      ).toBe('foo');
      const handlerNamesAfterRegistering = Puppeteer.customQueryHandlerNames();
      expect(handlerNamesAfterRegistering.includes('getById')).toBeTruthy();

      // Unregister.
      Puppeteer.unregisterCustomQueryHandler('getById');
      try {
        await page.$('getById/foo');
        throw new Error('Custom query handler name not set - throw expected');
      } catch (error) {
        expect(error).not.toStrictEqual(
          new Error('Custom query handler name not set - throw expected'),
        );
      }
      const handlerNamesAfterUnregistering =
        Puppeteer.customQueryHandlerNames();
      expect(handlerNamesAfterUnregistering.includes('getById')).toBeFalsy();
    });
    it('should throw with invalid query names', async () => {
      try {
        Puppeteer.registerCustomQueryHandler('1/2/3', {
          queryOne: () => {
            return document.querySelector('foo');
          },
        });
        throw new Error(
          'Custom query handler name was invalid - throw expected',
        );
      } catch (error) {
        expect(error).toStrictEqual(
          new Error('Custom query handler names may only contain [a-zA-Z]'),
        );
      }
    });
    it('should work for multiple elements', async () => {
      const {page} = await getTestState();
      await page.setContent(
        '<div id="not-foo"></div><div class="foo">Foo1</div><div class="foo baz">Foo2</div>',
      );
      Puppeteer.registerCustomQueryHandler('getByClass', {
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
        }),
      );

      expect(classNames).toStrictEqual(['foo', 'foo baz']);
    });
    it('should eval correctly', async () => {
      const {page} = await getTestState();
      await page.setContent(
        '<div id="not-foo"></div><div class="foo">Foo1</div><div class="foo baz">Foo2</div>',
      );
      Puppeteer.registerCustomQueryHandler('getByClass', {
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
      const {page} = await getTestState();
      Puppeteer.registerCustomQueryHandler('getByClass', {
        queryOne: (element, selector) => {
          return (element as Element).querySelector(`.${selector}`);
        },
      });
      const waitFor = page.waitForSelector('getByClass/foo').catch(err => {
        return err;
      });

      // Set the page content after the waitFor has been started.
      await page.setContent(
        '<div id="not-foo"></div><div class="foo">Foo1</div>',
      );
      const element = await waitFor;

      if (element instanceof Error) {
        throw element;
      }

      expect(element).toBeDefined();
    });

    it('should wait correctly with waitForSelector on an element', async () => {
      const {page} = await getTestState();
      Puppeteer.registerCustomQueryHandler('getByClass', {
        queryOne: (element, selector) => {
          return (element as Element).querySelector(`.${selector}`);
        },
      });
      const waitFor = page.waitForSelector('getByClass/foo').catch(err => {
        return err;
      }) as Promise<ElementHandle<HTMLElement>>;

      // Set the page content after the waitFor has been started.
      await page.setContent(
        '<div id="not-foo"></div><div class="bar">bar2</div><div class="foo">Foo1</div>',
      );
      using element = (await waitFor)!;
      if (element instanceof Error) {
        throw element;
      }
      expect(element).toBeDefined();

      const innerWaitFor = element
        .waitForSelector('getByClass/bar')
        .catch(err => {
          return err;
        }) as Promise<ElementHandle<HTMLElement>>;

      await element.evaluate(el => {
        el.innerHTML = '<div class="bar">bar1</div>';
      });

      using element2 = (await innerWaitFor)!;
      if (element2 instanceof Error) {
        throw element2;
      }
      expect(element2).toBeDefined();
      expect(
        await element2.evaluate(el => {
          return el.innerText;
        }),
      ).toStrictEqual('bar1');
    });

    it('should wait correctly with waitForSelector', async () => {
      const {page} = await getTestState();
      Puppeteer.registerCustomQueryHandler('getByClass', {
        queryOne: (element, selector) => {
          return (element as Element).querySelector(`.${selector}`);
        },
      });
      const waitFor = page.waitForSelector('getByClass/foo').catch(err => {
        return err;
      });

      // Set the page content after the waitFor has been started.
      await page.setContent(
        '<div id="not-foo"></div><div class="foo">Foo1</div>',
      );
      const element = await waitFor;

      if (element instanceof Error) {
        throw element;
      }

      expect(element).toBeDefined();
    });
    it('should work when both queryOne and queryAll are registered', async () => {
      const {page} = await getTestState();
      await page.setContent(
        '<div id="not-foo"></div><div class="foo"><div id="nested-foo" class="foo"/></div><div class="foo baz">Foo2</div>',
      );
      Puppeteer.registerCustomQueryHandler('getByClass', {
        queryOne: (element, selector) => {
          return (element as Element).querySelector(`.${selector}`);
        },
        queryAll: (element, selector) => {
          return [...(element as Element).querySelectorAll(`.${selector}`)];
        },
      });

      using element = (await page.$('getByClass/foo'))!;
      expect(element).toBeDefined();

      const elements = await page.$$('getByClass/foo');
      expect(elements).toHaveLength(3);
    });
    it('should eval when both queryOne and queryAll are registered', async () => {
      const {page} = await getTestState();
      await page.setContent(
        '<div id="not-foo"></div><div class="foo">text</div><div class="foo baz">content</div>',
      );
      Puppeteer.registerCustomQueryHandler('getByClass', {
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

    it('should work with function shorthands', async () => {
      const {page} = await getTestState();
      await page.setContent('<div id="not-foo"></div><div id="foo"></div>');

      Puppeteer.registerCustomQueryHandler('getById', {
        // This is a function shorthand
        queryOne(_element, selector) {
          return document.querySelector(`[id="${selector}"]`);
        },
      });

      using element = (await page.$(
        'getById/foo',
      )) as ElementHandle<HTMLDivElement>;
      expect(
        await page.evaluate(element => {
          return element.id;
        }, element),
      ).toBe('foo');
    });
  });

  describe('ElementHandle.toElement', () => {
    it('should work', async () => {
      const {page} = await getTestState();
      await page.setContent('<div class="foo">Foo1</div>');
      using element = await page.$('.foo');
      using div = await element?.toElement('div');
      expect(div).toBeDefined();
    });
  });

  describe('ElementHandle[Symbol.dispose]', () => {
    it('should work', async () => {
      const {page} = await getTestState();
      using handle = await page.evaluateHandle('document');
      const spy = sinon.spy(handle, disposeSymbol);
      {
        using _ = handle;
      }
      expect(handle).toBeInstanceOf(ElementHandle);
      expect(spy.calledOnce).toBeTruthy();
      expect(handle.disposed).toBeTruthy();
    });
  });

  describe('ElementHandle[Symbol.asyncDispose]', () => {
    it('should work', async () => {
      const {page} = await getTestState();
      using handle = await page.evaluateHandle('document');
      const spy = sinon.spy(handle, asyncDisposeSymbol);
      {
        await using _ = handle;
      }
      expect(handle).toBeInstanceOf(ElementHandle);
      expect(spy.calledOnce).toBeTruthy();
      expect(handle.disposed).toBeTruthy();
    });
  });

  describe('ElementHandle.move', () => {
    it('should work', async () => {
      const {page} = await getTestState();
      using handle = await page.evaluateHandle('document');
      const spy = sinon.spy(handle, disposeSymbol);
      {
        using _ = handle;
        handle.move();
      }
      expect(handle).toBeInstanceOf(ElementHandle);
      expect(spy.calledOnce).toBeTruthy();
      expect(handle.disposed).toBeFalsy();
    });
  });
});
