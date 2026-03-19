/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';

import {launch} from './mocha-utils.js';

describe('Network Restrictions', function () {
  it.only('should not block main frame navigation via page.goto', async () => {
    const {page, close, server} = await launch(
      {
        blocklist: ['*://*:*/*'],
      },
      {createContext: true},
    );
    try {
      const response = await page.goto(server.PREFIX + '/empty.html');
      console.log('Main frame navigation status:', response?.status());
      expect(response?.ok()).toBe(true);
    } finally {
      await close();
    }
  });

  it.only('should block subresources (e.g., images) in blocklist', async () => {
    const {page, close, server} = await launch(
      {
        blocklist: ['*://*:*/*'],
      },
      {createContext: true},
    );

    let imageBlocked = false;
    page.on('requestfailed', request => {
      if (request.url().endsWith('.png')) {
        console.log('Subresource blocked as expected:', request.url());
        imageBlocked = true;
      }
    });

    try {
      // Main navigation succeeds
      await page.goto(server.PREFIX + '/empty.html');

      // Attempt to load a blocked subresource
      await page.setContent('<img src="' + server.PREFIX + '/pptr.png">');

      // Wait a short bit for the request to fail
      await new Promise(r => setTimeout(r, 500));

      expect(imageBlocked).toBe(true);
    } finally {
      await close();
    }
  });

  it.only('should NOT block js navigation in blocklist', async () => {
    // Renamed to reflect expectation
    const {page, close, server} = await launch(
      {
        blocklist: ['*://*:*/*'],
      },
      {createContext: true},
    );

    try {
      await page.goto(server.PREFIX + '/empty.html');

      const navigationUrl = server.PREFIX + '/simple.html';

      // Attempt to navigate and wait for navigation to complete
      await Promise.all([
        page.waitForNavigation({waitUntil: 'networkidle0'}),
        page.evaluate(url => {
          window.location.href = url;
        }, navigationUrl),
      ]);

      // Check if the URL changed to the target
      expect(page.url()).toBe(navigationUrl);
      console.log('Navigation to', page.url(), 'succeeded.');
    } finally {
      await close();
    }
  });

  it.only('should allow subresources in allowlist and block others', async () => {
    const {page, close, server} = await launch(
      {
        // Allow specifically the pptr.png image, block everything else
        allowlist: ['*://*:*/pptr.png'],
      },
      {createContext: true},
    );

    const failedRequests: string[] = [];
    page.on('requestfailed', request => {
      failedRequests.push(request.url());
    });

    try {
      await page.goto(server.PREFIX + '/empty.html');

      // Trigger multiple subresource requests
      await page.setContent(`
        <img src="${server.PREFIX}/pptr.png">
        <script src="${server.PREFIX}/dummy.js"></script>
      `);

      await new Promise(r => setTimeout(r, 500));

      const isPngBlocked = failedRequests.some(url => url.endsWith('.png'));
      const isJsBlocked = failedRequests.some(url => url.endsWith('.js'));

      console.log('JS blocked (expected):', isJsBlocked);
      console.log('PNG blocked (NOT expected):', isPngBlocked);

      expect(isJsBlocked).toBe(true);
      expect(isPngBlocked).toBe(false);
    } finally {
      await close();
    }
  });
});
