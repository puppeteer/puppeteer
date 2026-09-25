/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from 'chai';
import puppeteer from 'puppeteer/internal/puppeteer.js';

import {
  launch,
  setupSeparateTestBrowserHooks,
  getTestState,
  setupTestBrowserHooks,
} from '../mocha-utils.js';
import {assertRejects, attachFrame, html} from '../utils.js';

describe('Network Restrictions', function () {
  setupTestBrowserHooks();

  describe('blocklist validation', () => {
    const state = setupSeparateTestBrowserHooks({
      blocklist: [
        '*://*:*/empty.html',
        '*://*:*/pptr.png',
        '*://*:*/serviceworkers/empty/sw.js',
        '*://*:*/serviceworkers/fetch/style.css',
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

      assert.isDefined(error);
      assert.include(error?.message, 'is blocked by blocklist/allowlist rules');
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
      assert.notStrictEqual(finalUrl, blockedUrl);
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

      assert.include(fetchError, 'Failed to fetch');
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

      assert.ok(swError);
      assert.include(swError, 'Failed to register a ServiceWorker');
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

      assert.ok(fetchError);
      assert.include(fetchError, 'Failed to fetch');
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

      assert.isTrue(failedRequests.has(blockedUrl));
      assert.include(
        failedRequests.get(blockedUrl),
        'net::ERR_INTERNET_DISCONNECTED',
      );
      assert.isTrue(finishedRequests.has(allowedUrl));
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

      assert.isDefined(error);
      assert.include(error?.message, 'is blocked by blocklist/allowlist rules');
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

      assert.isDefined(error);
      assert.include(error?.message, 'is blocked by blocklist/allowlist rules');
    });

    it('should block CDP standard emulation reset when blocklist is active', async () => {
      const {page} = state;
      const session = await page.createCDPSession();

      assert.include(
        (
          await assertRejects(
            session.send('Network.emulateNetworkConditions', {
              offline: false,
              latency: 0,
              downloadThroughput: 0,
              uploadThroughput: 0,
            }),
          )
        ).message,
        'Cannot reset network conditions: rule-based emulation is enabled.',
      );
    });

    it('should block page.emulateNetworkConditions reset when blocklist is active', async () => {
      const {page} = state;

      assert.include(
        (
          await assertRejects(
            page.emulateNetworkConditions({
              offline: false,
              latency: 0,
              download: 0,
              upload: 0,
            }),
          )
        ).message,
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

      assert.ok(fetchError);
      assert.include(fetchError, 'Failed to fetch');
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

      assert.ok(fetchError);
      assert.include(fetchError, 'Failed to fetch');
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
      assert.notInclude(content, "Hi, I'm frame");
    });

    it('should block out-of-process iframe (OOPIF) content from loading if the iframe URL is in the blocklist', async () => {
      const {page, server} = state;
      await page.goto(server.PREFIX + '/title.html');
      const frame = await attachFrame(
        page,
        'frame1',
        server.CROSS_PROCESS_PREFIX + '/empty.html',
      );
      assert.strictEqual(frame.url(), 'chrome-error://chromewebdata/');
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
      assert.notStrictEqual(page.url(), blockedUrl);
      assert.isDefined(error);
      assert.include(error?.message, 'is blocked by blocklist/allowlist rules');
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
      assert.notStrictEqual(finalUrl, blockedUrl);
      assert.notInclude(content, 'Woof-Woof');
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

      assert.include(fetchError, 'Failed to fetch');
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

      assert.ok(swError);
      assert.include(swError, 'Failed to register a ServiceWorker');
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

      assert.isTrue(failedRequests.has(blockedUrl));
      assert.include(
        failedRequests.get(blockedUrl),
        'net::ERR_INTERNET_DISCONNECTED',
      );
      assert.isTrue(finishedRequests.has(allowedUrl));
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

      assert.isDefined(error);
      assert.include(error?.message, 'is blocked by blocklist/allowlist rules');
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

      assert.ok(fetchError);
      assert.include(fetchError, 'Failed to fetch');
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
      assert.notInclude(content, "Hi, I'm frame");
    });

    it('should block out-of-process iframe (OOPIF) content from loading if the iframe URL is not in the allowlist', async () => {
      const {page, server} = state;
      await page.goto(server.PREFIX + '/empty.html');
      const frame = await attachFrame(
        page,
        'frame1',
        server.CROSS_PROCESS_PREFIX + '/title.html',
      );
      assert.strictEqual(frame.url(), 'chrome-error://chromewebdata/');
    });

    it('should block CDP standard emulation reset when allowlist is active', async () => {
      const {page} = state;
      const session = await page.createCDPSession();

      assert.include(
        (
          await assertRejects(
            session.send('Network.emulateNetworkConditions', {
              offline: false,
              latency: 0,
              downloadThroughput: 0,
              uploadThroughput: 0,
            }),
          )
        ).message,
        'Cannot reset network conditions: rule-based emulation is enabled.',
      );
    });

    it('should block page.emulateNetworkConditions reset when allowlist is active', async () => {
      const {page} = state;

      assert.include(
        (
          await assertRejects(
            page.emulateNetworkConditions({
              offline: false,
              latency: 0,
              download: 0,
              upload: 0,
            }),
          )
        ).message,
        'Cannot reset network conditions: rule-based emulation is enabled.',
      );
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

        assert.include(
          (
            await assertRejects(
              browser.installPWA({
                manifestId,
                installUrlOrBundleUrl: `${server.PREFIX}/pwa/index.html`,
              }),
            )
          ).message,
          'PWA APIs are not supported when network restrictions are configured.',
        );

        assert.include(
          (await assertRejects(browser.launchPWA({manifestId}))).message,
          'PWA APIs are not supported when network restrictions are configured.',
        );

        assert.include(
          (await assertRejects(browser.uninstallPWA({manifestId}))).message,
          'PWA APIs are not supported when network restrictions are configured.',
        );

        assert.include(
          (await assertRejects(browser.getPWAState({manifestId}))).message,
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

        assert.include(
          (
            await assertRejects(
              browser.installPWA({
                manifestId,
                installUrlOrBundleUrl: `${server.PREFIX}/pwa/index.html`,
              }),
            )
          ).message,
          'PWA APIs are not supported when network restrictions are configured.',
        );

        assert.include(
          (await assertRejects(browser.launchPWA({manifestId}))).message,
          'PWA APIs are not supported when network restrictions are configured.',
        );

        assert.include(
          (await assertRejects(browser.uninstallPWA({manifestId}))).message,
          'PWA APIs are not supported when network restrictions are configured.',
        );

        assert.include(
          (await assertRejects(browser.getPWAState({manifestId}))).message,
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

      assert.isUndefined(blockedTarget);
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

      assert.isUndefined(blockedTarget);
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

    assert.isDefined(error);
    assert.include(
      error?.message,
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

    assert.isDefined(connectError);
    assert.include(
      connectError?.message,
      'Cannot specify both blocklist and allowlist',
    );
  });

  it('should throw an error for an invalid pattern', async () => {
    assert.include(
      (
        await assertRejects(
          launch(
            {
              blocklist: ['(invalid pattern'],
            },
            {createContext: true},
          ),
        )
      ).message,
      'URLPattern',
    );
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
      assert.include(
        (await assertRejects(page.goto(blockedUrl))).message,
        'is blocked by blocklist/allowlist rules',
      );
    } finally {
      await close();
    }
  });
});
