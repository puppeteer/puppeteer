/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import expect from 'expect';

import {getTestState, launch} from './mocha-utils.js';

describe('Puppeteer.connect', function () {
  it('should be able to connect using browserUrl, with and without trailing slash', async () => {
    const {close, puppeteer} = await launch({
      args: ['--remote-debugging-port=21222'],
    });
    try {
      const browserURL = 'http://127.0.0.1:21222';

      using browser1 = await puppeteer.connect({browserURL});
      const page1 = await browser1.newPage();
      expect(
        await page1.evaluate(() => {
          return 7 * 8;
        }),
      ).toBe(56);
      await browser1.disconnect();

      using browser2 = await puppeteer.connect({
        browserURL: browserURL + '/',
      });
      const page2 = await browser2.newPage();
      expect(
        await page2.evaluate(() => {
          return 8 * 7;
        }),
      ).toBe(56);
    } finally {
      await close();
    }
  });
  it('should throw when using both browserWSEndpoint and browserURL', async () => {
    const {puppeteer} = await getTestState({skipLaunch: true});
    const browserURL = 'http://127.0.0.1:21222';

    let error!: Error;
    await puppeteer
      .connect({
        browserURL,
        browserWSEndpoint: 'ws://127.0.0.1:21222/devtools/browser/',
      })
      .catch(error_ => {
        return (error = error_);
      });
    expect(error.message).toContain(
      'Exactly one of browserWSEndpoint, browserURL, transport or channel must be passed to puppeteer.connect',
    );
  });

  it('should throw when trying to connect to non-existing browser', async () => {
    const {puppeteer} = await getTestState({skipLaunch: true});
    const browserURL = 'http://127.0.0.1:32333';

    let error!: Error;
    await puppeteer.connect({browserURL}).catch(error_ => {
      return (error = error_);
    });
    expect(error.message).toContain(
      'Failed to fetch browser webSocket URL from',
    );
  });

  it('should emit and buffer console and network events on Browser and BrowserContext', async () => {
    const {close, puppeteer, browser: originalBrowser} = await launch({});
    try {
      const browserWSEndpoint = originalBrowser.wsEndpoint();
      const page = await originalBrowser.newPage();

      // Trigger a console message and request BEFORE connecting remoteBrowser
      await page.evaluate(() => {
        console.log('early-hello');
      });

      // Connect remote browser
      const browserEvents: any[] = [];
      const contextEvents: any[] = [];

      const remoteBrowser = await puppeteer.connect({
        browserWSEndpoint,
        protocol: originalBrowser.protocol,
      });

      remoteBrowser.on('console', msg => {
        browserEvents.push({type: 'console', text: msg.text()});
      });
      remoteBrowser.on('request', req => {
        browserEvents.push({type: 'request', url: req.url()});
      });

      const defaultContext = remoteBrowser.defaultBrowserContext();
      defaultContext.on('console', msg => {
        contextEvents.push({type: 'console', text: msg.text()});
      });
      defaultContext.on('request', req => {
        contextEvents.push({type: 'request', url: req.url()});
      });

      // Wait a macroTask for replay to fire
      await new Promise(resolve => {
        setTimeout(resolve, 50);
      });

      // Now verify that the buffered console message was replayed and received
      const earlyConsoleBrowser = browserEvents.find(e => {
        return e.type === 'console' && e.text === 'early-hello';
      });
      const earlyConsoleContext = contextEvents.find(e => {
        return e.type === 'console' && e.text === 'early-hello';
      });
      expect(earlyConsoleBrowser).toBeDefined();
      expect(earlyConsoleContext).toBeDefined();

      // Also trigger a live console message and request
      const page2 = await remoteBrowser.newPage();
      const liveEventPromise = Promise.all([
        new Promise<void>(resolve => {
          remoteBrowser.on('console', msg => {
            if (msg.text() === 'live-hello') {
              resolve();
            }
          });
        }),
        page2.evaluate(() => {
          console.log('live-hello');
        }),
      ]);
      await liveEventPromise;

      await remoteBrowser.disconnect();
    } finally {
      await close();
    }
  });
});
