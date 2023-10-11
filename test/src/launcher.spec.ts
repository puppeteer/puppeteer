/**
 * Copyright 2017 Google Inc. All rights reserved.
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
import assert from 'assert';
import fs from 'fs';
import {mkdtemp, readFile, writeFile} from 'fs/promises';
import os from 'os';
import path from 'path';
import type {TLSSocket} from 'tls';

import expect from 'expect';
import {TimeoutError} from 'puppeteer';
import type {Page} from 'puppeteer-core/internal/api/Page.js';
import {rmSync} from 'puppeteer-core/internal/node/util/fs.js';
import sinon from 'sinon';

import {getTestState, isHeadless, launch} from './mocha-utils.js';
import {dumpFrames, waitEvent} from './utils.js';

const TMP_FOLDER = path.join(os.tmpdir(), 'pptr_tmp_folder-');
const FIREFOX_TIMEOUT = 30_000;

describe('Launcher specs', function () {
  this.timeout(FIREFOX_TIMEOUT);

  describe('Puppeteer', function () {
    describe('Browser.disconnect', function () {
      it('should reject navigation when browser closes', async () => {
        const {browser, close, puppeteer, server} = await launch({});
        server.setRoute('/one-style.css', () => {});
        try {
          const remote = await puppeteer.connect({
            browserWSEndpoint: browser.wsEndpoint(),
          });
          const page = await remote.newPage();
          const navigationPromise = page
            .goto(server.PREFIX + '/one-style.html', {timeout: 60000})
            .catch(error_ => {
              return error_;
            });
          await server.waitForRequest('/one-style.css');
          remote.disconnect();
          const error = await navigationPromise;
          expect(
            [
              'Navigating frame was detached',
              'Protocol error (Page.navigate): Target closed.',
            ].includes(error.message)
          ).toBeTruthy();
        } finally {
          await close();
        }
      });
      it('should reject waitForSelector when browser closes', async () => {
        const {browser, close, server, puppeteer} = await launch({});
        server.setRoute('/empty.html', () => {});
        try {
          const remote = await puppeteer.connect({
            browserWSEndpoint: browser.wsEndpoint(),
          });
          const page = await remote.newPage();
          const watchdog = page
            .waitForSelector('div', {timeout: 60000})
            .catch(error_ => {
              return error_;
            });
          remote.disconnect();
          const error = await watchdog;
          expect(error.message).toContain('Session closed.');
        } finally {
          await close();
        }
      });
    });
    describe('Browser.close', function () {
      it('should terminate network waiters', async () => {
        const {browser, close, server, puppeteer} = await launch({});
        try {
          const remote = await puppeteer.connect({
            browserWSEndpoint: browser.wsEndpoint(),
          });
          const newPage = await remote.newPage();
          const results = await Promise.all([
            newPage.waitForRequest(server.EMPTY_PAGE).catch(error => {
              return error;
            }),
            newPage.waitForResponse(server.EMPTY_PAGE).catch(error => {
              return error;
            }),
            browser.close(),
          ]);
          for (let i = 0; i < 2; i++) {
            const message = results[i].message;
            expect(message).atLeastOneToContain([
              'Target closed',
              'Page closed!',
            ]);
            expect(message).not.toContain('Timeout');
          }
        } finally {
          await close();
        }
      });
    });
    describe('Puppeteer.launch', function () {
      it('can launch and close the browser', async () => {
        const {close} = await launch({});
        await close();
      });
      it('should reject all promises when browser is closed', async () => {
        const {page, close} = await launch({});
        let error!: Error;
        const neverResolves = page
          .evaluate(() => {
            return new Promise(() => {});
          })
          .catch(error_ => {
            return (error = error_);
          });
        await close();
        await neverResolves;
        expect(error.message).toContain('Protocol error');
      });
      it('should reject if executable path is invalid', async () => {
        let waitError!: Error;
        await launch({
          executablePath: 'random-invalid-path',
        }).catch(error => {
          return (waitError = error);
        });
        expect(waitError.message).toContain('Failed to launch');
      });
      it('userDataDir option', async () => {
        const userDataDir = await mkdtemp(TMP_FOLDER);
        const {context, close} = await launch({userDataDir});
        // Open a page to make sure its functional.
        try {
          await context.newPage();
          expect(fs.readdirSync(userDataDir).length).toBeGreaterThan(0);
        } finally {
          await close();
        }

        expect(fs.readdirSync(userDataDir).length).toBeGreaterThan(0);
        // This might throw. See https://github.com/puppeteer/puppeteer/issues/2778
        try {
          rmSync(userDataDir);
        } catch {}
      });
      it('tmp profile should be cleaned up', async () => {
        const {puppeteer} = await getTestState({skipLaunch: true});

        // Set a custom test tmp dir so that we can validate that
        // the profile dir is created and then cleaned up.
        const testTmpDir = await fs.promises.mkdtemp(
          path.join(os.tmpdir(), 'puppeteer_test_chrome_profile-')
        );
        const oldTmpDir = puppeteer.configuration.temporaryDirectory;
        puppeteer.configuration.temporaryDirectory = testTmpDir;

        // Path should be empty before starting the browser.
        expect(fs.readdirSync(testTmpDir)).toHaveLength(0);
        const {context, close} = await launch({});
        try {
          // One profile folder should have been created at this moment.
          const profiles = fs.readdirSync(testTmpDir);
          expect(profiles).toHaveLength(1);
          expect(profiles[0]?.startsWith('puppeteer_dev_chrome_profile-')).toBe(
            true
          );

          // Open a page to make sure its functional.
          await context.newPage();
        } finally {
          await close();
        }

        // Profile should be deleted after closing the browser
        expect(fs.readdirSync(testTmpDir)).toHaveLength(0);

        // Restore env var
        puppeteer.configuration.temporaryDirectory = oldTmpDir;
      });
      it('userDataDir option restores preferences', async () => {
        const userDataDir = await mkdtemp(TMP_FOLDER);

        const prefsJSPath = path.join(userDataDir, 'prefs.js');
        const prefsJSContent = 'user_pref("browser.warnOnQuit", true)';
        await writeFile(prefsJSPath, prefsJSContent);

        const {context, close} = await launch({userDataDir});
        try {
          // Open a page to make sure its functional.
          await context.newPage();
          expect(fs.readdirSync(userDataDir).length).toBeGreaterThan(0);
          await close();
          expect(fs.readdirSync(userDataDir).length).toBeGreaterThan(0);

          expect(await readFile(prefsJSPath, 'utf8')).toBe(prefsJSContent);
        } finally {
          await close();
        }

        // This might throw. See https://github.com/puppeteer/puppeteer/issues/2778
        try {
          rmSync(userDataDir);
        } catch {}
      });
      it('userDataDir argument', async () => {
        const {isChrome, defaultBrowserOptions: options} = await getTestState({
          skipLaunch: true,
        });

        const userDataDir = await mkdtemp(TMP_FOLDER);
        if (isChrome) {
          options.args = [
            ...(options.args || []),
            `--user-data-dir=${userDataDir}`,
          ];
        } else {
          options.args = [...(options.args || []), '-profile', userDataDir];
        }
        const {close} = await launch(options);
        expect(fs.readdirSync(userDataDir).length).toBeGreaterThan(0);
        await close();
        expect(fs.readdirSync(userDataDir).length).toBeGreaterThan(0);
        // This might throw. See https://github.com/puppeteer/puppeteer/issues/2778
        try {
          rmSync(userDataDir);
        } catch {}
      });
      it('userDataDir argument with non-existent dir', async () => {
        const {isChrome, defaultBrowserOptions} = await getTestState({
          skipLaunch: true,
        });

        const userDataDir = await mkdtemp(TMP_FOLDER);
        rmSync(userDataDir);
        const options = Object.assign({}, defaultBrowserOptions);
        if (isChrome) {
          options.args = [
            ...(defaultBrowserOptions.args || []),
            `--user-data-dir=${userDataDir}`,
          ];
        } else {
          options.args = [
            ...(defaultBrowserOptions.args || []),
            '-profile',
            userDataDir,
          ];
        }
        const {close} = await launch(options);
        expect(fs.readdirSync(userDataDir).length).toBeGreaterThan(0);
        await close();
        expect(fs.readdirSync(userDataDir).length).toBeGreaterThan(0);
        // This might throw. See https://github.com/puppeteer/puppeteer/issues/2778
        try {
          rmSync(userDataDir);
        } catch {}
      });
      it('userDataDir option should restore state', async () => {
        const userDataDir = await mkdtemp(TMP_FOLDER);
        const {server, browser, close} = await launch({userDataDir});
        try {
          const page = await browser.newPage();
          await page.goto(server.EMPTY_PAGE);
          await page.evaluate(() => {
            return (localStorage['hey'] = 'hello');
          });
        } finally {
          await close();
        }

        const {browser: browser2, close: close2} = await launch({userDataDir});

        try {
          const page2 = await browser2.newPage();
          await page2.goto(server.EMPTY_PAGE);
          expect(
            await page2.evaluate(() => {
              return localStorage['hey'];
            })
          ).toBe('hello');
        } finally {
          await close2();
        }

        // This might throw. See https://github.com/puppeteer/puppeteer/issues/2778
        try {
          rmSync(userDataDir);
        } catch {}
      });
      it('userDataDir option should restore cookies', async () => {
        const userDataDir = await mkdtemp(TMP_FOLDER);
        const {server, browser, close} = await launch({userDataDir});
        try {
          const page = await browser.newPage();
          await page.goto(server.EMPTY_PAGE);
          await page.evaluate(() => {
            return (document.cookie =
              'doSomethingOnlyOnce=true; expires=Fri, 31 Dec 9999 23:59:59 GMT');
          });
        } finally {
          await close();
        }

        const {browser: browser2, close: close2} = await launch({userDataDir});
        try {
          const page2 = await browser2.newPage();
          await page2.goto(server.EMPTY_PAGE);
          expect(
            await page2.evaluate(() => {
              return document.cookie;
            })
          ).toBe('doSomethingOnlyOnce=true');
        } finally {
          await close2();
        }

        // This might throw. See https://github.com/puppeteer/puppeteer/issues/2778
        try {
          rmSync(userDataDir);
        } catch {}
      });
      it('should return the default arguments', async () => {
        const {isChrome, isFirefox, puppeteer} = await getTestState({
          skipLaunch: true,
        });

        if (isChrome) {
          expect(puppeteer.defaultArgs()).toContain('--no-first-run');
          expect(puppeteer.defaultArgs()).toContain('--headless');
          expect(puppeteer.defaultArgs({headless: false})).not.toContain(
            '--headless'
          );
          expect(puppeteer.defaultArgs({userDataDir: 'foo'})).toContain(
            `--user-data-dir=${path.resolve('foo')}`
          );
        } else if (isFirefox) {
          expect(puppeteer.defaultArgs()).toContain('--headless');
          expect(puppeteer.defaultArgs()).toContain('--no-remote');
          if (os.platform() === 'darwin') {
            expect(puppeteer.defaultArgs()).toContain('--foreground');
          } else {
            expect(puppeteer.defaultArgs()).not.toContain('--foreground');
          }
          expect(puppeteer.defaultArgs({headless: false})).not.toContain(
            '--headless'
          );
          expect(puppeteer.defaultArgs({userDataDir: 'foo'})).toContain(
            '--profile'
          );
          expect(puppeteer.defaultArgs({userDataDir: 'foo'})).toContain('foo');
        } else {
          expect(puppeteer.defaultArgs()).toContain('-headless');
          expect(puppeteer.defaultArgs({headless: false})).not.toContain(
            '-headless'
          );
          expect(puppeteer.defaultArgs({userDataDir: 'foo'})).toContain(
            '-profile'
          );
          expect(puppeteer.defaultArgs({userDataDir: 'foo'})).toContain(
            path.resolve('foo')
          );
        }
      });
      it('should report the correct product', async () => {
        const {isChrome, isFirefox, puppeteer} = await getTestState({
          skipLaunch: true,
        });
        if (isChrome) {
          expect(puppeteer.product).toBe('chrome');
        } else if (isFirefox) {
          expect(puppeteer.product).toBe('firefox');
        }
      });
      (!isHeadless ? it : it.skip)(
        'should work with no default arguments',
        async () => {
          const {context, close} = await launch({
            ignoreDefaultArgs: true,
          });
          try {
            const page = await context.newPage();
            expect(await page.evaluate('11 * 11')).toBe(121);
            await page.close();
          } finally {
            await close();
          }
        }
      );
      it('should filter out ignored default arguments in Chrome', async () => {
        const {defaultBrowserOptions, puppeteer} = await getTestState({
          skipLaunch: true,
        });
        // Make sure we launch with `--enable-automation` by default.
        const defaultArgs = puppeteer.defaultArgs();
        const {browser, close} = await launch(
          Object.assign({}, defaultBrowserOptions, {
            // Ignore first and third default argument.
            ignoreDefaultArgs: [defaultArgs[0]!, defaultArgs[2]],
          })
        );
        try {
          const spawnargs = browser.process()!.spawnargs;
          if (!spawnargs) {
            throw new Error('spawnargs not present');
          }
          expect(spawnargs.indexOf(defaultArgs[0]!)).toBe(-1);
          expect(spawnargs.indexOf(defaultArgs[1]!)).not.toBe(-1);
          expect(spawnargs.indexOf(defaultArgs[2]!)).toBe(-1);
        } finally {
          await close();
        }
      });
      it('should filter out ignored default argument in Firefox', async () => {
        const {defaultBrowserOptions, puppeteer} = await getTestState({
          skipLaunch: true,
        });

        const defaultArgs = puppeteer.defaultArgs();
        const {browser, close} = await launch(
          Object.assign({}, defaultBrowserOptions, {
            // Only the first argument is fixed, others are optional.
            ignoreDefaultArgs: [defaultArgs[0]!],
          })
        );
        try {
          const spawnargs = browser.process()!.spawnargs;
          if (!spawnargs) {
            throw new Error('spawnargs not present');
          }
          expect(spawnargs.indexOf(defaultArgs[0]!)).toBe(-1);
          expect(spawnargs.indexOf(defaultArgs[1]!)).not.toBe(-1);
        } finally {
          await close();
        }
      });
      it('should have default URL when launching browser', async function () {
        const {browser, close} = await launch(
          {},
          {
            createContext: false,
          }
        );
        try {
          const pages = (await browser.pages()).map(page => {
            return page.url();
          });
          expect(pages).toEqual(['about:blank']);
        } finally {
          await close();
        }
      });
      it('should have custom URL when launching browser', async () => {
        const {server, defaultBrowserOptions} = await getTestState({
          skipLaunch: true,
        });

        const options = Object.assign({}, defaultBrowserOptions);
        options.args = [server.EMPTY_PAGE].concat(options.args || []);
        const {browser, close} = await launch(options, {
          createContext: false,
        });
        try {
          const pages = await browser.pages();
          expect(pages).toHaveLength(1);
          const page = pages[0]!;
          if (page.url() !== server.EMPTY_PAGE) {
            await page.waitForNavigation();
          }
          expect(page.url()).toBe(server.EMPTY_PAGE);
        } finally {
          await close();
        }
      });
      it('should pass the timeout parameter to browser.waitForTarget', async () => {
        const options = {
          timeout: 1,
        };
        let error!: Error;
        await launch(options).catch(error_ => {
          return (error = error_);
        });
        expect(error).toBeInstanceOf(TimeoutError);
      });
      it('should work with timeout = 0', async () => {
        const {close} = await launch({
          timeout: 0,
        });
        await close();
      });
      it('should set the default viewport', async () => {
        const {context, close} = await launch({
          defaultViewport: {
            width: 456,
            height: 789,
          },
        });

        try {
          const page = await context.newPage();
          expect(await page.evaluate('window.innerWidth')).toBe(456);
          expect(await page.evaluate('window.innerHeight')).toBe(789);
        } finally {
          await close();
        }
      });
      it('should disable the default viewport', async () => {
        const {context, close} = await launch({
          defaultViewport: null,
        });
        try {
          const page = await context.newPage();
          expect(page.viewport()).toBe(null);
        } finally {
          await close();
        }
      });
      it('should take fullPage screenshots when defaultViewport is null', async () => {
        const {server, context, close} = await launch({
          defaultViewport: null,
        });
        try {
          const page = await context.newPage();
          await page.goto(server.PREFIX + '/grid.html');
          const screenshot = await page.screenshot({
            fullPage: true,
          });
          expect(screenshot).toBeInstanceOf(Buffer);
        } finally {
          await close();
        }
      });
      it('should set the debugging port', async () => {
        const {browser, close} = await launch({
          defaultViewport: null,
          debuggingPort: 9999,
        });
        try {
          const url = new URL(browser.wsEndpoint());
          expect(url.port).toBe('9999');
        } finally {
          await close();
        }
      });
      it('should not allow setting debuggingPort and pipe', async () => {
        const options = {
          defaultViewport: null,
          debuggingPort: 9999,
          pipe: true,
        };
        let error!: Error;
        await launch(options).catch(error_ => {
          return (error = error_);
        });
        expect(error.message).toContain('either pipe or debugging port');
      });
      (!isHeadless ? it : it.skip)(
        'should launch Chrome properly with --no-startup-window and waitForInitialPage=false',
        async () => {
          const {defaultBrowserOptions} = await getTestState({
            skipLaunch: true,
          });
          const options = {
            waitForInitialPage: false,
            // This is needed to prevent Puppeteer from adding an initial blank page.
            // See also https://github.com/puppeteer/puppeteer/blob/ad6b736039436fcc5c0a262e5b575aa041427be3/src/node/Launcher.ts#L200
            ignoreDefaultArgs: true,
            ...defaultBrowserOptions,
            args: ['--no-startup-window'],
          };
          const {browser, close} = await launch(options, {
            createContext: false,
          });
          try {
            const pages = await browser.pages();
            expect(pages).toHaveLength(0);
          } finally {
            await close();
          }
        }
      );
    });

    describe('Puppeteer.launch', function () {
      it('should be able to launch Chrome', async () => {
        const {browser, close} = await launch({product: 'chrome'});
        try {
          const userAgent = await browser.userAgent();
          expect(userAgent).toContain('Chrome');
        } finally {
          await close();
        }
      });

      it('should be able to launch Firefox', async function () {
        this.timeout(FIREFOX_TIMEOUT);
        const {browser, close} = await launch({product: 'firefox'});
        try {
          const userAgent = await browser.userAgent();
          expect(userAgent).toContain('Firefox');
        } finally {
          await close();
        }
      });
    });

    describe('Puppeteer.connect', function () {
      it('should be able to connect multiple times to the same browser', async () => {
        const {puppeteer, browser, close} = await launch({});
        try {
          const otherBrowser = await puppeteer.connect({
            browserWSEndpoint: browser.wsEndpoint(),
          });
          const page = await otherBrowser.newPage();
          expect(
            await page.evaluate(() => {
              return 7 * 8;
            })
          ).toBe(56);
          otherBrowser.disconnect();

          const secondPage = await browser.newPage();
          expect(
            await secondPage.evaluate(() => {
              return 7 * 6;
            })
          ).toBe(42);
        } finally {
          await close();
        }
      });
      it('should be able to close remote browser', async () => {
        const {puppeteer, browser, close} = await launch({});
        try {
          const remoteBrowser = await puppeteer.connect({
            browserWSEndpoint: browser.wsEndpoint(),
          });
          await Promise.all([
            waitEvent(browser, 'disconnected'),
            remoteBrowser.close(),
          ]);
        } finally {
          await close();
        }
      });
      it('should be able to connect to a browser with no page targets', async () => {
        const {puppeteer, browser, close} = await launch({});

        try {
          const pages = await browser.pages();
          await Promise.all(
            pages.map(page => {
              return page.close();
            })
          );
          const remoteBrowser = await puppeteer.connect({
            browserWSEndpoint: browser.wsEndpoint(),
          });
          await Promise.all([
            waitEvent(browser, 'disconnected'),
            remoteBrowser.close(),
          ]);
        } finally {
          await close();
        }
      });
      it('should support ignoreHTTPSErrors option', async () => {
        const {puppeteer, httpsServer, browser, close} = await launch(
          {},
          {
            createContext: false,
          }
        );

        try {
          const browserWSEndpoint = browser.wsEndpoint();
          const remoteBrowser = await puppeteer.connect({
            browserWSEndpoint,
            ignoreHTTPSErrors: true,
          });
          const page = await remoteBrowser.newPage();
          let error!: Error;
          const [serverRequest, response] = await Promise.all([
            httpsServer.waitForRequest('/empty.html'),
            page.goto(httpsServer.EMPTY_PAGE).catch(error_ => {
              return (error = error_);
            }),
          ]);
          expect(error).toBeUndefined();
          expect(response.ok()).toBe(true);
          expect(response.securityDetails()).toBeTruthy();
          const protocol = (serverRequest.socket as TLSSocket)
            .getProtocol()!
            .replace('v', ' ');
          expect(response.securityDetails().protocol()).toBe(protocol);
          await page.close();
          await remoteBrowser.close();
        } finally {
          await close();
        }
      });

      it('should support targetFilter option in puppeteer.launch', async () => {
        const {browser, close} = await launch(
          {
            targetFilter: target => {
              return target.type() !== 'page';
            },
            waitForInitialPage: false,
          },
          {createContext: false}
        );
        try {
          const targets = browser.targets();
          expect(targets).toHaveLength(1);
          expect(
            targets.find(target => {
              return target.type() === 'page';
            })
          ).toBeUndefined();
        } finally {
          await close();
        }
      });

      // @see https://github.com/puppeteer/puppeteer/issues/4197
      it('should support targetFilter option', async () => {
        const {puppeteer, server, browser, close} = await launch(
          {},
          {
            createContext: false,
          }
        );
        try {
          const browserWSEndpoint = browser.wsEndpoint();
          const page1 = await browser.newPage();
          await page1.goto(server.EMPTY_PAGE);

          const page2 = await browser.newPage();
          await page2.goto(server.EMPTY_PAGE + '?should-be-ignored');

          const remoteBrowser = await puppeteer.connect({
            browserWSEndpoint,
            targetFilter: target => {
              return !target.url().includes('should-be-ignored');
            },
          });

          const pages = await remoteBrowser.pages();

          expect(
            pages
              .map((p: Page) => {
                return p.url();
              })
              .sort()
          ).toEqual(['about:blank', server.EMPTY_PAGE]);

          await page2.close();
          await page1.close();
          remoteBrowser.disconnect();
          await browser.close();
        } finally {
          await close();
        }
      });
      it('should be able to reconnect to a disconnected browser', async () => {
        const {puppeteer, server, browser, close} = await launch({});
        try {
          const browserWSEndpoint = browser.wsEndpoint();
          const page = await browser.newPage();
          await page.goto(server.PREFIX + '/frames/nested-frames.html');
          browser.disconnect();

          const remoteBrowser = await puppeteer.connect({browserWSEndpoint});
          const pages = await remoteBrowser.pages();
          const restoredPage = pages.find(page => {
            return page.url() === server.PREFIX + '/frames/nested-frames.html';
          })!;
          expect(dumpFrames(restoredPage.mainFrame())).toEqual([
            'http://localhost:<PORT>/frames/nested-frames.html',
            '    http://localhost:<PORT>/frames/two-frames.html (2frames)',
            '        http://localhost:<PORT>/frames/frame.html (uno)',
            '        http://localhost:<PORT>/frames/frame.html (dos)',
            '    http://localhost:<PORT>/frames/frame.html (aframe)',
          ]);
          expect(
            await restoredPage.evaluate(() => {
              return 7 * 8;
            })
          ).toBe(56);
          await remoteBrowser.close();
        } finally {
          await close();
        }
      });
      // @see https://github.com/puppeteer/puppeteer/issues/4197#issuecomment-481793410
      it('should be able to connect to the same page simultaneously', async () => {
        const {puppeteer, browser: browserOne, close} = await launch({});

        try {
          const browserTwo = await puppeteer.connect({
            browserWSEndpoint: browserOne.wsEndpoint(),
          });
          const [page1, page2] = await Promise.all([
            new Promise<Page | null>(x => {
              return browserOne.once('targetcreated', target => {
                x(target.page());
              });
            }),
            browserTwo.newPage(),
          ]);
          assert(page1);
          expect(
            await page1.evaluate(() => {
              return 7 * 8;
            })
          ).toBe(56);
          expect(
            await page2.evaluate(() => {
              return 7 * 6;
            })
          ).toBe(42);
        } finally {
          await close();
        }
      });
      it('should be able to reconnect', async () => {
        const {
          puppeteer,
          server,
          browser: browserOne,
          close,
        } = await launch({});
        try {
          const browserWSEndpoint = browserOne.wsEndpoint();
          const pageOne = await browserOne.newPage();
          await pageOne.goto(server.EMPTY_PAGE);
          browserOne.disconnect();

          const browserTwo = await puppeteer.connect({
            browserWSEndpoint,
          });
          const pages = await browserTwo.pages();
          const pageTwo = pages.find(page => {
            return page.url() === server.EMPTY_PAGE;
          })!;
          await pageTwo.reload();
          using _ = await pageTwo.waitForSelector('body', {
            timeout: 10000,
          });
          await browserTwo.close();
        } finally {
          await close();
        }
      });
    });
    describe('Puppeteer.executablePath', function () {
      it('should work', async () => {
        const {puppeteer} = await getTestState({
          skipLaunch: true,
        });

        const executablePath = puppeteer.executablePath();
        expect(fs.existsSync(executablePath)).toBe(true);
        expect(fs.realpathSync(executablePath)).toBe(executablePath);
      });
      it('returns executablePath for channel', async () => {
        const {puppeteer} = await getTestState({
          skipLaunch: true,
        });

        const executablePath = puppeteer.executablePath('chrome');
        expect(executablePath).toBeTruthy();
      });
      describe('when executable path is configured', () => {
        const sandbox = sinon.createSandbox();

        beforeEach(async () => {
          const {puppeteer} = await getTestState({
            skipLaunch: true,
          });
          sandbox
            .stub(puppeteer.configuration, 'executablePath')
            .value('SOME_CUSTOM_EXECUTABLE');
        });

        afterEach(() => {
          sandbox.restore();
        });

        it('its value is used', async () => {
          const {puppeteer} = await getTestState({
            skipLaunch: true,
          });
          try {
            puppeteer.executablePath();
          } catch (error) {
            expect((error as Error).message).toContain(
              'SOME_CUSTOM_EXECUTABLE'
            );
          }
        });
      });
    });
  });

  describe('Browser target events', function () {
    it('should work', async () => {
      const {browser, server, close} = await launch({});

      try {
        const events: string[] = [];
        browser.on('targetcreated', () => {
          events.push('CREATED');
        });
        browser.on('targetchanged', () => {
          events.push('CHANGED');
        });
        browser.on('targetdestroyed', () => {
          events.push('DESTROYED');
        });
        const page = await browser.newPage();
        await page.goto(server.EMPTY_PAGE);
        await page.close();
        expect(events).toEqual(['CREATED', 'CHANGED', 'DESTROYED']);
      } finally {
        await close();
      }
    });
  });

  describe('Browser.Events.disconnected', function () {
    it('should be emitted when: browser gets closed, disconnected or underlying websocket gets closed', async () => {
      const {puppeteer, browser, close} = await launch({});
      try {
        const browserWSEndpoint = browser.wsEndpoint();
        const remoteBrowser1 = await puppeteer.connect({
          browserWSEndpoint,
        });
        const remoteBrowser2 = await puppeteer.connect({
          browserWSEndpoint,
        });

        let disconnectedOriginal = 0;
        let disconnectedRemote1 = 0;
        let disconnectedRemote2 = 0;
        browser.on('disconnected', () => {
          ++disconnectedOriginal;
        });
        remoteBrowser1.on('disconnected', () => {
          ++disconnectedRemote1;
        });
        remoteBrowser2.on('disconnected', () => {
          ++disconnectedRemote2;
        });

        await Promise.all([
          waitEvent(remoteBrowser2, 'disconnected'),
          remoteBrowser2.disconnect(),
        ]);

        expect(disconnectedOriginal).toBe(0);
        expect(disconnectedRemote1).toBe(0);
        expect(disconnectedRemote2).toBe(1);

        await Promise.all([
          waitEvent(remoteBrowser1, 'disconnected'),
          waitEvent(browser, 'disconnected'),
          browser.close(),
        ]);

        expect(disconnectedOriginal).toBe(1);
        expect(disconnectedRemote1).toBe(1);
        expect(disconnectedRemote2).toBe(1);
      } finally {
        await close();
      }
    });
  });
});
