/**
 * Copyright 2018 Google Inc. All rights reserved.
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

import {ServerResponse} from 'http';

import expect from 'expect';
import {TimeoutError} from 'puppeteer';
import {Page} from 'puppeteer-core/internal/api/Page.js';
import {Target} from 'puppeteer-core/internal/common/Target.js';

import {
  getTestState,
  setupTestBrowserHooks,
  setupTestPageAndContextHooks,
} from './mocha-utils.js';
import utils from './utils.js';

const {waitEvent} = utils;

describe('Target', function () {
  setupTestBrowserHooks();
  setupTestPageAndContextHooks();

  it('Browser.targets should return all of the targets', async () => {
    const {browser} = getTestState();

    // The pages will be the testing page and the original newtab page
    const targets = browser.targets();
    expect(
      targets.some(target => {
        return target.type() === 'page' && target.url() === 'about:blank';
      })
    ).toBeTruthy();
    expect(
      targets.some(target => {
        return target.type() === 'browser';
      })
    ).toBeTruthy();
  });
  it('Browser.pages should return all of the pages', async () => {
    const {page, context} = getTestState();

    // The pages will be the testing page
    const allPages = await context.pages();
    expect(allPages.length).toBe(1);
    expect(allPages).toContain(page);
  });
  it('should contain browser target', async () => {
    const {browser} = getTestState();

    const targets = browser.targets();
    const browserTarget = targets.find(target => {
      return target.type() === 'browser';
    });
    expect(browserTarget).toBeTruthy();
  });
  it('should be able to use the default page in the browser', async () => {
    const {page, browser} = getTestState();

    // The pages will be the testing page and the original newtab page
    const allPages = await browser.pages();
    const originalPage = allPages.find(p => {
      return p !== page;
    })!;
    expect(
      await originalPage.evaluate(() => {
        return ['Hello', 'world'].join(' ');
      })
    ).toBe('Hello world');
    expect(await originalPage.$('body')).toBeTruthy();
  });
  it('should be able to use async waitForTarget', async () => {
    const {page, server, context} = getTestState();

    const [otherPage] = await Promise.all([
      context
        .waitForTarget(target => {
          return target.page().then(page => {
            return page!.url() === server.CROSS_PROCESS_PREFIX + '/empty.html';
          });
        })
        .then(target => {
          return target.page();
        }),
      page.evaluate((url: string) => {
        return window.open(url);
      }, server.CROSS_PROCESS_PREFIX + '/empty.html'),
    ]);
    expect(otherPage!.url()).toEqual(
      server.CROSS_PROCESS_PREFIX + '/empty.html'
    );
    expect(page).not.toEqual(otherPage);
  });
  it('should report when a new page is created and closed', async () => {
    const {page, server, context} = getTestState();

    const [otherPage] = await Promise.all([
      context
        .waitForTarget(target => {
          return target.url() === server.CROSS_PROCESS_PREFIX + '/empty.html';
        })
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
      })
    ).toBe('Hello world');
    expect(await otherPage!.$('body')).toBeTruthy();

    let allPages = await context.pages();
    expect(allPages).toContain(page);
    expect(allPages).toContain(otherPage);

    const closePagePromise = new Promise(fulfill => {
      return context.once('targetdestroyed', target => {
        return fulfill(target.page());
      });
    });
    await otherPage!.close();
    expect(await closePagePromise).toBe(otherPage);

    allPages = (await Promise.all(
      context.targets().map(target => {
        return target.page();
      })
    )) as Page[];
    expect(allPages).toContain(page);
    expect(allPages).not.toContain(otherPage);
  });
  it('should report when a service worker is created and destroyed', async () => {
    const {page, server, context} = getTestState();

    await page.goto(server.EMPTY_PAGE);
    const createdTarget = new Promise<Target>(fulfill => {
      return context.once('targetcreated', target => {
        return fulfill(target);
      });
    });

    await page.goto(server.PREFIX + '/serviceworkers/empty/sw.html');

    expect((await createdTarget).type()).toBe('service_worker');
    expect((await createdTarget).url()).toBe(
      server.PREFIX + '/serviceworkers/empty/sw.js'
    );

    const destroyedTarget = new Promise(fulfill => {
      return context.once('targetdestroyed', target => {
        return fulfill(target);
      });
    });
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
    const {page, server, context} = getTestState();

    await page.goto(server.PREFIX + '/serviceworkers/empty/sw.html');

    const target = await context.waitForTarget(target => {
      return target.type() === 'service_worker';
    });
    const worker = (await target.worker())!;
    expect(
      await worker.evaluate(() => {
        return self.toString();
      })
    ).toBe('[object ServiceWorkerGlobalScope]');
  });
  it('should create a worker from a shared worker', async () => {
    const {page, server, context} = getTestState();

    await page.goto(server.EMPTY_PAGE);
    await page.evaluate(() => {
      new SharedWorker('data:text/javascript,console.log("hi")');
    });
    const target = await context.waitForTarget(target => {
      return target.type() === 'shared_worker';
    });
    const worker = (await target.worker())!;
    expect(
      await worker.evaluate(() => {
        return self.toString();
      })
    ).toBe('[object SharedWorkerGlobalScope]');
  });
  it('should report when a target url changes', async () => {
    const {page, server, context} = getTestState();

    await page.goto(server.EMPTY_PAGE);
    let changedTarget = new Promise<Target>(fulfill => {
      return context.once('targetchanged', target => {
        return fulfill(target);
      });
    });
    await page.goto(server.CROSS_PROCESS_PREFIX + '/');
    expect((await changedTarget).url()).toBe(server.CROSS_PROCESS_PREFIX + '/');

    changedTarget = new Promise(fulfill => {
      return context.once('targetchanged', target => {
        return fulfill(target);
      });
    });
    await page.goto(server.EMPTY_PAGE);
    expect((await changedTarget).url()).toBe(server.EMPTY_PAGE);
  });
  it('should not report uninitialized pages', async () => {
    const {context} = getTestState();

    let targetChanged = false;
    const listener = () => {
      return (targetChanged = true);
    };
    context.on('targetchanged', listener);
    const targetPromise = new Promise<Target>(fulfill => {
      return context.once('targetcreated', target => {
        return fulfill(target);
      });
    });
    const newPagePromise = context.newPage();
    const target = await targetPromise;
    expect(target.url()).toBe('about:blank');

    const newPage = await newPagePromise;
    const targetPromise2 = new Promise<Target>(fulfill => {
      return context.once('targetcreated', target => {
        return fulfill(target);
      });
    });
    const evaluatePromise = newPage.evaluate(() => {
      return window.open('about:blank');
    });
    const target2 = await targetPromise2;
    expect(target2.url()).toBe('about:blank');
    await evaluatePromise;
    await newPage.close();
    expect(targetChanged).toBe(false);
    context.removeListener('targetchanged', listener);
  });
  it('should not crash while redirecting if original request was missed', async () => {
    const {page, server, context} = getTestState();

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
    const target = await context.waitForTarget(target => {
      return target.url().includes('one-style.html');
    });
    const newPage = (await target.page())!;
    // Issue a redirect.
    serverResponse.writeHead(302, {location: '/injectedstyle.css'});
    serverResponse.end();
    // Wait for the new page to load.
    await waitEvent(newPage, 'load');
    // Cleanup.
    await newPage.close();
  });
  it('should have an opener', async () => {
    const {page, server, context} = getTestState();

    await page.goto(server.EMPTY_PAGE);
    const [createdTarget] = await Promise.all([
      new Promise<Target>(fulfill => {
        return context.once('targetcreated', target => {
          return fulfill(target);
        });
      }),
      page.goto(server.PREFIX + '/popup/window-open.html'),
    ]);
    expect((await createdTarget.page())!.url()).toBe(
      server.PREFIX + '/popup/popup.html'
    );
    expect(createdTarget.opener()).toBe(page.target());
    expect(page.target().opener()).toBeUndefined();
  });

  describe('Browser.waitForTarget', () => {
    it('should wait for a target', async () => {
      const {browser, server} = getTestState();

      let resolved = false;
      const targetPromise = browser.waitForTarget(target => {
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
      const page = await browser.newPage();
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
      const {browser, server} = getTestState();

      let error!: Error;
      await browser
        .waitForTarget(
          target => {
            return target.url() === server.EMPTY_PAGE;
          },
          {
            timeout: 1,
          }
        )
        .catch(error_ => {
          return (error = error_);
        });
      expect(error).toBeInstanceOf(TimeoutError);
    });
  });
});
