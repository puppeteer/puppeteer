/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {ServerResponse} from 'node:http';
import path from 'node:path';

import expect from 'expect';
import {type Target, TimeoutError} from 'puppeteer';
import type {Page} from 'puppeteer-core/internal/api/Page.js';
import type {RemoteException} from 'puppeteer-core/internal/common/RemoteException.js';

import {getTestState, launch, setupTestBrowserHooks} from './mocha-utils.js';
import {waitEvent} from './utils.js';

const discardTabExtensionPath = path.join(
  import.meta.dirname,
  '..',
  'assets',
  'discard-tab-extension',
);

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

  it('Target.isDiscarded() should return false for active targets', async () => {
    const {page, browser, context} = await getTestState();
    const target = page.target();

    expect(target.isDiscarded()).toBe(false);
    expect(browser.targets({includeDiscarded: true})).toContain(target);
    expect(context.targets({includeDiscarded: true})).toContain(target);
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
    const worker = (await target.worker())!;

    const onceDestroyed = new Promise(resolve => {
      context.once('targetdestroyed', event => {
        resolve(event);
      });
    });
    await worker.close();
    expect(await onceDestroyed).toBe(target);
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

  it('should hide discarded tabs by default and expose them with includeDiscarded', async () => {
    const {browser, server, close} = await launch(
      {
        enableExtensions: true,
        args: ['--enable-features=AllowDevtoolsConnectedDiscard'],
      },
      {createContext: false},
    );
    try {
      const extensionId = await browser.installExtension(
        discardTabExtensionPath,
      );
      const serviceWorkerTarget = await browser.waitForTarget(target => {
        return (
          target.type() === 'service_worker' &&
          target.url().includes(extensionId)
        );
      });
      const worker = (await serviceWorkerTarget.worker())!;

      // `chrome.tabs.query({url})` matches URL patterns against the URL
      // without its fragment, so the two pages need distinct paths.
      const discardUrl = server.EMPTY_PAGE;
      const activeUrl = `${server.PREFIX}/title.html`;

      const pageToDiscard = await browser.newPage();
      await pageToDiscard.goto(discardUrl);
      const targetToDiscard = pageToDiscard.target();
      expect(targetToDiscard.isDiscarded()).toBe(false);

      const activePage = await browser.newPage();
      await activePage.goto(activeUrl);

      const [_, destroyedTarget] = await Promise.all([
        waitEvent(pageToDiscard, 'close'),
        waitEvent<Target>(browser, 'targetdestroyed', (target: Target) => {
          return target.url() === discardUrl;
        }),
        worker.evaluate(async url => {
          const chromeApi = (globalThis as any).chrome;
          const [tab] = await chromeApi.tabs.query({url});
          await chromeApi.tabs.discard(tab.id);
        }, discardUrl),
      ]);

      expect(destroyedTarget.isDiscarded()).toBe(true);
      expect(pageToDiscard.isClosed()).toBe(true);
      expect(
        browser.targets().some(target => {
          return target.url() === discardUrl;
        }),
      ).toBe(false);
      expect(
        (await browser.pages()).some(page => {
          return page.url() === discardUrl;
        }),
      ).toBe(false);

      const discardedTargets = browser
        .targets({includeDiscarded: true})
        .filter(target => {
          return target.url() === discardUrl;
        });
      expect(discardedTargets).toHaveLength(1);
      const discardedTarget = discardedTargets[0]!;
      expect(discardedTarget.type()).toBe('tab');
      expect(discardedTarget.isDiscarded()).toBe(true);
      await expect(discardedTarget.page()).resolves.toBeNull();
      await expect(discardedTarget.asPage()).rejects.toThrow(
        'Cannot create a page for a discarded target.',
      );

      const [reloadedTarget] = await Promise.all([
        browser.waitForTarget(target => {
          return target.url() === discardUrl;
        }),
        worker.evaluate(async url => {
          const chromeApi = (globalThis as any).chrome;
          const [tab] = await chromeApi.tabs.query({url});
          await chromeApi.tabs.reload(tab.id);
        }, discardUrl),
      ]);

      expect(reloadedTarget.type()).toBe('page');
      expect(reloadedTarget.isDiscarded()).toBe(false);
      expect(destroyedTarget.isDiscarded()).toBe(true);
      await expect(destroyedTarget.page()).resolves.toBeNull();
      expect(browser.targets()).toContain(reloadedTarget);
      const reloadedPage = await reloadedTarget.page();
      expect(reloadedPage).not.toBeNull();
      expect(reloadedPage).not.toBe(pageToDiscard);
    } finally {
      await close();
    }
  });
});
