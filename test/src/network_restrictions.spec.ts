/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';
import puppeteer from 'puppeteer/internal/puppeteer.js';

import {launch} from './mocha-utils.js';
import {html} from './utils.js';

describe('Network Restrictions', function () {
  it('should block page.goto when the destination is in the blocklist', async () => {
    const {page, close, server} = await launch(
      {
        acceptInsecureCerts: true,
        blockList: ['*://*:*/empty.html'],
      },
      {createContext: true},
    );

    const allowedUrl = server.PREFIX + '/title.html';
    const blockedUrl = server.PREFIX + '/empty.html';

    await page.goto(allowedUrl);
    let error: Error | undefined;
    await page.goto(blockedUrl).catch(e => {
      return (error = e);
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain('net::ERR_INTERNET_DISCONNECTED');
    await close();
  });

  it('should block window.location.href navigation to URLs in the blocklist', async () => {
    const {page, close, server} = await launch(
      {
        blockList: ['*://*:*/empty.html'],
      },
      {createContext: true},
    );

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
    await close();
  });

  it('should fail fetch requests to URLs in the blocklist', async () => {
    const {page, close, server} = await launch(
      {
        blockList: ['*://*:*/empty.html'],
      },
      {createContext: true},
    );

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
    await close();
  });

  it('should prevent loading of blocklisted subresources (e.g., images)', async () => {
    const {page, close, server} = await launch(
      {
        blockList: ['*://*:*/pptr.png'],
      },
      {createContext: true},
    );

    const allowedUrl = server.PREFIX + '/one-style.css';
    const blockedUrl = server.PREFIX + '/pptr.png';

    const imageBlockedErrorPromise = new Promise<string | undefined>(
      resolve => {
        page.on('requestfailed', request => {
          if (request.url().endsWith('/pptr.png')) {
            resolve(request.failure()?.errorText);
          }
        });
      },
    );
    const cssFinishedPromise = new Promise<boolean>(resolve => {
      page.on('requestfinished', request => {
        if (request.url().endsWith('/one-style.css')) {
          resolve(true);
        }
      });
    });

    await page.goto(server.PREFIX + '/empty.html');
    await page.setContent(html`
      <img src="${blockedUrl}" />
      <link
        rel="stylesheet"
        href="${allowedUrl}"
      />
    `);

    const imageError = await Promise.race([
      imageBlockedErrorPromise,
      new Promise<string | undefined>(r => {
        return setTimeout(() => {
          return r(undefined);
        }, 3000);
      }),
    ]);
    const cssFinished = await Promise.race([
      cssFinishedPromise,
      new Promise<boolean>(r => {
        return setTimeout(() => {
          return r(false);
        }, 3000);
      }),
    ]);

    expect(imageError).toBeDefined();
    expect(imageError).toContain('net::ERR_INTERNET_DISCONNECTED');
    expect(cssFinished).toBe(true);

    await close();
  });

  it('should detach from targets violating blocklist when connecting to a running browser', async () => {
    const {
      browser: originalBrowser,
      server,
      close,
    } = await launch({}, {createContext: false, createPage: false});
    const page = await originalBrowser.newPage();
    const blockedUrl = server.PREFIX + '/empty.html';

    await page.goto(blockedUrl);

    const wsEndpoint = originalBrowser.wsEndpoint();

    const connectedBrowser = await puppeteer.connect({
      browserWSEndpoint: wsEndpoint,
      blockList: ['*://*:*/empty.html'],
    });

    const targets = connectedBrowser.targets();
    const blockedTarget = targets.find(t => {
      return t.url() === blockedUrl;
    });

    expect(blockedTarget).toBeUndefined();

    await connectedBrowser.disconnect();
    await close();
  });
});
