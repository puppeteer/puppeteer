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

module.exports.addTests = function({testRunner, expect, defaultBrowserOptions, puppeteer}) {
  const {describe, xdescribe, fdescribe, describe_fails_ffox} = testRunner;
  const {it, fit, xit, it_fails_ffox} = testRunner;
  const {beforeAll, beforeEach, afterAll, afterEach} = testRunner;

  describe('Puppeteer', function() {
    describe('BrowserFetcher', function() {
      it('should download and extract linux binary', async({server}) => {
        const downloadsFolder = await mkdtempAsync(TMP_FOLDER);
        const browserFetcher = puppeteer.createBrowserFetcher({
          platform: 'linux',
          path: downloadsFolder,
          host: server.PREFIX
        });
        let revisionInfo = browserFetcher.revisionInfo('123456');
        server.setRoute(revisionInfo.url.substring(server.PREFIX.length), (req, res) => {
          server.serveFile(req, res, '/chromium-linux.zip');
        });

        expect(revisionInfo.local).toBe(false);
        expect(browserFetcher.platform()).toBe('linux');
        expect(await browserFetcher.canDownload('100000')).toBe(false);
        expect(await browserFetcher.canDownload('123456')).toBe(true);

        revisionInfo = await browserFetcher.download('123456');
        expect(revisionInfo.local).toBe(true);
        expect(await readFileAsync(revisionInfo.executablePath, 'utf8')).toBe('LINUX BINARY\n');
        const expectedPermissions = os.platform() === 'win32' ? 0666 : 0755;
        expect((await statAsync(revisionInfo.executablePath)).mode & 0777).toBe(expectedPermissions);
        expect(await browserFetcher.localRevisions()).toEqual(['123456']);
        await browserFetcher.remove('123456');
        expect(await browserFetcher.localRevisions()).toEqual([]);
        await rmAsync(downloadsFolder);
      });
    });
    describe_fails_ffox('Browser.disconnect', function() {
      it('should reject navigation when browser closes', async({server}) => {
        server.setRoute('/one-style.css', () => {});
        const browser = await puppeteer.launch(defaultBrowserOptions);
        const remote = await puppeteer.connect({browserWSEndpoint: browser.wsEndpoint()});
        const page = await remote.newPage();
        const navigationPromise = page.goto(server.PREFIX + '/one-style.html', {timeout: 60000}).catch(e => e);
        await server.waitForRequest('/one-style.css');
        await remote.disconnect();
        const error = await navigationPromise;
        expect(error.message).toBe('Navigation failed because browser has disconnected!');
        await browser.close();
      });
      it('should reject waitForSelector when browser closes', async({server}) => {
        server.setRoute('/empty.html', () => {});
        const browser = await puppeteer.launch(defaultBrowserOptions);
        const remote = await puppeteer.connect({browserWSEndpoint: browser.wsEndpoint()});
        const page = await remote.newPage();
        const watchdog = page.waitForSelector('div', {timeout: 60000}).catch(e => e);
        await remote.disconnect();
        const error = await watchdog;
        expect(error.message).toBe('Protocol error (Runtime.callFunctionOn): Session closed. Most likely the page has been closed.');
        await browser.close();
      });
    });
    describe('Puppeteer.launch', function() {
      it('should reject all promises when browser is closed', async() => {
        const browser = await puppeteer.launch(defaultBrowserOptions);
        const page = await browser.newPage();
        let error = null;
        const neverResolves = page.evaluate(() => new Promise(r => {})).catch(e => error = e);
        await browser.close();
        await neverResolves;
        expect(error.message).toContain('Protocol error');
      });
      it_fails_ffox('should reject if executable path is invalid', async({server}) => {
        let waitError = null;
        const options = Object.assign({}, defaultBrowserOptions, {executablePath: 'random-invalid-path'});
        await puppeteer.launch(options).catch(e => waitError = e);
        expect(waitError.message.startsWith('Failed to launch chrome! spawn random-invalid-path ENOENT')).toBe(true);
      });
      it_fails_ffox('userDataDir option', async({server}) => {
        const userDataDir = await mkdtempAsync(TMP_FOLDER);
        const options = Object.assign({userDataDir}, defaultBrowserOptions);
        const browser = await puppeteer.launch(options);
        // Open a page to make sure its functional.
        await browser.newPage();
        expect(fs.readdirSync(userDataDir).length).toBeGreaterThan(0);
        await browser.close();
        expect(fs.readdirSync(userDataDir).length).toBeGreaterThan(0);
        // This might throw. See https://github.com/GoogleChrome/puppeteer/issues/2778
        await rmAsync(userDataDir).catch(e => {});
      });
      it_fails_ffox('userDataDir argument', async({server}) => {
        const userDataDir = await mkdtempAsync(TMP_FOLDER);
        const options = Object.assign({}, defaultBrowserOptions);
        options.args = [`--user-data-dir=${userDataDir}`].concat(options.args || []);
        const browser = await puppeteer.launch(options);
        expect(fs.readdirSync(userDataDir).length).toBeGreaterThan(0);
        await browser.close();
        expect(fs.readdirSync(userDataDir).length).toBeGreaterThan(0);
        // This might throw. See https://github.com/GoogleChrome/puppeteer/issues/2778
        await rmAsync(userDataDir).catch(e => {});
      });
      it_fails_ffox('userDataDir option should restore state', async({server}) => {
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
        // This might throw. See https://github.com/GoogleChrome/puppeteer/issues/2778
        await rmAsync(userDataDir).catch(e => {});
      });
      it_fails_ffox('userDataDir option should restore cookies', async({server}) => {
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
        // This might throw. See https://github.com/GoogleChrome/puppeteer/issues/2778
        await rmAsync(userDataDir).catch(e => {});
      });
      it_fails_ffox('should return the default chrome arguments', async() => {
        expect(puppeteer.defaultArgs()).toContain('--no-first-run');
        expect(puppeteer.defaultArgs()).toContain('--headless');
        expect(puppeteer.defaultArgs({headless: false})).not.toContain('--headless');
        expect(puppeteer.defaultArgs({userDataDir: 'foo'})).toContain('--user-data-dir=foo');
      });
      it('should dump browser process stderr', async({server}) => {
        const dumpioTextToLog = 'MAGIC_DUMPIO_TEST';
        let dumpioData = '';
        const {spawn} = require('child_process');
        const options = Object.assign({}, defaultBrowserOptions, {dumpio: true});
        const res = spawn('node',
            [path.join(__dirname, 'fixtures', 'dumpio.js'), utils.projectRoot(), JSON.stringify(options), server.EMPTY_PAGE, dumpioTextToLog]);
        res.stderr.on('data', data => dumpioData += data.toString('utf8'));
        await new Promise(resolve => res.on('close', resolve));

        expect(dumpioData).toContain(dumpioTextToLog);
      });
      it_fails_ffox('should close the browser when the node process closes', async({ server }) => {
        const {spawn, execSync} = require('child_process');
        const res = spawn('node', [path.join(__dirname, 'fixtures', 'closeme.js'), utils.projectRoot(), JSON.stringify(defaultBrowserOptions)]);
        let wsEndPointCallback;
        const wsEndPointPromise = new Promise(x => wsEndPointCallback = x);
        let output = '';
        res.stdout.on('data', data => {
          output += data;
          if (output.indexOf('\n'))
            wsEndPointCallback(output.substring(0, output.indexOf('\n')));
        });
        const browser = await puppeteer.connect({ browserWSEndpoint: await wsEndPointPromise });
        const promises = [
          new Promise(resolve => browser.once('disconnected', resolve)),
          new Promise(resolve => res.on('close', resolve))];
        if (process.platform === 'win32')
          execSync(`taskkill /pid ${res.pid} /T /F`);
        else
          process.kill(res.pid);
        await Promise.all(promises);
      });
      it_fails_ffox('should support the pipe option', async() => {
        const options = Object.assign({pipe: true}, defaultBrowserOptions);
        const browser = await puppeteer.launch(options);
        expect((await browser.pages()).length).toBe(1);
        expect(browser.wsEndpoint()).toBe('');
        const page = await browser.newPage();
        expect(await page.evaluate('11 * 11')).toBe(121);
        await page.close();
        await browser.close();
      });
      it_fails_ffox('should support the pipe argument', async() => {
        const options = Object.assign({}, defaultBrowserOptions);
        options.args = ['--remote-debugging-pipe'].concat(options.args || []);
        const browser = await puppeteer.launch(options);
        expect(browser.wsEndpoint()).toBe('');
        const page = await browser.newPage();
        expect(await page.evaluate('11 * 11')).toBe(121);
        await page.close();
        await browser.close();
      });
      it_fails_ffox('should fire "disconnected" when closing with pipe', async() => {
        const options = Object.assign({pipe: true}, defaultBrowserOptions);
        const browser = await puppeteer.launch(options);
        const disconnectedEventPromise = new Promise(resolve => browser.once('disconnected', resolve));
        // Emulate user exiting browser.
        browser.process().kill();
        await disconnectedEventPromise;
      });
      it('should work with no default arguments', async() => {
        const options = Object.assign({}, defaultBrowserOptions);
        options.ignoreDefaultArgs = true;
        const browser = await puppeteer.launch(options);
        const page = await browser.newPage();
        expect(await page.evaluate('11 * 11')).toBe(121);
        await page.close();
        await browser.close();
      });
      it_fails_ffox('should filter out ignored default arguments', async() => {
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
      it_fails_ffox('should have default url when launching browser', async function() {
        const browser = await puppeteer.launch(defaultBrowserOptions);
        const pages = (await browser.pages()).map(page => page.url());
        expect(pages).toEqual(['about:blank']);
        await browser.close();
      });
      it_fails_ffox('should have custom url when launching browser', async function({server}) {
        const customUrl = server.PREFIX + '/empty.html';
        const options = Object.assign({}, defaultBrowserOptions);
        options.args = [customUrl].concat(options.args || []);
        const browser = await puppeteer.launch(options);
        const pages = await browser.pages();
        expect(pages.length).toBe(1);
        if (pages[0].url() !== customUrl)
          await pages[0].waitForNavigation();
        expect(pages[0].url()).toBe(customUrl);
        await browser.close();
      });
      it('should set the default viewport', async() => {
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
        const options = Object.assign({}, defaultBrowserOptions, {
          defaultViewport: null
        });
        const browser = await puppeteer.launch(options);
        const page = await browser.newPage();
        expect(page.viewport()).toBe(null);
        await browser.close();
      });
      it('should take fullPage screenshots when defaultViewport is null', async({server}) => {
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
    describe_fails_ffox('Puppeteer.connect', function() {
      it('should be able to connect multiple times to the same browser', async({server}) => {
        const originalBrowser = await puppeteer.launch(defaultBrowserOptions);
        const browser = await puppeteer.connect({
          browserWSEndpoint: originalBrowser.wsEndpoint()
        });
        const page = await browser.newPage();
        expect(await page.evaluate(() => 7 * 8)).toBe(56);
        browser.disconnect();

        const secondPage = await originalBrowser.newPage();
        expect(await secondPage.evaluate(() => 7 * 6)).toBe(42, 'original browser should still work');
        await originalBrowser.close();
      });
      it('should support ignoreHTTPSErrors option', async({httpsServer}) => {
        const originalBrowser = await puppeteer.launch(defaultBrowserOptions);
        const browserWSEndpoint = originalBrowser.wsEndpoint();

        const browser = await puppeteer.connect({browserWSEndpoint, ignoreHTTPSErrors: true});
        const page = await browser.newPage();
        let error = null;
        const response = await page.goto(httpsServer.EMPTY_PAGE).catch(e => error = e);
        expect(error).toBe(null);
        expect(response.ok()).toBe(true);
        expect(response.securityDetails()).toBeTruthy();
        expect(response.securityDetails().protocol()).toBe('TLS 1.2');
        await page.close();
        await browser.close();
      });
      it('should be able to reconnect to a disconnected browser', async({server}) => {
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
      it('should be able to connect using browserUrl, with and without trailing slash', async({server}) => {
        const originalBrowser = await puppeteer.launch(Object.assign({}, defaultBrowserOptions, {
          args: ['--remote-debugging-port=21222']
        }));
        const browserURL = 'http://127.0.0.1:21222';

        const browser1 = await puppeteer.connect({browserURL});
        const page1 = await browser1.newPage();
        expect(await page1.evaluate(() => 7 * 8)).toBe(56);
        browser1.disconnect();

        const browser2 = await puppeteer.connect({browserURL: browserURL + '/'});
        const page2 = await browser2.newPage();
        expect(await page2.evaluate(() => 8 * 7)).toBe(56);
        browser2.disconnect();
        originalBrowser.close();
      });
      it('should throw when using both browserWSEndpoint and browserURL', async({server}) => {
        const originalBrowser = await puppeteer.launch(Object.assign({}, defaultBrowserOptions, {
          args: ['--remote-debugging-port=21222']
        }));
        const browserURL = 'http://127.0.0.1:21222';

        let error = null;
        await puppeteer.connect({browserURL, browserWSEndpoint: originalBrowser.wsEndpoint()}).catch(e => error = e);
        expect(error.message).toContain('Exactly one of browserWSEndpoint, browserURL or transport');

        originalBrowser.close();
      });
      it('should throw when trying to connect to non-existing browser', async({server}) => {
        const originalBrowser = await puppeteer.launch(Object.assign({}, defaultBrowserOptions, {
          args: ['--remote-debugging-port=21222']
        }));
        const browserURL = 'http://127.0.0.1:32333';

        let error = null;
        await puppeteer.connect({browserURL}).catch(e => error = e);
        expect(error.message).toContain('Failed to fetch browser webSocket url from');

        originalBrowser.close();
      });
    });
    describe('Puppeteer.executablePath', function() {
      it('should work', async({server}) => {
        const executablePath = puppeteer.executablePath();
        expect(fs.existsSync(executablePath)).toBe(true);
      });
    });
  });

  describe('Browser target events', function() {
    it('should work', async({server}) => {
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

  describe_fails_ffox('Browser.Events.disconnected', function() {
    it('should be emitted when: browser gets closed, disconnected or underlying websocket gets closed', async() => {
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

};
