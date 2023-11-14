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

import type {BidiBrowser} from '../bidi/Browser.js';
import type {ConnectionTransport} from '../common/ConnectionTransport.js';
import type {
  BrowserConnectOptions,
  ConnectOptions,
} from '../common/ConnectOptions.js';
import {UnsupportedOperation} from '../common/Errors.js';
import {getFetch} from '../common/fetch.js';
import {debugError} from '../common/util.js';
import {isNode} from '../environment.js';
import {assert} from '../util/assert.js';
import {isErrorLike} from '../util/ErrorLike.js';

import {CdpBrowser} from './Browser.js';
import {Connection} from './Connection.js';

const DEFAULT_VIEWPORT = Object.freeze({width: 800, height: 600});

const getWebSocketTransportClass = async () => {
  return isNode
    ? (await import('../node/NodeWebSocketTransport.js')).NodeWebSocketTransport
    : (await import('../common/BrowserWebSocketTransport.js'))
        .BrowserWebSocketTransport;
};

/**
 * Users should never call this directly; it's called when calling
 * `puppeteer.connect` with `protocol: 'cdp'`.
 *
 * @internal
 */
export async function _connectToCdpBrowser(
  options: BrowserConnectOptions & ConnectOptions
): Promise<CdpBrowser> {
  const {
    ignoreHTTPSErrors = false,
    defaultViewport = DEFAULT_VIEWPORT,
    targetFilter,
    _isPageTarget: isPageTarget,
  } = options;

  const connection = await getCdpConnection(options);

  const version = await connection.send('Browser.getVersion');
  const product = version.product.toLowerCase().includes('firefox')
    ? 'firefox'
    : 'chrome';

  const {browserContextIds} = await connection.send(
    'Target.getBrowserContexts'
  );
  const browser = await CdpBrowser._create(
    product || 'chrome',
    connection,
    browserContextIds,
    ignoreHTTPSErrors,
    defaultViewport,
    undefined,
    () => {
      return connection.send('Browser.close').catch(debugError);
    },
    targetFilter,
    isPageTarget
  );
  return browser;
}

/**
 * Users should never call this directly; it's called when calling
 * `puppeteer.connect` with `protocol: 'webDriverBiDi'`.
 *
 * @internal
 */
export async function _connectToBiDiOverCdpBrowser(
  options: BrowserConnectOptions & ConnectOptions
): Promise<BidiBrowser> {
  const {ignoreHTTPSErrors = false, defaultViewport = DEFAULT_VIEWPORT} =
    options;

  const connection = await getCdpConnection(options);

  const version = await connection.send('Browser.getVersion');
  if (version.product.toLowerCase().includes('firefox')) {
    throw new UnsupportedOperation(
      'Firefox is not supported in BiDi over CDP mode.'
    );
  }

  // TODO: use other options too.
  const BiDi = await import(/* webpackIgnore: true */ '../bidi/bidi.js');
  const bidiConnection = await BiDi.connectBidiOverCdp(connection);
  const bidiBrowser = await BiDi.BidiBrowser.create({
    connection: bidiConnection,
    closeCallback: () => {
      return connection.send('Browser.close').catch(debugError);
    },
    process: undefined,
    defaultViewport: defaultViewport,
    ignoreHTTPSErrors: ignoreHTTPSErrors,
  });
  return bidiBrowser;
}

async function getWSEndpoint(browserURL: string): Promise<string> {
  const endpointURL = new URL('/json/version', browserURL);

  const fetch = await getFetch();
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
    if (isErrorLike(error)) {
      error.message =
        `Failed to fetch browser webSocket URL from ${endpointURL}: ` +
        error.message;
    }
    throw error;
  }
}

/**
 * Returns a CDP connection for the given options.
 */
async function getCdpConnection(
  options: BrowserConnectOptions & ConnectOptions
): Promise<Connection> {
  const {
    browserWSEndpoint,
    browserURL,
    transport,
    headers = {},
    slowMo = 0,
    protocolTimeout,
  } = options;

  assert(
    Number(!!browserWSEndpoint) + Number(!!browserURL) + Number(!!transport) ===
      1,
    'Exactly one of browserWSEndpoint, browserURL or transport must be passed to puppeteer.connect'
  );

  if (transport) {
    return new Connection('', transport, slowMo, protocolTimeout);
  } else if (browserWSEndpoint) {
    const WebSocketClass = await getWebSocketTransportClass();
    const connectionTransport: ConnectionTransport =
      await WebSocketClass.create(browserWSEndpoint, headers);
    return new Connection(
      browserWSEndpoint,
      connectionTransport,
      slowMo,
      protocolTimeout
    );
  } else if (browserURL) {
    const connectionURL = await getWSEndpoint(browserURL);
    const WebSocketClass = await getWebSocketTransportClass();
    const connectionTransport: ConnectionTransport =
      await WebSocketClass.create(connectionURL);
    return new Connection(
      connectionURL,
      connectionTransport,
      slowMo,
      protocolTimeout
    );
  }
  throw new Error('Invalid connection options');
}
