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

import expect from 'expect';
import fs from 'fs';
import os from 'os';
import path from 'path';
import rimraf from 'rimraf';
import {promisify} from 'util';
import {
  PuppeteerLaunchOptions,
  PuppeteerNode,
} from '../../lib/cjs/puppeteer/node/Puppeteer.js';
import {
  describeChromeOnly,
  getTestState,
  itFailsWindows,
} from './mocha-utils.js';

const rmAsync = promisify(rimraf);
const mkdtempAsync = promisify(fs.mkdtemp);

const TMP_FOLDER = path.join(os.tmpdir(), 'pptr_tmp_folder-');

const extensionPath = path.join(__dirname, '../assets', 'simple-extension');

describeChromeOnly('headful tests', function () {
  /* These tests fire up an actual browser so let's
   * allow a higher timeout
   */
  this.timeout(20 * 1000);

  let headfulOptions: PuppeteerLaunchOptions | undefined;
  let headlessOptions: PuppeteerLaunchOptions & {headless: boolean};
  let extensionOptions: PuppeteerLaunchOptions & {
    headless: boolean;
    args: string[];
  };
  let forcedOopifOptions: PuppeteerLaunchOptions & {
    headless: boolean;
    devtools: boolean;
    args: string[];
  };
  let devtoolsOptions: PuppeteerLaunchOptions & {
    headless: boolean;
    devtools: boolean;
  };
  const browsers: any[] = [];

  beforeEach(() => {
    const {server, defaultBrowserOptions} = getTestState();
    headfulOptions = Object.assign({}, defaultBrowserOptions, {
      headless: false,
    });
    headlessOptions = Object.assign({}, defaultBrowserOptions, {
      headless: true,
    });

    extensionOptions = Object.assign({}, defaultBrowserOptions, {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    forcedOopifOptions = Object.assign({}, defaultBrowserOptions, {
      headless: false,
      devtools: true,
      args: [
        `--host-rules=MAP oopifdomain 127.0.0.1`,
        `--isolate-origins=${server.PREFIX.replace(
          'localhost',
          'oopifdomain'
        )}`,
      ],
    });

    devtoolsOptions = Object.assign({}, defaultBrowserOptions, {
      headless: false,
      devtools: true,
    });
  });

  async function launchBrowser(puppeteer: PuppeteerNode, options: any) {
    const browser = await puppeteer.launch(options);
    browsers.push(browser);
    return browser;
  }

  afterEach(() => {
    for (const i in browsers) {
      const browser = browsers[i];
      if (browser.isConnected()) {
        browser.close();
      }
      delete browsers[i];
    }
  });

  describe('HEADFUL', function () {
    it('background_page target type should be available', async () => {
      const {puppeteer} = getTestState();
      const browserWithExtension = await launchBrowser(
        puppeteer,
        extensionOptions
      );
      const page = await browserWithExtension.newPage();
      const backgroundPageTarget = await browserWithExtension.waitForTarget(
        (target: {type: () => string}) => {
          return target.type() === 'background_page';
        }
      );
      await page.close();
      await browserWithExtension.close();
      expect(backgroundPageTarget).toBeTruthy();
    });
    it('target.page() should return a background_page', async function () {
      const {puppeteer} = getTestState();
      const browserWithExtension = await launchBrowser(
        puppeteer,
        extensionOptions
      );
      const backgroundPageTarget = await browserWithExtension.waitForTarget(
        (target: {type: () => string}) => {
          return target.type() === 'background_page';
        }
      );
      const page = (await backgroundPageTarget.page())!;
      expect(
        await page.evaluate(() => {
          return 2 * 3;
        })
      ).toBe(6);
      expect(
        await page.evaluate(() => {
          return (globalThis as any).MAGIC;
        })
      ).toBe(42);
      await browserWithExtension.close();
    });
    it('target.page() should return a DevTools page if custom isPageTarget is provided', async function () {
      const {puppeteer} = getTestState();
      const originalBrowser = await launchBrowser(puppeteer, devtoolsOptions);

      const browserWSEndpoint = originalBrowser.wsEndpoint();

      const browser = await puppeteer.connect({
        browserWSEndpoint,
        _isPageTarget(target) {
          return (
            target.type === 'other' && target.url.startsWith('devtools://')
          );
        },
      });
      const devtoolsPageTarget = await browser.waitForTarget(target => {
        return target.type() === 'other';
      });
      const page = (await devtoolsPageTarget.page())!;
      expect(
        await page.evaluate(() => {
          return 2 * 3;
        })
      ).toBe(6);
      expect(await browser.pages()).toContainEqual(page);
      await browser.close();
    });
    it('should have default url when launching browser', async function () {
      const {puppeteer} = getTestState();
      const browser = await launchBrowser(puppeteer, extensionOptions);
      const pages = (await browser.pages()).map((page: {url: () => any}) => {
        return page.url();
      });
      expect(pages).toEqual(['about:blank']);
      await browser.close();
    });
    itFailsWindows(
      'headless should be able to read cookies written by headful',
      async () => {
        /* Needs investigation into why but this fails consistently on Windows CI. */
        const {server, puppeteer} = getTestState();

        const userDataDir = await mkdtempAsync(TMP_FOLDER);
        // Write a cookie in headful chrome
        const headfulBrowser = await launchBrowser(
          puppeteer,
          Object.assign({userDataDir}, headfulOptions)
        );
        const headfulPage = await headfulBrowser.newPage();
        await headfulPage.goto(server.EMPTY_PAGE);
        await headfulPage.evaluate(() => {
          return (document.cookie =
            'foo=true; expires=Fri, 31 Dec 9999 23:59:59 GMT');
        });
        await headfulBrowser.close();
        // Read the cookie from headless chrome
        const headlessBrowser = await launchBrowser(
          puppeteer,
          Object.assign({userDataDir}, headlessOptions)
        );
        const headlessPage = await headlessBrowser.newPage();
        await headlessPage.goto(server.EMPTY_PAGE);
        const cookie = await headlessPage.evaluate(() => {
          return document.cookie;
        });
        await headlessBrowser.close();
        // This might throw. See https://github.com/puppeteer/puppeteer/issues/2778
        await rmAsync(userDataDir).catch(() => {});
        expect(cookie).toBe('foo=true');
      }
    );
    // TODO: Support OOOPIF. @see https://github.com/puppeteer/puppeteer/issues/2548
    xit('OOPIF: should report google.com frame', async () => {
      const {server, puppeteer} = getTestState();

      // https://google.com is isolated by default in Chromium embedder.
      const browser = await launchBrowser(puppeteer, headfulOptions);
      const page = await browser.newPage();
      await page.goto(server.EMPTY_PAGE);
      await page.setRequestInterception(true);
      page.on('request', (r: {respond: (arg0: {body: string}) => any}) => {
        return r.respond({body: 'YO, GOOGLE.COM'});
      });
      await page.evaluate(() => {
        const frame = document.createElement('iframe');
        frame.setAttribute('src', 'https://google.com/');
        document.body.appendChild(frame);
        return new Promise(x => {
          return (frame.onload = x);
        });
      });
      await page.waitForSelector('iframe[src="https://google.com/"]');
      const urls = page
        .frames()
        .map((frame: {url: () => any}) => {
          return frame.url();
        })
        .sort();
      expect(urls).toEqual([server.EMPTY_PAGE, 'https://google.com/']);
      await browser.close();
    });
    it('OOPIF: should expose events within OOPIFs', async () => {
      const {server, puppeteer} = getTestState();

      const browser = await launchBrowser(puppeteer, forcedOopifOptions);
      const page = await browser.newPage();

      // Setup our session listeners to observe OOPIF activity.
      const session = await page.target().createCDPSession();
      const networkEvents: any[] = [];
      const otherSessions: any[] = [];
      await session.send('Target.setAutoAttach', {
        autoAttach: true,
        flatten: true,
        waitForDebuggerOnStart: true,
      });
      session.on(
        'sessionattached',
        async (session: {
          on: (arg0: string, arg1: (params: any) => number) => void;
          send: (arg0: string) => any;
        }) => {
          otherSessions.push(session);

          session.on('Network.requestWillBeSent', (params: any) => {
            return networkEvents.push(params);
          });
          await session.send('Network.enable');
          await session.send('Runtime.runIfWaitingForDebugger');
        }
      );

      // Navigate to the empty page and add an OOPIF iframe with at least one request.
      await page.goto(server.EMPTY_PAGE);
      await page.evaluate((frameUrl: string) => {
        const frame = document.createElement('iframe');
        frame.setAttribute('src', frameUrl);
        document.body.appendChild(frame);
        return new Promise((x, y) => {
          frame.onload = x;
          frame.onerror = y;
        });
      }, server.PREFIX.replace('localhost', 'oopifdomain') + '/one-style.html');
      await page.waitForSelector('iframe');

      // Ensure we found the iframe session.
      expect(otherSessions).toHaveLength(1);

      // Resume the iframe and trigger another request.
      const iframeSession = otherSessions[0]!;
      await iframeSession.send('Runtime.evaluate', {
        expression: `fetch('/fetch')`,
        awaitPromise: true,
      });
      await browser.close();

      const requests = networkEvents.map(event => {
        return event.request.url;
      });
      expect(requests).toContain(`http://oopifdomain:${server.PORT}/fetch`);
    });
    it('should close browser with beforeunload page', async () => {
      const {server, puppeteer} = getTestState();

      const browser = await launchBrowser(puppeteer, headfulOptions);
      const page = await browser.newPage();
      await page.goto(server.PREFIX + '/beforeunload.html');
      // We have to interact with a page so that 'beforeunload' handlers
      // fire.
      await page.click('body');
      await browser.close();
    });
    it('should open devtools when "devtools: true" option is given', async () => {
      const {puppeteer} = getTestState();

      const browser = await launchBrowser(
        puppeteer,
        Object.assign({devtools: true}, headfulOptions)
      );
      const context = await browser.createIncognitoBrowserContext();
      await Promise.all([
        context.newPage(),
        browser.waitForTarget((target: {url: () => string | string[]}) => {
          return target.url().includes('devtools://');
        }),
      ]);
      await browser.close();
    });
  });

  describe('Page.bringToFront', function () {
    it('should work', async () => {
      const {puppeteer} = getTestState();
      const browser = await launchBrowser(puppeteer, headfulOptions);
      const page1 = await browser.newPage();
      const page2 = await browser.newPage();

      await page1.bringToFront();
      expect(
        await page1.evaluate(() => {
          return document.visibilityState;
        })
      ).toBe('visible');
      expect(
        await page2.evaluate(() => {
          return document.visibilityState;
        })
      ).toBe('hidden');

      await page2.bringToFront();
      expect(
        await page1.evaluate(() => {
          return document.visibilityState;
        })
      ).toBe('hidden');
      expect(
        await page2.evaluate(() => {
          return document.visibilityState;
        })
      ).toBe('visible');

      await page1.close();
      await page2.close();
      await browser.close();
    });
  });

  describe('Page.screenshot', function () {
    it('should run in parallel in multiple pages', async () => {
      const {server, puppeteer} = getTestState();
      const browser = await puppeteer.launch(headfulOptions);
      const context = await browser.createIncognitoBrowserContext();

      const N = 2;
      const pages = await Promise.all(
        Array(N)
          .fill(0)
          .map(async () => {
            const page = await context.newPage();
            await page.goto(server.PREFIX + '/grid.html');
            return page;
          })
      );
      const promises = [];
      for (let i = 0; i < N; ++i) {
        promises.push(
          pages[i]!.screenshot({
            clip: {x: 50 * i, y: 0, width: 50, height: 50},
          })
        );
      }
      const screenshots = await Promise.all(promises);
      for (let i = 0; i < N; ++i) {
        expect(screenshots[i]).toBeGolden(`grid-cell-${i}.png`);
      }
      await Promise.all(
        pages.map(page => {
          return page.close();
        })
      );

      await browser.close();
    });
  });
});
