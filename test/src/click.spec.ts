/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';
import {KnownDevices} from 'puppeteer';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';
import {attachFrame} from './utils.js';

describe('Page.click', function () {
  setupTestBrowserHooks();

  it('should click the button', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/button.html');
    await page.click('button');
    expect(
      await page.evaluate(() => {
        return (globalThis as any).result;
      }),
    ).toBe('Clicked');
  });
  it('should click svg', async () => {
    const {page} = await getTestState();

    await page.setContent(`
        <svg height="100" width="100">
          <circle onclick="javascript:window.__CLICKED=42" cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" />
        </svg>
      `);
    await page.click('circle');
    expect(
      await page.evaluate(() => {
        return (globalThis as any).__CLICKED;
      }),
    ).toBe(42);
  });
  it('should click the button if window.Node is removed', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/button.html');
    await page.evaluate(() => {
      // @ts-expect-error Expected.
      return delete window.Node;
    });
    await page.click('button');
    expect(
      await page.evaluate(() => {
        return (globalThis as any).result;
      }),
    ).toBe('Clicked');
  });
  // @see https://github.com/puppeteer/puppeteer/issues/4281
  it('should click on a span with an inline element inside', async () => {
    const {page} = await getTestState();

    await page.setContent(`
        <style>
        span::before {
          content: 'q';
        }
        </style>
        <span onclick='javascript:window.CLICKED=42'></span>
      `);
    await page.click('span');
    expect(
      await page.evaluate(() => {
        return (globalThis as any).CLICKED;
      }),
    ).toBe(42);
  });
  it('should not throw UnhandledPromiseRejection when page closes', async () => {
    const {page} = await getTestState();

    const newPage = await page.browser().newPage();
    await Promise.all([newPage.close(), newPage.mouse.click(1, 2)]).catch(
      () => {},
    );
  });
  it('should click the button after navigation', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/button.html');
    await page.click('button');
    await page.goto(server.PREFIX + '/input/button.html');
    await page.click('button');
    expect(
      await page.evaluate(() => {
        return (globalThis as any).result;
      }),
    ).toBe('Clicked');
  });
  it('should click with disabled javascript', async () => {
    const {page, server} = await getTestState();

    await page.setJavaScriptEnabled(false);
    await page.goto(server.PREFIX + '/wrappedlink.html');
    await Promise.all([page.click('a'), page.waitForNavigation()]);
    expect(page.url()).toBe(server.PREFIX + '/wrappedlink.html#clicked');
  });
  it('should scroll and click with disabled javascript', async () => {
    const {page, server} = await getTestState();

    await page.setJavaScriptEnabled(false);
    await page.goto(server.PREFIX + '/wrappedlink.html');
    using body = await page.waitForSelector('body');
    await body!.evaluate(el => {
      el.style.paddingTop = '3000px';
    });
    await Promise.all([page.click('a'), page.waitForNavigation()]);
    expect(page.url()).toBe(server.PREFIX + '/wrappedlink.html#clicked');
  });
  it('should click when one of inline box children is outside of viewport', async () => {
    const {page} = await getTestState();

    await page.setContent(`
        <style>
        i {
          position: absolute;
          top: -1000px;
        }
        </style>
        <span onclick='javascript:window.CLICKED = 42;'><i>woof</i><b>doggo</b></span>
      `);
    await page.click('span');
    expect(
      await page.evaluate(() => {
        return (globalThis as any).CLICKED;
      }),
    ).toBe(42);
  });
  it('should select the text by triple clicking', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/textarea.html');
    await page.focus('textarea');
    const text =
      "This is the text that we are going to try to select. Let's see how it goes.";
    await page.keyboard.type(text);
    await page.evaluate(() => {
      (window as any).clicks = [];
      window.addEventListener('click', event => {
        return (window as any).clicks.push(event.detail);
      });
    });
    await page.click('textarea', {count: 3});
    expect(
      await page.evaluate(() => {
        return (window as any).clicks;
      }),
    ).toMatchObject({0: 1, 1: 2, 2: 3});
    expect(
      await page.evaluate(() => {
        const textarea = document.querySelector('textarea');
        return textarea!.value.substring(
          textarea!.selectionStart,
          textarea!.selectionEnd,
        );
      }),
    ).toBe(text);
  });
  it('should click offscreen buttons', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/offscreenbuttons.html');
    const messages: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        return messages.push(msg.text());
      }
      return;
    });
    for (let i = 0; i < 11; ++i) {
      // We might've scrolled to click a button - reset to (0, 0).
      await page.evaluate(() => {
        return window.scrollTo(0, 0);
      });
      await page.click(`#btn${i}`);
    }
    expect(messages).toEqual([
      'button #0 clicked',
      'button #1 clicked',
      'button #2 clicked',
      'button #3 clicked',
      'button #4 clicked',
      'button #5 clicked',
      'button #6 clicked',
      'button #7 clicked',
      'button #8 clicked',
      'button #9 clicked',
      'button #10 clicked',
    ]);
  });

  it('should click wrapped links', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/wrappedlink.html');
    await page.click('a');
    expect(
      await page.evaluate(() => {
        return (globalThis as any).__clicked;
      }),
    ).toBe(true);
  });

  it('should click on checkbox input and toggle', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/checkbox.html');
    expect(
      await page.evaluate(() => {
        return (globalThis as any).result.check;
      }),
    ).toBe(null);
    await page.click('input#agree');
    expect(
      await page.evaluate(() => {
        return (globalThis as any).result.check;
      }),
    ).toBe(true);
    expect(
      await page.evaluate(() => {
        return (globalThis as any).result.events;
      }),
    ).toEqual([
      'mouseover',
      'mouseenter',
      'mousemove',
      'mousedown',
      'mouseup',
      'click',
      'input',
      'change',
    ]);
    await page.click('input#agree');
    expect(
      await page.evaluate(() => {
        return (globalThis as any).result.check;
      }),
    ).toBe(false);
  });

  it('should click on checkbox label and toggle', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/checkbox.html');
    expect(
      await page.evaluate(() => {
        return (globalThis as any).result.check;
      }),
    ).toBe(null);
    await page.click('label[for="agree"]');
    expect(
      await page.evaluate(() => {
        return (globalThis as any).result.check;
      }),
    ).toBe(true);
    expect(
      await page.evaluate(() => {
        return (globalThis as any).result.events;
      }),
    ).toEqual(['click', 'input', 'change']);
    await page.click('label[for="agree"]');
    expect(
      await page.evaluate(() => {
        return (globalThis as any).result.check;
      }),
    ).toBe(false);
  });

  it('should fail to click a missing button', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/button.html');
    let error!: Error;
    await page.click('button.does-not-exist').catch(error_ => {
      return (error = error_);
    });
    expect(error.message).toBe(
      'No element found for selector: button.does-not-exist',
    );
  });
  // @see https://github.com/puppeteer/puppeteer/issues/161
  it('should not hang with touch-enabled viewports', async () => {
    const {page} = await getTestState();

    await page.setViewport(KnownDevices['iPhone 6'].viewport);
    await page.mouse.down();
    await page.mouse.move(100, 10);
    await page.mouse.up();
  });
  it('should scroll and click the button', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/scrollable.html');
    await page.click('#button-5');
    expect(
      await page.evaluate(() => {
        return document.querySelector('#button-5')!.textContent;
      }),
    ).toBe('clicked');
    await page.click('#button-80');
    expect(
      await page.evaluate(() => {
        return document.querySelector('#button-80')!.textContent;
      }),
    ).toBe('clicked');
  });
  it('should double click the button', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/button.html');
    await page.evaluate(() => {
      (globalThis as any).double = false;
      const button = document.querySelector('button');
      button!.addEventListener('dblclick', () => {
        (globalThis as any).double = true;
      });
    });
    using button = (await page.$('button'))!;
    await button!.click({count: 2});
    expect(await page.evaluate('double')).toBe(true);
    expect(await page.evaluate('result')).toBe('Clicked');
  });
  it('should click a partially obscured button', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/button.html');
    await page.evaluate(() => {
      const button = document.querySelector('button');
      button!.textContent = 'Some really long text that will go offscreen';
      button!.style.position = 'absolute';
      button!.style.left = '368px';
    });
    await page.click('button');
    expect(
      await page.evaluate(() => {
        return (globalThis as any).result;
      }),
    ).toBe('Clicked');
  });
  it('should click a rotated button', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/rotatedButton.html');
    await page.click('button');
    expect(
      await page.evaluate(() => {
        return (globalThis as any).result;
      }),
    ).toBe('Clicked');
  });
  it('should fire contextmenu event on right click', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/scrollable.html');
    await page.click('#button-8', {button: 'right'});
    expect(
      await page.evaluate(() => {
        return document.querySelector('#button-8')!.textContent;
      }),
    ).toBe('context menu');
  });
  it('should fire aux event on middle click', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/scrollable.html');
    await page.click('#button-8', {button: 'middle'});
    expect(
      await page.evaluate(() => {
        return document.querySelector('#button-8')!.textContent;
      }),
    ).toBe('aux click');
  });
  it('should fire back click', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/scrollable.html');
    await page.click('#button-8', {button: 'back'});
    expect(
      await page.evaluate(() => {
        return document.querySelector('#button-8')!.textContent;
      }),
    ).toBe('back click');
  });
  it('should fire forward click', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/scrollable.html');
    await page.click('#button-8', {button: 'forward'});
    expect(
      await page.evaluate(() => {
        return document.querySelector('#button-8')!.textContent;
      }),
    ).toBe('forward click');
  });
  // @see https://github.com/puppeteer/puppeteer/issues/206
  it('should click links which cause navigation', async () => {
    const {page, server} = await getTestState();

    await page.setContent(`<a href="${server.EMPTY_PAGE}">empty.html</a>`);
    // This await should not hang.
    await page.click('a');
  });
  it('should click the button inside an iframe', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.EMPTY_PAGE);
    await page.setContent('<div style="width:100px;height:100px">spacer</div>');
    await attachFrame(
      page,
      'button-test',
      server.PREFIX + '/input/button.html',
    );
    const frame = page.frames()[1];
    using button = await frame!.$('button');
    await button!.click();
    expect(
      await frame!.evaluate(() => {
        return (globalThis as any).result;
      }),
    ).toBe('Clicked');
  });
  // @see https://github.com/puppeteer/puppeteer/issues/4110
  it('should click the button with fixed position inside an iframe', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.EMPTY_PAGE);
    await page.setViewport({width: 500, height: 500});
    await page.setContent(
      '<div style="width:100px;height:2000px">spacer</div>',
    );
    await attachFrame(
      page,
      'button-test',
      server.CROSS_PROCESS_PREFIX + '/input/button.html',
    );
    const frame = page.frames()[1];
    await frame!.$eval('button', button => {
      return button.style.setProperty('position', 'fixed');
    });
    await frame!.click('button');
    expect(
      await frame!.evaluate(() => {
        return (globalThis as any).result;
      }),
    ).toBe('Clicked');
  });
  it('should click the button with deviceScaleFactor set', async () => {
    const {page, server} = await getTestState();

    await page.setViewport({width: 400, height: 400, deviceScaleFactor: 5});
    expect(
      await page.evaluate(() => {
        return window.devicePixelRatio;
      }),
    ).toBe(5);
    await page.setContent('<div style="width:100px;height:100px">spacer</div>');
    await attachFrame(
      page,
      'button-test',
      server.PREFIX + '/input/button.html',
    );
    const frame = page.frames()[1];
    using button = await frame!.$('button');
    await button!.click();
    expect(
      await frame!.evaluate(() => {
        return (globalThis as any).result;
      }),
    ).toBe('Clicked');
  });
});
