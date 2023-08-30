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
import {MouseButton} from 'puppeteer-core/internal/api/Input.js';
import {Page} from 'puppeteer-core/internal/api/Page.js';
import {KeyInput} from 'puppeteer-core/internal/common/USKeyboardLayout.js';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';

interface ClickData {
  type: string;
  detail: number;
  clientX: number;
  clientY: number;
  isTrusted: boolean;
  button: number;
  buttons: number;
}

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

  it('should click the document', async () => {
    const {page} = await getTestState();

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
    const {page, server} = await getTestState();

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
    const {page, server} = await getTestState();

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
    const {page, server} = await getTestState();

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
    const {page, server} = await getTestState();

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
    const {page, server, isFirefox} = await getTestState();

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
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/wheel.html');
    using elem = (await page.$('div'))!;
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
    const {page} = await getTestState();

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
    const {page, server} = await getTestState();

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
  it('should throw if buttons are pressed incorrectly', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.EMPTY_PAGE);

    await page.mouse.down();
    await expect(page.mouse.down()).rejects.toBeInstanceOf(Error);
  });

  interface AddMouseDataListenersOptions {
    includeMove?: boolean;
  }

  const addMouseDataListeners = (
    page: Page,
    options: AddMouseDataListenersOptions = {}
  ) => {
    return page.evaluate(({includeMove}) => {
      const clicks: ClickData[] = [];
      const mouseEventListener = (event: MouseEvent) => {
        clicks.push({
          type: event.type,
          detail: event.detail,
          clientX: event.clientX,
          clientY: event.clientY,
          isTrusted: event.isTrusted,
          button: event.button,
          buttons: event.buttons,
        });
      };
      document.addEventListener('mousedown', mouseEventListener);
      if (includeMove) {
        document.addEventListener('mousemove', mouseEventListener);
      }
      document.addEventListener('mouseup', mouseEventListener);
      document.addEventListener('click', mouseEventListener);
      (window as unknown as {clicks: ClickData[]}).clicks = clicks;
    }, options);
  };

  it('should not throw if clicking in parallel', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.EMPTY_PAGE);
    await addMouseDataListeners(page);

    await Promise.all([page.mouse.click(0, 5), page.mouse.click(6, 10)]);

    const data = await page.evaluate(() => {
      return (window as unknown as {clicks: ClickData[]}).clicks;
    });
    const commonAttrs = {
      isTrusted: true,
      detail: 1,
      clientY: 5,
      clientX: 0,
      button: 0,
    };
    expect(data.splice(0, 3)).toMatchObject({
      0: {
        type: 'mousedown',
        buttons: 1,
        ...commonAttrs,
      },
      1: {
        type: 'mouseup',
        buttons: 0,
        ...commonAttrs,
      },
      2: {
        type: 'click',
        buttons: 0,
        ...commonAttrs,
      },
    });
    Object.assign(commonAttrs, {
      clientX: 6,
      clientY: 10,
    });
    expect(data).toMatchObject({
      0: {
        type: 'mousedown',
        buttons: 1,
        ...commonAttrs,
      },
      1: {
        type: 'mouseup',
        buttons: 0,
        ...commonAttrs,
      },
      2: {
        type: 'click',
        buttons: 0,
        ...commonAttrs,
      },
    });
  });

  it('should reset properly', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.EMPTY_PAGE);

    await page.mouse.move(5, 5);
    await Promise.all([
      page.mouse.down({button: MouseButton.Left}),
      page.mouse.down({button: MouseButton.Middle}),
      page.mouse.down({button: MouseButton.Right}),
    ]);

    await addMouseDataListeners(page, {includeMove: true});
    await page.mouse.reset();

    const data = await page.evaluate(() => {
      return (window as unknown as {clicks: ClickData[]}).clicks;
    });
    const commonAttrs = {
      isTrusted: true,
      clientY: 5,
      clientX: 5,
    };
    expect(data).toMatchObject([
      {
        ...commonAttrs,
        button: 0,
        buttons: 6,
        detail: 1,
        type: 'mouseup',
      },
      {
        ...commonAttrs,
        button: 0,
        buttons: 6,
        detail: 1,
        type: 'click',
      },
      {
        ...commonAttrs,
        button: 1,
        buttons: 2,
        detail: 0,
        type: 'mouseup',
      },
      {
        ...commonAttrs,
        button: 2,
        buttons: 0,
        detail: 0,
        type: 'mouseup',
      },
      {
        ...commonAttrs,
        button: 0,
        buttons: 0,
        clientX: 0,
        clientY: 0,
        detail: 0,
        type: 'mousemove',
      },
    ]);
  });
});
