/**
 * Copyright 2020 Google Inc. All rights reserved.
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
import { Connection } from '../lib/esm/puppeteer/common/Connection.js';
import { BrowserWebSocketTransport } from '../lib/esm/puppeteer/common/BrowserWebSocketTransport.js';
import puppeteer from '../lib/esm/puppeteer/web.js';
import expect from '../node_modules/expect/build-es5/index.js';
import { getWebSocketEndpoint } from './helper.js';

describe('creating a Connection', () => {
  it('can create a real connection to the backend and send messages', async () => {
    const wsUrl = getWebSocketEndpoint();
    const transport = await BrowserWebSocketTransport.create(wsUrl);

    const connection = new Connection(wsUrl, transport);
    const result = await connection.send('Browser.getVersion');
    /* We can't expect exact results as the version of Chrome/CDP might change
     * and we don't want flakey tests, so let's assert the structure, which is
     * enough to confirm the result was recieved successfully.
     */
    expect(result).toEqual({
      protocolVersion: expect.any(String),
      jsVersion: expect.any(String),
      revision: expect.any(String),
      userAgent: expect.any(String),
      product: expect.any(String),
    });
  });
});

describe('puppeteer.connect', () => {
  it('can connect over websocket and make requests to the backend', async () => {
    const wsUrl = getWebSocketEndpoint();
    const browser = await puppeteer.connect({
      browserWSEndpoint: wsUrl,
    });

    const version = await browser.version();
    const versionLooksCorrect = /.+Chrome\/\d{2}/.test(version);
    expect(version).toEqual(expect.any(String));
    expect(versionLooksCorrect).toEqual(true);
  });
});
