/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';
import puppeteer from 'puppeteer/internal/puppeteer.js';
import type {WebWorker} from 'puppeteer-core/internal/api/WebWorker.js';

import {
  launch,
  setupSeparateTestBrowserHooks,
  getTestState,
  setupTestBrowserHooks,
} from '../mocha-utils.js';
import {attachFrame, html, waitEvent} from '../utils.js';

describe('Network Restrictions', function () {
  setupTestBrowserHooks();

  describe('blocklist validation', () => {
    const state = setupSeparateTestBrowserHooks({
      blocklist: [
        '*://*:*/empty.html',
        '*://*:*/pptr.png',
        '*://*:*/serviceworkers/empty/sw.js',
        '*://*:*/serviceworkers/fetch/style.css',
        '*://*:*/serviceworkers/fetch-on-install/blocked.json',
      ],
    });

    it('should block page.goto when the destination is in the blocklist', async () => {
      const {page, server} = state;
      const allowedUrl = server.PREFIX + '/title.html';
      const blockedUrl = server.PREFIX + '/empty.html';

      await page.goto(allowedUrl);
      let error: Error | undefined;
      await page.goto(blockedUrl).catch(e => {
        return (error = e);
      });

      expect(error).toBeDefined();
      expect(error?.message).toContain(
        'is blocked by blocklist/allowlist rules',
      );
    });

    it('should block window.location.href navigation to URLs in the blocklist', async () => {
      const {page, server} = state;
      const allowedUrl = server.PREFIX + '/title.html';
      const blockedUrl = server.PREFIX + '/empty.html';

      await page.goto(allowedUrl);
      const navPromise = page.waitForNavigation({timeout: 2000}).catch(e => {
        return e;
      });
      await page.evaluate(url => {
        window.location.href = url;
      }, blockedUrl);

      await navPromise;
      const finalUrl = page.url();
      expect(finalUrl).not.toBe(blockedUrl);
    });

    it('should fail fetch requests to URLs in the blocklist', async () => {
      const {page, server} = state;
      const allowedUrl = server.PREFIX + '/title.html';
      const blockedUrl = server.PREFIX + '/empty.html';

      await page.goto(allowedUrl);
      const fetchError = await page.evaluate(async url => {
        try {
          await fetch(url);
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      }, blockedUrl);

      expect(fetchError).toContain('Failed to fetch');
    });

    it('should fail service worker registration for blocklisted script URLs', async () => {
      const {page, server} = state;
      const allowedUrl = server.PREFIX + '/title.html';
      const blockedUrl = server.PREFIX + '/serviceworkers/empty/sw.js';

      await page.goto(allowedUrl);
      const swError = await page.evaluate(async url => {
        try {
          await navigator.serviceWorker.register(url);
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      }, blockedUrl);

      expect(swError).toBeTruthy();
      expect(swError).toContain('Failed to register a ServiceWorker');
    });

    it('should fail fetch requests forwarded by a service worker to URLs in the blocklist', async () => {
      const {page, server} = state;
      const blockedUrl = server.PREFIX + '/serviceworkers/fetch/style.css';

      await page.goto(server.PREFIX + '/serviceworkers/fetch/sw.html');
      // Wait until the page is controlled by the worker so that the fetch
      // below is forwarded by the worker instead of going out directly.
      await page.evaluate(() => {
        return (window as any).activationPromise;
      });

      const fetchError = await page.evaluate(async url => {
        try {
          await fetch(url);
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      }, blockedUrl);

      expect(fetchError).toContain('Failed to fetch');
    });

    it('should fail fetch requests made by a service worker during install to URLs in the blocklist', async () => {
      const {page, server} = state;

      await page.goto(
        server.PREFIX + '/serviceworkers/fetch-on-install/sw.html',
      );
      const installFetchResults = await page.evaluate(() => {
        return (window as any).installFetchResultsPromise;
      });

      expect(installFetchResults).toEqual({
        './blocked.json': 'Failed to fetch',
        './allowed.json': 'success',
      });
    });

    it('should fail fetch requests from within a service worker to URLs in the blocklist', async () => {
      const {page, server, context} = state;
      const allowedUrl = server.PREFIX + '/serviceworkers/fetch/sw.html';
      const blockedUrl = server.PREFIX + '/serviceworkers/fetch/style.css';

      await page.goto(allowedUrl);

      const target = await context.waitForTarget(
        target => {
          return target.type() === 'service_worker';
        },
        {timeout: 3000},
      );
      const worker = (await target.worker())!;

      const fetchError = await worker.evaluate(async url => {
        try {
          await fetch(url);
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      }, blockedUrl);

      expect(fetchError).toBeTruthy();
      expect(fetchError).toContain('Failed to fetch');
    });

    it('should prevent loading of blocklisted subresources (e.g., images)', async () => {
      const {page, server} = state;
      const allowedUrl = server.PREFIX + '/one-style.css';
      const blockedUrl = server.PREFIX + '/pptr.png';

      const failedRequests = new Map<string, string | undefined>();
      const finishedRequests = new Set<string>();

      page.on('requestfailed', request => {
        failedRequests.set(request.url(), request.failure()?.errorText);
      });
      page.on('requestfinished', request => {
        finishedRequests.add(request.url());
      });

      await page.goto(server.PREFIX + '/title.html');

      const idle = page.waitForNetworkIdle();
      await page.setContent(html`
        <img src="${blockedUrl}" />
        <link
          rel="stylesheet"
          href="${allowedUrl}"
        />
      `);
      await idle;

      expect(failedRequests.has(blockedUrl)).toBe(true);
      expect(failedRequests.get(blockedUrl)).toContain(
        'net::ERR_INTERNET_DISCONNECTED',
      );
      expect(finishedRequests.has(allowedUrl)).toBe(true);
    });

    it('should block frame.goto when the destination is in the blocklist', async () => {
      const {page, server} = state;
      await page.goto(server.PREFIX + '/frames/one-frame.html');
      const frame = page.frames().find(f => {
        return f !== page.mainFrame();
      })!;

      const blockedUrl = server.PREFIX + '/empty.html';
      let error: Error | undefined;
      await frame.goto(blockedUrl).catch(e => {
        return (error = e);
      });

      expect(error).toBeDefined();
      expect(error?.message).toContain(
        'is blocked by blocklist/allowlist rules',
      );
    });

    it('should block OOPIF frame.goto when the destination is in the blocklist', async () => {
      const {page, server} = state;
      await page.goto(server.PREFIX + '/title.html');
      const frame = await attachFrame(
        page,
        'frame1',
        server.CROSS_PROCESS_PREFIX + '/title.html',
      );

      const blockedUrl = server.PREFIX + '/empty.html';
      let error: Error | undefined;
      await frame.goto(blockedUrl).catch(e => {
        return (error = e);
      });

      expect(error).toBeDefined();
      expect(error?.message).toContain(
        'is blocked by blocklist/allowlist rules',
      );
    });

    it('should block CDP standard emulation reset when blocklist is active', async () => {
      const {page} = state;
      const session = await page.createCDPSession();

      await expect(
        session.send('Network.emulateNetworkConditions', {
          offline: false,
          latency: 0,
          downloadThroughput: 0,
          uploadThroughput: 0,
        }),
      ).rejects.toThrow(
        'Cannot reset network conditions: rule-based emulation is enabled.',
      );
    });

    it('should block page.emulateNetworkConditions reset when blocklist is active', async () => {
      const {page} = state;

      await expect(
        page.emulateNetworkConditions({
          offline: false,
          latency: 0,
          download: 0,
          upload: 0,
        }),
      ).rejects.toThrow(
        'Cannot reset network conditions: rule-based emulation is enabled.',
      );
    });

    it('should block fetch requests from within local iframes to URLs in the blocklist', async () => {
      const {page, server} = state;
      await page.goto(server.PREFIX + '/frames/one-frame.html');
      const frame = page.frames().find(f => {
        return f !== page.mainFrame();
      })!;

      const fetchError = await frame.evaluate(async url => {
        try {
          await fetch(url);
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      }, server.PREFIX + '/empty.html');

      expect(fetchError).toBeTruthy();
      expect(fetchError).toContain('Failed to fetch');
    });

    it('should block fetch requests from within OOPIFs to URLs in the blocklist', async () => {
      const {page, server} = state;
      await page.goto(server.PREFIX + '/title.html');
      const frame = await attachFrame(
        page,
        'frame1',
        server.CROSS_PROCESS_PREFIX + '/title.html',
      );

      const fetchError = await frame.evaluate(async url => {
        try {
          await fetch(url);
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      }, server.PREFIX + '/empty.html');

      expect(fetchError).toBeTruthy();
      expect(fetchError).toContain('Failed to fetch');
    });

    it('should block iframe content from loading if the iframe URL is in the blocklist', async () => {
      const {page, server} = state;
      await page.goto(server.PREFIX + '/title.html');
      await page.setContent(html`
        <iframe src="${server.PREFIX}/empty.html"></iframe>
      `);
      const frame = page.frames().find(f => {
        return f !== page.mainFrame();
      })!;

      const content = await frame.content();
      expect(content).not.toContain("Hi, I'm frame");
    });

    it('should block out-of-process iframe (OOPIF) content from loading if the iframe URL is in the blocklist', async () => {
      const {page, server} = state;
      await page.goto(server.PREFIX + '/title.html');
      const frame = await attachFrame(
        page,
        'frame1',
        server.CROSS_PROCESS_PREFIX + '/empty.html',
      );
      expect(frame.url()).toBe('chrome-error://chromewebdata/');
    });
  });

  describe('allowlist validation', () => {
    const state = setupSeparateTestBrowserHooks({
      allowlist: ['*://*:*/empty.html', '*://*:*/one-style.css'],
    });

    it('should only allow navigation to URLs in the allowlist', async () => {
      const {page, server} = state;
      const allowedUrl = server.PREFIX + '/empty.html';
      const blockedUrl = server.PREFIX + '/title.html';

      await page.goto(allowedUrl);
      let error: Error | undefined;
      await page.goto(blockedUrl).catch(e => {
        return (error = e);
      });
      expect(page.url()).not.toBe(blockedUrl);
      expect(error).toBeDefined();
      expect(error?.message).toContain(
        'is blocked by blocklist/allowlist rules',
      );
    });

    it('should block window.location.href navigation to URLs not in the allowlist', async () => {
      const {page, server} = state;
      const allowedUrl = server.PREFIX + '/empty.html';
      const blockedUrl = server.PREFIX + '/title.html';

      await page.goto(allowedUrl);
      const navPromise = page.waitForNavigation({timeout: 2000}).catch(e => {
        return e;
      });
      await page.evaluate(url => {
        window.location.href = url;
      }, blockedUrl);

      await navPromise;
      const finalUrl = page.url();
      const content = await page.content();
      expect(finalUrl).not.toBe(blockedUrl);
      expect(content).not.toContain('Woof-Woof');
    });

    it('should fail fetch requests to URLs not in the allowlist', async () => {
      const {page, server} = state;
      const allowedUrl = server.PREFIX + '/empty.html';
      const blockedUrl = server.PREFIX + '/title.html';

      await page.goto(allowedUrl);
      const fetchError = await page.evaluate(async url => {
        try {
          await fetch(url);
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      }, blockedUrl);

      expect(fetchError).toContain('Failed to fetch');
    });

    it('should fail service worker registration for script URLs not in the allowlist', async () => {
      const {page, server} = state;
      const allowedUrl = server.PREFIX + '/empty.html';
      const blockedUrl = server.PREFIX + '/serviceworkers/empty/sw.js';

      await page.goto(allowedUrl);
      const swError = await page.evaluate(async url => {
        try {
          await navigator.serviceWorker.register(url);
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      }, blockedUrl);

      expect(swError).toBeTruthy();
      expect(swError).toContain('Failed to register a ServiceWorker');
    });

    it('should prevent loading of subresources not in the allowlist (e.g., images)', async () => {
      const {page, server} = state;
      const allowedUrl = server.PREFIX + '/one-style.css';
      const blockedUrl = server.PREFIX + '/pptr.png';

      const failedRequests = new Map<string, string | undefined>();
      const finishedRequests = new Set<string>();

      page.on('requestfailed', request => {
        failedRequests.set(request.url(), request.failure()?.errorText);
      });
      page.on('requestfinished', request => {
        finishedRequests.add(request.url());
      });

      await page.goto(server.PREFIX + '/empty.html');

      const idle = page.waitForNetworkIdle();
      await page.setContent(html`
        <img src="${blockedUrl}" />
        <link
          rel="stylesheet"
          href="${allowedUrl}"
        />
      `);
      await idle;

      expect(failedRequests.has(blockedUrl)).toBe(true);
      expect(failedRequests.get(blockedUrl)).toContain(
        'net::ERR_INTERNET_DISCONNECTED',
      );
      expect(finishedRequests.has(allowedUrl)).toBe(true);
    });

    it('should block OOPIF frame.goto when the destination is not in the allowlist', async () => {
      const {page, server} = state;
      await page.goto(server.PREFIX + '/empty.html');
      const frame = await attachFrame(
        page,
        'frame1',
        server.CROSS_PROCESS_PREFIX + '/empty.html',
      );

      const blockedUrl = server.PREFIX + '/title.html';
      let error: Error | undefined;
      await frame.goto(blockedUrl).catch(e => {
        return (error = e);
      });

      expect(error).toBeDefined();
      expect(error?.message).toContain(
        'is blocked by blocklist/allowlist rules',
      );
    });

    it('should block fetch requests from within OOPIFs to URLs not in the allowlist', async () => {
      const {page, server} = state;
      await page.goto(server.PREFIX + '/empty.html');
      const frame = await attachFrame(
        page,
        'frame1',
        server.CROSS_PROCESS_PREFIX + '/empty.html',
      );

      const fetchError = await frame.evaluate(async url => {
        try {
          await fetch(url);
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      }, server.PREFIX + '/title.html');

      expect(fetchError).toBeTruthy();
      expect(fetchError).toContain('Failed to fetch');
    });

    it('should block iframe content from loading if the iframe URL is not in the allowlist', async () => {
      const {page, server} = state;
      await page.goto(server.PREFIX + '/empty.html');
      await page.setContent(html`
        <iframe src="${server.PREFIX}/title.html"></iframe>
      `);
      const frame = page.frames().find(f => {
        return f !== page.mainFrame();
      })!;

      const content = await frame.content();
      expect(content).not.toContain("Hi, I'm frame");
    });

    it('should block out-of-process iframe (OOPIF) content from loading if the iframe URL is not in the allowlist', async () => {
      const {page, server} = state;
      await page.goto(server.PREFIX + '/empty.html');
      const frame = await attachFrame(
        page,
        'frame1',
        server.CROSS_PROCESS_PREFIX + '/title.html',
      );
      expect(frame.url()).toBe('chrome-error://chromewebdata/');
    });

    it('should block CDP standard emulation reset when allowlist is active', async () => {
      const {page} = state;
      const session = await page.createCDPSession();

      await expect(
        session.send('Network.emulateNetworkConditions', {
          offline: false,
          latency: 0,
          downloadThroughput: 0,
          uploadThroughput: 0,
        }),
      ).rejects.toThrow(
        'Cannot reset network conditions: rule-based emulation is enabled.',
      );
    });

    it('should block page.emulateNetworkConditions reset when allowlist is active', async () => {
      const {page} = state;

      await expect(
        page.emulateNetworkConditions({
          offline: false,
          latency: 0,
          download: 0,
          upload: 0,
        }),
      ).rejects.toThrow(
        'Cannot reset network conditions: rule-based emulation is enabled.',
      );
    });
  });

  describe('allowlist validation with service workers', () => {
    const state = setupSeparateTestBrowserHooks({
      allowlist: [
        '*://*:*/serviceworkers/fetch/sw.html',
        '*://*:*/serviceworkers/fetch/sw.js',
        '*://*:*/serviceworkers/fetch-on-install/sw.html',
        '*://*:*/serviceworkers/fetch-on-install/sw.js',
        '*://*:*/serviceworkers/fetch-on-install/allowed.json',
      ],
    });

    it('should fail fetch requests forwarded by a service worker to URLs not in the allowlist', async () => {
      const {page, server} = state;
      const blockedUrl = server.PREFIX + '/serviceworkers/fetch/style.css';

      await page.goto(server.PREFIX + '/serviceworkers/fetch/sw.html');
      await page.evaluate(() => {
        return (window as any).activationPromise;
      });

      const fetchError = await page.evaluate(async url => {
        try {
          await fetch(url);
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      }, blockedUrl);

      expect(fetchError).toContain('Failed to fetch');
    });

    it('should fail fetch requests made by a service worker during install to URLs not in the allowlist', async () => {
      const {page, server} = state;

      await page.goto(
        server.PREFIX + '/serviceworkers/fetch-on-install/sw.html',
      );
      const installFetchResults = await page.evaluate(() => {
        return (window as any).installFetchResultsPromise;
      });

      expect(installFetchResults).toEqual({
        './blocked.json': 'Failed to fetch',
        './allowed.json': 'success',
      });
    });
  });

  describe('no restrictions', () => {
    it('should not affect fetch requests made by a service worker during install', async () => {
      const {page, server} = await getTestState();

      await page.goto(
        server.PREFIX + '/serviceworkers/fetch-on-install/sw.html',
      );
      const installFetchResults = await page.evaluate(() => {
        return (window as any).installFetchResultsPromise;
      });

      expect(installFetchResults).toEqual({
        './blocked.json': 'success',
        './allowed.json': 'success',
      });
    });
  });

  describe('PWA validation', () => {
    describe('blocklist', () => {
      const state = setupSeparateTestBrowserHooks({
        blocklist: ['*://*:*/empty.html'],
        pipe: true,
      });

      it('should throw when calling PWA APIs', async () => {
        const {browser, server} = state;
        const manifestId = `${server.PREFIX}/pwa/`;

        await expect(
          browser.installPWA({
            manifestId,
            installUrlOrBundleUrl: `${server.PREFIX}/pwa/index.html`,
          }),
        ).rejects.toThrow(
          'PWA APIs are not supported when network restrictions are configured.',
        );

        await expect(browser.launchPWA({manifestId})).rejects.toThrow(
          'PWA APIs are not supported when network restrictions are configured.',
        );

        await expect(browser.uninstallPWA({manifestId})).rejects.toThrow(
          'PWA APIs are not supported when network restrictions are configured.',
        );

        await expect(browser.getPWAState({manifestId})).rejects.toThrow(
          'PWA APIs are not supported when network restrictions are configured.',
        );
      });
    });

    describe('allowlist', () => {
      const state = setupSeparateTestBrowserHooks({
        allowlist: ['*://*:*/empty.html'],
        pipe: true,
      });

      it('should throw when calling PWA APIs', async () => {
        const {browser, server} = state;
        const manifestId = `${server.PREFIX}/pwa/`;

        await expect(
          browser.installPWA({
            manifestId,
            installUrlOrBundleUrl: `${server.PREFIX}/pwa/index.html`,
          }),
        ).rejects.toThrow(
          'PWA APIs are not supported when network restrictions are configured.',
        );

        await expect(browser.launchPWA({manifestId})).rejects.toThrow(
          'PWA APIs are not supported when network restrictions are configured.',
        );

        await expect(browser.uninstallPWA({manifestId})).rejects.toThrow(
          'PWA APIs are not supported when network restrictions are configured.',
        );

        await expect(browser.getPWAState({manifestId})).rejects.toThrow(
          'PWA APIs are not supported when network restrictions are configured.',
        );
      });
    });
  });

  it('should detach from targets violating blocklist when connecting to a running browser', async () => {
    const {browser: originalBrowser, server} = await getTestState({
      skipContextCreation: true,
    });

    let connectedBrowser: any;
    let page: any;
    try {
      page = await originalBrowser.newPage();
      const blockedUrl = server.PREFIX + '/empty.html';

      await page.goto(blockedUrl);

      const wsEndpoint = originalBrowser.wsEndpoint();

      connectedBrowser = await puppeteer.connect({
        browserWSEndpoint: wsEndpoint,
        blocklist: ['*://*:*/empty.html'],
      });

      const targets = connectedBrowser.targets();
      const blockedTarget = targets.find((t: any) => {
        return t.url() === blockedUrl;
      });

      expect(blockedTarget).toBeUndefined();
    } finally {
      if (connectedBrowser) {
        await connectedBrowser.disconnect();
      }
      if (page) {
        await page.close();
      }
    }
  });

  it('should detach from targets violating allowlist when connecting to a running browser', async () => {
    const {browser: originalBrowser, server} = await getTestState({
      skipContextCreation: true,
    });

    let connectedBrowser: any;
    let page: any;
    try {
      page = await originalBrowser.newPage();
      const blockedUrl = server.PREFIX + '/title.html';

      await page.goto(blockedUrl);

      const wsEndpoint = originalBrowser.wsEndpoint();

      connectedBrowser = await puppeteer.connect({
        browserWSEndpoint: wsEndpoint,
        allowlist: ['*://*:*/empty.html'],
      });

      const targets = connectedBrowser.targets();
      const blockedTarget = targets.find((t: any) => {
        return t.url() === blockedUrl;
      });

      expect(blockedTarget).toBeUndefined();
    } finally {
      if (connectedBrowser) {
        await connectedBrowser.disconnect();
      }
      if (page) {
        await page.close();
      }
    }
  });

  it('should throw an error when both blocklist and allowlist are specified', async () => {
    let error: Error | undefined;
    await launch(
      {
        blocklist: ['*://*:*/empty.html'],
        allowlist: ['*://*:*/empty.html'],
      },
      {createContext: true},
    ).catch(e => {
      return (error = e);
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain(
      'Cannot specify both blocklist and allowlist',
    );

    const {browser} = await getTestState({skipContextCreation: true});

    const wsEndpoint = browser.wsEndpoint();
    let connectError: Error | undefined;
    await puppeteer
      .connect({
        browserWSEndpoint: wsEndpoint,
        blocklist: ['*://*:*/empty.html'],
        allowlist: ['*://*:*/empty.html'],
      })
      .catch(e => {
        return (connectError = e);
      });

    expect(connectError).toBeDefined();
    expect(connectError?.message).toContain(
      'Cannot specify both blocklist and allowlist',
    );
  });

  it('should throw an error for an invalid pattern', async () => {
    await expect(
      launch(
        {
          blocklist: ['(invalid pattern'],
        },
        {createContext: true},
      ),
    ).rejects.toThrow('URLPattern');
  });

  it('should block chrome://version/ when it matches blocklist', async () => {
    const blockedUrl = 'chrome://version/';
    const {page, close} = await launch(
      {
        blocklist: [blockedUrl],
      },
      {createContext: true},
    );

    try {
      await expect(page.goto(blockedUrl)).rejects.toThrow(
        'is blocked by blocklist/allowlist rules',
      );
    } finally {
      await close();
    }
  });
  describe('dynamic restrictions', () => {
    afterEach(async () => {
      const {browser} = await getTestState({skipLaunch: true});
      await browser?.restrictNetwork(null);
    });

    it('can set blocklist dynamically', async () => {
      const {page, server, browser} = await getTestState();

      const allowedUrl = server.PREFIX + '/title.html';
      const blockedUrl = server.PREFIX + '/empty.html';

      await page.goto(allowedUrl);
      const res1 = await page.evaluate(async url => {
        try {
          await fetch(url);
          return true;
        } catch {
          return false;
        }
      }, blockedUrl);
      expect(res1).toBe(true);

      await browser.restrictNetwork({blocklist: ['*://*:*/empty.html']});

      const res2 = await page.evaluate(async url => {
        try {
          await fetch(url);
          return true;
        } catch {
          return false;
        }
      }, blockedUrl);
      expect(res2).toBe(false);

      await browser.restrictNetwork();

      const res3 = await page.evaluate(async url => {
        try {
          await fetch(url);
          return true;
        } catch {
          return false;
        }
      }, blockedUrl);
      expect(res3).toBe(true);
    });

    it('can set allowlist dynamically', async () => {
      const {page, server, browser} = await getTestState();

      const allowedUrl = server.PREFIX + '/title.html';
      const blockedUrl = server.PREFIX + '/empty.html';

      await page.goto(allowedUrl);

      const res1 = await page.evaluate(async url => {
        try {
          await fetch(url);
          return true;
        } catch {
          return false;
        }
      }, blockedUrl);
      expect(res1).toBe(true);

      await browser.restrictNetwork({allowlist: ['*://*:*/title.html']});

      const res2 = await page.evaluate(async url => {
        try {
          await fetch(url);
          return true;
        } catch {
          return false;
        }
      }, blockedUrl);
      expect(res2).toBe(false);

      await browser.restrictNetwork();

      const res3 = await page.evaluate(async url => {
        try {
          await fetch(url);
          return true;
        } catch {
          return false;
        }
      }, blockedUrl);
      expect(res3).toBe(true);
    });

    it('can switch directly from blocklist to allowlist', async () => {
      const {page, server, browser} = await getTestState();

      await browser.restrictNetwork({blocklist: ['*://*:*/empty.html']});
      let error: Error | undefined;
      await page.goto(server.PREFIX + '/empty.html').catch(e => {
        return (error = e);
      });
      expect(error).toBeDefined();

      await browser.restrictNetwork({allowlist: ['*://*:*/empty.html']});

      // Should now be allowed
      await page.goto(server.PREFIX + '/empty.html');
      expect(page.url()).toBe(server.PREFIX + '/empty.html');
    });

    it('blocks page.emulateNetworkConditions after restrictNetwork is called', async () => {
      const {page, browser} = await getTestState();
      await browser.restrictNetwork({blocklist: ['*://*:*/empty.html']});

      await expect(
        page.emulateNetworkConditions({
          offline: false,
          latency: 0,
          download: 0,
          upload: 0,
        }),
      ).rejects.toThrow(
        'Cannot reset network conditions: rule-based emulation is enabled.',
      );
    });

    it('does not mutate state when restrictNetwork fails with an invalid pattern', async () => {
      const {page, server, browser} = await getTestState();

      await expect(
        browser.restrictNetwork({blocklist: ['(invalid pattern']}),
      ).rejects.toThrow('URLPattern');

      // Browser and connection state should remain unrestricted.
      await expect(
        page.emulateNetworkConditions({
          offline: false,
          latency: 0,
          download: 0,
          upload: 0,
        }),
      ).resolves.toBeUndefined();

      await browser.restrictNetwork({blocklist: ['*://*:*/empty.html']});

      await expect(
        browser.restrictNetwork({allowlist: ['(invalid pattern']}),
      ).rejects.toThrow('URLPattern');

      // Previous blocklist restriction should still be enforced.
      await expect(page.goto(server.PREFIX + '/empty.html')).rejects.toThrow(
        'is blocked by blocklist/allowlist rules',
      );
    });

    it('allows empty arrays alongside a populated or empty list', async () => {
      const {page, server, browser} = await getTestState();

      await browser.restrictNetwork({
        blocklist: [],
        allowlist: ['*://*:*/title.html'],
      });

      await expect(page.goto(server.PREFIX + '/empty.html')).rejects.toThrow(
        'is blocked by blocklist/allowlist rules',
      );
      await page.goto(server.PREFIX + '/title.html');
      expect(page.url()).toBe(server.PREFIX + '/title.html');

      await browser.restrictNetwork({blocklist: [], allowlist: []});

      await page.goto(server.PREFIX + '/empty.html');
      expect(page.url()).toBe(server.PREFIX + '/empty.html');
    });

    it('applies restrictions to a worker target', async () => {
      const {page, server, browser, context} = await getTestState();
      await browser.restrictNetwork({blocklist: ['*://*:*/empty.html']});

      await page.goto(server.PREFIX + '/serviceworkers/fetch/sw.html');

      const target = await context.waitForTarget(
        target => {
          return target.type() === 'service_worker';
        },
        {timeout: 3000},
      );
      const worker = (await target.worker())!;

      const fetchError = await worker.evaluate(async url => {
        try {
          await fetch(url);
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      }, server.PREFIX + '/empty.html');

      expect(fetchError).toBeTruthy();
      expect(fetchError).toContain('Failed to fetch');
    });

    it('applies and clears restrictions on an already-running worker', async () => {
      const {page, server, browser} = await getTestState();
      const blockedUrl = server.PREFIX + '/empty.html';

      const [worker] = await Promise.all([
        waitEvent<WebWorker>(page, 'workercreated'),
        page.goto(server.PREFIX + '/worker/worker.html'),
      ]);

      const canFetch = async () => {
        return await worker.evaluate(async url => {
          try {
            await fetch(url);
            return true;
          } catch {
            return false;
          }
        }, blockedUrl);
      };

      expect(await canFetch()).toBe(true);

      await browser.restrictNetwork({blocklist: ['*://*:*/empty.html']});
      expect(await canFetch()).toBe(false);

      await browser.restrictNetwork(null);
      expect(await canFetch()).toBe(true);
    });

    it('applies and clears restrictions on an already-running service worker', async () => {
      const {page, server, browser, context} = await getTestState();
      const blockedUrl = server.PREFIX + '/empty.html';

      await page.goto(server.PREFIX + '/serviceworkers/fetch/sw.html');

      const target = await context.waitForTarget(
        target => {
          return target.type() === 'service_worker';
        },
        {timeout: 3000},
      );
      const worker = (await target.worker())!;

      const canFetch = async () => {
        return await worker.evaluate(async url => {
          try {
            await fetch(url);
            return true;
          } catch {
            return false;
          }
        }, blockedUrl);
      };

      expect(await canFetch()).toBe(true);

      await browser.restrictNetwork({blocklist: ['*://*:*/empty.html']});
      expect(await canFetch()).toBe(false);

      await browser.restrictNetwork(null);
      expect(await canFetch()).toBe(true);
    });

    it('applies and clears restrictions on fetches forwarded by an already-running controlling service worker', async () => {
      const {page, server, browser} = await getTestState();
      const blockedUrl = server.PREFIX + '/serviceworkers/fetch/style.css';

      await page.goto(server.PREFIX + '/serviceworkers/fetch/sw.html');
      await page.evaluate(() => {
        return (window as any).activationPromise;
      });

      const canFetch = async () => {
        return await page.evaluate(async url => {
          try {
            await fetch(url);
            return true;
          } catch {
            return false;
          }
        }, blockedUrl);
      };

      expect(await canFetch()).toBe(true);

      await browser.restrictNetwork({
        blocklist: ['*://*:*/serviceworkers/fetch/style.css'],
      });
      expect(await canFetch()).toBe(false);

      await browser.restrictNetwork(null);
      expect(await canFetch()).toBe(true);

      await browser.restrictNetwork({
        blocklist: ['*://*:*/serviceworkers/fetch/style.css'],
      });
      expect(await canFetch()).toBe(false);
    });
  });

  describe('clearing launch-time lists', () => {
    const state = setupSeparateTestBrowserHooks({
      blocklist: ['*://*:*/empty.html'],
    });

    it('can clear launch-time lists', async () => {
      const {browser, page, server} = state;
      let error: Error | undefined;
      await page.goto(server.PREFIX + '/empty.html').catch(e => {
        return (error = e);
      });
      expect(error).toBeDefined();

      await browser.restrictNetwork(null);

      await page.goto(server.PREFIX + '/empty.html');
      expect(page.url()).toBe(server.PREFIX + '/empty.html');
    });
  });
});
