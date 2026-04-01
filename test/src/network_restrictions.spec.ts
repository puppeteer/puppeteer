/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';

import {launch} from './mocha-utils.js';
import {html} from './utils.js';

describe('Network Restrictions', function () {
  it('should block page.goto when the destination is in the blocklist', async () => {
    const {page, close, server} = await launch(
      {
        acceptInsecureCerts: true,
        blocklist: ['*://*:*/empty.html'],
      },
      {createContext: true},
    );

    const initialUrl = server.PREFIX + '/title.html'; // should navigate
    const blockedUrl = server.PREFIX + '/empty.html'; // should be blocked

    await page.goto(initialUrl);
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
        blocklist: ['*://*:*/empty.html'],
      },
      {createContext: true},
    );

    const initialUrl = server.PREFIX + '/title.html'; // should navigate
    const blockedUrl = server.PREFIX + '/empty.html'; // should be blocked

    await page.goto(initialUrl);
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
        blocklist: ['*://*:*/empty.html'],
      },
      {createContext: true},
    );

    const initialUrl = server.PREFIX + '/title.html'; // should fetch
    const blockedUrl = server.PREFIX + '/empty.html'; // should fail

    await page.goto(initialUrl);
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
        blocklist: ['*://*:*/pptr.png'],
      },
      {createContext: true},
    );

    const allowedUrl = server.PREFIX + '/one-style.css'; // should load
    const blockedUrl = server.PREFIX + '/pptr.png'; // should not load

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

  it('should only allow page.goto to URLs present in the allowlist', async () => {
    const {page, close, server} = await launch(
      {
        acceptInsecureCerts: true,
        allowlist: ['*://*:*/empty.html'],
      },
      {createContext: true},
    );

    const initialUrl = server.PREFIX + '/empty.html'; // should navigate
    const blockedUrl = server.PREFIX + '/title.html'; // should be blocked

    await page.goto(initialUrl);

    let error: Error | undefined;
    await page.goto(blockedUrl).catch(e => {
      return (error = e);
    });
    expect(page.url()).toBe(initialUrl);
    expect(error).toBeDefined();
    expect(error?.message).toContain('net::ERR_INTERNET_DISCONNECTED');
    await close();
  });

  it('should permit window.location.href only to URLs in the allowlist', async () => {
    const {page, close, server} = await launch(
      {
        allowlist: ['*://*:*/empty.html'],
      },
      {createContext: true},
    );

    const initialUrl = server.PREFIX + '/empty.html'; // should navigate here
    const blockedUrl = server.PREFIX + '/title.html'; // should be blocked

    await page.goto(initialUrl);
    const navPromise = page.waitForNavigation({timeout: 2000}).catch(e => {
      return e;
    });

    await page.evaluate(url => {
      window.location.href = url;
    }, blockedUrl);

    await navPromise;
    const finalUrl = page.url();
    expect(finalUrl).toBe(initialUrl);
    await close();
  });
});
