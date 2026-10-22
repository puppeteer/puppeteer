/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {Browser} from '../api/Browser.js';
import {_connectToBiDiBrowser} from '../bidi/BrowserConnector.js';
import {_connectToCdpBrowser} from '../cdp/BrowserConnector.js';
import {environment, isNode} from '../environment.js';
import {assert} from '../util/assert.js';
import {isErrnoException, isErrorLike} from '../util/ErrorLike.js';

import type {ConnectionTransport} from './ConnectionTransport.js';
import type {ConnectOptions} from './ConnectOptions.js';
import type {Logger} from './Debug.js';
import {assertSupportedUrlRestrictions} from './util.js';

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
  options: ConnectOptions & {logger: Logger},
): Promise<Browser> {
  assertSupportedUrlRestrictions(options);
  const {connectionTransport, endpointUrl} =
    await getConnectionTransport(options);

  if (options.protocol === 'webDriverBiDi') {
    const bidiBrowser = await _connectToBiDiBrowser(
      connectionTransport,
      endpointUrl,
      options,
      options.logger,
    );
    return bidiBrowser;
  } else {
    const cdpBrowser = await _connectToCdpBrowser(
      connectionTransport,
      endpointUrl,
      options,
      options.logger,
    );
    return cdpBrowser;
  }
}

/**
 * Establishes a websocket connection by given options and returns both transport and
 * endpoint url the transport is connected to.
 * @internal
 */
async function getConnectionTransport(
  options: ConnectOptions & {logger: Logger},
): Promise<{connectionTransport: ConnectionTransport; endpointUrl: string}> {
  const {browserWSEndpoint, browserURL, channel, transport} = options;
  // `wsOptions.headers` supersedes the deprecated top-level `headers`.
  const headers = options.wsOptions?.headers ?? options.headers ?? {};
  const wsOptions = options.wsOptions ?? {};

  assert(
    Number(!!browserWSEndpoint) +
      Number(!!browserURL) +
      Number(!!transport) +
      Number(!!channel) ===
      1,
    'Exactly one of browserWSEndpoint, browserURL, transport or channel must be passed to puppeteer.connect',
  );

  if (transport) {
    return {connectionTransport: transport, endpointUrl: ''};
  } else if (browserWSEndpoint) {
    const WebSocketClass = await getWebSocketTransportClass();
    const connectionTransport: ConnectionTransport =
      await WebSocketClass.create(
        browserWSEndpoint,
        headers,
        options.logger,
        wsOptions,
      );
    return {
      connectionTransport: connectionTransport,
      endpointUrl: browserWSEndpoint,
    };
  } else if (browserURL) {
    const connectionURL = await getWSEndpoint(browserURL, headers);
    const WebSocketClass = await getWebSocketTransportClass();
    const connectionTransport: ConnectionTransport =
      await WebSocketClass.create(
        connectionURL,
        headers,
        options.logger,
        wsOptions,
      );
    return {
      connectionTransport: connectionTransport,
      endpointUrl: connectionURL,
    };
  } else if (options.channel && isNode) {
    const {detectBrowserPlatform, resolveDefaultUserDataDir, Browser} =
      await import('@puppeteer/browsers');
    const platform = detectBrowserPlatform();
    if (!platform) {
      throw new Error('Could not detect required browser platform');
    }
    const {convertPuppeteerChannelToBrowsersChannel} =
      await import('../node/LaunchOptions.js');
    const {join} = await import('node:path');
    const userDataDir = resolveDefaultUserDataDir(
      Browser.CHROME,
      platform,
      convertPuppeteerChannelToBrowsersChannel(options.channel),
    );
    const portPath = join(userDataDir, 'DevToolsActivePort');
    try {
      const fileContent = await environment.value.readFile(portPath, 'ascii');
      const [rawPort, rawPath] = fileContent
        .split('\n')
        .map(line => {
          return line.trim();
        })
        .filter(line => {
          return !!line;
        });
      if (!rawPort || !rawPath) {
        throw new Error(`Invalid DevToolsActivePort '${fileContent}' found`);
      }
      const port = parseInt(rawPort, 10);
      if (isNaN(port) || port <= 0 || port > 65535) {
        throw new Error(`Invalid port '${rawPort}' found`);
      }
      const browserWSEndpoint = `ws://localhost:${port}${rawPath}`;
      const WebSocketClass = await getWebSocketTransportClass();
      const connectionTransport = await WebSocketClass.create(
        browserWSEndpoint,
        headers,
        options.logger,
        wsOptions,
      );
      return {
        connectionTransport: connectionTransport,
        endpointUrl: browserWSEndpoint,
      };
    } catch (error) {
      if (
        isErrnoException(error) &&
        (error.code === 'EPERM' || error.code === 'EACCES')
      ) {
        throw new Error(
          `Could not read DevToolsActivePort for ${options.channel} at ${portPath}: permission denied`,
          {
            cause: error,
          },
        );
      }
      throw new Error(
        `Could not find DevToolsActivePort for ${options.channel} at ${portPath}`,
        {
          cause: error,
        },
      );
    }
  }
  throw new Error('Invalid connection options');
}

async function getWSEndpoint(
  browserURL: string,
  headers?: Record<string, string>,
): Promise<string> {
  const endpointURL = getWSEndpointURL(browserURL);

  try {
    const result = await globalThis.fetch(endpointURL, {
      method: 'GET',
      headers,
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

export function getWSEndpointURL(browserURL: string): string {
  const endpointURL = new URL(browserURL);
  endpointURL.pathname =
    endpointURL.pathname.replace(/\/?$/, '') + '/json/version';
  endpointURL.hash = '';
  return endpointURL.toString();
}
