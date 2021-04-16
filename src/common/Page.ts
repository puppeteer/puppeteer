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

import { EventEmitter } from './EventEmitter.js';
import {
  Connection,
  CDPSession,
  CDPSessionEmittedEvents,
} from './Connection.js';
import { Dialog } from './Dialog.js';
import { EmulationManager } from './EmulationManager.js';
import {
  Frame,
  FrameManager,
  FrameManagerEmittedEvents,
} from './FrameManager.js';
import { Keyboard, Mouse, Touchscreen, MouseButton } from './Input.js';
import { Tracing } from './Tracing.js';
import { assert } from './assert.js';
import { helper, debugError } from './helper.js';
import { Coverage } from './Coverage.js';
import { WebWorker } from './WebWorker.js';
import { Browser, BrowserContext } from './Browser.js';
import { Target } from './Target.js';
import { createJSHandle, JSHandle, ElementHandle } from './JSHandle.js';
import { Viewport } from './PuppeteerViewport.js';
import {
  Credentials,
  NetworkConditions,
  NetworkManagerEmittedEvents,
} from './NetworkManager.js';
import { HTTPRequest } from './HTTPRequest.js';
import { HTTPResponse } from './HTTPResponse.js';
import { Accessibility } from './Accessibility.js';
import { TimeoutSettings } from './TimeoutSettings.js';
import { FileChooser } from './FileChooser.js';
import { ConsoleMessage, ConsoleMessageType } from './ConsoleMessage.js';
import { PuppeteerLifeCycleEvent } from './LifecycleWatcher.js';
import { Protocol } from 'devtools-protocol';
import {
  SerializableOrJSHandle,
  EvaluateHandleFn,
  WrapElementHandle,
  EvaluateFn,
  EvaluateFnReturnType,
  UnwrapPromiseLike,
} from './EvalTypes.js';
import { PDFOptions, paperFormats } from './PDFOptions.js';
import { isNode } from '../environment.js';

/**
 * @public
 */
export interface Metrics {
  Timestamp?: number;
  Documents?: number;
  Frames?: number;
  JSEventListeners?: number;
  Nodes?: number;
  LayoutCount?: number;
  RecalcStyleCount?: number;
  LayoutDuration?: number;
  RecalcStyleDuration?: number;
  ScriptDuration?: number;
  TaskDuration?: number;
  JSHeapUsedSize?: number;
  JSHeapTotalSize?: number;
}

/**
 * @public
 */
export interface WaitTimeoutOptions {
  /**
   * Maximum wait time in milliseconds, defaults to 30 seconds, pass `0` to
   * disable the timeout.
   *
   * @remarks
   * The default value can be changed by using the
   * {@link Page.setDefaultTimeout} method.
   */
  timeout?: number;
}

/**
 * @public
 */
export interface WaitForOptions {
  /**
   * Maximum wait time in milliseconds, defaults to 30 seconds, pass `0` to
   * disable the timeout.
   *
   * @remarks
   * The default value can be changed by using the
   * {@link Page.setDefaultTimeout} or {@link Page.setDefaultNavigationTimeout}
   * methods.
   */
  timeout?: number;
  waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
}

/**
 * @public
 */
export interface GeolocationOptions {
  /**
   * Latitude between -90 and 90.
   */
  longitude: number;
  /**
   * Longitude between -180 and 180.
   */
  latitude: number;
  /**
   * Optional non-negative accuracy value.
   */
  accuracy?: number;
}

/**
 * @public
 */
export interface MediaFeature {
  name: string;
  value: string;
}

/**
 * @public
 */
export interface ScreenshotClip {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * @public
 */
export interface ScreenshotOptions {
  /**
   * @defaultValue 'png'
   */
  type?: 'png' | 'jpeg';
  /**
   * The file path to save the image to. The screenshot type will be inferred
   * from file extension. If path is a relative path, then it is resolved
   * relative to current working directory. If no path is provided, the image
   * won't be saved to the disk.
   */
  path?: string;
  /**
   * When true, takes a screenshot of the full page.
   * @defaultValue false
   */
  fullPage?: boolean;
  /**
   * An object which specifies the clipping region of the page.
   */
  clip?: ScreenshotClip;
  /**
   * Quality of the image, between 0-100. Not applicable to `png` images.
   */
  quality?: number;
  /**
   * Hides default white background and allows capturing screenshots with transparency.
   * @defaultValue false
   */
  omitBackground?: boolean;
  /**
   * Encoding of the image.
   * @defaultValue 'binary'
   */
  encoding?: 'base64' | 'binary';
  /**
   * If you need a screenshot bigger than the Viewport
   * @defaultValue true
   */
  captureBeyondViewport?: boolean;
}

/**
 * All the events that a page instance may emit.
 *
 * @public
 */
export const enum PageEmittedEvents {
  /** Emitted when the page closes. */
  Close = 'close',
  /**
   * Emitted when JavaScript within the page calls one of console API methods,
   * e.g. `console.log` or `console.dir`. Also emitted if the page throws an
   * error or a warning.
   *
   * @remarks
   *
   * A `console` event provides a {@link ConsoleMessage} representing the
   * console message that was logged.
   *
   * @example
   * An example of handling `console` event:
   * ```js
   * page.on('console', msg => {
   *   for (let i = 0; i < msg.args().length; ++i)
   *    console.log(`${i}: ${msg.args()[i]}`);
   *  });
   *  page.evaluate(() => console.log('hello', 5, {foo: 'bar'}));
   * ```
   */
  Console = 'console',
  /**
   * Emitted when a JavaScript dialog appears, such as `alert`, `prompt`,
   * `confirm` or `beforeunload`. Puppeteer can respond to the dialog via
   * {@link Dialog.accept} or {@link Dialog.dismiss}.
   */
  Dialog = 'dialog',
  /**
   * Emitted when the JavaScript
   * {@link https://developer.mozilla.org/en-US/docs/Web/Events/DOMContentLoaded | DOMContentLoaded } event is dispatched.
   */
  DOMContentLoaded = 'domcontentloaded',
  /**
   * Emitted when the page crashes. Will contain an `Error`.
   */
  Error = 'error',
  /** Emitted when a frame is attached. Will contain a {@link Frame}. */
  FrameAttached = 'frameattached',
  /** Emitted when a frame is detached. Will contain a {@link Frame}. */
  FrameDetached = 'framedetached',
  /** Emitted when a frame is navigated to a new URL. Will contain a {@link Frame}. */
  FrameNavigated = 'framenavigated',
  /**
   * Emitted when the JavaScript
   * {@link https://developer.mozilla.org/en-US/docs/Web/Events/load | load}
   * event is dispatched.
   */
  Load = 'load',
  /**
   * Emitted when the JavaScript code makes a call to `console.timeStamp`. For
   * the list of metrics see {@link Page.metrics | page.metrics}.
   *
   * @remarks
   * Contains an object with two properties:
   * - `title`: the title passed to `console.timeStamp`
   * - `metrics`: objec containing metrics as key/value pairs. The values will
   *   be `number`s.
   */
  Metrics = 'metrics',
  /**
   * Emitted when an uncaught exception happens within the page.
   * Contains an `Error`.
   */
  PageError = 'pageerror',
  /**
   * Emitted when the page opens a new tab or window.
   *
   * Contains a {@link Page} corresponding to the popup window.
   *
   * @example
   *
   * ```js
   * const [popup] = await Promise.all([
   *   new Promise(resolve => page.once('popup', resolve)),
   *   page.click('a[target=_blank]'),
   * ]);
   * ```
   *
   * ```js
   * const [popup] = await Promise.all([
   *   new Promise(resolve => page.once('popup', resolve)),
   *   page.evaluate(() => window.open('https://example.com')),
   * ]);
   * ```
   */
  Popup = 'popup',
  /**
   * Emitted when a page issues a request and contains a {@link HTTPRequest}.
   *
   * @remarks
   * The object is readonly. See {@link Page.setRequestInterception} for intercepting
   * and mutating requests.
   */
  Request = 'request',
  /**
   * Emitted when a request ended up loading from cache. Contains a {@link HTTPRequest}.
   *
   * @remarks
   * For certain requests, might contain undefined.
   * {@link https://crbug.com/750469}
   */
  RequestServedFromCache = 'requestservedfromcache',
  /**
   * Emitted when a request fails, for example by timing out.
   *
   * Contains a {@link HTTPRequest}.
   *
   * @remarks
   *
   * NOTE: HTTP Error responses, such as 404 or 503, are still successful
   * responses from HTTP standpoint, so request will complete with
   * `requestfinished` event and not with `requestfailed`.
   */
  RequestFailed = 'requestfailed',
  /**
   * Emitted when a request finishes successfully. Contains a {@link HTTPRequest}.
   */
  RequestFinished = 'requestfinished',
  /**
   * Emitted when a response is received. Contains a {@link HTTPResponse}.
   */
  Response = 'response',
  /**
   * Emitted when a dedicated
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API | WebWorker}
   * is spawned by the page.
   */
  WorkerCreated = 'workercreated',
  /**
   * Emitted when a dedicated
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API | WebWorker}
   * is destroyed by the page.
   */
  WorkerDestroyed = 'workerdestroyed',
}

/**
 * Denotes the objects received by callback functions for page events.
 *
 * See {@link PageEmittedEvents} for more detail on the events and when they are
 * emitted.
 * @public
 */
export interface PageEventObject {
  close: never;
  console: ConsoleMessage;
  dialog: Dialog;
  domcontentloaded: never;
  error: Error;
  frameattached: Frame;
  framedetached: Frame;
  framenavigated: Frame;
  load: never;
  metrics: { title: string; metrics: Metrics };
  pageerror: Error;
  popup: Page;
  request: HTTPRequest;
  response: HTTPResponse;
  requestfailed: HTTPRequest;
  requestfinished: HTTPRequest;
  requestservedfromcache: HTTPRequest;
  workercreated: WebWorker;
  workerdestroyed: WebWorker;
}

class ScreenshotTaskQueue {
  _chain: Promise<Buffer | string | void>;

  constructor() {
    this._chain = Promise.resolve<Buffer | string | void>(undefined);
  }

  public postTask(
    task: () => Promise<Buffer | string>
  ): Promise<Buffer | string | void> {
    const result = this._chain.then(task);
    this._chain = result.catch(() => {});
    return result;
  }
}

/**
 * Page provides methods to interact with a single tab or
 * {@link https://developer.chrome.com/extensions/background_pages | extension background page} in Chromium.
 *
 * @remarks
 *
 * One Browser instance might have multiple Page instances.
 *
 * @example
 * This example creates a page, navigates it to a URL, and then * saves a screenshot:
 * ```js
 * const puppeteer = require('puppeteer');
 *
 * (async () => {
 *   const browser = await puppeteer.launch();
 *   const page = await browser.newPage();
 *   await page.goto('https://example.com');
 *   await page.screenshot({path: 'screenshot.png'});
 *   await browser.close();
 * })();
 * ```
 *
 * The Page class extends from Puppeteer's {@link EventEmitter} class and will
 * emit various events which are documented in the {@link PageEmittedEvents} enum.
 *
 * @example
 * This example logs a message for a single page `load` event:
 * ```js
 * page.once('load', () => console.log('Page loaded!'));
 * ```
 *
 * To unsubscribe from events use the `off` method:
 *
 * ```js
 * function logRequest(interceptedRequest) {
 *   console.log('A request was made:', interceptedRequest.url());
 * }
 * page.on('request', logRequest);
 * // Sometime later...
 * page.off('request', logRequest);
 * ```
 * @public
 */
export class Page extends EventEmitter {
  /**
   * @internal
   */
  static async create(
    client: CDPSession,
    target: Target,
    ignoreHTTPSErrors: boolean,
    defaultViewport: Viewport | null
  ): Promise<Page> {
    const page = new Page(client, target, ignoreHTTPSErrors);
    await page._initialize();
    if (defaultViewport) await page.setViewport(defaultViewport);
    return page;
  }

  private _closed = false;
  private _client: CDPSession;
  private _target: Target;
  private _keyboard: Keyboard;
  private _mouse: Mouse;
  private _timeoutSettings = new TimeoutSettings();
  private _touchscreen: Touchscreen;
  private _accessibility: Accessibility;
  private _frameManager: FrameManager;
  private _emulationManager: EmulationManager;
  private _tracing: Tracing;
  private _pageBindings = new Map<string, Function>();
  private _coverage: Coverage;
  private _javascriptEnabled = true;
  private _viewport: Viewport | null;
  private _screenshotTaskQueue: ScreenshotTaskQueue;
  private _workers = new Map<string, WebWorker>();
  // TODO: improve this typedef - it's a function that takes a file chooser or
  // something?
  private _fileChooserInterceptors = new Set<Function>();

  private _disconnectPromise?: Promise<Error>;

  /**
   * @internal
   */
  constructor(client: CDPSession, target: Target, ignoreHTTPSErrors: boolean) {
    super();
    this._client = client;
    this._target = target;
    this._keyboard = new Keyboard(client);
    this._mouse = new Mouse(client, this._keyboard);
    this._touchscreen = new Touchscreen(client, this._keyboard);
    this._accessibility = new Accessibility(client);
    this._frameManager = new FrameManager(
      client,
      this,
      ignoreHTTPSErrors,
      this._timeoutSettings
    );
    this._emulationManager = new EmulationManager(client);
    this._tracing = new Tracing(client);
    this._coverage = new Coverage(client);
    this._screenshotTaskQueue = new ScreenshotTaskQueue();
    this._viewport = null;

    client.on('Target.attachedToTarget', (event) => {
      if (event.targetInfo.type !== 'worker') {
        // If we don't detach from service workers, they will never die.
        client
          .send('Target.detachFromTarget', {
            sessionId: event.sessionId,
          })
          .catch(debugError);
        return;
      }
      const session = Connection.fromSession(client).session(event.sessionId);
      const worker = new WebWorker(
        session,
        event.targetInfo.url,
        this._addConsoleMessage.bind(this),
        this._handleException.bind(this)
      );
      this._workers.set(event.sessionId, worker);
      this.emit(PageEmittedEvents.WorkerCreated, worker);
    });
    client.on('Target.detachedFromTarget', (event) => {
      const worker = this._workers.get(event.sessionId);
      if (!worker) return;
      this._workers.delete(event.sessionId);
      this.emit(PageEmittedEvents.WorkerDestroyed, worker);
    });

    this._frameManager.on(FrameManagerEmittedEvents.FrameAttached, (event) =>
      this.emit(PageEmittedEvents.FrameAttached, event)
    );
    this._frameManager.on(FrameManagerEmittedEvents.FrameDetached, (event) =>
      this.emit(PageEmittedEvents.FrameDetached, event)
    );
    this._frameManager.on(FrameManagerEmittedEvents.FrameNavigated, (event) =>
      this.emit(PageEmittedEvents.FrameNavigated, event)
    );

    const networkManager = this._frameManager.networkManager();
    networkManager.on(NetworkManagerEmittedEvents.Request, (event) =>
      this.emit(PageEmittedEvents.Request, event)
    );
    networkManager.on(
      NetworkManagerEmittedEvents.RequestServedFromCache,
      (event) => this.emit(PageEmittedEvents.RequestServedFromCache, event)
    );
    networkManager.on(NetworkManagerEmittedEvents.Response, (event) =>
      this.emit(PageEmittedEvents.Response, event)
    );
    networkManager.on(NetworkManagerEmittedEvents.RequestFailed, (event) =>
      this.emit(PageEmittedEvents.RequestFailed, event)
    );
    networkManager.on(NetworkManagerEmittedEvents.RequestFinished, (event) =>
      this.emit(PageEmittedEvents.RequestFinished, event)
    );
    this._fileChooserInterceptors = new Set();

    client.on('Page.domContentEventFired', () =>
      this.emit(PageEmittedEvents.DOMContentLoaded)
    );
    client.on('Page.loadEventFired', () => this.emit(PageEmittedEvents.Load));
    client.on('Runtime.consoleAPICalled', (event) => this._onConsoleAPI(event));
    client.on('Runtime.bindingCalled', (event) => this._onBindingCalled(event));
    client.on('Page.javascriptDialogOpening', (event) => this._onDialog(event));
    client.on('Runtime.exceptionThrown', (exception) =>
      this._handleException(exception.exceptionDetails)
    );
    client.on('Inspector.targetCrashed', () => this._onTargetCrashed());
    client.on('Performance.metrics', (event) => this._emitMetrics(event));
    client.on('Log.entryAdded', (event) => this._onLogEntryAdded(event));
    client.on('Page.fileChooserOpened', (event) => this._onFileChooser(event));
    this._target._isClosedPromise.then(() => {
      this.emit(PageEmittedEvents.Close);
      this._closed = true;
    });
  }

  private async _initialize(): Promise<void> {
    await Promise.all([
      this._frameManager.initialize(),
      this._client.send('Target.setAutoAttach', {
        autoAttach: true,
        waitForDebuggerOnStart: false,
        flatten: true,
      }),
      this._client.send('Performance.enable'),
      this._client.send('Log.enable'),
    ]);
  }

  private async _onFileChooser(
    event: Protocol.Page.FileChooserOpenedEvent
  ): Promise<void> {
    if (!this._fileChooserInterceptors.size) return;
    const frame = this._frameManager.frame(event.frameId);
    const context = await frame.executionContext();
    const element = await context._adoptBackendNodeId(event.backendNodeId);
    const interceptors = Array.from(this._fileChooserInterceptors);
    this._fileChooserInterceptors.clear();
    const fileChooser = new FileChooser(element, event);
    for (const interceptor of interceptors) interceptor.call(null, fileChooser);
  }

  /**
   * @returns `true` if the page has JavaScript enabled, `false` otherwise.
   */
  public isJavaScriptEnabled(): boolean {
    return this._javascriptEnabled;
  }

  /**
   * Listen to page events.
   */
  public on<K extends keyof PageEventObject>(
    eventName: K,
    handler: (event: PageEventObject[K]) => void
  ): EventEmitter {
    // Note: this method only exists to define the types; we delegate the impl
    // to EventEmitter.
    return super.on(eventName, handler);
  }

  public once<K extends keyof PageEventObject>(
    eventName: K,
    handler: (event: PageEventObject[K]) => void
  ): EventEmitter {
    // Note: this method only exists to define the types; we delegate the impl
    // to EventEmitter.
    return super.once(eventName, handler);
  }

  /**
   * @param options - Optional waiting parameters
   * @returns Resolves after a page requests a file picker.
   */
  async waitForFileChooser(
    options: WaitTimeoutOptions = {}
  ): Promise<FileChooser> {
    if (!this._fileChooserInterceptors.size)
      await this._client.send('Page.setInterceptFileChooserDialog', {
        enabled: true,
      });

    const { timeout = this._timeoutSettings.timeout() } = options;
    let callback;
    const promise = new Promise<FileChooser>((x) => (callback = x));
    this._fileChooserInterceptors.add(callback);
    return helper
      .waitWithTimeout<FileChooser>(
        promise,
        'waiting for file chooser',
        timeout
      )
      .catch((error) => {
        this._fileChooserInterceptors.delete(callback);
        throw error;
      });
  }

  /**
   * Sets the page's geolocation.
   *
   * @remarks
   * Consider using {@link BrowserContext.overridePermissions} to grant
   * permissions for the page to read its geolocation.
   *
   * @example
   * ```js
   * await page.setGeolocation({latitude: 59.95, longitude: 30.31667});
   * ```
   */
  async setGeolocation(options: GeolocationOptions): Promise<void> {
    const { longitude, latitude, accuracy = 0 } = options;
    if (longitude < -180 || longitude > 180)
      throw new Error(
        `Invalid longitude "${longitude}": precondition -180 <= LONGITUDE <= 180 failed.`
      );
    if (latitude < -90 || latitude > 90)
      throw new Error(
        `Invalid latitude "${latitude}": precondition -90 <= LATITUDE <= 90 failed.`
      );
    if (accuracy < 0)
      throw new Error(
        `Invalid accuracy "${accuracy}": precondition 0 <= ACCURACY failed.`
      );
    await this._client.send('Emulation.setGeolocationOverride', {
      longitude,
      latitude,
      accuracy,
    });
  }

  /**
   * @returns A target this page was created from.
   */
  target(): Target {
    return this._target;
  }

  /**
   * @returns The browser this page belongs to.
   */
  browser(): Browser {
    return this._target.browser();
  }

  /**
   * @returns The browser context that the page belongs to
   */
  browserContext(): BrowserContext {
    return this._target.browserContext();
  }

  private _onTargetCrashed(): void {
    this.emit('error', new Error('Page crashed!'));
  }

  private _onLogEntryAdded(event: Protocol.Log.EntryAddedEvent): void {
    const { level, text, args, source, url, lineNumber } = event.entry;
    if (args) args.map((arg) => helper.releaseObject(this._client, arg));
    if (source !== 'worker')
      this.emit(
        PageEmittedEvents.Console,
        new ConsoleMessage(level, text, [], [{ url, lineNumber }])
      );
  }

  /**
   * @returns The page's main frame.
   */
  mainFrame(): Frame {
    return this._frameManager.mainFrame();
  }

  get keyboard(): Keyboard {
    return this._keyboard;
  }

  get touchscreen(): Touchscreen {
    return this._touchscreen;
  }

  get coverage(): Coverage {
    return this._coverage;
  }

  get tracing(): Tracing {
    return this._tracing;
  }

  get accessibility(): Accessibility {
    return this._accessibility;
  }

  /**
   * @returns An array of all frames attached to the page.
   */
  frames(): Frame[] {
    return this._frameManager.frames();
  }

  /**
   * @returns all of the dedicated
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API | WebWorkers}
   * associated with the page.
   */
  workers(): WebWorker[] {
    return Array.from(this._workers.values());
  }

  /**
   * @param value - Whether to enable request interception.
   * @param cacheSafe - Whether to trust browser caching. If set to false,
   * enabling request interception disables page caching. Defaults to false.
   *
   * @remarks
   * Activating request interception enables {@link HTTPRequest.abort},
   * {@link HTTPRequest.continue} and {@link HTTPRequest.respond} methods.  This
   * provides the capability to modify network requests that are made by a page.
   *
   * Once request interception is enabled, every request will stall unless it's
   * continued, responded or aborted; or completed using the browser cache.
   *
   * @example
   * An example of a naïve request interceptor that aborts all image requests:
   * ```js
   * const puppeteer = require('puppeteer');
   * (async () => {
   *   const browser = await puppeteer.launch();
   *   const page = await browser.newPage();
   *   await page.setRequestInterception(true);
   *   page.on('request', interceptedRequest => {
   *     if (interceptedRequest.url().endsWith('.png') ||
   *         interceptedRequest.url().endsWith('.jpg'))
   *       interceptedRequest.abort();
   *     else
   *       interceptedRequest.continue();
   *     });
   *   await page.goto('https://example.com');
   *   await browser.close();
   * })();
   * ```
   */
  async setRequestInterception(
    value: boolean,
    cacheSafe = false
  ): Promise<void> {
    return this._frameManager
      .networkManager()
      .setRequestInterception(value, cacheSafe);
  }

  /**
   * @param enabled - When `true`, enables offline mode for the page.
   */
  setOfflineMode(enabled: boolean): Promise<void> {
    return this._frameManager.networkManager().setOfflineMode(enabled);
  }

  emulateNetworkConditions(
    networkConditions: NetworkConditions | null
  ): Promise<void> {
    return this._frameManager
      .networkManager()
      .emulateNetworkConditions(networkConditions);
  }

  /**
   * @param timeout - Maximum navigation time in milliseconds.
   */
  setDefaultNavigationTimeout(timeout: number): void {
    this._timeoutSettings.setDefaultNavigationTimeout(timeout);
  }

  /**
   * @param timeout - Maximum time in milliseconds.
   */
  setDefaultTimeout(timeout: number): void {
    this._timeoutSettings.setDefaultTimeout(timeout);
  }

  /**
   * Runs `document.querySelector` within the page. If no element matches the
   * selector, the return value resolves to `null`.
   *
   * @remarks
   * Shortcut for {@link Frame.$ | Page.mainFrame().$(selector) }.
   *
   * @param selector - A
   * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors | selector}
   * to query page for.
   */
  async $<T extends Element = Element>(
    selector: string
  ): Promise<ElementHandle<T> | null> {
    return this.mainFrame().$<T>(selector);
  }

  /**
   * @remarks
   *
   * The only difference between {@link Page.evaluate | page.evaluate} and
   * `page.evaluateHandle` is that `evaluateHandle` will return the value
   * wrapped in an in-page object.
   *
   * If the function passed to `page.evaluteHandle` returns a Promise, the
   * function will wait for the promise to resolve and return its value.
   *
   * You can pass a string instead of a function (although functions are
   * recommended as they are easier to debug and use with TypeScript):
   *
   * @example
   * ```
   * const aHandle = await page.evaluateHandle('document')
   * ```
   *
   * @example
   * {@link JSHandle} instances can be passed as arguments to the `pageFunction`:
   * ```
   * const aHandle = await page.evaluateHandle(() => document.body);
   * const resultHandle = await page.evaluateHandle(body => body.innerHTML, aHandle);
   * console.log(await resultHandle.jsonValue());
   * await resultHandle.dispose();
   * ```
   *
   * Most of the time this function returns a {@link JSHandle},
   * but if `pageFunction` returns a reference to an element,
   * you instead get an {@link ElementHandle} back:
   *
   * @example
   * ```
   * const button = await page.evaluateHandle(() => document.querySelector('button'));
   * // can call `click` because `button` is an `ElementHandle`
   * await button.click();
   * ```
   *
   * The TypeScript definitions assume that `evaluateHandle` returns
   *  a `JSHandle`, but if you know it's going to return an
   * `ElementHandle`, pass it as the generic argument:
   *
   * ```
   * const button = await page.evaluateHandle<ElementHandle>(...);
   * ```
   *
   * @param pageFunction - a function that is run within the page
   * @param args - arguments to be passed to the pageFunction
   */
  async evaluateHandle<HandlerType extends JSHandle = JSHandle>(
    pageFunction: EvaluateHandleFn,
    ...args: SerializableOrJSHandle[]
  ): Promise<HandlerType> {
    const context = await this.mainFrame().executionContext();
    return context.evaluateHandle<HandlerType>(pageFunction, ...args);
  }

  /**
   * This method iterates the JavaScript heap and finds all objects with the
   * given prototype.
   *
   * @remarks
   *
   * @example
   *
   * ```js
   * // Create a Map object
   * await page.evaluate(() => window.map = new Map());
   * // Get a handle to the Map object prototype
   * const mapPrototype = await page.evaluateHandle(() => Map.prototype);
   * // Query all map instances into an array
   * const mapInstances = await page.queryObjects(mapPrototype);
   * // Count amount of map objects in heap
   * const count = await page.evaluate(maps => maps.length, mapInstances);
   * await mapInstances.dispose();
   * await mapPrototype.dispose();
   * ```
   * @param prototypeHandle - a handle to the object prototype.
   */
  async queryObjects(prototypeHandle: JSHandle): Promise<JSHandle> {
    const context = await this.mainFrame().executionContext();
    return context.queryObjects(prototypeHandle);
  }

  /**
   * This method runs `document.querySelector` within the page and passes the
   * result as the first argument to the `pageFunction`.
   *
   * @remarks
   *
   * If no element is found matching `selector`, the method will throw an error.
   *
   * If `pageFunction` returns a promise `$eval` will wait for the promise to
   * resolve and then return its value.
   *
   * @example
   *
   * ```
   * const searchValue = await page.$eval('#search', el => el.value);
   * const preloadHref = await page.$eval('link[rel=preload]', el => el.href);
   * const html = await page.$eval('.main-container', el => el.outerHTML);
   * ```
   *
   * If you are using TypeScript, you may have to provide an explicit type to the
   * first argument of the `pageFunction`.
   * By default it is typed as `Element`, but you may need to provide a more
   * specific sub-type:
   *
   * @example
   *
   * ```
   * // if you don't provide HTMLInputElement here, TS will error
   * // as `value` is not on `Element`
   * const searchValue = await page.$eval('#search', (el: HTMLInputElement) => el.value);
   * ```
   *
   * The compiler should be able to infer the return type
   * from the `pageFunction` you provide. If it is unable to, you can use the generic
   * type to tell the compiler what return type you expect from `$eval`:
   *
   * @example
   *
   * ```
   * // The compiler can infer the return type in this case, but if it can't
   * // or if you want to be more explicit, provide it as the generic type.
   * const searchValue = await page.$eval<string>(
   *  '#search', (el: HTMLInputElement) => el.value
   * );
   * ```
   *
   * @param selector - the
   * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors | selector}
   * to query for
   * @param pageFunction - the function to be evaluated in the page context.
   * Will be passed the result of `document.querySelector(selector)` as its
   * first argument.
   * @param args - any additional arguments to pass through to `pageFunction`.
   *
   * @returns The result of calling `pageFunction`. If it returns an element it
   * is wrapped in an {@link ElementHandle}, else the raw value itself is
   * returned.
   */
  async $eval<ReturnType>(
    selector: string,
    pageFunction: (
      element: Element,
      /* Unfortunately this has to be unknown[] because it's hard to get
       * TypeScript to understand that the arguments will be left alone unless
       * they are an ElementHandle, in which case they will be unwrapped.
       * The nice thing about unknown vs any is that unknown will force the user
       * to type the item before using it to avoid errors.
       *
       * TODO(@jackfranklin): We could fix this by using overloads like
       * DefinitelyTyped does:
       * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/puppeteer/index.d.ts#L114
       */
      ...args: unknown[]
    ) => ReturnType | Promise<ReturnType>,
    ...args: SerializableOrJSHandle[]
  ): Promise<WrapElementHandle<ReturnType>> {
    return this.mainFrame().$eval<ReturnType>(selector, pageFunction, ...args);
  }

  /**
   * This method runs `Array.from(document.querySelectorAll(selector))` within
   * the page and passes the result as the first argument to the `pageFunction`.
   *
   * @remarks
   *
   * If `pageFunction` returns a promise `$$eval` will wait for the promise to
   * resolve and then return its value.
   *
   * @example
   *
   * ```
   * // get the amount of divs on the page
   * const divCount = await page.$$eval('div', divs => divs.length);
   *
   * // get the text content of all the `.options` elements:
   * const options = await page.$$eval('div > span.options', options => {
   *   return options.map(option => option.textContent)
   * });
   * ```
   *
   * If you are using TypeScript, you may have to provide an explicit type to the
   * first argument of the `pageFunction`.
   * By default it is typed as `Element[]`, but you may need to provide a more
   * specific sub-type:
   *
   * @example
   *
   * ```
   * // if you don't provide HTMLInputElement here, TS will error
   * // as `value` is not on `Element`
   * await page.$$eval('input', (elements: HTMLInputElement[]) => {
   *   return elements.map(e => e.value);
   * });
   * ```
   *
   * The compiler should be able to infer the return type
   * from the `pageFunction` you provide. If it is unable to, you can use the generic
   * type to tell the compiler what return type you expect from `$$eval`:
   *
   * @example
   *
   * ```
   * // The compiler can infer the return type in this case, but if it can't
   * // or if you want to be more explicit, provide it as the generic type.
   * const allInputValues = await page.$$eval<string[]>(
   *  'input', (elements: HTMLInputElement[]) => elements.map(e => e.textContent)
   * );
   * ```
   *
   * @param selector - the
   * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors | selector}
   * to query for
   * @param pageFunction - the function to be evaluated in the page context. Will
   * be passed the result of `Array.from(document.querySelectorAll(selector))`
   * as its first argument.
   * @param args - any additional arguments to pass through to `pageFunction`.
   *
   * @returns The result of calling `pageFunction`. If it returns an element it
   * is wrapped in an {@link ElementHandle}, else the raw value itself is
   * returned.
   */
  async $$eval<ReturnType>(
    selector: string,
    pageFunction: (
      elements: Element[],
      /* These have to be typed as unknown[] for the same reason as the $eval
       * definition above, please see that comment for more details and the TODO
       * that will improve things.
       */
      ...args: unknown[]
    ) => ReturnType | Promise<ReturnType>,
    ...args: SerializableOrJSHandle[]
  ): Promise<WrapElementHandle<ReturnType>> {
    return this.mainFrame().$$eval<ReturnType>(selector, pageFunction, ...args);
  }

  async $$<T extends Element = Element>(
    selector: string
  ): Promise<Array<ElementHandle<T>>> {
    return this.mainFrame().$$<T>(selector);
  }

  async $x(expression: string): Promise<ElementHandle[]> {
    return this.mainFrame().$x(expression);
  }

  /**
   * If no URLs are specified, this method returns cookies for the current page
   * URL. If URLs are specified, only cookies for those URLs are returned.
   */
  async cookies(...urls: string[]): Promise<Protocol.Network.Cookie[]> {
    const originalCookies = (
      await this._client.send('Network.getCookies', {
        urls: urls.length ? urls : [this.url()],
      })
    ).cookies;

    const unsupportedCookieAttributes = ['priority'];
    const filterUnsupportedAttributes = (
      cookie: Protocol.Network.Cookie
    ): Protocol.Network.Cookie => {
      for (const attr of unsupportedCookieAttributes) delete cookie[attr];
      return cookie;
    };
    return originalCookies.map(filterUnsupportedAttributes);
  }

  async deleteCookie(
    ...cookies: Protocol.Network.DeleteCookiesRequest[]
  ): Promise<void> {
    const pageURL = this.url();
    for (const cookie of cookies) {
      const item = Object.assign({}, cookie);
      if (!cookie.url && pageURL.startsWith('http')) item.url = pageURL;
      await this._client.send('Network.deleteCookies', item);
    }
  }

  async setCookie(...cookies: Protocol.Network.CookieParam[]): Promise<void> {
    const pageURL = this.url();
    const startsWithHTTP = pageURL.startsWith('http');
    const items = cookies.map((cookie) => {
      const item = Object.assign({}, cookie);
      if (!item.url && startsWithHTTP) item.url = pageURL;
      assert(
        item.url !== 'about:blank',
        `Blank page can not have cookie "${item.name}"`
      );
      assert(
        !String.prototype.startsWith.call(item.url || '', 'data:'),
        `Data URL page can not have cookie "${item.name}"`
      );
      return item;
    });
    await this.deleteCookie(...items);
    if (items.length)
      await this._client.send('Network.setCookies', { cookies: items });
  }

  async addScriptTag(options: {
    url?: string;
    path?: string;
    content?: string;
    type?: string;
  }): Promise<ElementHandle> {
    return this.mainFrame().addScriptTag(options);
  }

  async addStyleTag(options: {
    url?: string;
    path?: string;
    content?: string;
  }): Promise<ElementHandle> {
    return this.mainFrame().addStyleTag(options);
  }

  async exposeFunction(
    name: string,
    puppeteerFunction: Function
  ): Promise<void> {
    if (this._pageBindings.has(name))
      throw new Error(
        `Failed to add page binding with name ${name}: window['${name}'] already exists!`
      );
    this._pageBindings.set(name, puppeteerFunction);

    const expression = helper.pageBindingInitString('exposedFun', name);
    await this._client.send('Runtime.addBinding', { name: name });
    await this._client.send('Page.addScriptToEvaluateOnNewDocument', {
      source: expression,
    });
    await Promise.all(
      this.frames().map((frame) => frame.evaluate(expression).catch(debugError))
    );
  }

  async authenticate(credentials: Credentials): Promise<void> {
    return this._frameManager.networkManager().authenticate(credentials);
  }

  async setExtraHTTPHeaders(headers: Record<string, string>): Promise<void> {
    return this._frameManager.networkManager().setExtraHTTPHeaders(headers);
  }

  async setUserAgent(userAgent: string): Promise<void> {
    return this._frameManager.networkManager().setUserAgent(userAgent);
  }

  async metrics(): Promise<Metrics> {
    const response = await this._client.send('Performance.getMetrics');
    return this._buildMetricsObject(response.metrics);
  }

  private _emitMetrics(event: Protocol.Performance.MetricsEvent): void {
    this.emit(PageEmittedEvents.Metrics, {
      title: event.title,
      metrics: this._buildMetricsObject(event.metrics),
    });
  }

  private _buildMetricsObject(
    metrics?: Protocol.Performance.Metric[]
  ): Metrics {
    const result = {};
    for (const metric of metrics || []) {
      if (supportedMetrics.has(metric.name)) result[metric.name] = metric.value;
    }
    return result;
  }

  private _handleException(
    exceptionDetails: Protocol.Runtime.ExceptionDetails
  ): void {
    const message = helper.getExceptionMessage(exceptionDetails);
    const err = new Error(message);
    err.stack = ''; // Don't report clientside error with a node stack attached
    this.emit(PageEmittedEvents.PageError, err);
  }

  private async _onConsoleAPI(
    event: Protocol.Runtime.ConsoleAPICalledEvent
  ): Promise<void> {
    if (event.executionContextId === 0) {
      // DevTools protocol stores the last 1000 console messages. These
      // messages are always reported even for removed execution contexts. In
      // this case, they are marked with executionContextId = 0 and are
      // reported upon enabling Runtime agent.
      //
      // Ignore these messages since:
      // - there's no execution context we can use to operate with message
      //   arguments
      // - these messages are reported before Puppeteer clients can subscribe
      //   to the 'console'
      //   page event.
      //
      // @see https://github.com/puppeteer/puppeteer/issues/3865
      return;
    }
    const context = this._frameManager.executionContextById(
      event.executionContextId
    );
    const values = event.args.map((arg) => createJSHandle(context, arg));
    this._addConsoleMessage(event.type, values, event.stackTrace);
  }

  private async _onBindingCalled(
    event: Protocol.Runtime.BindingCalledEvent
  ): Promise<void> {
    let payload: { type: string; name: string; seq: number; args: unknown[] };
    try {
      payload = JSON.parse(event.payload);
    } catch {
      // The binding was either called by something in the page or it was
      // called before our wrapper was initialized.
      return;
    }
    const { type, name, seq, args } = payload;
    if (type !== 'exposedFun' || !this._pageBindings.has(name)) return;
    let expression = null;
    try {
      const result = await this._pageBindings.get(name)(...args);
      expression = helper.pageBindingDeliverResultString(name, seq, result);
    } catch (error) {
      if (error instanceof Error)
        expression = helper.pageBindingDeliverErrorString(
          name,
          seq,
          error.message,
          error.stack
        );
      else
        expression = helper.pageBindingDeliverErrorValueString(
          name,
          seq,
          error
        );
    }
    this._client
      .send('Runtime.evaluate', {
        expression,
        contextId: event.executionContextId,
      })
      .catch(debugError);
  }

  private _addConsoleMessage(
    type: ConsoleMessageType,
    args: JSHandle[],
    stackTrace?: Protocol.Runtime.StackTrace
  ): void {
    if (!this.listenerCount(PageEmittedEvents.Console)) {
      args.forEach((arg) => arg.dispose());
      return;
    }
    const textTokens = [];
    for (const arg of args) {
      const remoteObject = arg._remoteObject;
      if (remoteObject.objectId) textTokens.push(arg.toString());
      else textTokens.push(helper.valueFromRemoteObject(remoteObject));
    }
    const stackTraceLocations = [];
    if (stackTrace) {
      for (const callFrame of stackTrace.callFrames) {
        stackTraceLocations.push({
          url: callFrame.url,
          lineNumber: callFrame.lineNumber,
          columnNumber: callFrame.columnNumber,
        });
      }
    }
    const message = new ConsoleMessage(
      type,
      textTokens.join(' '),
      args,
      stackTraceLocations
    );
    this.emit(PageEmittedEvents.Console, message);
  }

  private _onDialog(event: Protocol.Page.JavascriptDialogOpeningEvent): void {
    let dialogType = null;
    const validDialogTypes = new Set<Protocol.Page.DialogType>([
      'alert',
      'confirm',
      'prompt',
      'beforeunload',
    ]);

    if (validDialogTypes.has(event.type)) {
      dialogType = event.type as Protocol.Page.DialogType;
    }
    assert(dialogType, 'Unknown javascript dialog type: ' + event.type);

    const dialog = new Dialog(
      this._client,
      dialogType,
      event.message,
      event.defaultPrompt
    );
    this.emit(PageEmittedEvents.Dialog, dialog);
  }

  /**
   * Resets default white background
   */
  private async _resetDefaultBackgroundColor() {
    await this._client.send('Emulation.setDefaultBackgroundColorOverride');
  }

  /**
   * Hides default white background
   */
  private async _setTransparentBackgroundColor(): Promise<void> {
    await this._client.send('Emulation.setDefaultBackgroundColorOverride', {
      color: { r: 0, g: 0, b: 0, a: 0 },
    });
  }

  url(): string {
    return this.mainFrame().url();
  }

  async content(): Promise<string> {
    return await this._frameManager.mainFrame().content();
  }

  async setContent(html: string, options: WaitForOptions = {}): Promise<void> {
    await this._frameManager.mainFrame().setContent(html, options);
  }

  async goto(
    url: string,
    options: WaitForOptions & { referer?: string } = {}
  ): Promise<HTTPResponse> {
    return await this._frameManager.mainFrame().goto(url, options);
  }

  async reload(options?: WaitForOptions): Promise<HTTPResponse | null> {
    const result = await Promise.all<HTTPResponse, void>([
      this.waitForNavigation(options),
      this._client.send('Page.reload'),
    ]);

    return result[0];
  }

  async waitForNavigation(
    options: WaitForOptions = {}
  ): Promise<HTTPResponse | null> {
    return await this._frameManager.mainFrame().waitForNavigation(options);
  }

  private _sessionClosePromise(): Promise<Error> {
    if (!this._disconnectPromise)
      this._disconnectPromise = new Promise((fulfill) =>
        this._client.once(CDPSessionEmittedEvents.Disconnected, () =>
          fulfill(new Error('Target closed'))
        )
      );
    return this._disconnectPromise;
  }

  async waitForRequest(
    urlOrPredicate: string | ((req: HTTPRequest) => boolean | Promise<boolean>),
    options: { timeout?: number } = {}
  ): Promise<HTTPRequest> {
    const { timeout = this._timeoutSettings.timeout() } = options;
    return helper.waitForEvent(
      this._frameManager.networkManager(),
      NetworkManagerEmittedEvents.Request,
      (request) => {
        if (helper.isString(urlOrPredicate))
          return urlOrPredicate === request.url();
        if (typeof urlOrPredicate === 'function')
          return !!urlOrPredicate(request);
        return false;
      },
      timeout,
      this._sessionClosePromise()
    );
  }

  async waitForResponse(
    urlOrPredicate:
      | string
      | ((res: HTTPResponse) => boolean | Promise<boolean>),
    options: { timeout?: number } = {}
  ): Promise<HTTPResponse> {
    const { timeout = this._timeoutSettings.timeout() } = options;
    return helper.waitForEvent(
      this._frameManager.networkManager(),
      NetworkManagerEmittedEvents.Response,
      async (response) => {
        if (helper.isString(urlOrPredicate))
          return urlOrPredicate === response.url();
        if (typeof urlOrPredicate === 'function')
          return !!(await urlOrPredicate(response));
        return false;
      },
      timeout,
      this._sessionClosePromise()
    );
  }

  async goBack(options: WaitForOptions = {}): Promise<HTTPResponse | null> {
    return this._go(-1, options);
  }

  async goForward(options: WaitForOptions = {}): Promise<HTTPResponse | null> {
    return this._go(+1, options);
  }

  private async _go(
    delta: number,
    options: WaitForOptions
  ): Promise<HTTPResponse | null> {
    const history = await this._client.send('Page.getNavigationHistory');
    const entry = history.entries[history.currentIndex + delta];
    if (!entry) return null;
    const result = await Promise.all([
      this.waitForNavigation(options),
      this._client.send('Page.navigateToHistoryEntry', { entryId: entry.id }),
    ]);
    return result[0];
  }

  async bringToFront(): Promise<void> {
    await this._client.send('Page.bringToFront');
  }

  async emulate(options: {
    viewport: Viewport;
    userAgent: string;
  }): Promise<void> {
    await Promise.all([
      this.setViewport(options.viewport),
      this.setUserAgent(options.userAgent),
    ]);
  }

  async setJavaScriptEnabled(enabled: boolean): Promise<void> {
    if (this._javascriptEnabled === enabled) return;
    this._javascriptEnabled = enabled;
    await this._client.send('Emulation.setScriptExecutionDisabled', {
      value: !enabled,
    });
  }

  async setBypassCSP(enabled: boolean): Promise<void> {
    await this._client.send('Page.setBypassCSP', { enabled });
  }

  async emulateMediaType(type?: string): Promise<void> {
    assert(
      type === 'screen' || type === 'print' || type === null,
      'Unsupported media type: ' + type
    );
    await this._client.send('Emulation.setEmulatedMedia', {
      media: type || '',
    });
  }

  async emulateMediaFeatures(features?: MediaFeature[]): Promise<void> {
    if (features === null)
      await this._client.send('Emulation.setEmulatedMedia', { features: null });
    if (Array.isArray(features)) {
      features.every((mediaFeature) => {
        const name = mediaFeature.name;
        assert(
          /^(?:prefers-(?:color-scheme|reduced-motion)|color-gamut)$/.test(
            name
          ),
          'Unsupported media feature: ' + name
        );
        return true;
      });
      await this._client.send('Emulation.setEmulatedMedia', {
        features: features,
      });
    }
  }

  async emulateTimezone(timezoneId?: string): Promise<void> {
    try {
      await this._client.send('Emulation.setTimezoneOverride', {
        timezoneId: timezoneId || '',
      });
    } catch (error) {
      if (error.message.includes('Invalid timezone'))
        throw new Error(`Invalid timezone ID: ${timezoneId}`);
      throw error;
    }
  }

  /**
   * Emulates the idle state.
   * If no arguments set, clears idle state emulation.
   *
   * @example
   * ```js
   * // set idle emulation
   * await page.emulateIdleState({isUserActive: true, isScreenUnlocked: false});
   *
   * // do some checks here
   * ...
   *
   * // clear idle emulation
   * await page.emulateIdleState();
   * ```
   *
   * @param overrides - Mock idle state. If not set, clears idle overrides
   * @param isUserActive - Mock isUserActive
   * @param isScreenUnlocked - Mock isScreenUnlocked
   */
  async emulateIdleState(overrides?: {
    isUserActive: boolean;
    isScreenUnlocked: boolean;
  }): Promise<void> {
    if (overrides) {
      await this._client.send('Emulation.setIdleOverride', {
        isUserActive: overrides.isUserActive,
        isScreenUnlocked: overrides.isScreenUnlocked,
      });
    } else {
      await this._client.send('Emulation.clearIdleOverride');
    }
  }

  /**
   * Simulates the given vision deficiency on the page.
   *
   * @example
   * ```js
   * const puppeteer = require('puppeteer');
   *
   * (async () => {
   *   const browser = await puppeteer.launch();
   *   const page = await browser.newPage();
   *   await page.goto('https://v8.dev/blog/10-years');
   *
   *   await page.emulateVisionDeficiency('achromatopsia');
   *   await page.screenshot({ path: 'achromatopsia.png' });
   *
   *   await page.emulateVisionDeficiency('deuteranopia');
   *   await page.screenshot({ path: 'deuteranopia.png' });
   *
   *   await page.emulateVisionDeficiency('blurredVision');
   *   await page.screenshot({ path: 'blurred-vision.png' });
   *
   *   await browser.close();
   * })();
   * ```
   *
   * @param type - the type of deficiency to simulate, or `'none'` to reset.
   */
  async emulateVisionDeficiency(
    type?: Protocol.Emulation.SetEmulatedVisionDeficiencyRequest['type']
  ): Promise<void> {
    const visionDeficiencies = new Set<
      Protocol.Emulation.SetEmulatedVisionDeficiencyRequest['type']
    >([
      'none',
      'achromatopsia',
      'blurredVision',
      'deuteranopia',
      'protanopia',
      'tritanopia',
    ]);
    try {
      assert(
        !type || visionDeficiencies.has(type),
        `Unsupported vision deficiency: ${type}`
      );
      await this._client.send('Emulation.setEmulatedVisionDeficiency', {
        type: type || 'none',
      });
    } catch (error) {
      throw error;
    }
  }

  async setViewport(viewport: Viewport): Promise<void> {
    const needsReload = await this._emulationManager.emulateViewport(viewport);
    this._viewport = viewport;
    if (needsReload) await this.reload();
  }

  viewport(): Viewport | null {
    return this._viewport;
  }

  /**
   * @remarks
   *
   * Evaluates a function in the page's context and returns the result.
   *
   * If the function passed to `page.evaluteHandle` returns a Promise, the
   * function will wait for the promise to resolve and return its value.
   *
   * @example
   *
   * ```js
   * const result = await frame.evaluate(() => {
   *   return Promise.resolve(8 * 7);
   * });
   * console.log(result); // prints "56"
   * ```
   *
   * You can pass a string instead of a function (although functions are
   * recommended as they are easier to debug and use with TypeScript):
   *
   * @example
   * ```
   * const aHandle = await page.evaluate('1 + 2');
   * ```
   *
   * To get the best TypeScript experience, you should pass in as the
   * generic the type of `pageFunction`:
   *
   * ```
   * const aHandle = await page.evaluate<() => number>(() => 2);
   * ```
   *
   * @example
   *
   * {@link ElementHandle} instances (including {@link JSHandle}s) can be passed
   * as arguments to the `pageFunction`:
   *
   * ```
   * const bodyHandle = await page.$('body');
   * const html = await page.evaluate(body => body.innerHTML, bodyHandle);
   * await bodyHandle.dispose();
   * ```
   *
   * @param pageFunction - a function that is run within the page
   * @param args - arguments to be passed to the pageFunction
   *
   * @returns the return value of `pageFunction`.
   */
  async evaluate<T extends EvaluateFn>(
    pageFunction: T,
    ...args: SerializableOrJSHandle[]
  ): Promise<UnwrapPromiseLike<EvaluateFnReturnType<T>>> {
    return this._frameManager.mainFrame().evaluate<T>(pageFunction, ...args);
  }

  async evaluateOnNewDocument(
    pageFunction: Function | string,
    ...args: unknown[]
  ): Promise<void> {
    const source = helper.evaluationString(pageFunction, ...args);
    await this._client.send('Page.addScriptToEvaluateOnNewDocument', {
      source,
    });
  }

  async setCacheEnabled(enabled = true): Promise<void> {
    await this._frameManager.networkManager().setCacheEnabled(enabled);
  }

  async screenshot(
    options: ScreenshotOptions = {}
  ): Promise<Buffer | string | void> {
    let screenshotType = null;
    // options.type takes precedence over inferring the type from options.path
    // because it may be a 0-length file with no extension created beforehand
    // (i.e. as a temp file).
    if (options.type) {
      assert(
        options.type === 'png' || options.type === 'jpeg',
        'Unknown options.type value: ' + options.type
      );
      screenshotType = options.type;
    } else if (options.path) {
      const filePath = options.path;
      const extension = filePath
        .slice(filePath.lastIndexOf('.') + 1)
        .toLowerCase();
      if (extension === 'png') screenshotType = 'png';
      else if (extension === 'jpg' || extension === 'jpeg')
        screenshotType = 'jpeg';
      assert(
        screenshotType,
        `Unsupported screenshot type for extension \`.${extension}\``
      );
    }

    if (!screenshotType) screenshotType = 'png';

    if (options.quality) {
      assert(
        screenshotType === 'jpeg',
        'options.quality is unsupported for the ' +
          screenshotType +
          ' screenshots'
      );
      assert(
        typeof options.quality === 'number',
        'Expected options.quality to be a number but found ' +
          typeof options.quality
      );
      assert(
        Number.isInteger(options.quality),
        'Expected options.quality to be an integer'
      );
      assert(
        options.quality >= 0 && options.quality <= 100,
        'Expected options.quality to be between 0 and 100 (inclusive), got ' +
          options.quality
      );
    }
    assert(
      !options.clip || !options.fullPage,
      'options.clip and options.fullPage are exclusive'
    );
    if (options.clip) {
      assert(
        typeof options.clip.x === 'number',
        'Expected options.clip.x to be a number but found ' +
          typeof options.clip.x
      );
      assert(
        typeof options.clip.y === 'number',
        'Expected options.clip.y to be a number but found ' +
          typeof options.clip.y
      );
      assert(
        typeof options.clip.width === 'number',
        'Expected options.clip.width to be a number but found ' +
          typeof options.clip.width
      );
      assert(
        typeof options.clip.height === 'number',
        'Expected options.clip.height to be a number but found ' +
          typeof options.clip.height
      );
      assert(
        options.clip.width !== 0,
        'Expected options.clip.width not to be 0.'
      );
      assert(
        options.clip.height !== 0,
        'Expected options.clip.height not to be 0.'
      );
    }
    return this._screenshotTaskQueue.postTask(() =>
      this._screenshotTask(screenshotType, options)
    );
  }

  private async _screenshotTask(
    format: 'png' | 'jpeg',
    options?: ScreenshotOptions
  ): Promise<Buffer | string> {
    await this._client.send('Target.activateTarget', {
      targetId: this._target._targetId,
    });
    let clip = options.clip ? processClip(options.clip) : undefined;
    let { captureBeyondViewport = true } = options;
    captureBeyondViewport =
      typeof captureBeyondViewport === 'boolean' ? captureBeyondViewport : true;

    if (options.fullPage) {
      const metrics = await this._client.send('Page.getLayoutMetrics');
      const width = Math.ceil(metrics.contentSize.width);
      const height = Math.ceil(metrics.contentSize.height);

      // Overwrite clip for full page.
      clip = { x: 0, y: 0, width, height, scale: 1 };

      if (!captureBeyondViewport) {
        const { isMobile = false, deviceScaleFactor = 1, isLandscape = false } =
          this._viewport || {};
        const screenOrientation: Protocol.Emulation.ScreenOrientation = isLandscape
          ? { angle: 90, type: 'landscapePrimary' }
          : { angle: 0, type: 'portraitPrimary' };
        await this._client.send('Emulation.setDeviceMetricsOverride', {
          mobile: isMobile,
          width,
          height,
          deviceScaleFactor,
          screenOrientation,
        });
      }
    }
    const shouldSetDefaultBackground =
      options.omitBackground && format === 'png';
    if (shouldSetDefaultBackground) {
      await this._setTransparentBackgroundColor();
    }

    const result = await this._client.send('Page.captureScreenshot', {
      format,
      quality: options.quality,
      clip,
      captureBeyondViewport,
    });
    if (shouldSetDefaultBackground) {
      await this._resetDefaultBackgroundColor();
    }

    if (options.fullPage && this._viewport)
      await this.setViewport(this._viewport);

    const buffer =
      options.encoding === 'base64'
        ? result.data
        : Buffer.from(result.data, 'base64');

    if (options.path) {
      if (!isNode) {
        throw new Error(
          'Screenshots can only be written to a file path in a Node environment.'
        );
      }
      const fs = await helper.importFSModule();
      await fs.promises.writeFile(options.path, buffer);
    }
    return buffer;

    function processClip(
      clip: ScreenshotClip
    ): ScreenshotClip & { scale: number } {
      const x = Math.round(clip.x);
      const y = Math.round(clip.y);
      const width = Math.round(clip.width + clip.x - x);
      const height = Math.round(clip.height + clip.y - y);
      return { x, y, width, height, scale: 1 };
    }
  }

  /**
   * Generatees a PDF of the page with the `print` CSS media type.
   * @remarks
   *
   * IMPORTANT: PDF generation is only supported in Chrome headless mode.
   *
   * To generate a PDF with the `screen` media type, call
   * {@link Page.emulateMediaType | `page.emulateMediaType('screen')`} before
   * calling `page.pdf()`.
   *
   * By default, `page.pdf()` generates a pdf with modified colors for printing.
   * Use the
   * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-print-color-adjust | `-webkit-print-color-adjust`}
   * property to force rendering of exact colors.
   *
   *
   * @param options - options for generating the PDF.
   */
  async pdf(options: PDFOptions = {}): Promise<Buffer> {
    const {
      scale = 1,
      displayHeaderFooter = false,
      headerTemplate = '',
      footerTemplate = '',
      printBackground = false,
      landscape = false,
      pageRanges = '',
      preferCSSPageSize = false,
      margin = {},
      path = null,
      omitBackground = false,
    } = options;

    let paperWidth = 8.5;
    let paperHeight = 11;
    if (options.format) {
      const format = paperFormats[options.format.toLowerCase()];
      assert(format, 'Unknown paper format: ' + options.format);
      paperWidth = format.width;
      paperHeight = format.height;
    } else {
      paperWidth = convertPrintParameterToInches(options.width) || paperWidth;
      paperHeight =
        convertPrintParameterToInches(options.height) || paperHeight;
    }

    const marginTop = convertPrintParameterToInches(margin.top) || 0;
    const marginLeft = convertPrintParameterToInches(margin.left) || 0;
    const marginBottom = convertPrintParameterToInches(margin.bottom) || 0;
    const marginRight = convertPrintParameterToInches(margin.right) || 0;

    if (omitBackground) {
      await this._setTransparentBackgroundColor();
    }

    const result = await this._client.send('Page.printToPDF', {
      transferMode: 'ReturnAsStream',
      landscape,
      displayHeaderFooter,
      headerTemplate,
      footerTemplate,
      printBackground,
      scale,
      paperWidth,
      paperHeight,
      marginTop,
      marginBottom,
      marginLeft,
      marginRight,
      pageRanges,
      preferCSSPageSize,
    });

    if (omitBackground) {
      await this._resetDefaultBackgroundColor();
    }

    return await helper.readProtocolStream(this._client, result.stream, path);
  }

  async title(): Promise<string> {
    return this.mainFrame().title();
  }

  async close(
    options: { runBeforeUnload?: boolean } = { runBeforeUnload: undefined }
  ): Promise<void> {
    assert(
      !!this._client._connection,
      'Protocol error: Connection closed. Most likely the page has been closed.'
    );
    const runBeforeUnload = !!options.runBeforeUnload;
    if (runBeforeUnload) {
      await this._client.send('Page.close');
    } else {
      await this._client._connection.send('Target.closeTarget', {
        targetId: this._target._targetId,
      });
      await this._target._isClosedPromise;
    }
  }

  isClosed(): boolean {
    return this._closed;
  }

  get mouse(): Mouse {
    return this._mouse;
  }

  click(
    selector: string,
    options: {
      delay?: number;
      button?: MouseButton;
      clickCount?: number;
    } = {}
  ): Promise<void> {
    return this.mainFrame().click(selector, options);
  }

  focus(selector: string): Promise<void> {
    return this.mainFrame().focus(selector);
  }

  hover(selector: string): Promise<void> {
    return this.mainFrame().hover(selector);
  }

  select(selector: string, ...values: string[]): Promise<string[]> {
    return this.mainFrame().select(selector, ...values);
  }

  tap(selector: string): Promise<void> {
    return this.mainFrame().tap(selector);
  }

  type(
    selector: string,
    text: string,
    options?: { delay: number }
  ): Promise<void> {
    return this.mainFrame().type(selector, text, options);
  }

  /**
   * @remarks
   *
   * This method behaves differently depending on the first parameter. If it's a
   * `string`, it will be treated as a `selector` or `xpath` (if the string
   * starts with `//`). This method then is a shortcut for
   * {@link Page.waitForSelector} or {@link Page.waitForXPath}.
   *
   * If the first argument is a function this method is a shortcut for
   * {@link Page.waitForFunction}.
   *
   * If the first argument is a `number`, it's treated as a timeout in
   * milliseconds and the method returns a promise which resolves after the
   * timeout.
   *
   * @param selectorOrFunctionOrTimeout - a selector, predicate or timeout to
   * wait for.
   * @param options - optional waiting parameters.
   * @param args - arguments to pass to `pageFunction`.
   *
   * @deprecated Don't use this method directly. Instead use the more explicit
   * methods available: {@link Page.waitForSelector},
   * {@link Page.waitForXPath}, {@link Page.waitForFunction} or
   * {@link Page.waitForTimeout}.
   */
  waitFor(
    selectorOrFunctionOrTimeout: string | number | Function,
    options: {
      visible?: boolean;
      hidden?: boolean;
      timeout?: number;
      polling?: string | number;
    } = {},
    ...args: SerializableOrJSHandle[]
  ): Promise<JSHandle> {
    return this.mainFrame().waitFor(
      selectorOrFunctionOrTimeout,
      options,
      ...args
    );
  }

  /**
   * Causes your script to wait for the given number of milliseconds.
   *
   * @remarks
   *
   * It's generally recommended to not wait for a number of seconds, but instead
   * use {@link Page.waitForSelector}, {@link Page.waitForXPath} or
   * {@link Page.waitForFunction} to wait for exactly the conditions you want.
   *
   * @example
   *
   * Wait for 1 second:
   *
   * ```
   * await page.waitForTimeout(1000);
   * ```
   *
   * @param milliseconds - the number of milliseconds to wait.
   */
  waitForTimeout(milliseconds: number): Promise<void> {
    return this.mainFrame().waitForTimeout(milliseconds);
  }

  waitForSelector(
    selector: string,
    options: {
      visible?: boolean;
      hidden?: boolean;
      timeout?: number;
    } = {}
  ): Promise<ElementHandle | null> {
    return this.mainFrame().waitForSelector(selector, options);
  }

  waitForXPath(
    xpath: string,
    options: {
      visible?: boolean;
      hidden?: boolean;
      timeout?: number;
    } = {}
  ): Promise<ElementHandle | null> {
    return this.mainFrame().waitForXPath(xpath, options);
  }

  waitForFunction(
    pageFunction: Function | string,
    options: {
      timeout?: number;
      polling?: string | number;
    } = {},
    ...args: SerializableOrJSHandle[]
  ): Promise<JSHandle> {
    return this.mainFrame().waitForFunction(pageFunction, options, ...args);
  }
}

const supportedMetrics = new Set<string>([
  'Timestamp',
  'Documents',
  'Frames',
  'JSEventListeners',
  'Nodes',
  'LayoutCount',
  'RecalcStyleCount',
  'LayoutDuration',
  'RecalcStyleDuration',
  'ScriptDuration',
  'TaskDuration',
  'JSHeapUsedSize',
  'JSHeapTotalSize',
]);

const unitToPixels = {
  px: 1,
  in: 96,
  cm: 37.8,
  mm: 3.78,
};

function convertPrintParameterToInches(
  parameter?: string | number
): number | undefined {
  if (typeof parameter === 'undefined') return undefined;
  let pixels;
  if (helper.isNumber(parameter)) {
    // Treat numbers as pixel values to be aligned with phantom's paperSize.
    pixels = /** @type {number} */ parameter;
  } else if (helper.isString(parameter)) {
    const text = /** @type {string} */ parameter;
    let unit = text.substring(text.length - 2).toLowerCase();
    let valueText = '';
    if (unitToPixels.hasOwnProperty(unit)) {
      valueText = text.substring(0, text.length - 2);
    } else {
      // In case of unknown unit try to parse the whole parameter as number of pixels.
      // This is consistent with phantom's paperSize behavior.
      unit = 'px';
      valueText = text;
    }
    const value = Number(valueText);
    assert(!isNaN(value), 'Failed to parse parameter value: ' + text);
    pixels = value * unitToPixels[unit];
  } else {
    throw new Error(
      'page.pdf() Cannot handle parameter type: ' + typeof parameter
    );
  }
  return pixels / 96;
}
