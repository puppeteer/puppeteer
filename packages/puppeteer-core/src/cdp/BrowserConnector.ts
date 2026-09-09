/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {ConnectionTransport} from '../common/ConnectionTransport.js';
import type {ConnectOptions} from '../common/ConnectOptions.js';
import {DEBUG_PREFIXES, type Logger} from '../common/Debug.js';
import {DEFAULT_VIEWPORT} from '../common/util.js';
import {createIncrementalIdGenerator} from '../util/incremental-id-generator.js';

import {CdpBrowser} from './Browser.js';
import {Connection} from './Connection.js';

/**
 * Users should never call this directly; it's called when calling
 * `puppeteer.connect` with `protocol: 'cdp'`.
 *
 * @internal
 */
export async function _connectToCdpBrowser(
  connectionTransport: ConnectionTransport,
  url: string,
  options: ConnectOptions,
  logger: Logger,
): Promise<CdpBrowser> {
  const {
    acceptInsecureCerts = false,
    networkEnabled = true,
    issuesEnabled = true,
    defaultViewport = DEFAULT_VIEWPORT,
    downloadBehavior,
    targetFilter,
    _isPageTarget: isPageTarget,
    slowMo = 0,
    protocolTimeout,
    handleDevToolsAsPage,
    idGenerator = createIncrementalIdGenerator(),
    blocklist,
    allowlist,
  } = options;

  const log = options.logger ?? logger;

  const connection = new Connection(
    url,
    connectionTransport,
    slowMo,
    protocolTimeout,
    /* rawErrors */ false,
    idGenerator,
    log,
  );

  const {browserContextIds} = await connection.send(
    'Target.getBrowserContexts',
  );
  const browser = await CdpBrowser._create(
    connection,
    browserContextIds,
    acceptInsecureCerts,
    defaultViewport,
    downloadBehavior,
    undefined,
    () => {
      return connection.send('Browser.close').catch(error => {
        log?.(DEBUG_PREFIXES.error)?.(error);
      });
    },
    targetFilter,
    isPageTarget,
    undefined,
    networkEnabled,
    issuesEnabled,
    handleDevToolsAsPage,
    blocklist,
    allowlist,
    log,
  );
  return browser;
}
