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
import os from 'os';

import expect from 'expect';
import {KeyInput} from 'puppeteer-core/internal/common/USKeyboardLayout.js';

import {
  getTestState,
  setupTestBrowserHooks,
  setupTestPageAndContextHooks,
} from './mocha-utils.js';
import assert from 'assert';

interface Dimensions {
  x: number;
  y: number;
  width: number;
  height: number;
}

function dimensions(): Dimensions {
  const rect = document.querySelector('textarea')!.getBoundingClientRect();
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

describe('Mouse', function () {
  setupTestBrowserHooks();
  setupTestPageAndContextHooks();
  it('should click the document', async () => {
    const {page} = getTestState();

    await page.evaluate(() => {
      (globalThis as any).clickPromise = new Promise(resolve => {
        document.addEventListener('click', event => {
          resolve({
            type: event.type,
            detail: event.detail,
            clientX: event.clientX,
            clientY: event.clientY,
            isTrusted: event.isTrusted,
            button: event.button,
          });
        });
      });
    });
    await page.mouse.click(50, 60);
    const event = await page.evaluate(() => {
      return (globalThis as any).clickPromise;
    });
    expect(event.type).toBe('click');
    expect(event.detail).toBe(1);
    expect(event.clientX).toBe(50);
    expect(event.clientY).toBe(60);
    expect(event.isTrusted).toBe(true);
    expect(event.button).toBe(0);
  });
  it('should resize the textarea', async () => {
    const {page, server} = getTestState();

    await page.goto(server.PREFIX + '/input/textarea.html');
    const {x, y, width, height} = await page.evaluate(dimensions);
    const mouse = page.mouse;
    await mouse.move(x + width - 4, y + height - 4);
    await mouse.down();
    await mouse.move(x + width + 100, y + height + 100);
    await mouse.up();
    const newDimensions = await page.evaluate(dimensions);
    expect(newDimensions.width).toBe(Math.round(width + 104));
    expect(newDimensions.height).toBe(Math.round(height + 104));
  });
  it('should select the text with mouse', async () => {
    const {page, server} = getTestState();

    await page.goto(server.PREFIX + '/input/textarea.html');
    await page.focus('textarea');
    const text =
      "This is the text that we are going to try to select. Let's see how it goes.";
    await page.keyboard.type(text);
    // Firefox needs an extra frame here after typing or it will fail to set the scrollTop
    await page.evaluate(() => {
      return new Promise(requestAnimationFrame);
    });
    await page.evaluate(() => {
      return (document.querySelector('textarea')!.scrollTop = 0);
    });
    const {x, y} = await page.evaluate(dimensions);
    await page.mouse.move(x + 2, y + 2);
    await page.mouse.down();
    await page.mouse.move(100, 100);
    await page.mouse.up();
    expect(
      await page.evaluate(() => {
        const textarea = document.querySelector('textarea')!;
        return textarea.value.substring(
          textarea.selectionStart,
          textarea.selectionEnd
        );
      })
    ).toBe(text);
  });
  it('should trigger hover state', async () => {
    const {page, server} = getTestState();

    await page.goto(server.PREFIX + '/input/scrollable.html');
    await page.hover('#button-6');
    expect(
      await page.evaluate(() => {
        return document.querySelector('button:hover')!.id;
      })
    ).toBe('button-6');
    await page.hover('#button-2');
    expect(
      await page.evaluate(() => {
        return document.querySelector('button:hover')!.id;
      })
    ).toBe('button-2');
    await page.hover('#button-91');
    expect(
      await page.evaluate(() => {
        return document.querySelector('button:hover')!.id;
      })
    ).toBe('button-91');
  });
  it('should trigger hover state with removed window.Node', async () => {
    const {page, server} = getTestState();

    await page.goto(server.PREFIX + '/input/scrollable.html');
    await page.evaluate(() => {
      // @ts-expect-error Expected.
      return delete window.Node;
    });
    await page.hover('#button-6');
    expect(
      await page.evaluate(() => {
        return document.querySelector('button:hover')!.id;
      })
    ).toBe('button-6');
  });
  it('should set modifier keys on click', async () => {
    const {page, server, isFirefox} = getTestState();

    await page.goto(server.PREFIX + '/input/scrollable.html');
    await page.evaluate(() => {
      return document.querySelector('#button-3')!.addEventListener(
        'mousedown',
        e => {
          return ((globalThis as any).lastEvent = e);
        },
        true
      );
    });
    const modifiers = new Map<KeyInput, string>([
      ['Shift', 'shiftKey'],
      ['Control', 'ctrlKey'],
      ['Alt', 'altKey'],
      ['Meta', 'metaKey'],
    ]);
    // In Firefox, the Meta modifier only exists on Mac
    if (isFirefox && os.platform() !== 'darwin') {
      modifiers.delete('Meta');
    }
    for (const [modifier, key] of modifiers) {
      await page.keyboard.down(modifier);
      await page.click('#button-3');
      if (
        !(await page.evaluate((mod: string) => {
          return (globalThis as any).lastEvent[mod];
        }, key))
      ) {
        throw new Error(key + ' should be true');
      }
      await page.keyboard.up(modifier);
    }
    await page.click('#button-3');
    for (const [modifier, key] of modifiers) {
      if (
        await page.evaluate((mod: string) => {
          return (globalThis as any).lastEvent[mod];
        }, key)
      ) {
        throw new Error(modifiers.get(modifier) + ' should be false');
      }
    }
  });
  it('should send mouse wheel events', async () => {
    const {page, server} = getTestState();

    await page.goto(server.PREFIX + '/input/wheel.html');
    const elem = (await page.$('div'))!;
    const boundingBoxBefore = (await elem.boundingBox())!;
    expect(boundingBoxBefore).toMatchObject({
      width: 115,
      height: 115,
    });

    await page.mouse.move(
      boundingBoxBefore.x + boundingBoxBefore.width / 2,
      boundingBoxBefore.y + boundingBoxBefore.height / 2
    );

    await page.mouse.wheel({deltaY: -100});
    const boundingBoxAfter = await elem.boundingBox();
    expect(boundingBoxAfter).toMatchObject({
      width: 230,
      height: 230,
    });
  });
  it('should tween mouse movement', async () => {
    const {page} = getTestState();

    await page.mouse.move(100, 100);
    await page.evaluate(() => {
      (globalThis as any).result = [];
      document.addEventListener('mousemove', event => {
        (globalThis as any).result.push([event.clientX, event.clientY]);
      });
    });
    await page.mouse.move(200, 300, {steps: 5});
    expect(await page.evaluate('result')).toEqual([
      [120, 140],
      [140, 180],
      [160, 220],
      [180, 260],
      [200, 300],
    ]);
  });
  // @see https://crbug.com/929806
  it('should work with mobile viewports and cross process navigations', async () => {
    const {page, server} = getTestState();

    await page.goto(server.EMPTY_PAGE);
    await page.setViewport({width: 360, height: 640, isMobile: true});
    await page.goto(server.CROSS_PROCESS_PREFIX + '/mobile.html');
    await page.evaluate(() => {
      document.addEventListener('click', event => {
        (globalThis as any).result = {x: event.clientX, y: event.clientY};
      });
    });

    await page.mouse.click(30, 40);

    expect(await page.evaluate('result')).toEqual({x: 30, y: 40});
  });

  describe("Drag n' Drop", () => {
    const getDragStateMask = () => {
      const {page} = getTestState();
      return page.evaluate(() => {
        return (
          (globalThis as any).didDragStart +
          ((globalThis as any).didDragEnter << 1) +
          ((globalThis as any).didDragOver << 2) +
          ((globalThis as any).didDrop << 3)
        );
      });
    };
    it('should drag', async () => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/input/drag-and-drop.html');
      expect(page.isDragInterceptionEnabled()).toBe(false);
      await page.setDragInterception(true);
      expect(page.isDragInterceptionEnabled()).toBe(true);
      const draggable = await page.$('#drag');
      assert(draggable);
      const dropzone = await page.$('#drop');
      assert(dropzone);
      const target = await draggable.clickablePoint();
      const destination = await dropzone.clickablePoint();

      await page.mouse.move(target.x, target.y);
      await page.mouse.down();
      await page.mouse.move(destination.x, destination.y);

      expect(page.mouse.isDragging()).toBe(true);
      expect(await getDragStateMask()).toBe(0b0111);
    });
    it('should drop', async () => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/input/drag-and-drop.html');
      expect(page.isDragInterceptionEnabled()).toBe(false);
      await page.setDragInterception(true);
      expect(page.isDragInterceptionEnabled()).toBe(true);
      const draggable = await page.$('#drag');
      assert(draggable);
      const dropzone = await page.$('#drop');
      assert(dropzone);
      const target = await draggable.clickablePoint();
      const destination = await dropzone.clickablePoint();

      await page.mouse.move(target.x, target.y);
      await page.mouse.down();
      await page.mouse.move(destination.x, destination.y);

      expect(page.mouse.isDragging()).toBe(true);
      expect(await getDragStateMask()).toBe(0b0111);

      await page.mouse.up();
      expect(await getDragStateMask()).toBe(0b1111);
    });
    it('should not drag without drag interception', async () => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/input/drag-and-drop.html');
      expect(page.isDragInterceptionEnabled()).toBe(false);
      const draggable = await page.$('#drag');
      assert(draggable);
      const dropzone = await page.$('#drop');
      assert(dropzone);
      const target = await draggable.clickablePoint();
      const destination = await dropzone.clickablePoint();

      await page.mouse.move(target.x, target.y);
      await page.mouse.down();
      await page.mouse.move(destination.x, destination.y);

      expect(page.mouse.isDragging()).toBe(false);

      // Note the drag is started because the move is converted to a drag
      // internally, but Puppeteer doesn't know because interception is
      // disabled. Technically the page is in an invalid state at this point
      // since mouse movements during a drag state is illegal.
      expect(await getDragStateMask()).toBe(0b0001);

      await page.mouse.up();
      expect(await getDragStateMask()).toBe(0b0001);
    });
  });
});
