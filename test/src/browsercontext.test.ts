/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from 'chai';
import {TimeoutError} from 'puppeteer';
import type {Page} from 'puppeteer-core/internal/api/Page.js';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';
import {waitEvent} from './utils.js';

describe('BrowserContext', function () {
  setupTestBrowserHooks();

  it('should have default context', async () => {
    const {browser} = await getTestState({
      skipContextCreation: true,
    });

    assert.isAtLeast(browser.browserContexts().length, 1);
  });
  it('should not be able to close default context', async () => {
    const {browser} = await getTestState({
      skipContextCreation: true,
    });

    const defaultContext = browser.defaultBrowserContext();
    assert.isDefined(defaultContext);

    const error = await defaultContext!.close().catch(error => {
      return error;
    });
    assert.instanceOf(error, Error);
    assert.include(error.message, 'cannot be closed');
  });
  it('should create new context', async () => {
    const {browser} = await getTestState({
      skipContextCreation: true,
    });

    const contextCount = browser.browserContexts().length;
    assert.isAtLeast(contextCount, 1);
    const context = await browser.createBrowserContext();
    assert.lengthOf(browser.browserContexts(), contextCount + 1);
    assert.isTrue(browser.browserContexts().indexOf(context) !== -1);
    await context.close();
    assert.lengthOf(browser.browserContexts(), contextCount);
  });
  it('should close all belonging targets once closing context', async () => {
    const {browser} = await getTestState({
      skipContextCreation: true,
    });

    assert.lengthOf(await browser.pages(), 1);

    const context = await browser.createBrowserContext();
    await context.newPage();
    assert.lengthOf(await browser.pages(), 2);
    assert.lengthOf(await context.pages(), 1);

    await context.close();
    assert.lengthOf(await browser.pages(), 1);
  });
  it('window.open should use parent tab context', async () => {
    const {browser, server, page, context} = await getTestState();

    await page.goto(server.EMPTY_PAGE);
    const [popupTarget] = await Promise.all([
      waitEvent(browser, 'targetcreated'),
      page.evaluate(url => {
        return window.open(url);
      }, server.EMPTY_PAGE),
    ]);
    assert.strictEqual(popupTarget.browserContext(), context);
  });
  it('should fire target events', async () => {
    const {server, context} = await getTestState();

    const events: string[] = [];
    context.on('targetcreated', target => {
      events.push('CREATED: ' + target.url());
    });
    context.on('targetchanged', target => {
      events.push('CHANGED: ' + target.url());
    });
    context.on('targetdestroyed', target => {
      events.push('DESTROYED: ' + target.url());
    });
    const page = await context.newPage();
    await page.goto(server.EMPTY_PAGE);
    await page.close();
    assert.deepEqual(events, [
      'CREATED: about:blank',
      `CHANGED: ${server.EMPTY_PAGE}`,
      `DESTROYED: ${server.EMPTY_PAGE}`,
    ]);
  });
  it('should wait for a target', async () => {
    const {server, context} = await getTestState();

    let resolved = false;

    const targetPromise = context.waitForTarget(target => {
      return target.url() === server.EMPTY_PAGE;
    });
    targetPromise
      .then(() => {
        return (resolved = true);
      })
      .catch(error => {
        resolved = true;
        if (error instanceof TimeoutError) {
          console.error(error);
        } else {
          throw error;
        }
      });
    const page = await context.newPage();
    assert.isFalse(resolved);
    await page.goto(server.EMPTY_PAGE);
    try {
      const target = await targetPromise;
      assert.strictEqual(await target.page(), page);
    } catch (error) {
      if (error instanceof TimeoutError) {
        console.error(error);
      } else {
        throw error;
      }
    }
  });

  it('should timeout waiting for a non-existent target', async () => {
    const {browser, server} = await getTestState();

    const context = await browser.createBrowserContext();
    const error = await context
      .waitForTarget(
        target => {
          return target.url() === server.EMPTY_PAGE;
        },
        {
          timeout: 1,
        },
      )
      .catch(error_ => {
        return error_;
      });
    assert.instanceOf(error, TimeoutError);
    await context.close();
  });

  it('should isolate localStorage and cookies', async () => {
    const {browser, server} = await getTestState({
      skipContextCreation: true,
    });

    const contextCount = browser.browserContexts().length;
    // Create two incognito contexts.
    const context1 = await browser.createBrowserContext();
    const context2 = await browser.createBrowserContext();
    assert.lengthOf(context1.targets(), 0);
    assert.lengthOf(context2.targets(), 0);

    // Create a page in first incognito context.
    const page1 = await context1.newPage();
    await page1.goto(server.EMPTY_PAGE);
    await page1.evaluate(() => {
      localStorage.setItem('name', 'page1');
      document.cookie = 'name=page1';
    });

    assert.lengthOf(context1.targets(), 1);
    assert.lengthOf(context2.targets(), 0);

    // Create a page in second incognito context.
    const page2 = await context2.newPage();
    await page2.goto(server.EMPTY_PAGE);
    await page2.evaluate(() => {
      localStorage.setItem('name', 'page2');
      document.cookie = 'name=page2';
    });

    assert.lengthOf(context1.targets(), 1);
    assert.strictEqual(await context1.targets()[0]?.page(), page1);
    assert.lengthOf(context2.targets(), 1);
    assert.strictEqual(await context2.targets()[0]?.page(), page2);

    // Make sure pages don't share localstorage or cookies.
    assert.strictEqual(
      await page1.evaluate(() => {
        return localStorage.getItem('name');
      }),
      'page1',
    );
    assert.strictEqual(
      await page1.evaluate(() => {
        return document.cookie;
      }),
      'name=page1',
    );
    assert.strictEqual(
      await page2.evaluate(() => {
        return localStorage.getItem('name');
      }),
      'page2',
    );
    assert.strictEqual(
      await page2.evaluate(() => {
        return document.cookie;
      }),
      'name=page2',
    );

    // Cleanup contexts.
    await Promise.all([context1.close(), context2.close()]);
    assert.lengthOf(browser.browserContexts(), contextCount);
  });

  it('should work across sessions', async () => {
    const {browser, puppeteer} = await getTestState({
      skipContextCreation: true,
    });

    assert.lengthOf(browser.browserContexts(), 1);
    const context = await browser.createBrowserContext();
    try {
      assert.lengthOf(browser.browserContexts(), 2);
      using remoteBrowser = await puppeteer.connect({
        browserWSEndpoint: browser.wsEndpoint(),
        protocol: browser.protocol,
      });
      const contexts = remoteBrowser.browserContexts();
      assert.lengthOf(contexts, 2);
    } finally {
      await context.close();
    }
  });

  it('should provide a context id', async () => {
    const {browser} = await getTestState({
      skipContextCreation: true,
    });

    const contextCount = browser.browserContexts().length;

    assert.isAtLeast(contextCount, 1);

    const context = await browser.createBrowserContext();
    assert.lengthOf(browser.browserContexts(), contextCount + 1);
    assert.isDefined(context.id);
    await context.close();
  });

  describe('BrowserContext.overridePermissions', function () {
    function getPermission(page: Page, name: PermissionName) {
      return page.evaluate(name => {
        return navigator.permissions.query({name}).then(result => {
          return result.state;
        });
      }, name);
    }

    it('should be prompt by default', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      assert.strictEqual(await getPermission(page, 'geolocation'), 'prompt');
    });
    it('should deny permission when not listed', async () => {
      const {page, server, context} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await context.overridePermissions(server.EMPTY_PAGE, []);
      assert.strictEqual(await getPermission(page, 'geolocation'), 'denied');
    });
    it('should fail when bad permission is given', async () => {
      const {page, server, context} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      let error!: Error;
      await context
        // @ts-expect-error purposeful bad input for test
        .overridePermissions(server.EMPTY_PAGE, ['foo'])
        .catch(error_ => {
          return (error = error_);
        });
      assert.strictEqual(error.message, 'Unknown permission: foo');
    });
    it('should grant permission when listed', async () => {
      const {page, server, context} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await context.overridePermissions(server.EMPTY_PAGE, ['geolocation']);
      assert.strictEqual(await getPermission(page, 'geolocation'), 'granted');
    });
    it('should reset permissions', async () => {
      const {page, server, context} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await context.overridePermissions(server.EMPTY_PAGE, ['geolocation']);
      assert.strictEqual(await getPermission(page, 'geolocation'), 'granted');
      await context.clearPermissionOverrides();
      assert.strictEqual(await getPermission(page, 'geolocation'), 'prompt');
    });
    it('should trigger permission onchange', async () => {
      const {page, server, context} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(() => {
        (globalThis as any).events = [];
        return navigator.permissions
          .query({name: 'geolocation'})
          .then(function (result) {
            (globalThis as any).events.push(result.state);
            result.onchange = function () {
              (globalThis as any).events.push(result.state);
            };
          });
      });
      assert.deepEqual(
        await page.evaluate(() => {
          return (globalThis as any).events;
        }),
        ['prompt'],
      );
      await context.overridePermissions(server.EMPTY_PAGE, []);
      assert.deepEqual(
        await page.evaluate(() => {
          return (globalThis as any).events;
        }),
        ['prompt', 'denied'],
      );
      await context.overridePermissions(server.EMPTY_PAGE, ['geolocation']);
      assert.deepEqual(
        await page.evaluate(() => {
          return (globalThis as any).events;
        }),
        ['prompt', 'denied', 'granted'],
      );
      await context.clearPermissionOverrides();
      assert.deepEqual(
        await page.evaluate(() => {
          return (globalThis as any).events;
        }),
        ['prompt', 'denied', 'granted', 'prompt'],
      );
    });
    it('should isolate permissions between browser contexts', async () => {
      const {page, server, context, browser} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      const otherContext = await browser.createBrowserContext();
      const otherPage = await otherContext.newPage();
      await otherPage.goto(server.EMPTY_PAGE);
      assert.strictEqual(await getPermission(page, 'geolocation'), 'prompt');
      assert.strictEqual(
        await getPermission(otherPage, 'geolocation'),
        'prompt',
      );

      await context.overridePermissions(server.EMPTY_PAGE, []);
      await otherContext.overridePermissions(server.EMPTY_PAGE, [
        'geolocation',
      ]);
      assert.strictEqual(await getPermission(page, 'geolocation'), 'denied');
      assert.strictEqual(
        await getPermission(otherPage, 'geolocation'),
        'granted',
      );

      await context.clearPermissionOverrides();
      assert.strictEqual(await getPermission(page, 'geolocation'), 'prompt');
      assert.strictEqual(
        await getPermission(otherPage, 'geolocation'),
        'granted',
      );

      await otherContext.close();
    });
    it('should grant persistent-storage', async () => {
      const {page, server, context} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      assert.notStrictEqual(
        await getPermission(page, 'persistent-storage'),
        'granted',
      );
      await context.overridePermissions(server.EMPTY_PAGE, [
        'persistent-storage',
      ]);
      assert.strictEqual(
        await getPermission(page, 'persistent-storage'),
        'granted',
      );
    });
  });

  describe('BrowserContext.setPermission', function () {
    function getPermission(page: Page, name: PermissionName) {
      return page.evaluate(name => {
        return navigator.permissions.query({name}).then(result => {
          return result.state;
        });
      }, name);
    }

    it('should set permission', async () => {
      const {page, server, context} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await context.setPermission(server.EMPTY_PAGE, {
        permission: {name: 'geolocation'},
        state: 'granted',
      });
      assert.strictEqual(await getPermission(page, 'geolocation'), 'granted');
      await context.setPermission(server.EMPTY_PAGE, {
        permission: {name: 'geolocation'},
        state: 'denied',
      });
      assert.strictEqual(await getPermission(page, 'geolocation'), 'denied');
      await context.setPermission(server.EMPTY_PAGE, {
        permission: {name: 'geolocation'},
        state: 'prompt',
      });
      assert.strictEqual(await getPermission(page, 'geolocation'), 'prompt');
    });

    it('should support * as origin', async () => {
      const {page, server, context} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await context.setPermission('*', {
        permission: {name: 'geolocation'},
        state: 'granted',
      });
      assert.strictEqual(await getPermission(page, 'geolocation'), 'granted');
      await context.setPermission('*', {
        permission: {name: 'geolocation'},
        state: 'denied',
      });
      assert.strictEqual(await getPermission(page, 'geolocation'), 'denied');
      await context.setPermission('*', {
        permission: {name: 'geolocation'},
        state: 'prompt',
      });
      assert.strictEqual(await getPermission(page, 'geolocation'), 'prompt');
    });

    it('should support multiple permissions', async () => {
      const {page, server, context} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await context.setPermission(
        server.EMPTY_PAGE,
        {permission: {name: 'geolocation'}, state: 'granted'},
        {permission: {name: 'midi'}, state: 'granted'},
      );
      assert.strictEqual(await getPermission(page, 'geolocation'), 'granted');
      assert.strictEqual(await getPermission(page, 'midi'), 'granted');

      await context.setPermission(
        server.EMPTY_PAGE,
        {permission: {name: 'geolocation'}, state: 'denied'},
        {permission: {name: 'midi'}, state: 'denied'},
      );
      assert.strictEqual(await getPermission(page, 'geolocation'), 'denied');
      assert.strictEqual(await getPermission(page, 'midi'), 'denied');

      await context.setPermission(
        server.EMPTY_PAGE,
        {permission: {name: 'geolocation'}, state: 'prompt'},
        {permission: {name: 'midi'}, state: 'prompt'},
      );
      assert.strictEqual(await getPermission(page, 'geolocation'), 'prompt');
      assert.strictEqual(await getPermission(page, 'midi'), 'prompt');
    });
  });
});
