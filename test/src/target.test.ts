/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {ServerResponse} from 'node:http';

import {assert} from 'chai';
import {type Target, TimeoutError} from 'puppeteer';
import type {Page} from 'puppeteer-core/internal/api/Page.js';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';
import {assertRejects, waitEvent} from './utils.js';

describe('Target', function () {
  setupTestBrowserHooks();

  it('Target.asPage() should return the same instance', async () => {
    const {browser} = await getTestState();
    const page = await browser.newPage();
    const target = page.target();

    // Test that target.page() and target.asPage() return the same instance
    const page1 = await target.page();
    const page2 = await target.asPage();
    const page3 = await target.asPage();

    assert.strictEqual(page1, page);
    assert.strictEqual(page2, page);
    assert.strictEqual(page3, page);

    await page.close();
  });

  it('Browser.targets should return all of the targets', async () => {
    const {browser} = await getTestState();

    // The pages will be the testing page and the original newtab page
    const targets = browser.targets();
    assert.ok(
      targets.some(target => {
        return target.type() === 'page' && target.url() === 'about:blank';
      }),
    );
    assert.ok(
      targets.some(target => {
        return target.type() === 'browser';
      }),
    );
  });
  it('Browser.pages should return all of the pages', async () => {
    const {page, context} = await getTestState();

    // The pages will be the testing page
    const allPages = await context.pages();
    assert.lengthOf(allPages, 1);
    assert.include(allPages, page);
  });

  it('page should return tab target id', async () => {
    const {page} = await getTestState();
    assert.isAbove(page._tabId.length, 0);
  });

  it('should contain browser target', async () => {
    const {browser} = await getTestState();

    const targets = browser.targets();
    const browserTarget = targets.find(target => {
      return target.type() === 'browser';
    });
    assert.ok(browserTarget);
  });
  it('should be able to use the default page in the browser', async () => {
    const {page, browser} = await getTestState();

    // The pages will be the testing page and the original newtab page
    const allPages = await browser.pages();
    const originalPage = allPages.find(p => {
      return p !== page;
    })!;
    assert.strictEqual(
      await originalPage.evaluate(() => {
        return ['Hello', 'world'].join(' ');
      }),
      'Hello world',
    );
    assert.ok(await originalPage.$('body'));
  });
  it('should be able to use async waitForTarget', async () => {
    const {page, server, context} = await getTestState();

    const [otherPage] = await Promise.all([
      context
        .waitForTarget(
          target => {
            return target.page().then(page => {
              return (
                page!.url() === server.CROSS_PROCESS_PREFIX + '/empty.html'
              );
            });
          },
          {timeout: 3000},
        )
        .then(target => {
          return target.page();
        }),
      page.evaluate((url: string) => {
        return window.open(url);
      }, server.CROSS_PROCESS_PREFIX + '/empty.html'),
    ]);
    assert.deepEqual(
      otherPage!.url(),
      server.CROSS_PROCESS_PREFIX + '/empty.html',
    );
    assert.notStrictEqual(page, otherPage);
  });
  it('should report when a new page is created and closed', async () => {
    const {page, server, context} = await getTestState();

    const [otherPage] = await Promise.all([
      context
        .waitForTarget(
          target => {
            return target.url() === server.CROSS_PROCESS_PREFIX + '/empty.html';
          },
          {timeout: 3000},
        )
        .then(target => {
          return target.page();
        }),
      page.evaluate((url: string) => {
        return window.open(url);
      }, server.CROSS_PROCESS_PREFIX + '/empty.html'),
    ]);
    assert.include(otherPage!.url(), server.CROSS_PROCESS_PREFIX);
    assert.strictEqual(
      await otherPage!.evaluate(() => {
        return ['Hello', 'world'].join(' ');
      }),
      'Hello world',
    );
    assert.ok(await otherPage!.$('body'));

    let allPages = await context.pages();
    assert.include(allPages, page);
    assert.include(allPages, otherPage);

    const [closedTarget] = await Promise.all([
      waitEvent<Target>(context, 'targetdestroyed'),
      otherPage!.close(),
    ]);
    assert.strictEqual<unknown>(await closedTarget.page(), otherPage);

    allPages = (await Promise.all(
      context.targets().map(target => {
        return target.page();
      }),
    )) as Page[];
    assert.include(allPages, page);
    assert.notInclude(allPages, otherPage);
  });
  it('should report when a service worker is created and destroyed', async () => {
    const {page, server, context} = await getTestState();

    await page.goto(server.EMPTY_PAGE);
    const createdTarget = waitEvent(context, 'targetcreated');

    await page.goto(server.PREFIX + '/serviceworkers/empty/sw.html');

    assert.strictEqual((await createdTarget).type(), 'service_worker');
    assert.strictEqual(
      (await createdTarget).url(),
      server.PREFIX + '/serviceworkers/empty/sw.js',
    );

    const destroyedTarget = waitEvent(context, 'targetdestroyed');
    await page.evaluate(() => {
      return (
        globalThis as unknown as {
          registrationPromise: Promise<{unregister: () => void}>;
        }
      ).registrationPromise.then((registration: any) => {
        return registration.unregister();
      });
    });
    assert.strictEqual(await destroyedTarget, await createdTarget);
  });
  it('should create a worker from a service worker', async () => {
    const {page, server, context} = await getTestState();

    await page.goto(server.PREFIX + '/serviceworkers/empty/sw.html');

    const target = await context.waitForTarget(
      target => {
        return target.type() === 'service_worker';
      },
      {timeout: 3000},
    );
    const worker = (await target.worker())!;

    assert.strictEqual(
      await worker.evaluate(() => {
        return self.toString();
      }),
      '[object ServiceWorkerGlobalScope]',
    );
  });

  it('should close a service worker', async () => {
    const {page, server, context} = await getTestState();

    await page.goto(server.PREFIX + '/serviceworkers/empty/sw.html');

    const target = await context.waitForTarget(
      target => {
        return target.type() === 'service_worker';
      },
      {timeout: 3000},
    );
    const worker = (await target.worker())!;

    const onceDestroyed = new Promise(resolve => {
      context.once('targetdestroyed', event => {
        resolve(event);
      });
    });
    await worker.close();
    assert.strictEqual(await onceDestroyed, target);
  });

  it('should create a worker from a shared worker', async () => {
    const {page, server, context} = await getTestState();

    await page.goto(server.EMPTY_PAGE);
    await page.evaluate(() => {
      new SharedWorker('data:text/javascript,console.log("hi")');
    });
    const target = await context.waitForTarget(
      target => {
        return target.type() === 'shared_worker';
      },
      {timeout: 3000},
    );
    const worker = (await target.worker())!;
    assert.strictEqual(
      await worker.evaluate(() => {
        return self.toString();
      }),
      '[object SharedWorkerGlobalScope]',
    );
  });

  it('should close a shared worker', async () => {
    const {page, server, context} = await getTestState();

    await page.goto(server.EMPTY_PAGE);
    await page.evaluate(() => {
      new SharedWorker('data:text/javascript,console.log("hi2")');
    });
    const target = await context.waitForTarget(
      target => {
        return target.type() === 'shared_worker';
      },
      {timeout: 3000},
    );
    const worker = (await target.worker())!;

    const onceDestroyed = new Promise(resolve => {
      context.once('targetdestroyed', event => {
        resolve(event);
      });
    });
    await worker.close();
    assert.strictEqual(await onceDestroyed, target);
  });

  it('should report when a target url changes', async () => {
    const {page, server, context} = await getTestState();

    await page.goto(server.EMPTY_PAGE);
    let changedTarget = waitEvent(context, 'targetchanged');
    await page.goto(server.CROSS_PROCESS_PREFIX + '/');
    assert.strictEqual(
      (await changedTarget).url(),
      server.CROSS_PROCESS_PREFIX + '/',
    );

    changedTarget = waitEvent(context, 'targetchanged');
    await page.goto(server.EMPTY_PAGE);
    assert.strictEqual((await changedTarget).url(), server.EMPTY_PAGE);
  });
  it('should not report uninitialized pages', async () => {
    const {context} = await getTestState();

    let targetChanged = false;
    const listener = () => {
      targetChanged = true;
    };
    context.on('targetchanged', listener);
    const targetPromise = waitEvent<Target>(context, 'targetcreated');
    const newPagePromise = context.newPage();
    const target = await targetPromise;
    assert.strictEqual(target.url(), 'about:blank');

    const newPage = await newPagePromise;
    const targetPromise2 = waitEvent<Target>(context, 'targetcreated');
    const evaluatePromise = newPage.evaluate(() => {
      return window.open('about:blank');
    });
    const target2 = await targetPromise2;
    assert.strictEqual(target2.url(), 'about:blank');
    await evaluatePromise;
    await newPage.close();
    assert.isFalse(targetChanged);
    context.off('targetchanged', listener);
  });

  it('should not crash while redirecting if original request was missed', async () => {
    const {page, server, context} = await getTestState();

    let serverResponse!: ServerResponse;
    server.setRoute('/one-style.css', (_req, res) => {
      return (serverResponse = res);
    });
    // Open a new page. Use window.open to connect to the page later.
    await Promise.all([
      page.evaluate((url: string) => {
        return window.open(url);
      }, server.PREFIX + '/one-style.html'),
      server.waitForRequest('/one-style.css'),
    ]);
    // Connect to the opened page.
    const target = await context.waitForTarget(
      target => {
        return target.url().includes('one-style.html');
      },
      {timeout: 3000},
    );
    const newPage = (await target.page())!;
    const loadEvent = waitEvent(newPage, 'load');
    // Issue a redirect.
    serverResponse.writeHead(302, {location: '/injectedstyle.css'});
    serverResponse.end();
    // Wait for the new page to load.
    await loadEvent;
    // Cleanup.
    await newPage.close();
  });
  it('should have an opener', async () => {
    const {page, server, context} = await getTestState();

    await page.goto(server.EMPTY_PAGE);
    const [createdTarget] = await Promise.all([
      waitEvent<Target>(context, 'targetcreated'),
      page.goto(server.PREFIX + '/popup/window-open.html'),
    ]);
    assert.strictEqual(
      (await createdTarget.page())!.url(),
      server.PREFIX + '/popup/popup.html',
    );
    assert.strictEqual<unknown>(createdTarget.opener(), page.target());
    assert.isUndefined(page.target().opener());
  });

  describe('Browser.waitForTarget', () => {
    it('should wait for a target', async () => {
      const {browser, server, context} = await getTestState();

      let resolved = false;
      const targetPromise = browser.waitForTarget(
        target => {
          return target.url() === server.EMPTY_PAGE;
        },
        {timeout: 3000},
      );
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
      await page.close();
    });
    it('should timeout waiting for a non-existent target', async () => {
      const {browser, server} = await getTestState();

      let error!: Error;
      await browser
        .waitForTarget(
          target => {
            return target.url() === server.PREFIX + '/does-not-exist.html';
          },
          {
            timeout: 1,
          },
        )
        .catch(error_ => {
          return (error = error_);
        });
      assert.instanceOf(error, TimeoutError);
    });
    it('should be able to abort', async () => {
      const {browser} = await getTestState();
      const abortController = new AbortController();
      const task = browser.waitForTarget(
        () => {
          return false;
        },
        {
          signal: abortController.signal,
        },
      );

      abortController.abort();
      const error = await assertRejects(task);
      assert.match(error.message, /aborted/);
    });
  });
});
