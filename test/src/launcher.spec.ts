/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
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

import {getTestState, launch} from './mocha-utils.js';
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
          using remote = await puppeteer.connect({
            browserWSEndpoint: browser.wsEndpoint(),
            protocol: browser.protocol,
          });
          const page = await remote.newPage();
          const navigationPromise = page
            .goto(server.PREFIX + '/one-style.html', {timeout: 60_000})
            .catch(error_ => {
              return error_;
            });
          await server.waitForRequest('/one-style.css');
          await remote.disconnect();
          const error = await navigationPromise;
          expect(
            [
              'Navigating frame was detached',
              'Protocol error (Page.navigate): Target closed.',
              'Protocol error (browsingContext.navigate): Target closed',
              'Frame detached',
            ].some(message => {
              return error.message.startsWith(message);
            }),
          ).toBeTruthy();
        } finally {
          await close();
        }
      });
      it('should reject waitForSelector when browser closes', async () => {
        const {browser, close, server, puppeteer} = await launch({});
        server.setRoute('/empty.html', () => {});
        try {
          using remote = await puppeteer.connect({
            browserWSEndpoint: browser.wsEndpoint(),
            protocol: browser.protocol,
          });
          const page = await remote.newPage();
          const watchdog = page
            .waitForSelector('div', {timeout: 60_000})
            .catch(error_ => {
              return error_;
            });
          await remote.disconnect();
          const error = await watchdog;
          expect(error.message).toContain(
            'Waiting for selector `div` failed: waitForFunction failed: frame got detached.',
          );
        } finally {
          await close();
        }
      });
    });
    describe('Browser.close', function () {
      it('should terminate network waiters', async () => {
        const {browser, close, server, puppeteer} = await launch({});
        try {
          using remote = await puppeteer.connect({
            browserWSEndpoint: browser.wsEndpoint(),
            protocol: browser.protocol,
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
              'Browser already closed',
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

      it('can launch multiple instances without node warnings', async () => {
        const instances = [];
        let warning: Error | undefined;
        const warningHandler: NodeJS.WarningListener = w => {
          warning = w;
        };
        process.on('warning', warningHandler);
        process.setMaxListeners(1);
        try {
          for (let i = 0; i < 2; i++) {
            instances.push(launch({}));
          }
          await Promise.all(
            (await Promise.all(instances)).map(instance => {
              return instance.close();
            }),
          );
        } finally {
          process.setMaxListeners(10);
        }
        process.off('warning', warningHandler);
        expect(warning?.stack).toBe(undefined);
      });
      it('should have default url when launching browser', async function () {
        const {browser, close} = await launch({});
        try {
          const pages = (await browser.pages()).map(
            (page: {url: () => any}) => {
              return page.url();
            },
          );
          expect(pages).toEqual(['about:blank']);
        } finally {
          await close();
        }
      });
      it('should close browser with beforeunload page', async () => {
        const {browser, server, close} = await launch({});
        try {
          const page = await browser.newPage();

          await page.goto(server.PREFIX + '/beforeunload.html');
          // We have to interact with a page so that 'beforeunload' handlers
          // fire.
          await page.click('body');
        } finally {
          await close();
        }
      });
      it('should reject all promises when browser is closed', async () => {
        const {browser, close} = await launch({});
        let error!: Error;
        const page = await browser.newPage();
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
        expect(waitError.message).toBe(
          'Browser was not found at the configured executablePath (random-invalid-path)',
        );
      });
      it('userDataDir option', async () => {
        const userDataDir = await mkdtemp(TMP_FOLDER);
        const {browser, close} = await launch({userDataDir});
        // Open a page to make sure its functional.
        try {
          await browser.newPage();
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
        const {puppeteer, isFirefox} = await getTestState({skipLaunch: true});

        // Set a custom test tmp dir so that we can validate that
        // the profile dir is created and then cleaned up.
        const testTmpDir = await fs.promises.mkdtemp(
          path.join(os.tmpdir(), 'puppeteer_test_chrome_profile-'),
        );
        const oldTmpDir = puppeteer.configuration.temporaryDirectory;
        puppeteer.configuration.temporaryDirectory = testTmpDir;

        // Path should be empty before starting the browser.
        expect(fs.readdirSync(testTmpDir)).toHaveLength(0);
        const {browser, close} = await launch({});
        try {
          // One profile folder should have been created at this moment.
          const profiles = fs.readdirSync(testTmpDir);
          expect(profiles).toHaveLength(1);
          const expectedProfile = isFirefox
            ? 'puppeteer_dev_firefox_profile-'
            : 'puppeteer_dev_chrome_profile-';
          expect(profiles[0]?.startsWith(expectedProfile)).toBe(true);

          // Open a page to make sure its functional.
          await browser.newPage();
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
        const userJSPath = path.join(userDataDir, 'user.js');
        const prefsJSContent = 'user_pref("browser.warnOnQuit", true)';
        await writeFile(prefsJSPath, prefsJSContent);
        await writeFile(userJSPath, prefsJSContent);

        const {browser, close} = await launch({userDataDir});
        try {
          // Open a page to make sure its functional.
          await browser.newPage();
          expect(fs.readdirSync(userDataDir).length).toBeGreaterThan(0);
          await close();
          expect(fs.readdirSync(userDataDir).length).toBeGreaterThan(0);

          expect(await readFile(prefsJSPath, 'utf8')).toBe(prefsJSContent);
          expect(await readFile(userJSPath, 'utf8')).toBe(prefsJSContent);
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
            }),
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
            }),
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
          expect(puppeteer.defaultArgs()).toContain('--headless=new');
          expect(puppeteer.defaultArgs({headless: false})).not.toContain(
            '--headless=new',
          );
          expect(puppeteer.defaultArgs({userDataDir: 'foo'})).toContain(
            `--user-data-dir=${path.resolve('foo')}`,
          );
        } else if (isFirefox) {
          expect(puppeteer.defaultArgs()).toContain('--headless');
          if (os.platform() === 'darwin') {
            expect(puppeteer.defaultArgs()).toContain('--foreground');
          } else {
            expect(puppeteer.defaultArgs()).not.toContain('--foreground');
          }
          expect(puppeteer.defaultArgs({headless: false})).not.toContain(
            '--headless',
          );
          expect(puppeteer.defaultArgs({userDataDir: 'foo'})).toContain(
            '--profile',
          );
          expect(puppeteer.defaultArgs({userDataDir: 'foo'})).toContain('foo');
        } else {
          expect(puppeteer.defaultArgs()).toContain('-headless');
          expect(puppeteer.defaultArgs({headless: false})).not.toContain(
            '-headless',
          );
          expect(puppeteer.defaultArgs({userDataDir: 'foo'})).toContain(
            '-profile',
          );
          expect(puppeteer.defaultArgs({userDataDir: 'foo'})).toContain(
            path.resolve('foo'),
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
      it('should work with no default arguments', async () => {
        const {browser, close} = await launch({
          ignoreDefaultArgs: true,
        });
        try {
          const page = await browser.newPage();
          expect(await page.evaluate('11 * 11')).toBe(121);
          await page.close();
        } finally {
          await close();
        }
      });
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
          }),
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
            // All arguments are optional.
            ignoreDefaultArgs: [],
          }),
        );
        try {
          const spawnargs = browser.process()!.spawnargs;
          if (!spawnargs) {
            throw new Error('spawnargs not present');
          }
          expect(spawnargs.indexOf(defaultArgs[0]!)).not.toBe(-1);
        } finally {
          await close();
        }
      });
      it('should have default URL when launching browser', async function () {
        const {browser, close} = await launch({});
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
        const {browser, close} = await launch(options);
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
        let error!: Error;
        await launch({
          timeout: 1,
        }).catch(error_ => {
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
        const {browser, close} = await launch({
          defaultViewport: {
            width: 456,
            height: 789,
          },
        });

        try {
          const page = await browser.newPage();
          expect(await page.evaluate('window.innerWidth')).toBe(456);
          expect(await page.evaluate('window.innerHeight')).toBe(789);
        } finally {
          await close();
        }
      });
      it('should disable the default viewport', async () => {
        const {browser, close} = await launch({
          defaultViewport: null,
        });
        try {
          const page = await browser.newPage();
          expect(page.viewport()).toBe(null);
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

      it('throws an error if executable path is not valid with pipe=true', async () => {
        const options = {
          executablePath: '/tmp/does-not-exist',
          pipe: true,
        };
        let error!: Error;
        await launch(options).catch(error_ => {
          return (error = error_);
        });
        expect(error.message).toContain(
          'Browser was not found at the configured executablePath (/tmp/does-not-exist)',
        );
      });
    });

    describe('Puppeteer.connect', function () {
      it('should be able to connect multiple times to the same browser', async () => {
        const {puppeteer, browser, close} = await launch({});
        try {
          using otherBrowser = await puppeteer.connect({
            browserWSEndpoint: browser.wsEndpoint(),
            protocol: browser.protocol,
          });
          const page = await otherBrowser.newPage();
          expect(
            await page.evaluate(() => {
              return 7 * 8;
            }),
          ).toBe(56);
          await otherBrowser.disconnect();

          const secondPage = await browser.newPage();
          expect(
            await secondPage.evaluate(() => {
              return 7 * 6;
            }),
          ).toBe(42);
        } finally {
          await close();
        }
      });
      it('should be able to close remote browser', async () => {
        const {puppeteer, browser, close} = await launch({});
        try {
          using remoteBrowser = await puppeteer.connect({
            browserWSEndpoint: browser.wsEndpoint(),
            protocol: browser.protocol,
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
            }),
          );
          using remoteBrowser = await puppeteer.connect({
            browserWSEndpoint: browser.wsEndpoint(),
            protocol: browser.protocol,
          });
          await Promise.all([
            waitEvent(browser, 'disconnected'),
            remoteBrowser.close(),
          ]);
        } finally {
          await close();
        }
      });
      it('should support acceptInsecureCerts option', async () => {
        const {puppeteer, httpsServer, browser, close} = await launch({});

        try {
          const browserWSEndpoint = browser.wsEndpoint();
          using remoteBrowser = await puppeteer.connect({
            browserWSEndpoint,
            acceptInsecureCerts: true,
            protocol: browser.protocol,
          });
          const page = await remoteBrowser.newPage();
          const [serverRequest, response] = await Promise.all([
            httpsServer.waitForRequest('/empty.html'),
            page.goto(httpsServer.EMPTY_PAGE),
          ]);
          expect(response!.ok()).toBe(true);
          expect(response!.securityDetails()).toBeTruthy();
          const protocol = (serverRequest.socket as TLSSocket)
            .getProtocol()!
            .replace('v', ' ');
          expect(response!.securityDetails()!.protocol()).toBe(protocol);
          await page.close();
        } finally {
          await close();
        }
      });

      it('should support targetFilter option in puppeteer.launch', async () => {
        const {browser, close} = await launch({
          targetFilter: target => {
            return target.type() !== 'page';
          },
          waitForInitialPage: false,
        });
        try {
          const targets = browser.targets();
          expect(targets).toHaveLength(1);
          expect(
            targets.find(target => {
              return target.type() === 'page';
            }),
          ).toBeUndefined();
        } finally {
          await close();
        }
      });

      // @see https://github.com/puppeteer/puppeteer/issues/4197
      it('should support targetFilter option', async () => {
        const {puppeteer, server, browser, close} = await launch({});
        try {
          const browserWSEndpoint = browser.wsEndpoint();
          const page1 = await browser.newPage();
          await page1.goto(server.EMPTY_PAGE);

          const page2 = await browser.newPage();
          await page2.goto(server.EMPTY_PAGE + '?should-be-ignored');

          using remoteBrowser = await puppeteer.connect({
            browserWSEndpoint,
            targetFilter: target => {
              return !target.url().includes('should-be-ignored');
            },
            protocol: browser.protocol,
          });

          const pages = await remoteBrowser.pages();

          expect(
            pages
              .map((p: Page) => {
                return p.url();
              })
              .sort(),
          ).toEqual(['about:blank', server.EMPTY_PAGE]);

          await page2.close();
          await page1.close();
          await remoteBrowser.disconnect();
          await browser.close();
        } finally {
          await close();
        }
      });
      it('should be able to reconnect to a disconnected browser', async () => {
        const {puppeteer, server, browser, close} = await launch({});
        // Connection is closed on the original one
        let remoteClose!: () => Promise<void>;
        try {
          const browserWSEndpoint = browser.wsEndpoint();
          const page = await browser.newPage();
          await page.goto(server.PREFIX + '/frames/nested-frames.html');
          await browser.disconnect();

          const remoteBrowser = await puppeteer.connect({
            browserWSEndpoint,
            protocol: browser.protocol,
          });
          remoteClose = remoteBrowser.close.bind(remoteBrowser);
          const pages = await remoteBrowser.pages();
          const restoredPage = pages.find(page => {
            return page.url() === server.PREFIX + '/frames/nested-frames.html';
          })!;
          expect(await dumpFrames(restoredPage.mainFrame())).toEqual([
            'http://localhost:<PORT>/frames/nested-frames.html',
            '    http://localhost:<PORT>/frames/two-frames.html (2frames)',
            '        http://localhost:<PORT>/frames/frame.html (uno)',
            '        http://localhost:<PORT>/frames/frame.html (dos)',
            '    http://localhost:<PORT>/frames/frame.html (aframe)',
          ]);
          expect(
            await restoredPage.evaluate(() => {
              return 7 * 8;
            }),
          ).toBe(56);
        } finally {
          await remoteClose();
          await close();
        }
      });
      // @see https://github.com/puppeteer/puppeteer/issues/4197#issuecomment-481793410
      it('should be able to connect to the same page simultaneously', async () => {
        const {puppeteer, browser: browserOne, close} = await launch({});

        try {
          using browserTwo = await puppeteer.connect({
            browserWSEndpoint: browserOne.wsEndpoint(),
            protocol: browserOne.protocol,
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
            }),
          ).toBe(56);
          expect(
            await page2.evaluate(() => {
              return 7 * 6;
            }),
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
        // Connection is closed on the original one
        let remoteClose!: () => Promise<void>;
        try {
          const browserWSEndpoint = browserOne.wsEndpoint();
          const pageOne = await browserOne.newPage();
          await pageOne.goto(server.EMPTY_PAGE);
          await browserOne.disconnect();

          const browserTwo = await puppeteer.connect({
            browserWSEndpoint,
            protocol: browserOne.protocol,
          });
          remoteClose = browserTwo.close.bind(browserTwo);
          const pages = await browserTwo.pages();
          const pageTwo = pages.find(page => {
            return page.url() === server.EMPTY_PAGE;
          })!;
          await pageTwo.reload();
          using _ = await pageTwo.waitForSelector('body', {
            timeout: 10000,
          });
        } finally {
          await remoteClose();
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
              'SOME_CUSTOM_EXECUTABLE',
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
        browser.on('targetcreated', target => {
          events.push('CREATED: ' + target.url());
        });
        browser.on('targetchanged', target => {
          events.push('CHANGED: ' + target.url());
        });
        browser.on('targetdestroyed', target => {
          events.push('DESTROYED: ' + target.url());
        });
        const page = await browser.newPage();
        await page.goto(server.EMPTY_PAGE);
        await page.close();
        expect(events).toEqual([
          'CREATED: about:blank',
          `CHANGED: ${server.EMPTY_PAGE}`,
          `DESTROYED: ${server.EMPTY_PAGE}`,
        ]);
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
        using remoteBrowser1 = await puppeteer.connect({
          browserWSEndpoint,
          protocol: browser.protocol,
        });
        using remoteBrowser2 = await puppeteer.connect({
          browserWSEndpoint,
          protocol: browser.protocol,
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
