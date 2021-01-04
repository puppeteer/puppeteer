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

import { ConnectionTransport } from './ConnectionTransport.ts';
import { Browser } from './Browser.ts';
import { assert } from './assert.ts';
import { debugError } from './helper.ts';
import { Connection } from './Connection.ts';
import { Viewport } from './PuppeteerViewport.ts';
import { WebSocketTransport } from './BrowserWebSocketTransport.ts';

/**
 * Generic browser options that can be passed when launching any browser.
 * @public
 */
export interface BrowserOptions {
  ignoreHTTPSErrors?: boolean;
  defaultViewport?: Viewport | null;
  slowMo?: number;
}

/**
 * Users should never call this directly; it's called when calling
 * `puppeteer.connect`.
 * @internal
 */
export const connectToBrowser = async (
  options: BrowserOptions & {
    browserWSEndpoint?: string;
    browserURL?: string;
    transport?: ConnectionTransport;
  }
): Promise<Browser> => {
  const {
    browserWSEndpoint,
    browserURL,
    ignoreHTTPSErrors = false,
    defaultViewport = { width: 800, height: 600 },
    transport,
    slowMo = 0,
  } = options;

  assert(
    Number(!!browserWSEndpoint) + Number(!!browserURL) + Number(!!transport) ===
      1,
    'Exactly one of browserWSEndpoint, browserURL or transport must be passed to puppeteer.connect'
  );

  const connection = await (async () => {
    if (transport) {
      return new Connection('', transport, slowMo);
    } else if (browserWSEndpoint) {
      const connectionTransport: ConnectionTransport = await WebSocketTransport.create(
        browserWSEndpoint
      );
      return new Connection(browserWSEndpoint, connectionTransport, slowMo);
    } else if (browserURL) {
      const connectionURL = await getWSEndpoint(browserURL);
      const connectionTransport: ConnectionTransport = await WebSocketTransport.create(
        connectionURL
      );
      return new Connection(connectionURL, connectionTransport, slowMo);
    }
    assert(false, 'unreachable');
  })();

  const { browserContextIds } = await connection.send(
    'Target.getBrowserContexts'
  );
  return Browser.create(
    connection,
    browserContextIds,
    ignoreHTTPSErrors,
    defaultViewport,
    undefined,
    () => connection.send('Browser.close').catch(debugError)
  );
};

async function getWSEndpoint(browserURL: string): Promise<string> {
  const endpointURL = new URL('/json/version', browserURL);

  try {
    const result = await fetch(endpointURL.toString(), {
      method: 'GET',
    });
    if (!result.ok) {
      throw new Error(`HTTP ${result.statusText}`);
    }
    const data = await result.json();
    return data.webSocketDebuggerUrl;
  } catch (error) {
    error.message =
      `Failed to fetch browser webSocket URL from ${endpointURL}: ` +
      error.message;
    throw error;
  }
}
