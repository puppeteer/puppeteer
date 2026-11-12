/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {ServerResponse} from 'node:http';

import type {TestServer} from '@pptr/testserver';
import expect from 'expect';
import {type Target, TimeoutError, UnsupportedOperation} from 'puppeteer';
import type {Browser} from 'puppeteer-core/internal/api/Browser.js';
import type {Page} from 'puppeteer-core/internal/api/Page.js';
import {TargetCloseError} from 'puppeteer-core/internal/common/Errors.js';
import type {RemoteException} from 'puppeteer-core/internal/common/RemoteException.js';

import {getTestState, launch, setupTestBrowserHooks} from './mocha-utils.js';
import {attachFrame, waitEvent} from './utils.js';

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

    expect(page1).toBe(page);
    expect(page2).toBe(page);
    expect(page3).toBe(page);

    await page.close();
  });

  it('Browser.targets should return all of the targets', async () => {
    const {browser} = await getTestState();

    // The pages will be the testing page and the original newtab page
    const targets = browser.targets();
    expect(
      targets.some(target => {
        return target.type() === 'page' && target.url() === 'about:blank';
      }),
    ).toBeTruthy();
    expect(
      targets.some(target => {
        return target.type() === 'browser';
      }),
    ).toBeTruthy();
  });
  it('Browser.pages should return all of the pages', async () => {
    const {page, context} = await getTestState();

    // The pages will be the testing page
    const allPages = await context.pages();
    expect(allPages).toHaveLength(1);
    expect(allPages).toContain(page);
  });

  it('page should return tab target id', async () => {
    const {page} = await getTestState();
    expect(page._tabId.length).toBeGreaterThan(0);
  });

  it('should contain browser target', async () => {
    const {browser} = await getTestState();

    const targets = browser.targets();
    const browserTarget = targets.find(target => {
      return target.type() === 'browser';
    });
    expect(browserTarget).toBeTruthy();
  });
  it('should be able to use the default page in the browser', async () => {
    const {page, browser} = await getTestState();

    // The pages will be the testing page and the original newtab page
    const allPages = await browser.pages();
    const originalPage = allPages.find(p => {
      return p !== page;
    })!;
    expect(
      await originalPage.evaluate(() => {
        return ['Hello', 'world'].join(' ');
      }),
    ).toBe('Hello world');
    expect(await originalPage.$('body')).toBeTruthy();
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
    expect(otherPage!.url()).toEqual(
      server.CROSS_PROCESS_PREFIX + '/empty.html',
    );
    expect(page).not.toBe(otherPage);
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
    expect(otherPage!.url()).toContain(server.CROSS_PROCESS_PREFIX);
    expect(
      await otherPage!.evaluate(() => {
        return ['Hello', 'world'].join(' ');
      }),
    ).toBe('Hello world');
    expect(await otherPage!.$('body')).toBeTruthy();

    let allPages = await context.pages();
    expect(allPages).toContain(page);
    expect(allPages).toContain(otherPage);

    const [closedTarget] = await Promise.all([
      waitEvent<Target>(context, 'targetdestroyed'),
      otherPage!.close(),
    ]);
    expect(await closedTarget.page()).toBe(otherPage);

    allPages = (await Promise.all(
      context.targets().map(target => {
        return target.page();
      }),
    )) as Page[];
    expect(allPages).toContain(page);
    expect(allPages).not.toContain(otherPage);
  });
  it('should report when a service worker is created and destroyed', async () => {
    const {page, server, context} = await getTestState();

    await page.goto(server.EMPTY_PAGE);
    const createdTarget = waitEvent(context, 'targetcreated');

    await page.goto(server.PREFIX + '/serviceworkers/empty/sw.html');

    expect((await createdTarget).type()).toBe('service_worker');
    expect((await createdTarget).url()).toBe(
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
    expect(await destroyedTarget).toBe(await createdTarget);
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

    expect(
      await worker.evaluate(() => {
        return self.toString();
      }),
    ).toBe('[object ServiceWorkerGlobalScope]');
  });

  it('should emit exceptions on a service worker but not on the page', async () => {
    const {page, server, context} = await getTestState();

    await page.goto(server.PREFIX + '/serviceworkers/empty/sw.html');

    const target = await context.waitForTarget(
      target => {
        return target.type() === 'service_worker';
      },
      {timeout: 3000},
    );
    const worker = (await target.worker())!;
    const pageExceptions: RemoteException[] = [];
    page.on('exception', exception => {
      pageExceptions.push(exception);
    });

    const [exception] = await Promise.all([
      waitEvent<RemoteException>(worker, 'exception'),
      worker.evaluate(() => {
        setTimeout(() => {
          throw new Error('service worker error');
        });
      }),
    ]);
    expect(exception.text()).toContain('service worker error');
    expect(pageExceptions).toHaveLength(0);
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
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    const worker = (await target.worker())!;

    const onceDestroyed = new Promise(resolve => {
      context.once('targetdestroyed', event => {
        resolve(event);
      });
    });
    await worker.close();
    expect(await onceDestroyed).toBe(target);
  });

  it('should close a service worker when network rules are set', async () => {
    const {browser, server, close} = await launch({
      blocklist: ['*://*:*/empty.html'],
    });
    try {
      // With network rules, Puppeteer stays attached to service workers, also
      // through the page that registered them.
      const page = await openServiceWorkerPage(browser, server);
      const target = await browser.waitForTarget(
        target => {
          return target.type() === 'service_worker';
        },
        {timeout: 3000},
      );
      const worker = (await target.worker())!;
      const targetDestroyed = waitEvent(
        browser,
        'targetdestroyed',
        destroyed => {
          return destroyed === target;
        },
      );
      const {destroyed} = await watchServiceWorker(page);

      await worker.close();

      expect(await targetDestroyed).toBe(target);
      await destroyed;
    } finally {
      await close();
    }
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
    expect(
      await worker.evaluate(() => {
        return self.toString();
      }),
    ).toBe('[object SharedWorkerGlobalScope]');
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
    expect(await onceDestroyed).toBe(target);
  });

  it('should report when a target url changes', async () => {
    const {page, server, context} = await getTestState();

    await page.goto(server.EMPTY_PAGE);
    let changedTarget = waitEvent(context, 'targetchanged');
    await page.goto(server.CROSS_PROCESS_PREFIX + '/');
    expect((await changedTarget).url()).toBe(server.CROSS_PROCESS_PREFIX + '/');

    changedTarget = waitEvent(context, 'targetchanged');
    await page.goto(server.EMPTY_PAGE);
    expect((await changedTarget).url()).toBe(server.EMPTY_PAGE);
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
    expect(target.url()).toBe('about:blank');

    const newPage = await newPagePromise;
    const targetPromise2 = waitEvent<Target>(context, 'targetcreated');
    const evaluatePromise = newPage.evaluate(() => {
      return window.open('about:blank');
    });
    const target2 = await targetPromise2;
    expect(target2.url()).toBe('about:blank');
    await evaluatePromise;
    await newPage.close();
    expect(targetChanged).toBe(false);
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
    expect((await createdTarget.page())!.url()).toBe(
      server.PREFIX + '/popup/popup.html',
    );
    expect(createdTarget.opener()).toBe(page.target());
    expect(page.target().opener()).toBeUndefined();
  });

  describe('Target.close', () => {
    it('should close the target', async () => {
      const {context} = await getTestState();
      const page = await context.newPage();
      const target = page.target();
      const targetDestroyed = waitEvent(
        context,
        'targetdestroyed',
        destroyed => {
          return destroyed === target;
        },
      );

      await target.close();

      expect(context.targets()).not.toContain(target);
      expect(await targetDestroyed).toBe(target);
      expect(await context.pages()).not.toContain(page);
    });

    it('should close a service worker target', async () => {
      const {page, server, context} = await getTestState();
      await page.goto(server.PREFIX + '/serviceworkers/empty/sw.html');
      const target = await context.waitForTarget(
        target => {
          return target.type() === 'service_worker';
        },
        {timeout: 3000},
      );
      // Creating the worker attaches Puppeteer to the service worker. Chrome
      // reports the closed service worker as destroyed only after the detach.
      await target.worker();
      const targetDestroyed = waitEvent(
        context,
        'targetdestroyed',
        destroyed => {
          return destroyed === target;
        },
      );

      await target.close();

      expect(context.targets()).not.toContain(target);
      expect(await targetDestroyed).toBe(target);
    });

    it('should close a service worker target used by two pages when network rules are set', async () => {
      const {browser, server, close} = await launch({
        blocklist: ['*://*:*/empty.html'],
      });
      try {
        // With network rules, Puppeteer stays attached to service workers,
        // also through each page that uses them.
        const page = await openServiceWorkerPage(browser, server);
        await openServiceWorkerPage(browser, server);
        const target = await browser.waitForTarget(
          target => {
            return target.type() === 'service_worker';
          },
          {timeout: 3000},
        );
        let destroyedCount = 0;
        browser.on('targetdestroyed', destroyed => {
          if (destroyed === target) {
            destroyedCount++;
          }
        });
        const {destroyed} = await watchServiceWorker(page);

        await target.close();

        expect(browser.targets()).not.toContain(target);
        await destroyed;
        expect(destroyedCount).toBe(1);
      } finally {
        await close();
      }
    });

    it('should close a service worker target after a page that used it closed when network rules are set', async () => {
      const {browser, server, close} = await launch({
        blocklist: ['*://*:*/empty.html'],
      });
      try {
        const page = await openServiceWorkerPage(browser, server);
        // Puppeteer reports the service worker as gone when a page that uses
        // it closes, and creates a new target for it when another page
        // attaches. Puppeteer still keeps the sessions of the old target.
        await (await openServiceWorkerPage(browser, server)).close();
        await openServiceWorkerPage(browser, server);
        const target = await browser.waitForTarget(
          target => {
            return target.type() === 'service_worker';
          },
          {timeout: 3000},
        );
        const {destroyed} = await watchServiceWorker(page);

        await target.close();

        await destroyed;
      } finally {
        await close();
      }
    });

    it('should close a shared worker target', async () => {
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
      const targetDestroyed = waitEvent(
        context,
        'targetdestroyed',
        destroyed => {
          return destroyed === target;
        },
      );

      await target.close();

      expect(context.targets()).not.toContain(target);
      expect(await targetDestroyed).toBe(target);
    });

    it('should not throw if close() is called concurrently', async () => {
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

      // A shared worker is gone before the response to `Target.closeTarget`,
      // so a second `Target.closeTarget` would fail.
      await Promise.all([target.close(), target.close()]);

      expect(context.targets()).not.toContain(target);
    });

    it('should reject worker() while a service worker target closes', async () => {
      const {page, server, context} = await getTestState();
      await page.goto(server.PREFIX + '/serviceworkers/empty/sw.html');
      const target = await context.waitForTarget(
        target => {
          return target.type() === 'service_worker';
        },
        {timeout: 3000},
      );
      const {destroyed} = await watchServiceWorker(page);

      // A session that `worker()` attached while `close()` runs would keep the
      // closed service worker alive.
      const closed = target.close();
      await expect(target.worker()).rejects.toThrow(TargetCloseError);
      await closed;

      await destroyed;
    });

    it('should do nothing if the target is already closed', async () => {
      const {context} = await getTestState();
      const page = await context.newPage();
      const target = page.target();
      await target.close();

      await target.close();

      expect(context.targets()).not.toContain(target);
    });

    it('should close a page target without creating its page', async () => {
      const {browser, close} = await launch({protocolTimeout: 3000});
      try {
        const page = await browser.newPage();
        const [target] = await Promise.all([
          browser.waitForTarget(target => {
            return target.opener() === page.target();
          }),
          page.evaluate(() => {
            window.open('about:blank', 'popup');
          }),
        ]);
        // The alert blocks creating a page for the popup until the protocol
        // timeout, so closing the target must not create one.
        const session = await target.createCDPSession();
        await session.send('Page.enable');
        await Promise.all([
          waitEvent(session, 'Page.javascriptDialogOpening'),
          page.evaluate(() => {
            const popup = window.open('', 'popup')!;
            popup.setTimeout(() => {
              popup.alert('blocked');
            }, 0);
          }),
        ]);

        await target.close();

        expect(browser.targets()).not.toContain(target);
      } finally {
        await close();
      }
    });

    it('should throw if the target does not support closing', async () => {
      const {browser, close} = await launch({});
      try {
        // Chrome rejects `Target.closeTarget` for the browser target, and
        // chrome-headless-shell reports that it did not close it.
        await expect(browser.target().close()).rejects.toThrow(
          browser.protocol === 'cdp' ? /support closing/ : UnsupportedOperation,
        );
        expect(browser.connected).toBe(true);
      } finally {
        await close();
      }
    });

    it('should not close the page through the target of a frame', async () => {
      const {browser, server, close} = await launch({
        args: ['--site-per-process'],
      });
      try {
        const page = await browser.newPage();
        await page.goto(server.EMPTY_PAGE);
        const frameUrl = server.CROSS_PROCESS_PREFIX + '/empty.html';
        await attachFrame(page, 'frame1', frameUrl);
        const target = await browser.waitForTarget(target => {
          return target.url() === frameUrl;
        });

        await expect(target.close()).rejects.toThrow(
          browser.protocol === 'cdp'
            ? 'The target of a frame does not support closing'
            : UnsupportedOperation,
        );

        expect(page.isClosed()).toBe(false);
        expect(
          await page.evaluate(() => {
            return document.querySelectorAll('iframe').length;
          }),
        ).toBe(1);
      } finally {
        await close();
      }
    });
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
      expect(resolved).toBe(false);
      await page.goto(server.EMPTY_PAGE);
      try {
        const target = await targetPromise;
        expect(await target.page()).toBe(page);
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
      expect(error).toBeInstanceOf(TimeoutError);
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
      await expect(task).rejects.toThrow(/aborted/);
    });
  });
});

/**
 * Opens a page that registers a service worker and waits until the service
 * worker is ready, which gives Puppeteer time to attach to it through the page.
 */
async function openServiceWorkerPage(
  browser: Browser,
  server: TestServer,
): Promise<Page> {
  const page = await browser.newPage();
  await page.goto(server.PREFIX + '/serviceworkers/empty/sw.html');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  return page;
}

/**
 * Watches the targets of the browser through a CDP session of the page.
 * `destroyed` resolves when Chrome reports the service worker as destroyed,
 * which it does only after all sessions attached to it detach.
 */
async function watchServiceWorker(
  page: Page,
): Promise<{destroyed: Promise<void>}> {
  const session = await page.createCDPSession();
  const destroyed = new Promise<void>(resolve => {
    let targetId: string | undefined;
    session.on('Target.targetCreated', event => {
      if (event.targetInfo.type === 'service_worker') {
        targetId = event.targetInfo.targetId;
      }
    });
    session.on('Target.targetDestroyed', event => {
      if (event.targetId === targetId) {
        resolve();
      }
    });
  });
  await session.send('Target.setDiscoverTargets', {discover: true});
  return {destroyed};
}
