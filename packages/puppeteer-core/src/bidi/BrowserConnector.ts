/*
 * Copyright 2023 Google Inc. All rights reserved.
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

import type {BrowserCloseCallback} from '../api/Browser.js';
import {Connection} from '../cdp/Connection.js';
import type {ConnectionTransport} from '../common/ConnectionTransport.js';
import type {
  BrowserConnectOptions,
  ConnectOptions,
} from '../common/ConnectOptions.js';
import {UnsupportedOperation} from '../common/Errors.js';
import {debugError, DEFAULT_VIEWPORT} from '../common/util.js';

import type {BidiBrowser} from './Browser.js';
import type {BidiConnection} from './Connection.js';

/**
 * Users should never call this directly; it's called when calling `puppeteer.connect`
 * with `protocol: 'webDriverBiDi'`. This method attaches Puppeteer to an existing browser
 * instance. First it tries to connect to the browser using pure BiDi. If the protocol is
 * not supported, connects to the browser using BiDi over CDP.
 *
 * @internal
 */
export async function _connectToBiDiBrowser(
  connectionTransport: ConnectionTransport,
  url: string,
  options: BrowserConnectOptions & ConnectOptions
): Promise<BidiBrowser> {
  const {ignoreHTTPSErrors = false, defaultViewport = DEFAULT_VIEWPORT} =
    options;

  const {bidiConnection, closeCallback} = await getBiDiConnection(
    connectionTransport,
    url,
    options
  );
  const BiDi = await import(/* webpackIgnore: true */ './bidi.js');
  const bidiBrowser = await BiDi.BidiBrowser.create({
    connection: bidiConnection,
    closeCallback,
    process: undefined,
    defaultViewport: defaultViewport,
    ignoreHTTPSErrors: ignoreHTTPSErrors,
  });
  return bidiBrowser;
}

/**
 * Returns a BiDiConnection established to the endpoint specified by the options and a
 * callback closing the browser. Callback depends on whether the connection is pure BiDi
 * or BiDi over CDP.
 * The method tries to connect to the browser using pure BiDi protocol, and falls back
 * to BiDi over CDP.
 */
async function getBiDiConnection(
  connectionTransport: ConnectionTransport,
  url: string,
  options: BrowserConnectOptions
): Promise<{
  bidiConnection: BidiConnection;
  closeCallback: BrowserCloseCallback;
}> {
  const BiDi = await import(/* webpackIgnore: true */ './bidi.js');
  const {ignoreHTTPSErrors = false, slowMo = 0, protocolTimeout} = options;

  // Try pure BiDi first.
  const pureBidiConnection = new BiDi.BidiConnection(
    url,
    connectionTransport,
    slowMo,
    protocolTimeout
  );
  try {
    const result = await pureBidiConnection.send('session.status', {});
    if ('type' in result && result.type === 'success') {
      // The `browserWSEndpoint` points to an endpoint supporting pure WebDriver BiDi.
      return {
        bidiConnection: pureBidiConnection,
        closeCallback: async () => {
          await pureBidiConnection.send('browser.close', {}).catch(debugError);
        },
      };
    }
  } catch (e: any) {
    if (!('name' in e && e.name === 'ProtocolError')) {
      // Unexpected exception not related to BiDi / CDP. Rethrow.
      throw e;
    }
  }
  // Unbind the connection to avoid memory leaks.
  pureBidiConnection.unbind();

  // Fall back to CDP over BiDi reusing the WS connection.
  const cdpConnection = new Connection(
    url,
    connectionTransport,
    slowMo,
    protocolTimeout
  );

  const version = await cdpConnection.send('Browser.getVersion');
  if (version.product.toLowerCase().includes('firefox')) {
    throw new UnsupportedOperation(
      'Firefox is not supported in BiDi over CDP mode.'
    );
  }

  // TODO: use other options too.
  const bidiOverCdpConnection = await BiDi.connectBidiOverCdp(cdpConnection, {
    acceptInsecureCerts: ignoreHTTPSErrors,
  });
  return {
    bidiConnection: bidiOverCdpConnection,
    closeCallback: async () => {
      // In case of BiDi over CDP, we need to close browser via CDP.
      await cdpConnection.send('Browser.close').catch(debugError);
    },
  };
}
