/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';
import puppeteer from 'puppeteer/internal/puppeteer.js';

import {launch} from '../mocha-utils.js';
import {attachFrame, html} from '../utils.js';

describe('Network Restrictions', function () {
  it('should block page.goto when the destination is in the blocklist', async () => {
    const {page, close, server} = await launch(
      {
        blocklist: ['*://*:*/empty.html'],
      },
      {createContext: true},
    );

    try {
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
    } finally {
      await close();
    }
  });

  it('should block window.location.href navigation to URLs in the blocklist', async () => {
    const {page, close, server} = await launch(
      {
        blocklist: ['*://*:*/empty.html'],
      },
      {createContext: true},
    );

    try {
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
    } finally {
      await close();
    }
  });

  it('should fail fetch requests to URLs in the blocklist', async () => {
    const {page, close, server} = await launch(
      {
        blocklist: ['*://*:*/empty.html'],
      },
      {createContext: true},
    );

    try {
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
    } finally {
      await close();
    }
  });

  it('should prevent loading of blocklisted subresources (e.g., images)', async () => {
    const {page, close, server} = await launch(
      {
        blocklist: ['*://*:*/pptr.png'],
      },
      {createContext: true},
    );

    try {
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
    } finally {
      await close();
    }
  });

  it('should detach from targets violating blocklist when connecting to a running browser', async () => {
    const {
      browser: originalBrowser,
      server,
      close,
    } = await launch({}, {createContext: false, createPage: false});

    let connectedBrowser: any;
    try {
      const page = await originalBrowser.newPage();
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
      await close();
    }
  });

  it('should only allow navigation to URLs in the allowlist', async () => {
    const {page, close, server} = await launch(
      {
        allowlist: ['*://*:*/empty.html'],
      },
      {createContext: true},
    );

    try {
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
    } finally {
      await close();
    }
  });

  it('should block window.location.href navigation to URLs not in the allowlist', async () => {
    const {page, close, server} = await launch(
      {
        allowlist: ['*://*:*/empty.html'],
      },
      {createContext: true},
    );

    try {
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
    } finally {
      await close();
    }
  });

  it('should fail fetch requests to URLs not in the allowlist', async () => {
    const {page, close, server} = await launch(
      {
        allowlist: ['*://*:*/empty.html'],
      },
      {createContext: true},
    );

    try {
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
    } finally {
      await close();
    }
  });

  it('should prevent loading of subresources not in the allowlist (e.g., images)', async () => {
    const {page, close, server} = await launch(
      {
        allowlist: ['*://*:*/empty.html', '*://*:*/one-style.css'],
      },
      {createContext: true},
    );

    try {
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
    } finally {
      await close();
    }
  });

  it('should detach from targets violating allowlist when connecting to a running browser', async () => {
    const {
      browser: originalBrowser,
      server,
      close,
    } = await launch({}, {createContext: false, createPage: false});

    let connectedBrowser: any;
    try {
      const page = await originalBrowser.newPage();
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
      await close();
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

    const {browser, close} = await launch({}, {createContext: false});
    try {
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
    } finally {
      await close();
    }
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

  it('should block iframe content from loading if the iframe URL is in the blocklist', async () => {
    const {page, close, server} = await launch(
      {
        blocklist: ['*://*:*/frames/frame.html'],
      },
      {createContext: true},
    );

    try {
      await page.goto(server.PREFIX + '/frames/one-frame.html');
      const frame = page.frames().find(f => {
        return f !== page.mainFrame();
      })!;

      const content = await frame.content();
      expect(content).not.toContain("Hi, I'm frame");
    } finally {
      await close();
    }
  });

  it('should block out-of-process iframe (OOPIF) content from loading if the iframe URL is in the blocklist', async () => {
    const {page, close, server} = await launch(
      {
        blocklist: ['*://*:*/frames/frame.html'],
        args: ['--site-per-process'],
      },
      {createContext: true},
    );

    try {
      await page.goto(server.EMPTY_PAGE);
      const frame = await attachFrame(
        page,
        'frame1',
        server.CROSS_PROCESS_PREFIX + '/frames/frame.html',
      );
      const content = await frame.content();
      expect(content).not.toContain("Hi, I'm frame");
      expect(content).toContain('ERR_INTERNET_DISCONNECTED');
    } finally {
      await close();
    }
  });

  it('should block fetch requests from within local iframes to URLs in the blocklist', async () => {
    const {page, close, server} = await launch(
      {
        blocklist: ['*://*:*/empty.html'],
      },
      {createContext: true},
    );

    try {
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
    } finally {
      await close();
    }
  });

  it('should block frame.goto when the destination is in the blocklist', async () => {
    const {page, close, server} = await launch(
      {
        blocklist: ['*://*:*/empty.html'],
      },
      {createContext: true},
    );

    try {
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
    } finally {
      await close();
    }
  });

  it('should block standard emulation reset when blocklist/allowlist is active', async () => {
    const {page, close} = await launch(
      {
        blocklist: ['*://*:*/empty.html'],
      },
      {createContext: true},
    );

    try {
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
    } finally {
      await close();
    }
  });
});
