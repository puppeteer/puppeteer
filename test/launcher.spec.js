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
const fs = require('fs');
const os = require('os');
const path = require('path');
const {helper} = require('../lib/helper');
const rmAsync = helper.promisify(require('rimraf'));
const mkdtempAsync = helper.promisify(fs.mkdtemp);
const readFileAsync = helper.promisify(fs.readFile);
const statAsync = helper.promisify(fs.stat);
const TMP_FOLDER = path.join(os.tmpdir(), 'pptr_tmp_folder-');
const utils = require('./utils');
const expect = require('expect');
const {getTestState} = require('./mocha-utils');

describe('Launcher specs', function() {
  describe('Puppeteer', function() {
    describe('BrowserFetcher', function() {
      it('should download and extract chrome linux binary', async() => {
        const {server, puppeteer} = getTestState();

        const downloadsFolder = await mkdtempAsync(TMP_FOLDER);
        const browserFetcher = puppeteer.createBrowserFetcher({
          platform: 'linux',
          path: downloadsFolder,
          host: server.PREFIX
        });
        const expectedRevision = '123456';
        let revisionInfo = browserFetcher.revisionInfo(expectedRevision);
        server.setRoute(revisionInfo.url.substring(server.PREFIX.length), (req, res) => {
          server.serveFile(req, res, '/chromium-linux.zip');
        });

        expect(revisionInfo.local).toBe(false);
        expect(browserFetcher.platform()).toBe('linux');
        expect(browserFetcher.product()).toBe('chrome');
        expect(!!browserFetcher.host()).toBe(true);
        expect(await browserFetcher.canDownload('100000')).toBe(false);
        expect(await browserFetcher.canDownload(expectedRevision)).toBe(true);

        revisionInfo = await browserFetcher.download(expectedRevision);
        expect(revisionInfo.local).toBe(true);
        expect(await readFileAsync(revisionInfo.executablePath, 'utf8')).toBe('LINUX BINARY\n');
        const expectedPermissions = os.platform() === 'win32' ? 0o666 : 0o755;
        expect((await statAsync(revisionInfo.executablePath)).mode & 0o777).toBe(expectedPermissions);
        expect(await browserFetcher.localRevisions()).toEqual([expectedRevision]);
        await browserFetcher.remove(expectedRevision);
        expect(await browserFetcher.localRevisions()).toEqual([]);
        await rmAsync(downloadsFolder);
      });
      it('should download and extract firefox linux binary', async() => {
        const {server , puppeteer} = getTestState();

        const downloadsFolder = await mkdtempAsync(TMP_FOLDER);
        const browserFetcher = puppeteer.createBrowserFetcher({
          platform: 'linux',
          path: downloadsFolder,
          host: server.PREFIX,
          product: 'firefox',
        });
        const expectedVersion = '75';
        let revisionInfo = browserFetcher.revisionInfo(expectedVersion);
        server.setRoute(revisionInfo.url.substring(server.PREFIX.length), (req, res) => {
          server.serveFile(req, res, `/firefox-${expectedVersion}.0a1.en-US.linux-x86_64.tar.bz2`);
        });

        expect(revisionInfo.local).toBe(false);
        expect(browserFetcher.platform()).toBe('linux');
        expect(browserFetcher.product()).toBe('firefox');
        expect(await browserFetcher.canDownload('100000')).toBe(false);
        expect(await browserFetcher.canDownload(expectedVersion)).toBe(true);

        revisionInfo = await browserFetcher.download(expectedVersion);
        expect(revisionInfo.local).toBe(true);
        expect(await readFileAsync(revisionInfo.executablePath, 'utf8')).toBe('FIREFOX LINUX BINARY\n');
        const expectedPermissions = os.platform() === 'win32' ? 0o666 : 0o755;
        expect((await statAsync(revisionInfo.executablePath)).mode & 0o777).toBe(expectedPermissions);
        expect(await browserFetcher.localRevisions()).toEqual([expectedVersion]);
        await browserFetcher.remove(expectedVersion);
        expect(await browserFetcher.localRevisions()).toEqual([]);
        await rmAsync(downloadsFolder);
      });
    });

    describe('Browser.disconnect', function() {
      it('should reject navigation when browser closes', async() => {
        const {server, puppeteer, defaultBrowserOptions} = getTestState();
        server.setRoute('/one-style.css', () => {});
        const browser = await puppeteer.launch(defaultBrowserOptions);
        const remote = await puppeteer.connect({browserWSEndpoint: browser.wsEndpoint()});
        const page = await remote.newPage();
        const navigationPromise = page.goto(server.PREFIX + '/one-style.html', {timeout: 60000}).catch(error_ => error_);
        await server.waitForRequest('/one-style.css');
        remote.disconnect();
        const error = await navigationPromise;
        expect(error.message).toBe('Navigation failed because browser has disconnected!');
        await browser.close();
      });
      it('should reject waitForSelector when browser closes', async() => {
        const {server, puppeteer, defaultBrowserOptions} = getTestState();

        server.setRoute('/empty.html', () => {});
        const browser = await puppeteer.launch(defaultBrowserOptions);
        const remote = await puppeteer.connect({browserWSEndpoint: browser.wsEndpoint()});
        const page = await remote.newPage();
        const watchdog = page.waitForSelector('div', {timeout: 60000}).catch(error_ => error_);
        remote.disconnect();
        const error = await watchdog;
        expect(error.message).toContain('Protocol error');
        await browser.close();
      });
    });
    describe('Browser.close', function() {
      it('should terminate network waiters', async() => {
        const {server, puppeteer, defaultBrowserOptions} = getTestState();

        const browser = await puppeteer.launch(defaultBrowserOptions);
        const remote = await puppeteer.connect({browserWSEndpoint: browser.wsEndpoint()});
        const newPage = await remote.newPage();
        const results = await Promise.all([
          newPage.waitForRequest(server.EMPTY_PAGE).catch(error => error),
          newPage.waitForResponse(server.EMPTY_PAGE).catch(error => error),
          browser.close()
        ]);
        for (let i = 0; i < 2; i++) {
          const message = results[i].message;
          expect(message).toContain('Target closed');
          expect(message).not.toContain('Timeout');
        }
        await browser.close();
      });
    });
    describe('Puppeteer.launch', function() {
      it('should reject all promises when browser is closed', async() => {
        const {defaultBrowserOptions, puppeteer} = getTestState();
        const browser = await puppeteer.launch(defaultBrowserOptions);
        const page = await browser.newPage();
        let error = null;
        const neverResolves = page.evaluate(() => new Promise(r => {})).catch(error_ => error = error_);
        await browser.close();
        await neverResolves;
        expect(error.message).toContain('Protocol error');
      });
      it('should reject if executable path is invalid', async() => {
        const {defaultBrowserOptions, puppeteer} = getTestState();

        let waitError = null;
        const options = Object.assign({}, defaultBrowserOptions, {executablePath: 'random-invalid-path'});
        await puppeteer.launch(options).catch(error => waitError = error);
        expect(waitError.message).toContain('Failed to launch');
      });
      it('userDataDir option', async() => {
        const {defaultBrowserOptions, puppeteer} = getTestState();

        const userDataDir = await mkdtempAsync(TMP_FOLDER);
        const options = Object.assign({userDataDir}, defaultBrowserOptions);
        const browser = await puppeteer.launch(options);
        // Open a page to make sure its functional.
        await browser.newPage();
        expect(fs.readdirSync(userDataDir).length).toBeGreaterThan(0);
        await browser.close();
        expect(fs.readdirSync(userDataDir).length).toBeGreaterThan(0);
        // This might throw. See https://github.com/puppeteer/puppeteer/issues/2778
        await rmAsync(userDataDir).catch(error => {});
      });
      it('userDataDir argument', async() => {
        const {isChrome, puppeteer, defaultBrowserOptions} = getTestState();

        const userDataDir = await mkdtempAsync(TMP_FOLDER);
        const options = Object.assign({}, defaultBrowserOptions);
        if (isChrome) {
          options.args = [
            ...(defaultBrowserOptions.args || []),
            `--user-data-dir=${userDataDir}`
          ];
        } else {
          options.args = [
            ...(defaultBrowserOptions.args || []),
            `-profile`,
            userDataDir,
          ];
        }
        const browser = await puppeteer.launch(options);
        expect(fs.readdirSync(userDataDir).length).toBeGreaterThan(0);
        await browser.close();
        expect(fs.readdirSync(userDataDir).length).toBeGreaterThan(0);
        // This might throw. See https://github.com/puppeteer/puppeteer/issues/2778
        await rmAsync(userDataDir).catch(error => {});
      });
      it('userDataDir option should restore state', async() => {
        const {server, puppeteer, defaultBrowserOptions} = getTestState();

        const userDataDir = await mkdtempAsync(TMP_FOLDER);
        const options = Object.assign({userDataDir}, defaultBrowserOptions);
        const browser = await puppeteer.launch(options);
        const page = await browser.newPage();
        await page.goto(server.EMPTY_PAGE);
        await page.evaluate(() => localStorage.hey = 'hello');
        await browser.close();

        const browser2 = await puppeteer.launch(options);
        const page2 = await browser2.newPage();
        await page2.goto(server.EMPTY_PAGE);
        expect(await page2.evaluate(() => localStorage.hey)).toBe('hello');
        await browser2.close();
        // This might throw. See https://github.com/puppeteer/puppeteer/issues/2778
        await rmAsync(userDataDir).catch(error => {});
      });
      // This mysteriously fails on Windows on AppVeyor. See https://github.com/puppeteer/puppeteer/issues/4111
      xit('userDataDir option should restore cookies', async() => {
        const {server , puppeteer} = getTestState();

        const userDataDir = await mkdtempAsync(TMP_FOLDER);
        const options = Object.assign({userDataDir}, defaultBrowserOptions);
        const browser = await puppeteer.launch(options);
        const page = await browser.newPage();
        await page.goto(server.EMPTY_PAGE);
        await page.evaluate(() => document.cookie = 'doSomethingOnlyOnce=true; expires=Fri, 31 Dec 9999 23:59:59 GMT');
        await browser.close();

        const browser2 = await puppeteer.launch(options);
        const page2 = await browser2.newPage();
        await page2.goto(server.EMPTY_PAGE);
        expect(await page2.evaluate(() => document.cookie)).toBe('doSomethingOnlyOnce=true');
        await browser2.close();
        // This might throw. See https://github.com/puppeteer/puppeteer/issues/2778
        await rmAsync(userDataDir).catch(error => {});
      });
      it('should return the default arguments', async() => {
        const {isChrome, isFirefox, puppeteer} = getTestState();

        if (isChrome) {
          expect(puppeteer.defaultArgs()).toContain('--no-first-run');
          expect(puppeteer.defaultArgs()).toContain('--headless');
          expect(puppeteer.defaultArgs({headless: false})).not.toContain('--headless');
          expect(puppeteer.defaultArgs({userDataDir: 'foo'})).toContain('--user-data-dir=foo');
        } else if (isFirefox) {
          expect(puppeteer.defaultArgs()).toContain('--headless');
          expect(puppeteer.defaultArgs()).toContain('--no-remote');
          expect(puppeteer.defaultArgs()).toContain('--foreground');
          expect(puppeteer.defaultArgs({headless: false})).not.toContain('--headless');
          expect(puppeteer.defaultArgs({userDataDir: 'foo'})).toContain('--profile');
          expect(puppeteer.defaultArgs({userDataDir: 'foo'})).toContain('foo');
        } else {
          expect(puppeteer.defaultArgs()).toContain('-headless');
          expect(puppeteer.defaultArgs({headless: false})).not.toContain('-headless');
          expect(puppeteer.defaultArgs({userDataDir: 'foo'})).toContain('-profile');
          expect(puppeteer.defaultArgs({userDataDir: 'foo'})).toContain('foo');
        }
      });
      it('should report the correct product', async() => {
        const {isChrome, isFirefox, puppeteer} = getTestState();
        if (isChrome)
          expect(puppeteer.product).toBe('chrome');
        else if (isFirefox)
          expect(puppeteer.product).toBe('firefox');
      });
      itFailsFirefox('should work with no default arguments', async() => {
        const {defaultBrowserOptions, puppeteer} = getTestState();
        const options = Object.assign({}, defaultBrowserOptions);
        options.ignoreDefaultArgs = true;
        const browser = await puppeteer.launch(options);
        const page = await browser.newPage();
        expect(await page.evaluate('11 * 11')).toBe(121);
        await page.close();
        await browser.close();
      });
      itFailsFirefox('should filter out ignored default arguments', async() => {
        const {defaultBrowserOptions, puppeteer} = getTestState();
        // Make sure we launch with `--enable-automation` by default.
        const defaultArgs = puppeteer.defaultArgs();
        const browser = await puppeteer.launch(Object.assign({}, defaultBrowserOptions, {
          // Ignore first and third default argument.
          ignoreDefaultArgs: [ defaultArgs[0], defaultArgs[2] ],
        }));
        const spawnargs = browser.process().spawnargs;
        expect(spawnargs.indexOf(defaultArgs[0])).toBe(-1);
        expect(spawnargs.indexOf(defaultArgs[1])).not.toBe(-1);
        expect(spawnargs.indexOf(defaultArgs[2])).toBe(-1);
        await browser.close();
      });
      it('should have default URL when launching browser', async function() {
        const {defaultBrowserOptions, puppeteer} = getTestState();
        const browser = await puppeteer.launch(defaultBrowserOptions);
        const pages = (await browser.pages()).map(page => page.url());
        expect(pages).toEqual(['about:blank']);
        await browser.close();
      });
      itFailsFirefox('should have custom URL when launching browser', async() => {
        const {server, puppeteer, defaultBrowserOptions} = getTestState();

        const options = Object.assign({}, defaultBrowserOptions);
        options.args = [server.EMPTY_PAGE].concat(options.args || []);
        const browser = await puppeteer.launch(options);
        const pages = await browser.pages();
        expect(pages.length).toBe(1);
        const page = pages[0];
        if (page.url() !== server.EMPTY_PAGE)
          await page.waitForNavigation();
        expect(page.url()).toBe(server.EMPTY_PAGE);
        await browser.close();
      });
      it('should set the default viewport', async() => {
        const {puppeteer, defaultBrowserOptions} = getTestState();
        const options = Object.assign({}, defaultBrowserOptions, {
          defaultViewport: {
            width: 456,
            height: 789
          }
        });
        const browser = await puppeteer.launch(options);
        const page = await browser.newPage();
        expect(await page.evaluate('window.innerWidth')).toBe(456);
        expect(await page.evaluate('window.innerHeight')).toBe(789);
        await browser.close();
      });
      it('should disable the default viewport', async() => {
        const {puppeteer, defaultBrowserOptions} = getTestState();
        const options = Object.assign({}, defaultBrowserOptions, {
          defaultViewport: null
        });
        const browser = await puppeteer.launch(options);
        const page = await browser.newPage();
        expect(page.viewport()).toBe(null);
        await browser.close();
      });
      itFailsFirefox('should take fullPage screenshots when defaultViewport is null', async() => {
        const {server, puppeteer, defaultBrowserOptions} = getTestState();

        const options = Object.assign({}, defaultBrowserOptions, {
          defaultViewport: null
        });
        const browser = await puppeteer.launch(options);
        const page = await browser.newPage();
        await page.goto(server.PREFIX + '/grid.html');
        const screenshot = await page.screenshot({
          fullPage: true
        });
        expect(screenshot).toBeInstanceOf(Buffer);
        await browser.close();
      });
    });

    describe('Puppeteer.launch', function() {
      let productName;

      before(async() => {
        const {puppeteer} = getTestState();
        productName = puppeteer._productName;
      });

      after(async() => {
        const {puppeteer} = getTestState();
        puppeteer._lazyLauncher = undefined;
        puppeteer._productName = productName;
      });

      it('should be able to launch Chrome', async() => {
        const {puppeteer} = getTestState();
        const browser = await puppeteer.launch({product: 'chrome'});
        const userAgent = await browser.userAgent();
        await browser.close();
        expect(userAgent).toContain('Chrome');
      });

      /* We think there's a bug in the FF Windows launcher, or some
       * combo of that plus it running on CI, but we're deferring fixing
       * this so we can get Windows CI stable and then dig into this
       * properly with help from the Mozilla folks.
       */
      itFailsWindowsUntilDate(new Date('2020-06-01'), 'should be able to launch Firefox', async() => {
        const {puppeteer} = getTestState();
        const browser = await puppeteer.launch({product: 'firefox'});
        const userAgent = await browser.userAgent();
        await browser.close();
        expect(userAgent).toContain('Firefox');
      });
    });

    describe('Puppeteer.connect', function() {
      it('should be able to connect multiple times to the same browser', async() => {
        const {puppeteer, defaultBrowserOptions} = getTestState();

        const originalBrowser = await puppeteer.launch(defaultBrowserOptions);
        const otherBrowser = await puppeteer.connect({
          browserWSEndpoint: originalBrowser.wsEndpoint()
        });
        const page = await otherBrowser.newPage();
        expect(await page.evaluate(() => 7 * 8)).toBe(56);
        otherBrowser.disconnect();

        const secondPage = await originalBrowser.newPage();
        expect(await secondPage.evaluate(() => 7 * 6)).toBe(42, 'original browser should still work');
        await originalBrowser.close();
      });
      it('should be able to close remote browser', async() => {
        const {defaultBrowserOptions, puppeteer} = getTestState();

        const originalBrowser = await puppeteer.launch(defaultBrowserOptions);
        const remoteBrowser = await puppeteer.connect({
          browserWSEndpoint: originalBrowser.wsEndpoint()
        });
        await Promise.all([
          utils.waitEvent(originalBrowser, 'disconnected'),
          remoteBrowser.close(),
        ]);
      });
      itFailsFirefox('should support ignoreHTTPSErrors option', async() => {
        const {httpsServer, puppeteer, defaultBrowserOptions} = getTestState();

        const originalBrowser = await puppeteer.launch(defaultBrowserOptions);
        const browserWSEndpoint = originalBrowser.wsEndpoint();

        const browser = await puppeteer.connect({browserWSEndpoint, ignoreHTTPSErrors: true});
        const page = await browser.newPage();
        let error = null;
        const [serverRequest, response] = await Promise.all([
          httpsServer.waitForRequest('/empty.html'),
          page.goto(httpsServer.EMPTY_PAGE).catch(error_ => error = error_)
        ]);
        expect(error).toBe(null);
        expect(response.ok()).toBe(true);
        expect(response.securityDetails()).toBeTruthy();
        const protocol = serverRequest.socket.getProtocol().replace('v', ' ');
        expect(response.securityDetails().protocol()).toBe(protocol);
        await page.close();
        await browser.close();
      });
      itFailsFirefox('should be able to reconnect to a disconnected browser', async() => {
        const {server , puppeteer, defaultBrowserOptions} = getTestState();

        const originalBrowser = await puppeteer.launch(defaultBrowserOptions);
        const browserWSEndpoint = originalBrowser.wsEndpoint();
        const page = await originalBrowser.newPage();
        await page.goto(server.PREFIX + '/frames/nested-frames.html');
        originalBrowser.disconnect();

        const browser = await puppeteer.connect({browserWSEndpoint});
        const pages = await browser.pages();
        const restoredPage = pages.find(page => page.url() === server.PREFIX + '/frames/nested-frames.html');
        expect(utils.dumpFrames(restoredPage.mainFrame())).toEqual([
          'http://localhost:<PORT>/frames/nested-frames.html',
          '    http://localhost:<PORT>/frames/two-frames.html (2frames)',
          '        http://localhost:<PORT>/frames/frame.html (uno)',
          '        http://localhost:<PORT>/frames/frame.html (dos)',
          '    http://localhost:<PORT>/frames/frame.html (aframe)',
        ]);
        expect(await restoredPage.evaluate(() => 7 * 8)).toBe(56);
        await browser.close();
      });
      // @see https://github.com/puppeteer/puppeteer/issues/4197#issuecomment-481793410
      itFailsFirefox('should be able to connect to the same page simultaneously', async() => {
        const {puppeteer} = getTestState();

        const browserOne = await puppeteer.launch();
        const browserTwo = await puppeteer.connect({browserWSEndpoint: browserOne.wsEndpoint()});
        const [page1, page2] = await Promise.all([
          new Promise(x => browserOne.once('targetcreated', target => x(target.page()))),
          browserTwo.newPage(),
        ]);
        expect(await page1.evaluate(() => 7 * 8)).toBe(56);
        expect(await page2.evaluate(() => 7 * 6)).toBe(42);
        await browserOne.close();
      });

    });
    describe('Puppeteer.executablePath', function() {
      itFailsFirefox('should work', async() => {
        const {puppeteer} = getTestState();

        const executablePath = puppeteer.executablePath();
        expect(fs.existsSync(executablePath)).toBe(true);
        expect(fs.realpathSync(executablePath)).toBe(executablePath);
      });
    });
  });

  describe('Top-level requires', function() {
    it('should require top-level Errors', async() => {
      const {puppeteer, puppeteerPath} = getTestState();
      const Errors = require(path.join(puppeteerPath, '/Errors'));
      expect(Errors.TimeoutError).toBe(puppeteer.errors.TimeoutError);
    });
    it('should require top-level DeviceDescriptors', async() => {
      const {puppeteer, puppeteerPath} = getTestState();
      const Devices = require(path.join(puppeteerPath, '/DeviceDescriptors'));
      expect(Devices['iPhone 6']).toBe(puppeteer.devices['iPhone 6']);
    });
  });

  describe('Browser target events', function() {
    itFailsFirefox('should work', async() => {
      const {server , puppeteer, defaultBrowserOptions} = getTestState();

      const browser = await puppeteer.launch(defaultBrowserOptions);
      const events = [];
      browser.on('targetcreated', () => events.push('CREATED'));
      browser.on('targetchanged', () => events.push('CHANGED'));
      browser.on('targetdestroyed', () => events.push('DESTROYED'));
      const page = await browser.newPage();
      await page.goto(server.EMPTY_PAGE);
      await page.close();
      expect(events).toEqual(['CREATED', 'CHANGED', 'DESTROYED']);
      await browser.close();
    });
  });

  describe('Browser.Events.disconnected', function() {
    it('should be emitted when: browser gets closed, disconnected or underlying websocket gets closed', async() => {
      const {puppeteer, defaultBrowserOptions} = getTestState();
      const originalBrowser = await puppeteer.launch(defaultBrowserOptions);
      const browserWSEndpoint = originalBrowser.wsEndpoint();
      const remoteBrowser1 = await puppeteer.connect({browserWSEndpoint});
      const remoteBrowser2 = await puppeteer.connect({browserWSEndpoint});

      let disconnectedOriginal = 0;
      let disconnectedRemote1 = 0;
      let disconnectedRemote2 = 0;
      originalBrowser.on('disconnected', () => ++disconnectedOriginal);
      remoteBrowser1.on('disconnected', () => ++disconnectedRemote1);
      remoteBrowser2.on('disconnected', () => ++disconnectedRemote2);

      await Promise.all([
        utils.waitEvent(remoteBrowser2, 'disconnected'),
        remoteBrowser2.disconnect(),
      ]);

      expect(disconnectedOriginal).toBe(0);
      expect(disconnectedRemote1).toBe(0);
      expect(disconnectedRemote2).toBe(1);

      await Promise.all([
        utils.waitEvent(remoteBrowser1, 'disconnected'),
        utils.waitEvent(originalBrowser, 'disconnected'),
        originalBrowser.close(),
      ]);

      expect(disconnectedOriginal).toBe(1);
      expect(disconnectedRemote1).toBe(1);
      expect(disconnectedRemote2).toBe(1);
    });
  });
});
