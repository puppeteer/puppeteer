/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';
import type {ConsoleMessage} from 'puppeteer-core/internal/common/ConsoleMessage.js';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';
import {html, waitEvent} from './utils.js';

describe('console', function () {
  setupTestBrowserHooks();
  it.only('measure performance', async () => {
    const {page} = await getTestState();
    await page.setContent(html`<div id="some-counter"></div>`);

    // Measurement
    const ITERATIONS_PER_RUN = 1000;
    const latencies: number[] = [];
    for (let i = 0; i < ITERATIONS_PER_RUN; i++) {
      const start = performance.now();
      await page.evaluate(
        (index, id) => {
          // Change DOM.
          document.getElementById(id)!.innerText = `Iter: ${index + 1}`;
          // Return an object.
          return {
            iteration: index + 1,
            timestamp: Date.now(),
            someArray: [1, 2, 3],
            someObject: {a: 1, b: 2, c: 3},
            someString: 'hello',
            someNumber: 123,
            someBoolean: true,
            someNull: null,
            someUndefined: undefined,
          };
        },
        i,
        'some-counter',
      );
      const end = performance.now();
      latencies.push(end - start);
    }

    latencies.sort((a, b) => {
      return a - b;
    });
    const mean =
      latencies.reduce((a, b) => {
        return a + b;
      }, 0) / latencies.length;
    const median = latencies[Math.floor(latencies.length / 2)];
    const p10 = latencies[Math.floor(latencies.length * 0.1)];

    console.log(`Mean: ${mean}ms`);
    console.log(`Median: ${median}ms`);
    console.log(`p10: ${p10}ms`);
  });
  it('should work', async () => {
    const {page} = await getTestState();

    const [message] = await Promise.all([
      waitEvent<ConsoleMessage>(page, 'console'),
      page.evaluate(() => {
        return console.log('hello', 5, {foo: 'bar'});
      }),
    ]);
    expect(message.text()).atLeastOneToContain([
      'hello 5 [object Object]',
      'hello 5 JSHandle@object', // WebDriver BiDi
    ]);
    expect(message.type()).toEqual('log');
    expect(message.args()).toHaveLength(3);

    expect(await message.args()[0]!.jsonValue()).toEqual('hello');
    expect(await message.args()[1]!.jsonValue()).toEqual(5);
    expect(await message.args()[2]!.jsonValue()).toEqual({foo: 'bar'});
  });
  it('should work for Error instances', async () => {
    const {page} = await getTestState();

    const [message] = await Promise.all([
      waitEvent<ConsoleMessage>(page, 'console'),
      page.evaluate(() => {
        return console.log(new Error('test error'));
      }),
    ]);
    expect(message.text()).toEqual('Error: test error');
    expect(message.type()).toEqual('log');
    expect(message.args()).toHaveLength(1);
  });
  it('should return the first line of the error message in text()', async () => {
    const {page} = await getTestState();

    const [message] = await Promise.all([
      waitEvent<ConsoleMessage>(page, 'console'),
      page.evaluate(() => {
        return console.log(new Error('test error\nsecond line'));
      }),
    ]);
    expect(message.text()).toEqual('Error: test error');
    expect(message.type()).toEqual('log');
    expect(message.args()).toHaveLength(1);
  });
  it('should work on script call right after navigation', async () => {
    const {page} = await getTestState();

    const [message] = await Promise.all([
      waitEvent<ConsoleMessage>(page, 'console'),
      page.goto(
        // Firefox prints warn if <!DOCTYPE html> is not present
        `data:text/html,<!DOCTYPE html><script>console.log('SOME_LOG_MESSAGE');</script>`,
      ),
    ]);

    expect(message.text()).toEqual('SOME_LOG_MESSAGE');
  });
  it('should work for different console API calls with logging functions', async () => {
    const {page} = await getTestState();

    const messages: ConsoleMessage[] = [];
    page.on('console', msg => {
      return messages.push(msg);
    });
    // All console events will be reported before `page.evaluate` is finished.
    await page.evaluate(() => {
      console.trace('calling console.trace');
      console.dir('calling console.dir');
      console.warn('calling console.warn');
      console.error('calling console.error');
      console.log(Promise.resolve('should not wait until resolved!'));
    });
    expect(
      messages.map(msg => {
        return msg.type();
      }),
    ).toEqual(['trace', 'dir', 'warn', 'error', 'log']);
    const texts = messages.map(msg => {
      return msg.text();
    });
    try {
      expect(texts).toEqual([
        'calling console.trace',
        'calling console.dir',
        'calling console.warn',
        'calling console.error',
        '[promise Promise]',
      ]);
    } catch {
      // WebDriver BiDi expectation.
      expect(texts).toEqual([
        'calling console.trace',
        'calling console.dir',
        'calling console.warn',
        'calling console.error',
        'JSHandle@promise',
      ]);
    }
  });
  it('should work for different console API calls with timing functions', async () => {
    const {page} = await getTestState();

    const messages: any[] = [];
    page.on('console', msg => {
      return messages.push(msg);
    });
    // All console events will be reported before `page.evaluate` is finished.
    await page.evaluate(() => {
      // A pair of time/timeEnd generates only one Console API call.
      console.time('calling console.time');
      console.timeEnd('calling console.time');
    });
    expect(
      messages.map(msg => {
        return msg.type();
      }),
    ).toEqual(['timeEnd']);
    expect(messages[0]!.text()).toContain('calling console.time');
  });
  it('should work for different console API calls with group functions', async () => {
    const {page} = await getTestState();

    const messages: ConsoleMessage[] = [];
    page.on('console', msg => {
      return messages.push(msg);
    });
    // All console events will be reported before `page.evaluate` is finished.
    await page.evaluate(() => {
      console.group('calling console.group');
      console.groupEnd();
    });
    expect(
      messages.map(msg => {
        return msg.type();
      }),
    ).toEqual(['startGroup', 'endGroup']);

    // We should be able to check both messages, but Chrome report text
    expect(messages[0]!.text()).toContain('calling console.group');
  });
  it('should not fail for window object', async () => {
    const {page} = await getTestState();

    const [message] = await Promise.all([
      waitEvent<ConsoleMessage>(page, 'console'),
      page.evaluate(() => {
        return console.error(window);
      }),
    ]);
    expect(message.text()).atLeastOneToContain([
      '[object Object]',
      '[object Window]',
      'JSHandle@window', // WebDriver BiDi
    ]);
  });
  it('should return remote objects', async () => {
    const {page} = await getTestState();

    const logPromise = waitEvent<ConsoleMessage>(page, 'console');
    await page.evaluate(() => {
      (globalThis as any).test = 1;
      console.log(1, 2, 3, globalThis);
    });
    const log = await logPromise;

    expect(log.text()).atLeastOneToContain([
      '1 2 3 [object Object]',
      '1 2 3 [object Window]',
      '1 2 3 JSHandle@object', // WebDriver BiDi
    ]);
    expect(log.args()).toHaveLength(4);
    using property = await log.args()[3]!.getProperty('test');
    expect(await property.jsonValue()).toBe(1);
  });
  it('should trigger correct Log', async () => {
    const {page, server, isChrome} = await getTestState();

    await page.goto(`http://domain1.test:${server.PORT}/empty.html`);
    const [message] = await Promise.all([
      waitEvent(page, 'console'),
      page.evaluate(async url => {
        return await fetch(url).catch(() => {});
      }, `http://domain2.test:${server.PORT}/empty.html`),
    ]);
    expect(message.text()).toContain('Access-Control-Allow-Origin');
    if (isChrome) {
      expect(message.type()).toEqual('error');
    } else {
      expect(message.type()).toEqual('warn');
    }
  });
  it('should have location when fetch fails', async () => {
    const {page, server} = await getTestState();

    // The point of this test is to make sure that we report console messages from
    // Log domain: https://vanilla.aslushnikov.com/?Log.entryAdded
    await page.goto(server.EMPTY_PAGE);
    const [message] = await Promise.all([
      waitEvent(page, 'console'),
      page.setContent(
        html`<script>
          fetch('http://wat');
        </script>`,
      ),
    ]);
    expect(message.text()).toContain(`ERR_NAME_NOT_RESOLVED`);
    expect(message.type()).toEqual('error');
    expect(message.location()).toEqual({
      url: 'http://wat/',
      lineNumber: undefined,
    });
  });
  it('should have location and stack trace for console API calls', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.EMPTY_PAGE);
    const [message] = await Promise.all([
      waitEvent(page, 'console'),
      page.goto(server.PREFIX + '/consoletrace.html'),
    ]);
    expect(message.text()).toBe('yellow');
    expect(message.type()).toBe('trace');
    expect(message.location()).toEqual({
      url: server.PREFIX + '/consoletrace.html',
      lineNumber: 8,
      columnNumber: 16,
    });
    expect(message.stackTrace()).toEqual([
      {
        url: server.PREFIX + '/consoletrace.html',
        lineNumber: 8,
        columnNumber: 16,
      },
      {
        url: server.PREFIX + '/consoletrace.html',
        lineNumber: 11,
        columnNumber: 8,
      },
      {
        url: server.PREFIX + '/consoletrace.html',
        lineNumber: 13,
        columnNumber: 6,
      },
    ]);
  });
  // @see https://github.com/puppeteer/puppeteer/issues/3865
  it('should not throw when there are console messages in detached iframes', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.EMPTY_PAGE);
    await page.evaluate(async () => {
      // 1. Create a popup that Puppeteer is not connected to.
      const win = window.open(
        window.location.href,
        'Title',
        'toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=780,height=200,top=0,left=0',
      )!;
      await new Promise(x => {
        return (win.onload = x);
      });
      // 2. In this popup, create an iframe that console.logs a message.
      win.document.body.innerHTML = `<iframe src='/consolelog.html'></iframe>`;
      const frame = win.document.querySelector('iframe')!;
      await new Promise(x => {
        return (frame.onload = x);
      });
      // 3. After that, remove the iframe.
      frame.remove();
    });
    // 4. The target will always be the last one.
    const popupTarget = page.browserContext().targets().at(-1)!;
    // 5. Connect to the popup and make sure it doesn't throw and is not the same page.
    expect(await popupTarget.page()).not.toBe(page);
  });
});
