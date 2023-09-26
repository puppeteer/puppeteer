/**
 * Copyright 2020 Google Inc. All rights reserved.
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
import type {WebWorker} from 'puppeteer-core/internal/cdp/WebWorker.js';
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
      })
    ).toBe('worker function result');

    await page.goto(server.EMPTY_PAGE);
    expect(page.workers()).toHaveLength(0);
  });
  it('should emit created and destroyed events', async () => {
    const {page} = await getTestState();

    const workerCreatedPromise = waitEvent<WebWorker>(page, 'workercreated');
    using workerObj = await page.evaluateHandle(() => {
      return new Worker('data:text/javascript,1');
    });
    const worker = await workerCreatedPromise;
    using workerThisObj = await worker.evaluateHandle(() => {
      return this;
    });
    const workerDestroyedPromise = waitEvent(page, 'workerdestroyed');
    await page.evaluate((workerObj: Worker) => {
      return workerObj.terminate();
    }, workerObj);
    expect(await workerDestroyedPromise).toBe(worker);
    const error = await workerThisObj.getProperty('self').catch(error => {
      return error;
    });
    expect(error.message).toContain('Most likely the worker has been closed.');
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
  it('should have JSHandles for console logs', async () => {
    const {page} = await getTestState();

    const logPromise = waitEvent<ConsoleMessage>(page, 'console');
    await page.evaluate(() => {
      return new Worker(`data:text/javascript,console.log(1,2,3,this)`);
    });
    const log = await logPromise;
    expect(log.text()).toBe('1 2 3 JSHandle@object');
    expect(log.args()).toHaveLength(4);
    expect(await (await log.args()[3]!.getProperty('origin')).jsonValue()).toBe(
      'null'
    );
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
        `data:text/javascript, throw new Error('this is my error');`
      );
    });
    const errorLog = await errorPromise;
    expect(errorLog.message).toContain('this is my error');
  });
});
