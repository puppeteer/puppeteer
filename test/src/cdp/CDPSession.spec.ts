/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';
import type {Target} from 'puppeteer-core/internal/api/Target.js';
import {isErrorLike} from 'puppeteer-core/internal/util/ErrorLike.js';

import {getTestState, setupTestBrowserHooks} from '../mocha-utils.js';
import {waitEvent} from '../utils.js';

describe('Target.createCDPSession', function () {
  setupTestBrowserHooks();

  it('should work', async () => {
    const {page} = await getTestState();

    const client = await page.createCDPSession();

    await Promise.all([
      client.send('Runtime.enable'),
      client.send('Runtime.evaluate', {expression: 'window.foo = "bar"'}),
    ]);
    const foo = await page.evaluate(() => {
      return (globalThis as any).foo;
    });
    expect(foo).toBe('bar');
  });

  it('should not report created targets for custom CDP sessions', async () => {
    const {context} = await getTestState();
    let called = 0;
    const handler = async (target: Target) => {
      called++;
      if (called > 1) {
        throw new Error('Too many targets created');
      }
      await target.createCDPSession();
    };
    context.on('targetcreated', handler);
    await context.newPage();
    context.off('targetcreated', handler);
  });

  it('should send events', async () => {
    const {page, server} = await getTestState();

    const client = await page.createCDPSession();
    await client.send('Network.enable');
    const events: unknown[] = [];
    client.on('Network.requestWillBeSent', event => {
      events.push(event);
    });
    await Promise.all([
      waitEvent(client, 'Network.requestWillBeSent'),
      page.goto(server.EMPTY_PAGE),
    ]);
    expect(events).toHaveLength(1);
  });

  it('should not send extra events', async () => {
    const {page, server} = await getTestState();

    const client = await page.createCDPSession();
    await client.send('Network.enable');
    const events = new Set();
    client.on('*', name => {
      if (typeof name !== 'string') {
        return;
      }
      events.add((name as string).split('.').shift());
    });
    await Promise.all([
      waitEvent(client, 'Network.requestWillBeSent'),
      page.goto(server.EMPTY_PAGE),
    ]);
    expect(events.size).toBe(1);
    expect(events).toContain('Network');
  });

  it('should enable and disable domains independently', async () => {
    const {page} = await getTestState();

    const client = await page.createCDPSession();
    await client.send('Runtime.enable');
    await client.send('Debugger.enable');
    // JS coverage enables and then disables Debugger domain.
    await page.coverage.startJSCoverage();
    await page.coverage.stopJSCoverage();
    // generate a script in page and wait for the event.
    const [event] = await Promise.all([
      waitEvent(client, 'Debugger.scriptParsed'),
      page.evaluate('//# sourceURL=foo.js'),
    ]);
    // expect events to be dispatched.
    expect(event.url).toBe('foo.js');
  });
  it('should be able to detach session', async () => {
    const {page} = await getTestState();

    const client = await page.createCDPSession();
    await client.send('Runtime.enable');
    const evalResponse = await client.send('Runtime.evaluate', {
      expression: '1 + 2',
      returnByValue: true,
    });
    expect(evalResponse.result.value).toBe(3);
    await client.detach();
    let error!: Error;
    try {
      await client.send('Runtime.evaluate', {
        expression: '3 + 1',
        returnByValue: true,
      });
    } catch (error_) {
      if (isErrorLike(error_)) {
        error = error_ as Error;
      }
    }
    expect(error.message).toContain('Session closed.');
  });
  it('should throw nice errors', async () => {
    const {page} = await getTestState();

    const client = await page.createCDPSession();
    const error = await theSourceOfTheProblems().catch(error => {
      return error;
    });
    expect(error.stack).toContain('theSourceOfTheProblems');
    expect(error.message).toContain('ThisCommand.DoesNotExist');

    async function theSourceOfTheProblems() {
      // @ts-expect-error This fails in TS as it knows that command does not
      // exist but we want to have this tests for our users who consume in JS
      // not TS.
      await client.send('ThisCommand.DoesNotExist');
    }
  });

  it('should respect custom timeout', async () => {
    const {page} = await getTestState();

    const client = await page.createCDPSession();
    await expect(
      client.send(
        'Runtime.evaluate',
        {
          expression: 'new Promise(resolve => {})',
          awaitPromise: true,
        },
        {
          timeout: 50,
        },
      ),
    ).rejects.toThrowError(
      /Increase the 'protocolTimeout' setting in launch\/connect calls for a higher timeout if needed./gi,
    );
  });

  it('should expose the underlying connection', async () => {
    const {page} = await getTestState();

    const client = await page.createCDPSession();
    expect(client.connection()).toBeTruthy();
  });
});
