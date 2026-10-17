/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type {IncomingMessage} from 'node:http';

import expect from 'expect';

import {getTestState, setupTestBrowserHooks} from '../mocha-utils.js';

describe('Page.setRequestInterception', function () {
  setupTestBrowserHooks();

  it('should work with intervention headers', async () => {
    const {server, page} = await getTestState();

    server.setRoute('/intervention', (_req, res) => {
      return res.end(`
        <script>
          document.write('<script src="${server.CROSS_PROCESS_PREFIX}/intervention.js">' + '</scr' + 'ipt>');
        </script>
      `);
    });
    server.setRedirect('/intervention.js', '/redirect.js');
    let serverRequest: IncomingMessage | undefined;
    server.setRoute('/redirect.js', (req, res) => {
      serverRequest = req;
      res.end('console.log(1);');
    });

    await page.setRequestInterception(true);
    page.on('request', request => {
      return request.continue();
    });
    await page.goto(server.PREFIX + '/intervention');
    // The intercepted document.write() script must still reach the server.
    expect(serverRequest).toBeDefined();
    // Chrome 157+ no longer attaches the `Intervention` request header
    // (https://crrev.com/c/8504605). Older versions still do; check for the
    // feature URL substring rather than https://www.chromestatus.com to make it
    // work with Edgium.
    const intervention = serverRequest!.headers['intervention'];
    if (intervention !== undefined) {
      expect(intervention).toContain('feature/5718547946799104');
    }
  });
});
