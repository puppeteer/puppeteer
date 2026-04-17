/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';
import puppeteer from 'puppeteer/internal/puppeteer.js';

import {launch} from '../mocha-utils.js';
import {html} from '../utils.js';

describe('Network Restrictions', function () {
  it('should block page.goto when the destination is in the blocklist', async () => {
    const {page, close, server} = await launch(
      {
        blockList: ['*://*:*/empty.html'],
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
      expect(error?.message).toContain('net::ERR_INTERNET_DISCONNECTED');
    } finally {
      await close();
    }
  });

  it('should block window.location.href navigation to URLs in the blocklist', async () => {
    const {page, close, server} = await launch(
      {
        blockList: ['*://*:*/empty.html'],
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
        blockList: ['*://*:*/empty.html'],
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

      expect(fetchError).toBeTruthy();
      expect(fetchError).toContain('Failed to fetch');
    } finally {
      await close();
    }
  });

  it('should prevent loading of blocklisted subresources (e.g., images)', async () => {
    const {page, close, server} = await launch(
      {
        blockList: ['*://*:*/pptr.png'],
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

      await page.setContent(
        html`
          <img src="${blockedUrl}" />
          <link
            rel="stylesheet"
            href="${allowedUrl}"
          />
        `,
        {waitUntil: 'networkidle0'},
      );

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
        blockList: ['*://*:*/empty.html'],
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

  it('should not block chrome://version/ even if it matches blocklist', async () => {
    const chromeUrl = 'chrome://version/';
    const {page, close} = await launch(
      {
        blockList: [chromeUrl],
      },
      {createContext: true},
    );

    try {
      await page.goto(chromeUrl);

      // Navigation should succeed as chrome:// URLs usually bypass the network
      expect(page.url()).toBe(chromeUrl);
    } finally {
      await close();
    }
  });
});
