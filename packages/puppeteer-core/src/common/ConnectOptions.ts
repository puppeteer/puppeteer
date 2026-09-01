/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {Session} from 'webdriver-bidi-protocol';

import type {
  IsPageTargetCallback,
  TargetFilterCallback,
} from '../api/Browser.js';

import type {ConnectionTransport} from './ConnectionTransport.js';
import type {Logger} from './Debug.js';
import type {DownloadBehavior} from './DownloadBehavior.js';
import type {Viewport} from './Viewport.js';

/**
 * @public
 */
export type ProtocolType = 'cdp' | 'webDriverBiDi';

/**
 * @public
 */
export type SupportedWebDriverCapability = Exclude<
  Session.CapabilityRequest,
  'unhandledPromptBehavior' | 'acceptInsecureCerts'
>;

/**
 * WebDriver BiDi capabilities that are not set by Puppeteer itself.
 *
 * @public
 */
export interface SupportedWebDriverCapabilities {
  firstMatch?: SupportedWebDriverCapability[];
  alwaysMatch?: SupportedWebDriverCapability;
}

/**
 * @public
 */
export type ChromeReleaseChannel =
  'chrome' | 'chrome-beta' | 'chrome-canary' | 'chrome-dev';

/**
 * Options for the WebSocket connection to the browser.
 *
 * @remarks
 * Only used in the Node.js environment.
 *
 * @public
 */
export interface WsOptions {
  /**
   * Headers to use for the web socket connection.
   */
  headers?: Record<string, string>;

  /**
   * Whether to send WebSocket pings and drop the connection when a pong does
   * not come back within the same interval. Detects a connection that died
   * without a close frame, which otherwise leaves calls hanging until
   * `protocolTimeout`.
   *
   * @defaultValue `false`
   */
  keepAlive?: boolean;

  /**
   * Ping period in milliseconds. Only used when {@link WsOptions.keepAlive} is
   * set.
   *
   * @defaultValue `30_000`
   */
  keepAliveIntervalMs?: number;
}

/**
 * Generic browser options that can be passed when launching any browser or when
 * connecting to an existing browser instance.
 * @public
 */
export interface ConnectOptions {
  /**
   * Whether to ignore HTTPS errors during navigation.
   * @defaultValue `false`
   */
  acceptInsecureCerts?: boolean;
  /**
   * If specified, puppeteer looks for an open WebSocket at the well-known
   * default user data directory for the specified channel and attempts to
   * connect to it using ws://localhost:$ActivePort/devtools/browser. Only works
   * for Chrome and when run in Node.js.
   *
   * This option is experimental when used with puppeteer.connect().
   *
   * @experimental
   */
  channel?: ChromeReleaseChannel;
  /**
   * Experimental setting to disable monitoring network events by default. When
   * set to `false`, parts of Puppeteer that depend on network events would not
   * work such as HTTPRequest and HTTPResponse.
   *
   * @experimental
   * @defaultValue `true`
   */
  networkEnabled?: boolean;
  /**
   * Experimental setting to disable monitoring issue events by default.
   *
   * @experimental
   * @defaultValue `true`
   */
  issuesEnabled?: boolean;
  /**
   * Sets the viewport for each page.
   *
   * @defaultValue '\{width: 800, height: 600\}'
   */
  defaultViewport?: Viewport | null;
  /**
   * Sets the download behavior for the context.
   */
  downloadBehavior?: DownloadBehavior;
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
   * Whether to handle the DevTools windows as pages in Puppeteer. Supported
   * only in Chrome with CDP.
   *
   * @defaultValue 'false'
   */
  handleDevToolsAsPage?: boolean;

  /**
   * @defaultValue Determined at run time:
   *
   * - Launching Chrome - 'cdp'.
   *
   * - Launching Firefox - 'webDriverBiDi'.
   *
   * - Connecting to a browser - 'cdp'.
   *
   * @public
   */
  protocol?: ProtocolType;
  /**
   * Timeout setting for individual protocol (CDP) calls.
   *
   * @defaultValue `180_000`
   */
  protocolTimeout?: number;

  /**
   * Options for the WebSocket connection to the browser.
   *
   * @remarks
   * Only used in the Node.js environment. The browser build has no ping frame
   * API, so the keep-alive options are ignored there.
   */
  wsOptions?: WsOptions;

  browserWSEndpoint?: string;
  browserURL?: string;
  transport?: ConnectionTransport;
  /**
   * @internal
   *
   * Custom ID generator for CDP / BiDi messages. Useful if the same transport
   * is shared for multiple connections.
   */
  idGenerator?: () => number;

  /**
   * Headers to use for the web socket connection.
   * @remarks
   * Only works in the Node.js environment.
   *
   * @deprecated Use {@link WsOptions.headers} via
   * {@link ConnectOptions.wsOptions} instead. When both are set,
   * `wsOptions.headers` wins.
   */
  headers?: Record<string, string>;

  /**
   * WebDriver BiDi capabilities passed to BiDi `session.new`.
   *
   * @remarks
   * Only works for `protocol="webDriverBiDi"` and {@link Puppeteer.connect}.
   */
  capabilities?: SupportedWebDriverCapabilities;

  /**
   * A list of URL patterns to block.
   *
   * This option allows you to restrict the browser from accessing specific URLs
   * or origins. It uses the standard
   * [URLPattern](https://urlpattern.spec.whatwg.org/) API to match URLs.
   *
   * When connecting to an existing browser, Puppeteer will silently detach from
   * any already open targets that violate the patterns.
   *
   * For any network requests made by the browser (including navigations and
   * subresources like images or scripts), the request will fail with an error
   * if the URL matches a blocked pattern.
   *
   * @example Pattern to block a specific domain: `*://example.com/*`
   *
   * @example Pattern to block all subdomains: `*://*.evil.com/*`
   *
   * @remarks
   * Currently only supported for Chrome.
   *
   * The feature works while Puppeteer is attached to the CDP targets.
   * It intercepts requests in the network service in Chrome.
   * Chrome may perform some network access in other ways or
   * some web features may omit the network service.
   * The feature is meant as an additional guardrails to LLM-based
   * usage under Puppeteer control and not a complete network sandbox.
   * For complete network sandboxing, we recommend using
   * container/OS-level sandbox mechanism.
   *
   * Cannot be used along with {@link ConnectOptions.allowlist}.
   *
   * @experimental
   */
  blocklist?: string[];
  /**
   * A list of URL patterns to allow.
   *
   * **Requires Chrome 149+.**
   *
   * This option allows you to restrict the browser from accessing any URLs
   * except for those that match the patterns in the allowList.
   * It uses the standard [URLPattern](https://urlpattern.spec.whatwg.org/) API to match URLs.
   *
   * When connecting to an existing browser, Puppeteer will silently detach from any
   * already open targets that violate the patterns.
   *
   * For any network requests made by the browser (including navigations and
   * subresources like images or scripts), the request will fail with an error
   * if the URL does not match any pattern in the allowlist.
   *
   * @example Pattern to allow a specific domain:
   * `*://example.com/*`
   *
   * @example Pattern to allow all subdomains:
   * `*://*.example.com/*`
   *
   * @remarks
   * Currently only supported for Chrome.
   *
   * The feature works while Puppeteer is attached to the CDP targets.
   * It intercepts requests in the network service in Chrome.
   * Chrome may perform some network access in other ways or
   * some web features may omit the network service.
   * The feature is meant as an additional guardrails to LLM-based
   * usage under Puppeteer control and not a complete network sandbox.
   * For complete network sandboxing, we recommend using
   * container/OS-level sandbox mechanism.
   *
   * Cannot be used along with {@link ConnectOptions.blocklist}.
   *
   * @experimental
   */
  allowlist?: string[];
  /**
   * When provided, Puppeteer calls the logger with a debug channel prefix
   * {@link DebugPrefix}. If the logger returns a
   * {@link LoggerFunction}, Puppeteer uses it to log details for that channel.
   *
   * @example
   *
   * ```ts
   * const browser = await puppeteer.connect({
   *   browserWSEndpoint,
   *   logger: prefix => {
   *     return (...args) => console.log(`[${prefix}]`, ...args);
   *   },
   * });
   * ```
   *
   * @experimental The API may change in future releases.
   */
  logger?: Logger;
}
