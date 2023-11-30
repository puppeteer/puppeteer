/**
 * Copyright 2017 Google Inc. All rights reserved.
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

import type {ChildProcess} from 'child_process';

import type {Protocol} from 'devtools-protocol';

import {
  firstValueFrom,
  from,
  merge,
  raceWith,
  filterAsync,
  fromEvent,
  type Observable,
} from '../../third_party/rxjs/rxjs.js';
import type {ProtocolType} from '../common/ConnectOptions.js';
import {EventEmitter, type EventType} from '../common/EventEmitter.js';
import {debugError} from '../common/util.js';
import {timeout} from '../common/util.js';
import {asyncDisposeSymbol, disposeSymbol} from '../util/disposable.js';

import type {BrowserContext} from './BrowserContext.js';
import type {Page} from './Page.js';
import type {Target} from './Target.js';
/**
 * @public
 */
export interface BrowserContextOptions {
  /**
   * Proxy server with optional port to use for all requests.
   * Username and password can be set in `Page.authenticate`.
   */
  proxyServer?: string;
  /**
   * Bypass the proxy for the given list of hosts.
   */
  proxyBypassList?: string[];
}

/**
 * @internal
 */
export type BrowserCloseCallback = () => Promise<void> | void;

/**
 * @public
 */
export type TargetFilterCallback = (target: Target) => boolean;

/**
 * @internal
 */
export type IsPageTargetCallback = (target: Target) => boolean;

/**
 * @internal
 */
export const WEB_PERMISSION_TO_PROTOCOL_PERMISSION = new Map<
  Permission,
  Protocol.Browser.PermissionType
>([
  ['geolocation', 'geolocation'],
  ['midi', 'midi'],
  ['notifications', 'notifications'],
  // TODO: push isn't a valid type?
  // ['push', 'push'],
  ['camera', 'videoCapture'],
  ['microphone', 'audioCapture'],
  ['background-sync', 'backgroundSync'],
  ['ambient-light-sensor', 'sensors'],
  ['accelerometer', 'sensors'],
  ['gyroscope', 'sensors'],
  ['magnetometer', 'sensors'],
  ['accessibility-events', 'accessibilityEvents'],
  ['clipboard-read', 'clipboardReadWrite'],
  ['clipboard-write', 'clipboardReadWrite'],
  ['clipboard-sanitized-write', 'clipboardSanitizedWrite'],
  ['payment-handler', 'paymentHandler'],
  ['persistent-storage', 'durableStorage'],
  ['idle-detection', 'idleDetection'],
  // chrome-specific permissions we have.
  ['midi-sysex', 'midiSysex'],
]);

/**
 * @public
 */
export type Permission =
  | 'geolocation'
  | 'midi'
  | 'notifications'
  | 'camera'
  | 'microphone'
  | 'background-sync'
  | 'ambient-light-sensor'
  | 'accelerometer'
  | 'gyroscope'
  | 'magnetometer'
  | 'accessibility-events'
  | 'clipboard-read'
  | 'clipboard-write'
  | 'clipboard-sanitized-write'
  | 'payment-handler'
  | 'persistent-storage'
  | 'idle-detection'
  | 'midi-sysex';

/**
 * @public
 */
export interface WaitForTargetOptions {
  /**
   * Maximum wait time in milliseconds. Pass `0` to disable the timeout.
   *
   * @defaultValue `30_000`
   */
  timeout?: number;
}

/**
 * All the events a {@link Browser | browser instance} may emit.
 *
 * @public
 */
export const enum BrowserEvent {
  /**
   * Emitted when Puppeteer gets disconnected from the browser instance. This
   * might happen because either:
   *
   * - The browser closes/crashes or
   * - {@link Browser.disconnect} was called.
   */
  Disconnected = 'disconnected',
  /**
   * Emitted when the URL of a target changes. Contains a {@link Target}
   * instance.
   *
   * @remarks Note that this includes target changes in incognito browser
   * contexts.
   */
  TargetChanged = 'targetchanged',
  /**
   * Emitted when a target is created, for example when a new page is opened by
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/open | window.open}
   * or by {@link Browser.newPage | browser.newPage}
   *
   * Contains a {@link Target} instance.
   *
   * @remarks Note that this includes target creations in incognito browser
   * contexts.
   */
  TargetCreated = 'targetcreated',
  /**
   * Emitted when a target is destroyed, for example when a page is closed.
   * Contains a {@link Target} instance.
   *
   * @remarks Note that this includes target destructions in incognito browser
   * contexts.
   */
  TargetDestroyed = 'targetdestroyed',
  /**
   * @internal
   */
  TargetDiscovered = 'targetdiscovered',
}

export {
  /**
   * @deprecated Use {@link BrowserEvent}.
   */
  BrowserEvent as BrowserEmittedEvents,
};

/**
 * @public
 */
export interface BrowserEvents extends Record<EventType, unknown> {
  [BrowserEvent.Disconnected]: undefined;
  [BrowserEvent.TargetCreated]: Target;
  [BrowserEvent.TargetDestroyed]: Target;
  [BrowserEvent.TargetChanged]: Target;
  /**
   * @internal
   */
  [BrowserEvent.TargetDiscovered]: Protocol.Target.TargetInfo;
}

/**
 * {@link Browser} represents a browser instance that is either:
 *
 * - connected to via {@link Puppeteer.connect} or
 * - launched by {@link PuppeteerNode.launch}.
 *
 * {@link Browser} {@link EventEmitter | emits} various events which are
 * documented in the {@link BrowserEvent} enum.
 *
 * @example Using a {@link Browser} to create a {@link Page}:
 *
 * ```ts
 * import puppeteer from 'puppeteer';
 *
 * const browser = await puppeteer.launch();
 * const page = await browser.newPage();
 * await page.goto('https://example.com');
 * await browser.close();
 * ```
 *
 * @example Disconnecting from and reconnecting to a {@link Browser}:
 *
 * ```ts
 * import puppeteer from 'puppeteer';
 *
 * const browser = await puppeteer.launch();
 * // Store the endpoint to be able to reconnect to the browser.
 * const browserWSEndpoint = browser.wsEndpoint();
 * // Disconnect puppeteer from the browser.
 * await browser.disconnect();
 *
 * // Use the endpoint to reestablish a connection
 * const browser2 = await puppeteer.connect({browserWSEndpoint});
 * // Close the browser.
 * await browser2.close();
 * ```
 *
 * @public
 */
export abstract class Browser extends EventEmitter<BrowserEvents> {
  /**
   * @internal
   */
  constructor() {
    super();
  }

  /**
   * Gets the associated
   * {@link https://nodejs.org/api/child_process.html#class-childprocess | ChildProcess}.
   *
   * @returns `null` if this instance was connected to via
   * {@link Puppeteer.connect}.
   */
  abstract process(): ChildProcess | null;

  /**
   * Creates a new incognito {@link BrowserContext | browser context}.
   *
   * This won't share cookies/cache with other {@link BrowserContext | browser contexts}.
   *
   * @example
   *
   * ```ts
   * import puppeteer from 'puppeteer';
   *
   * const browser = await puppeteer.launch();
   * // Create a new incognito browser context.
   * const context = await browser.createIncognitoBrowserContext();
   * // Create a new page in a pristine context.
   * const page = await context.newPage();
   * // Do stuff
   * await page.goto('https://example.com');
   * ```
   */
  abstract createIncognitoBrowserContext(
    options?: BrowserContextOptions
  ): Promise<BrowserContext>;

  /**
   * Gets a list of open {@link BrowserContext | browser contexts}.
   *
   * In a newly-created {@link Browser | browser}, this will return a single
   * instance of {@link BrowserContext}.
   */
  abstract browserContexts(): BrowserContext[];

  /**
   * Gets the default {@link BrowserContext | browser context}.
   *
   * @remarks The default {@link BrowserContext | browser context} cannot be
   * closed.
   */
  abstract defaultBrowserContext(): BrowserContext;

  /**
   * Gets the WebSocket URL to connect to this {@link Browser | browser}.
   *
   * This is usually used with {@link Puppeteer.connect}.
   *
   * You can find the debugger URL (`webSocketDebuggerUrl`) from
   * `http://HOST:PORT/json/version`.
   *
   * See {@link
   * https://chromedevtools.github.io/devtools-protocol/#how-do-i-access-the-browser-target
   * | browser endpoint} for more information.
   *
   * @remarks The format is always `ws://HOST:PORT/devtools/browser/<id>`.
   */
  abstract wsEndpoint(): string;

  /**
   * Creates a new {@link Page | page} in the
   * {@link Browser.defaultBrowserContext | default browser context}.
   */
  abstract newPage(): Promise<Page>;

  /**
   * Gets all active {@link Target | targets}.
   *
   * In case of multiple {@link BrowserContext | browser contexts}, this returns
   * all {@link Target | targets} in all
   * {@link BrowserContext | browser contexts}.
   */
  abstract targets(): Target[];

  /**
   * Gets the {@link Target | target} associated with the
   * {@link Browser.defaultBrowserContext | default browser context}).
   */
  abstract target(): Target;

  /**
   * Waits until a {@link Target | target} matching the given `predicate`
   * appears and returns it.
   *
   * This will look all open {@link BrowserContext | browser contexts}.
   *
   * @example Finding a target for a page opened via `window.open`:
   *
   * ```ts
   * await page.evaluate(() => window.open('https://www.example.com/'));
   * const newWindowTarget = await browser.waitForTarget(
   *   target => target.url() === 'https://www.example.com/'
   * );
   * ```
   */
  async waitForTarget(
    predicate: (x: Target) => boolean | Promise<boolean>,
    options: WaitForTargetOptions = {}
  ): Promise<Target> {
    const {timeout: ms = 30000} = options;
    return await firstValueFrom(
      merge(
        fromEvent(this, BrowserEvent.TargetCreated) as Observable<Target>,
        fromEvent(this, BrowserEvent.TargetChanged) as Observable<Target>,
        from(this.targets())
      ).pipe(filterAsync(predicate), raceWith(timeout(ms)))
    );
  }

  /**
   * Gets a list of all open {@link Page | pages} inside this {@link Browser}.
   *
   * If there ar multiple {@link BrowserContext | browser contexts}, this
   * returns all {@link Page | pages} in all
   * {@link BrowserContext | browser contexts}.
   *
   * @remarks Non-visible {@link Page | pages}, such as `"background_page"`,
   * will not be listed here. You can find them using {@link Target.page}.
   */
  async pages(): Promise<Page[]> {
    const contextPages = await Promise.all(
      this.browserContexts().map(context => {
        return context.pages();
      })
    );
    // Flatten array.
    return contextPages.reduce((acc, x) => {
      return acc.concat(x);
    }, []);
  }

  /**
   * Gets a string representing this {@link Browser | browser's} name and
   * version.
   *
   * For headless browser, this is similar to `"HeadlessChrome/61.0.3153.0"`. For
   * non-headless or new-headless, this is similar to `"Chrome/61.0.3153.0"`. For
   * Firefox, it is similar to `"Firefox/116.0a1"`.
   *
   * The format of {@link Browser.version} might change with future releases of
   * browsers.
   */
  abstract version(): Promise<string>;

  /**
   * Gets this {@link Browser | browser's} original user agent.
   *
   * {@link Page | Pages} can override the user agent with
   * {@link Page.setUserAgent}.
   *
   */
  abstract userAgent(): Promise<string>;

  /**
   * Closes this {@link Browser | browser} and all associated
   * {@link Page | pages}.
   */
  abstract close(): Promise<void>;

  /**
   * Disconnects Puppeteer from this {@link Browser | browser}, but leaves the
   * process running.
   */
  abstract disconnect(): Promise<void>;

  /**
   * Whether Puppeteer is connected to this {@link Browser | browser}.
   *
   * @deprecated Use {@link Browser.connected}.
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Whether Puppeteer is connected to this {@link Browser | browser}.
   */
  abstract get connected(): boolean;

  /** @internal */
  [disposeSymbol](): void {
    return void this.close().catch(debugError);
  }

  /** @internal */
  [asyncDisposeSymbol](): Promise<void> {
    return this.close();
  }

  /**
   * @internal
   */
  abstract get protocol(): ProtocolType;
}
