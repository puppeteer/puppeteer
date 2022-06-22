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
import {ConsoleMessage} from '../../lib/cjs/puppeteer/common/ConsoleMessage.js';
import {WebWorker} from '../../lib/cjs/puppeteer/common/WebWorker.js';
import {
  describeFailsFirefox,
  getTestState,
  setupTestBrowserHooks,
  setupTestPageAndContextHooks,
} from './mocha-utils.js';
import {waitEvent} from './utils.js';

describeFailsFirefox('Workers', function () {
  setupTestBrowserHooks();
  setupTestPageAndContextHooks();
  it('Page.workers', async () => {
    const {page, server} = getTestState();

    await Promise.all([
      new Promise(x => {
        return page.once('workercreated', x);
      }),
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
    expect(page.workers().length).toBe(0);
  });
  it('should emit created and destroyed events', async () => {
    const {page} = getTestState();

    const workerCreatedPromise = new Promise<WebWorker>(x => {
      return page.once('workercreated', x);
    });
    const workerObj = await page.evaluateHandle(() => {
      return new Worker('data:text/javascript,1');
    });
    const worker = await workerCreatedPromise;
    const workerThisObj = await worker.evaluateHandle(() => {
      return this;
    });
    const workerDestroyedPromise = new Promise(x => {
      return page.once('workerdestroyed', x);
    });
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
    const {page} = getTestState();

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
    const {page} = getTestState();

    const logPromise = new Promise<ConsoleMessage>(x => {
      return page.on('console', x);
    });
    await page.evaluate(() => {
      return new Worker(`data:text/javascript,console.log(1,2,3,this)`);
    });
    const log = await logPromise;
    expect(log.text()).toBe('1 2 3 JSHandle@object');
    expect(log.args().length).toBe(4);
    expect(await (await log.args()[3]!.getProperty('origin')).jsonValue()).toBe(
      'null'
    );
  });
  it('should have an execution context', async () => {
    const {page} = getTestState();

    const workerCreatedPromise = new Promise<WebWorker>(x => {
      return page.once('workercreated', x);
    });
    await page.evaluate(() => {
      return new Worker(`data:text/javascript,console.log(1)`);
    });
    const worker = await workerCreatedPromise;
    expect(await (await worker.executionContext()).evaluate('1+1')).toBe(2);
  });
  it('should report errors', async () => {
    const {page} = getTestState();

    const errorPromise = new Promise<Error>(x => {
      return page.on('pageerror', x);
    });
    await page.evaluate(() => {
      return new Worker(
        `data:text/javascript, throw new Error('this is my error');`
      );
    });
    const errorLog = await errorPromise;
    expect(errorLog.message).toContain('this is my error');
  });
});
