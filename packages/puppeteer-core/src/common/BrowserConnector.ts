/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {Browser} from '../api/Browser.js';
import {_connectToBiDiBrowser} from '../bidi/BrowserConnector.js';
import {_connectToCdpBrowser} from '../cdp/BrowserConnector.js';
import {isNode} from '../environment.js';
import {assert} from '../util/assert.js';
import {isErrorLike} from '../util/ErrorLike.js';

import type {ConnectionTransport} from './ConnectionTransport.js';
import type {ConnectOptions} from './ConnectOptions.js';
import type {BrowserConnectOptions} from './ConnectOptions.js';

const getWebSocketTransportClass = async () => {
  return isNode
    ? (await import('../node/NodeWebSocketTransport.js')).NodeWebSocketTransport
    : (await import('../common/BrowserWebSocketTransport.js'))
        .BrowserWebSocketTransport;
};

/**
 * Users should never call this directly; it's called when calling
 * `puppeteer.connect`. This method attaches Puppeteer to an existing browser instance.
 *
 * @internal
 */
export async function _connectToBrowser(
  options: ConnectOptions,
): Promise<Browser> {
  const {connectionTransport, endpointUrl} =
    await getConnectionTransport(options);

  if (options.protocol === 'webDriverBiDi') {
    const bidiBrowser = await _connectToBiDiBrowser(
      connectionTransport,
      endpointUrl,
      options,
    );
    return bidiBrowser;
  } else {
    const cdpBrowser = await _connectToCdpBrowser(
      connectionTransport,
      endpointUrl,
      options,
    );
    return cdpBrowser;
  }
}

/**
 * Establishes a websocket connection by given options and returns both transport and
 * endpoint url the transport is connected to.
 */
async function getConnectionTransport(
  options: BrowserConnectOptions & ConnectOptions,
): Promise<{connectionTransport: ConnectionTransport; endpointUrl: string}> {
  const {browserWSEndpoint, browserURL, transport, headers = {}} = options;

  assert(
    Number(!!browserWSEndpoint) + Number(!!browserURL) + Number(!!transport) ===
      1,
    'Exactly one of browserWSEndpoint, browserURL or transport must be passed to puppeteer.connect',
  );

  if (transport) {
    return {connectionTransport: transport, endpointUrl: ''};
  } else if (browserWSEndpoint) {
    const WebSocketClass = await getWebSocketTransportClass();
    const connectionTransport: ConnectionTransport =
      await WebSocketClass.create(browserWSEndpoint, headers);
    return {
      connectionTransport: connectionTransport,
      endpointUrl: browserWSEndpoint,
    };
  } else if (browserURL) {
    const connectionURL = await getWSEndpoint(browserURL);
    const WebSocketClass = await getWebSocketTransportClass();
    const connectionTransport: ConnectionTransport =
      await WebSocketClass.create(connectionURL);
    return {
      connectionTransport: connectionTransport,
      endpointUrl: connectionURL,
    };
  }
  throw new Error('Invalid connection options');
}

async function getWSEndpoint(browserURL: string): Promise<string> {
  const endpointURL = new URL('/json/version', browserURL);

  try {
    const result = await globalThis.fetch(endpointURL.toString(), {
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
