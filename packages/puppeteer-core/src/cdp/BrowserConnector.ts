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

import type {ConnectionTransport} from '../common/ConnectionTransport.js';
import type {
  BrowserConnectOptions,
  ConnectOptions,
} from '../common/ConnectOptions.js';
import {debugError, DEFAULT_VIEWPORT} from '../common/util.js';

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
  options: BrowserConnectOptions & ConnectOptions
): Promise<CdpBrowser> {
  const {
    ignoreHTTPSErrors = false,
    defaultViewport = DEFAULT_VIEWPORT,
    targetFilter,
    _isPageTarget: isPageTarget,
    slowMo = 0,
    protocolTimeout,
  } = options;

  const connection = new Connection(
    url,
    connectionTransport,
    slowMo,
    protocolTimeout
  );

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
