/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';
import type {WebWorker} from 'puppeteer-core/internal/api/WebWorker.js';
import {WebWorkerEvent} from 'puppeteer-core/internal/api/WebWorker.js';
import type {ConsoleMessage} from 'puppeteer-core/internal/common/ConsoleMessage.js';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';
import {waitEvent} from './utils.js';

describe('Workers', function () {
  setupTestBrowserHooks();

  it('Page.workers', async () => {
    const {page, server} = await getTestState();

    await Promise.all([
      waitEvent(page, 'workercreated'),
      page.goto(server.PREFIX + '/worker/worker.html'),
    ]);
    const worker = page.workers()[0]!;
    expect(worker.url()).toContain('worker.js');

    let result = '';
    // TODO: Chrome is flaky and workerFunction is sometimes not yet
    // defined. Generally, it should not be the case but it look like
    // there is a race condition between Runtime.evaluate and the
    // worker's main script execution.
    for (let i = 0; i < 5; i++) {
      try {
        result = await worker.evaluate(() => {
          return (globalThis as any).workerFunction();
        });
        break;
      } catch {}
      await new Promise(resolve => {
        return setTimeout(resolve, 200);
      });
    }
    expect(result).toBe('worker function result');

    await page.goto(server.EMPTY_PAGE);
    expect(page.workers()).toHaveLength(0);
  });
  it('should emit created and destroyed events', async () => {
    const {page} = await getTestState();

    const [worker, workerObj] = await Promise.all([
      waitEvent<WebWorker>(page, 'workercreated'),
      page.evaluateHandle(() => {
        return new Worker('data:text/javascript,1');
      }),
    ]);
    using workerThisObj = await worker.evaluateHandle(() => {
      return this;
    });
    const [workerDestroyed] = await Promise.all([
      waitEvent(page, 'workerdestroyed'),
      page.evaluate(worker => {
        return worker.terminate();
      }, workerObj),
    ]);

    expect(workerDestroyed).toBe(worker);
    const error = await workerThisObj.getProperty('self').catch(error => {
      return error;
    });
    expect(error.message).atLeastOneToContain([
      'Realm already destroyed.',
      'Execution context is not available in detached frame',
    ]);
  });
  it('should report console logs', async () => {
    const {page} = await getTestState();

    const [message] = await Promise.all([
      waitEvent(page, 'console'),
      page.evaluate(() => {
        return new Worker(`data:text/javascript,console.log(1)`);
      }),
    ]);
    expect(message.text()).toBe('1');
    expect(message.location()).toEqual({
      url: '',
      lineNumber: 0,
      columnNumber: 8,
    });
  });
  it('should work with console logs', async () => {
    const {page} = await getTestState();

    const logPromise = waitEvent<ConsoleMessage>(page, 'console');
    await page.evaluate(() => {
      return new Worker(`data:text/javascript,console.log(1,2,3,this)`);
    });
    const log = await logPromise;
    expect(log.text()).atLeastOneToContain([
      '1 2 3 JSHandle@object',
      '1 2 3 [object DedicatedWorkerGlobalScope]',
    ]);
    expect(log.args()).toHaveLength(4);
  });
  it('should have an execution context', async () => {
    const {page} = await getTestState();

    const workerCreatedPromise = waitEvent<WebWorker>(page, 'workercreated');
    await page.evaluate(() => {
      return new Worker(`data:text/javascript,console.log(1)`);
    });
    const worker = await workerCreatedPromise;
    expect(await worker.evaluate('1+1')).toBe(2);
  });
  it('should report errors', async () => {
    const {page} = await getTestState();

    const errorPromise = waitEvent<Error>(page, 'pageerror');
    await page.evaluate(() => {
      return new Worker(
        `data:text/javascript, throw new Error('this is my error');`,
      );
    });
    const errorLog = await errorPromise;
    expect(errorLog.message).toContain('this is my error');
  });

  it('can be closed', async () => {
    const {page, server} = await getTestState();

    await Promise.all([
      waitEvent(page, 'workercreated'),
      page.goto(server.PREFIX + '/worker/worker.html'),
    ]);
    const worker = page.workers()[0]!;
    expect(worker?.url()).toContain('worker.js');

    await Promise.all([waitEvent(page, 'workerdestroyed'), worker?.close()]);
  });

  it('should work with waitForNetworkIdle', async () => {
    const {page, server} = await getTestState();

    await Promise.all([
      waitEvent(page, 'workercreated'),
      page.goto(server.PREFIX + '/worker/worker.html', {
        waitUntil: 'networkidle0',
      }),
    ]);

    await page.waitForNetworkIdle({
      timeout: 3000,
    });
  });

  it('should retrieve body for main worker requests', async () => {
    const {page, server} = await getTestState();

    let testResponse = null;

    const workerUrl = server.PREFIX + '/worker/worker.js';

    page.on('response', async response => {
      if (response.request().url() === workerUrl) {
        testResponse = response;
      }
    });

    // Navigate to a page with a worker.
    await Promise.all([
      waitEvent(page, 'workercreated'),
      page.goto(server.PREFIX + '/worker/worker.html', {
        waitUntil: 'networkidle0',
      }),
    ]);

    await expect(testResponse!.text()).resolves.toContain(
      'hello from the worker',
    );
  });

  describe('console', function () {
    setupTestBrowserHooks();

    async function createWorker(page: any): Promise<WebWorker> {
      const workerCreatedPromise = waitEvent<WebWorker>(page, 'workercreated');
      await page.evaluate(() => {
        return new Worker(`data:text/javascript,1`);
      });
      return await workerCreatedPromise;
    }

    it('should work', async () => {
      const {page} = await getTestState();
      const worker = await createWorker(page);

      const [message] = await Promise.all([
        waitEvent<ConsoleMessage>(worker, WebWorkerEvent.Console),
        worker.evaluate(() => {
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
      const worker = await createWorker(page);

      const [message] = await Promise.all([
        waitEvent<ConsoleMessage>(worker, WebWorkerEvent.Console),
        worker.evaluate(() => {
          return console.log(new Error('test error'));
        }),
      ]);

      expect(message.text()).atLeastOneToContain([
        'Error: test error', // CDP expectation
        'JSHandle@error', // BiDi current behavior
      ]);
      expect(message.type()).toEqual('log');
      expect(message.args()).toHaveLength(1);
    });
    it('should return the first line of the error message in text()', async () => {
      const {page} = await getTestState();
      const worker = await createWorker(page);

      const [message] = await Promise.all([
        waitEvent<ConsoleMessage>(worker, WebWorkerEvent.Console),
        worker.evaluate(() => {
          return console.log(new Error('test error\nsecond line'));
        }),
      ]);
      expect(message.text()).atLeastOneToContain([
        'Error: test error', // CDP expectation
        'JSHandle@error', // BiDi current behavior
      ]);
      expect(message.type()).toEqual('log');
      expect(message.args()).toHaveLength(1);
    });
    it('should work for console.trace', async () => {
      const {page} = await getTestState();
      const worker = await createWorker(page);

      const [message] = await Promise.all([
        waitEvent<ConsoleMessage>(worker, WebWorkerEvent.Console),
        worker.evaluate(() => {
          console.trace('calling console.trace');
        }),
      ]);
      expect(message.type()).toBe('trace');
      expect(message.text()).toBe('calling console.trace');
    });

    it('should work for console.dir', async () => {
      const {page} = await getTestState();
      const worker = await createWorker(page);

      const [message] = await Promise.all([
        waitEvent<ConsoleMessage>(worker, WebWorkerEvent.Console),
        worker.evaluate(() => {
          console.dir('calling console.dir');
        }),
      ]);
      expect(message.type()).toBe('dir');
      expect(message.text()).toBe('calling console.dir');
    });

    it('should work for console.warn', async () => {
      const {page} = await getTestState();
      const worker = await createWorker(page);

      const [message] = await Promise.all([
        waitEvent<ConsoleMessage>(worker, WebWorkerEvent.Console),
        worker.evaluate(() => {
          console.warn('calling console.warn');
        }),
      ]);
      expect(message.type()).toBe('warn');
      expect(message.text()).toBe('calling console.warn');
    });

    it('should work for console.error', async () => {
      const {page} = await getTestState();
      const worker = await createWorker(page);

      const [message] = await Promise.all([
        waitEvent<ConsoleMessage>(worker, WebWorkerEvent.Console),
        worker.evaluate(() => {
          console.error('calling console.error');
        }),
      ]);
      expect(message.type()).toBe('error');
      expect(message.text()).toBe('calling console.error');
    });

    it('should work for console.log with promise', async () => {
      const {page} = await getTestState();
      const worker = await createWorker(page);

      const [message] = await Promise.all([
        waitEvent<ConsoleMessage>(worker, WebWorkerEvent.Console),
        worker.evaluate(() => {
          console.log(Promise.resolve('should not wait until resolved!'));
        }),
      ]);
      expect(message.type()).toBe('log');
      expect(message.text()).atLeastOneToContain([
        '[promise Promise]',
        'JSHandle@promise', // WebDriver BiDi expectation.
      ]);
    });
    it('should work for different console API calls with timing functions', async () => {
      const {page} = await getTestState();
      const worker = await createWorker(page);

      const messages: ConsoleMessage[] = [];
      worker.on(WebWorkerEvent.Console, msg => {
        return messages.push(msg);
      });
      // All console events will be reported before `worker.evaluate` is finished.
      await worker.evaluate(() => {
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
      const worker = await createWorker(page);

      const messages: ConsoleMessage[] = [];
      worker.on(WebWorkerEvent.Console, msg => {
        return messages.push(msg);
      });
      // All console events will be reported before `worker.evaluate` is finished.
      await worker.evaluate(() => {
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
    it('should return remote objects', async () => {
      const {page} = await getTestState();
      const worker = await createWorker(page);

      const logPromise = waitEvent<ConsoleMessage>(
        worker,
        WebWorkerEvent.Console,
      );
      await worker.evaluate(() => {
        (globalThis as any).test = 1;
        console.log(1, 2, 3, globalThis);
      });
      const log = await logPromise;

      expect(log.text()).atLeastOneToContain([
        '1 2 3 [object DedicatedWorkerGlobalScope]',
        '1 2 3 JSHandle@object', // WebDriver BiDi
      ]);
      expect(log.args()).toHaveLength(4);
      using property = await log.args()[3]!.getProperty('test');
      expect(await property.jsonValue()).toBe(1);
    });
    it('should have location and stack trace for console API calls', async () => {
      const {page} = await getTestState();
      const worker = await createWorker(page);

      const [message] = await Promise.all([
        waitEvent<ConsoleMessage>(worker, WebWorkerEvent.Console),
        worker.evaluate(() => {
          function consoleTrace() {
            console.trace('yellow');
          }
          consoleTrace();
        }),
      ]);
      expect(message.text()).toBe('yellow');
      expect(message.type()).toBe('trace');
      expect(message.location().url).toBeDefined();
      expect(message.stackTrace().length).toBeGreaterThan(0);
    });

    it('should not dispose handles when worker has listeners', async () => {
      const {page} = await getTestState();
      const worker = await createWorker(page);

      const [message] = await Promise.all([
        waitEvent<ConsoleMessage>(worker, WebWorkerEvent.Console),
        worker.evaluate(() => {
          return console.log({foo: 'bar'});
        }),
      ]);
      using handle = message.args()[0]!;
      expect(handle.disposed).toBe(false);
      expect(await handle.jsonValue()).toEqual({foo: 'bar'});
      await handle.dispose();
      expect(handle.disposed).toBe(true);
    });
  });
});
