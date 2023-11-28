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

import type {
  IsPageTargetCallback,
  TargetFilterCallback,
} from '../api/Browser.js';

import type {ConnectionTransport} from './ConnectionTransport.js';
import type {Viewport} from './Viewport.js';

/**
 * @public
 */
export type ProtocolType = 'cdp' | 'webDriverBiDi';

/**
 * Generic browser options that can be passed when launching any browser or when
 * connecting to an existing browser instance.
 * @public
 */
export interface BrowserConnectOptions {
  /**
   * Whether to ignore HTTPS errors during navigation.
   * @defaultValue `false`
   */
  ignoreHTTPSErrors?: boolean;
  /**
   * Sets the viewport for each page.
   *
   * @defaultValue '\{width: 800, height: 600\}'
   */
  defaultViewport?: Viewport | null;
  /**
   * Slows down Puppeteer operations by the specified amount of milliseconds to
   * aid debugging.
   */
  slowMo?: number;
  /**
   * Callback to decide if Puppeteer should connect to a given target or not.
   */
  targetFilter?: TargetFilterCallback;
  /**
   * @internal
   */
  _isPageTarget?: IsPageTargetCallback;

  /**
   * @defaultValue 'cdp'
   * @public
   */
  protocol?: ProtocolType;
  /**
   * Timeout setting for individual protocol (CDP) calls.
   *
   * @defaultValue `180_000`
   */
  protocolTimeout?: number;
}

/**
 * @public
 */
export interface ConnectOptions extends BrowserConnectOptions {
  browserWSEndpoint?: string;
  browserURL?: string;
  transport?: ConnectionTransport;
  /**
   * Headers to use for the web socket connection.
   * @remarks
   * Only works in the Node.js environment.
   */
  headers?: Record<string, string>;
}
