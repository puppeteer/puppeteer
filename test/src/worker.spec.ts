/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';
import type {WebWorker} from 'puppeteer-core/internal/api/WebWorker.js';
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
    expect(worker?.url()).toContain('worker.js');

    expect(
      await worker?.evaluate(() => {
        return (globalThis as any).workerFunction();
      }),
    ).toBe('worker function result');

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
    expect(log.text()).toBe('1 2 3 JSHandle@object');
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
});
