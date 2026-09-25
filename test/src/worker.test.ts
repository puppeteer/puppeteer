/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from 'chai';
import type {WebWorker} from 'puppeteer-core/internal/api/WebWorker.js';
import {WebWorkerEvent} from 'puppeteer-core/internal/api/WebWorker.js';
import type {ConsoleMessage} from 'puppeteer-core/internal/common/ConsoleMessage.js';

import {
  assertAtLeastOneToContain,
  getTestState,
  setupTestBrowserHooks,
} from './mocha-utils.js';
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
    assert.include(worker.url(), 'worker.js');

    const result = await worker.evaluate(() => {
      return (globalThis as any).workerFunction();
    });
    assert.strictEqual(result, 'worker function result');

    await page.goto(server.EMPTY_PAGE);
    assert.lengthOf(page.workers(), 0);
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

    assert.strictEqual(workerDestroyed, worker);
    const error = await workerThisObj.getProperty('self').catch(error => {
      return error;
    });
    assertAtLeastOneToContain(error.message, [
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
    assert.strictEqual(message.text(), '1');
    assert.deepEqual(message.location(), {
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
    assertAtLeastOneToContain(log.text(), [
      '1 2 3 JSHandle@object',
      '1 2 3 [object DedicatedWorkerGlobalScope]',
    ]);
    assert.lengthOf(log.args(), 4);
  });
  it('should have an execution context', async () => {
    const {page} = await getTestState();

    const workerCreatedPromise = waitEvent<WebWorker>(page, 'workercreated');
    await page.evaluate(() => {
      return new Worker(`data:text/javascript,console.log(1)`);
    });
    const worker = await workerCreatedPromise;
    assert.strictEqual(await worker.evaluate('1+1'), 2);
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
    assert.include(errorLog.message, 'this is my error');
  });

  it('can be closed', async () => {
    const {page, server} = await getTestState();

    await Promise.all([
      waitEvent(page, 'workercreated'),
      page.goto(server.PREFIX + '/worker/worker.html'),
    ]);
    const worker = page.workers()[0]!;
    assert.include(worker?.url(), 'worker.js');

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

    assert.include(await testResponse!.text(), 'hello from the worker');
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
      assertAtLeastOneToContain(message.text(), [
        'hello 5 [object Object]',
        'hello 5 JSHandle@object', // WebDriver BiDi
      ]);
      assert.deepEqual(message.type(), 'log');
      assert.lengthOf(message.args(), 3);

      assert.deepEqual(await message.args()[0]!.jsonValue(), 'hello');
      assert.deepEqual(await message.args()[1]!.jsonValue(), 5);
      assert.deepEqual(await message.args()[2]!.jsonValue(), {foo: 'bar'});
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

      assertAtLeastOneToContain(message.text(), [
        'Error: test error', // CDP expectation
        'JSHandle@error', // BiDi current behavior
      ]);
      assert.deepEqual(message.type(), 'log');
      assert.lengthOf(message.args(), 1);
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
      assertAtLeastOneToContain(message.text(), [
        'Error: test error', // CDP expectation
        'JSHandle@error', // BiDi current behavior
      ]);
      assert.deepEqual(message.type(), 'log');
      assert.lengthOf(message.args(), 1);
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
      assert.strictEqual(message.type(), 'trace');
      assert.strictEqual(message.text(), 'calling console.trace');
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
      assert.strictEqual(message.type(), 'dir');
      assert.strictEqual(message.text(), 'calling console.dir');
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
      assert.strictEqual(message.type(), 'warn');
      assert.strictEqual(message.text(), 'calling console.warn');
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
      assert.strictEqual(message.type(), 'error');
      assert.strictEqual(message.text(), 'calling console.error');
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
      assert.strictEqual(message.type(), 'log');
      assertAtLeastOneToContain(message.text(), [
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
      assert.deepEqual(
        messages.map(msg => {
          return msg.type();
        }),
        ['timeEnd'],
      );
      assert.include(messages[0]!.text(), 'calling console.time');
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
      assert.deepEqual(
        messages.map(msg => {
          return msg.type();
        }),
        ['startGroup', 'endGroup'],
      );

      // We should be able to check both messages, but Chrome report text
      assert.include(messages[0]!.text(), 'calling console.group');
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

      assertAtLeastOneToContain(log.text(), [
        '1 2 3 [object DedicatedWorkerGlobalScope]',
        '1 2 3 JSHandle@object', // WebDriver BiDi
      ]);
      assert.lengthOf(log.args(), 4);
      using property = await log.args()[3]!.getProperty('test');
      assert.strictEqual(await property.jsonValue(), 1);
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
      assert.strictEqual(message.text(), 'yellow');
      assert.strictEqual(message.type(), 'trace');
      assert.isDefined(message.location().url);
      assert.isAbove(message.stackTrace().length, 0);
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
      assert.isFalse(handle.disposed);
      assert.deepEqual(await handle.jsonValue(), {foo: 'bar'});
      await handle.dispose();
      assert.isTrue(handle.disposed);
    });
  });

  describe('waitForFunction', function () {
    setupTestBrowserHooks();

    it('should wait for a condition', async () => {
      const {page} = await getTestState();

      const workerCreatedPromise = waitEvent<WebWorker>(page, 'workercreated');
      await page.evaluate(() => {
        return new Worker(`data:text/javascript,
          setTimeout(() => {
            self.foo = true;
          }, 500);
        `);
      });
      const worker = await workerCreatedPromise;

      await worker.waitForFunction(() => {
        return (self as any).foo === true;
      });
    });

    it('should timeout if condition is not met', async () => {
      const {page} = await getTestState();

      const workerCreatedPromise = waitEvent<WebWorker>(page, 'workercreated');
      await page.evaluate(() => {
        return new Worker(`data:text/javascript,1`);
      });
      const worker = await workerCreatedPromise;

      let error: Error | undefined;
      try {
        await worker.waitForFunction(
          () => {
            return false;
          },
          {timeout: 50},
        );
      } catch (e) {
        error = e as Error;
      }
      assert.include(error?.message, 'Waiting failed');
    });

    it('should return a JSHandle to a string and parse it', async () => {
      const {page} = await getTestState();
      const workerCreatedPromise = waitEvent<WebWorker>(page, 'workercreated');
      await page.evaluate(() => {
        return new Worker(`data:text/javascript,
          setTimeout(() => {
            self.status = 'ready';
          }, 500);
        `);
      });
      const worker = await workerCreatedPromise;

      using handle = await worker.waitForFunction(() => {
        return (self as any).status === 'ready' ? 'Operation Success' : false;
      });

      const result = await handle.jsonValue();
      assert.strictEqual(result, 'Operation Success');
    });

    it('should work with JSHandle as an argument', async () => {
      const {page} = await getTestState();
      const workerCreatedPromise = waitEvent<WebWorker>(page, 'workercreated');
      await page.evaluate(() => {
        return new Worker(`data:text/javascript,
          self.targetValue = 42;
        `);
      });
      const worker = await workerCreatedPromise;

      // Create a handle in Node.js to pass into the worker
      using argHandle = await worker.evaluateHandle(() => {
        return 42;
      });

      await worker.waitForFunction(
        expected => {
          return (self as any).targetValue === expected;
        },
        {},
        argHandle,
      );
    });
  });
});
