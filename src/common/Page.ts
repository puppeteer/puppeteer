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

import {Protocol} from 'devtools-protocol';
import type {Readable} from 'stream';
import {Accessibility} from './Accessibility.js';
import {assert} from './assert.js';
import {Browser, BrowserContext} from './Browser.js';
import {CDPSession, CDPSessionEmittedEvents} from './Connection.js';
import {ConsoleMessage, ConsoleMessageType} from './ConsoleMessage.js';
import {Coverage} from './Coverage.js';
import {Dialog} from './Dialog.js';
import {MAIN_WORLD, WaitForSelectorOptions} from './IsolatedWorld.js';
import {ElementHandle} from './ElementHandle.js';
import {EmulationManager} from './EmulationManager.js';
import {EventEmitter, Handler} from './EventEmitter.js';
import {FileChooser} from './FileChooser.js';
import {
  Frame,
  FrameManager,
  FrameManagerEmittedEvents,
} from './FrameManager.js';
import {HTTPRequest} from './HTTPRequest.js';
import {HTTPResponse} from './HTTPResponse.js';
import {Keyboard, Mouse, MouseButton, Touchscreen} from './Input.js';
import {JSHandle} from './JSHandle.js';
import {PuppeteerLifeCycleEvent} from './LifecycleWatcher.js';
import {
  Credentials,
  NetworkConditions,
  NetworkManagerEmittedEvents,
} from './NetworkManager.js';
import {LowerCasePaperFormat, PDFOptions, _paperFormats} from './PDFOptions.js';
import {Viewport} from './PuppeteerViewport.js';
import {Target} from './Target.js';
import {TargetManagerEmittedEvents} from './TargetManager.js';
import {TaskQueue} from './TaskQueue.js';
import {TimeoutSettings} from './TimeoutSettings.js';
import {Tracing} from './Tracing.js';
import {EvaluateFunc, HandleFor, NodeFor} from './types.js';
import {
  createJSHandle,
  debugError,
  evaluationString,
  getExceptionMessage,
  importFS,
  getReadableAsBuffer,
  getReadableFromProtocolStream,
  isErrorLike,
  isNumber,
  isString,
  pageBindingDeliverErrorString,
  pageBindingDeliverErrorValueString,
  pageBindingDeliverResultString,
  pageBindingInitString,
  releaseObject,
  valueFromRemoteObject,
  waitForEvent,
  waitWithTimeout,
  createDeferredPromiseWithTimer,
  DeferredPromise,
} from './util.js';
import {WebWorker} from './WebWorker.js';

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
   * Maximum wait time in milliseconds. Pass 0 to disable the timeout.
   *
   * The default value can be changed by using the
   * {@link Page.setDefaultTimeout} method.
   *
   * @defaultValue `30000`
   */
  timeout?: number;
}

/**
 * @public
 */
export interface WaitForOptions {
  /**
   * Maximum wait time in milliseconds. Pass 0 to disable the timeout.
   *
   * The default value can be changed by using the
   * {@link Page.setDefaultTimeout} or {@link Page.setDefaultNavigationTimeout}
   * methods.
   *
   * @defaultValue `30000`
   */
  timeout?: number;
  waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
}

/**
 * @public
 */
export interface GeolocationOptions {
  /**
   * Latitude between `-90` and `90`.
   */
  longitude: number;
  /**
   * Longitude between `-180` and `180`.
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
   * @defaultValue `png`
   */
  type?: 'png' | 'jpeg' | 'webp';
  /**
   * The file path to save the image to. The screenshot type will be inferred
   * from file extension. If path is a relative path, then it is resolved
   * relative to current working directory. If no path is provided, the image
   * won't be saved to the disk.
   */
  path?: string;
  /**
   * When `true`, takes a screenshot of the full page.
   * @defaultValue `false`
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
   * @defaultValue `false`
   */
  omitBackground?: boolean;
  /**
   * Encoding of the image.
   * @defaultValue `binary`
   */
  encoding?: 'base64' | 'binary';
  /**
   * Capture the screenshot beyond the viewport.
   * @defaultValue `true`
   */
  captureBeyondViewport?: boolean;
  /**
   * Capture the screenshot from the surface, rather than the view.
   * @defaultValue `true`
   */
  fromSurface?: boolean;
}

/**
 * All the events that a page instance may emit.
 *
 * @public
 */
export const enum PageEmittedEvents {
  /**
   * Emitted when the page closes.
   * @eventProperty
   */
  Close = 'close',
  /**
   * Emitted when JavaScript within the page calls one of console API methods,
   * e.g. `console.log` or `console.dir`. Also emitted if the page throws an
   * error or a warning.
   *
   * @remarks
   * A `console` event provides a {@link ConsoleMessage} representing the
   * console message that was logged.
   *
   * @example
   * An example of handling `console` event:
   *
   * ```ts
   * page.on('console', msg => {
   *   for (let i = 0; i < msg.args().length; ++i)
   *     console.log(`${i}: ${msg.args()[i]}`);
   * });
   * page.evaluate(() => console.log('hello', 5, {foo: 'bar'}));
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
   * {@link https://developer.mozilla.org/en-US/docs/Web/Events/DOMContentLoaded | DOMContentLoaded }
   * event is dispatched.
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
  /**
   * Emitted when a frame is navigated to a new URL. Will contain a
   * {@link Frame}.
   */
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
   *
   * - `title`: the title passed to `console.timeStamp`
   * - `metrics`: objec containing metrics as key/value pairs. The values will
   *   be `number`s.
   */
  Metrics = 'metrics',
  /**
   * Emitted when an uncaught exception happens within the page. Contains an
   * `Error`.
   */
  PageError = 'pageerror',
  /**
   * Emitted when the page opens a new tab or window.
   *
   * Contains a {@link Page} corresponding to the popup window.
   *
   * @example
   *
   * ```ts
   * const [popup] = await Promise.all([
   *   new Promise(resolve => page.once('popup', resolve)),
   *   page.click('a[target=_blank]'),
   * ]);
   * ```
   *
   * ```ts
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
   * The object is readonly. See {@link Page.setRequestInterception} for
   * intercepting and mutating requests.
   */
  Request = 'request',
  /**
   * Emitted when a request ended up loading from cache. Contains a
   * {@link HTTPRequest}.
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
   * HTTP Error responses, such as 404 or 503, are still successful responses
   * from HTTP standpoint, so request will complete with `requestfinished` event
   * and not with `requestfailed`.
   */
  RequestFailed = 'requestfailed',
  /**
   * Emitted when a request finishes successfully. Contains a
   * {@link HTTPRequest}.
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
 *
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
  metrics: {title: string; metrics: Metrics};
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

/**
 * Page provides methods to interact with a single tab or
 * {@link https://developer.chrome.com/extensions/background_pages | extension background page}
 * in Chromium.
 *
 * :::note
 *
 * One Browser instance might have multiple Page instances.
 *
 * :::
 *
 * @example
 * This example creates a page, navigates it to a URL, and then saves a screenshot:
 *
 * ```ts
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
 *
 * ```ts
 * page.once('load', () => console.log('Page loaded!'));
 * ```
 *
 * To unsubscribe from events use the {@link Page.off} method:
 *
 * ```ts
 * function logRequest(interceptedRequest) {
 *   console.log('A request was made:', interceptedRequest.url());
 * }
 * page.on('request', logRequest);
 * // Sometime later...
 * page.off('request', logRequest);
 * ```
 *
 * @public
 */
export class Page extends EventEmitter {
  /**
   * @internal
   */
  static async _create(
    client: CDPSession,
    target: Target,
    ignoreHTTPSErrors: boolean,
    defaultViewport: Viewport | null,
    screenshotTaskQueue: TaskQueue
  ): Promise<Page> {
    const page = new Page(
      client,
      target,
      ignoreHTTPSErrors,
      screenshotTaskQueue
    );
    await page.#initialize();
    if (defaultViewport) {
      await page.setViewport(defaultViewport);
    }
    return page;
  }

  #closed = false;
  #client: CDPSession;
  #target: Target;
  #keyboard: Keyboard;
  #mouse: Mouse;
  #timeoutSettings = new TimeoutSettings();
  #touchscreen: Touchscreen;
  #accessibility: Accessibility;
  #frameManager: FrameManager;
  #emulationManager: EmulationManager;
  #tracing: Tracing;
  #pageBindings = new Map<string, Function>();
  #coverage: Coverage;
  #javascriptEnabled = true;
  #viewport: Viewport | null;
  #screenshotTaskQueue: TaskQueue;
  #workers = new Map<string, WebWorker>();
  #fileChooserPromises = new Set<DeferredPromise<FileChooser>>();

  #disconnectPromise?: Promise<Error>;
  #userDragInterceptionEnabled = false;
  #handlerMap = new WeakMap<Handler, Handler>();

  /**
   * @internal
   */
  constructor(
    client: CDPSession,
    target: Target,
    ignoreHTTPSErrors: boolean,
    screenshotTaskQueue: TaskQueue
  ) {
    super();
    this.#client = client;
    this.#target = target;
    this.#keyboard = new Keyboard(client);
    this.#mouse = new Mouse(client, this.#keyboard);
    this.#touchscreen = new Touchscreen(client, this.#keyboard);
    this.#accessibility = new Accessibility(client);
    this.#frameManager = new FrameManager(
      client,
      this,
      ignoreHTTPSErrors,
      this.#timeoutSettings
    );
    this.#emulationManager = new EmulationManager(client);
    this.#tracing = new Tracing(client);
    this.#coverage = new Coverage(client);
    this.#screenshotTaskQueue = screenshotTaskQueue;
    this.#viewport = null;

    this.#target
      ._targetManager()
      .addTargetInterceptor(this.#client, this.#onAttachedToTarget);

    this.#target
      ._targetManager()
      .on(TargetManagerEmittedEvents.TargetGone, this.#onDetachedFromTarget);

    this.#frameManager.on(FrameManagerEmittedEvents.FrameAttached, event => {
      return this.emit(PageEmittedEvents.FrameAttached, event);
    });
    this.#frameManager.on(FrameManagerEmittedEvents.FrameDetached, event => {
      return this.emit(PageEmittedEvents.FrameDetached, event);
    });
    this.#frameManager.on(FrameManagerEmittedEvents.FrameNavigated, event => {
      return this.emit(PageEmittedEvents.FrameNavigated, event);
    });

    const networkManager = this.#frameManager.networkManager;
    networkManager.on(NetworkManagerEmittedEvents.Request, event => {
      return this.emit(PageEmittedEvents.Request, event);
    });
    networkManager.on(
      NetworkManagerEmittedEvents.RequestServedFromCache,
      event => {
        return this.emit(PageEmittedEvents.RequestServedFromCache, event);
      }
    );
    networkManager.on(NetworkManagerEmittedEvents.Response, event => {
      return this.emit(PageEmittedEvents.Response, event);
    });
    networkManager.on(NetworkManagerEmittedEvents.RequestFailed, event => {
      return this.emit(PageEmittedEvents.RequestFailed, event);
    });
    networkManager.on(NetworkManagerEmittedEvents.RequestFinished, event => {
      return this.emit(PageEmittedEvents.RequestFinished, event);
    });

    client.on('Page.domContentEventFired', () => {
      return this.emit(PageEmittedEvents.DOMContentLoaded);
    });
    client.on('Page.loadEventFired', () => {
      return this.emit(PageEmittedEvents.Load);
    });
    client.on('Runtime.consoleAPICalled', event => {
      return this.#onConsoleAPI(event);
    });
    client.on('Runtime.bindingCalled', event => {
      return this.#onBindingCalled(event);
    });
    client.on('Page.javascriptDialogOpening', event => {
      return this.#onDialog(event);
    });
    client.on('Runtime.exceptionThrown', exception => {
      return this.#handleException(exception.exceptionDetails);
    });
    client.on('Inspector.targetCrashed', () => {
      return this.#onTargetCrashed();
    });
    client.on('Performance.metrics', event => {
      return this.#emitMetrics(event);
    });
    client.on('Log.entryAdded', event => {
      return this.#onLogEntryAdded(event);
    });
    client.on('Page.fileChooserOpened', event => {
      return this.#onFileChooser(event);
    });
    this.#target._isClosedPromise.then(() => {
      this.#target
        ._targetManager()
        .removeTargetInterceptor(this.#client, this.#onAttachedToTarget);

      this.#target
        ._targetManager()
        .off(TargetManagerEmittedEvents.TargetGone, this.#onDetachedFromTarget);
      this.emit(PageEmittedEvents.Close);
      this.#closed = true;
    });
  }

  #onDetachedFromTarget = (target: Target) => {
    const sessionId = target._session()?.id();

    this.#frameManager.onDetachedFromTarget(target);

    const worker = this.#workers.get(sessionId!);
    if (!worker) {
      return;
    }
    this.#workers.delete(sessionId!);
    this.emit(PageEmittedEvents.WorkerDestroyed, worker);
  };

  #onAttachedToTarget = async (createdTarget: Target) => {
    this.#frameManager.onAttachedToTarget(createdTarget);
    if (createdTarget._getTargetInfo().type === 'worker') {
      const session = createdTarget._session();
      assert(session);
      const worker = new WebWorker(
        session,
        createdTarget.url(),
        this.#addConsoleMessage.bind(this),
        this.#handleException.bind(this)
      );
      this.#workers.set(session.id(), worker);
      this.emit(PageEmittedEvents.WorkerCreated, worker);
    }
    if (createdTarget._session()) {
      this.#target
        ._targetManager()
        .addTargetInterceptor(
          createdTarget._session()!,
          this.#onAttachedToTarget
        );
    }
  };

  async #initialize(): Promise<void> {
    await Promise.all([
      this.#frameManager.initialize(this.#target._targetId),
      this.#client.send('Performance.enable'),
      this.#client.send('Log.enable'),
    ]);
  }

  async #onFileChooser(
    event: Protocol.Page.FileChooserOpenedEvent
  ): Promise<void> {
    if (!this.#fileChooserPromises.size) {
      return;
    }

    const frame = this.#frameManager.frame(event.frameId);
    assert(frame, 'This should never happen.');

    // This is guaranteed to be an HTMLInputElement handle by the event.
    const handle = (await frame.worlds[MAIN_WORLD].adoptBackendNode(
      event.backendNodeId
    )) as ElementHandle<HTMLInputElement>;

    const fileChooser = new FileChooser(handle, event);
    for (const promise of this.#fileChooserPromises) {
      promise.resolve(fileChooser);
    }
    this.#fileChooserPromises.clear();
  }

  /**
   * @returns `true` if drag events are being intercepted, `false` otherwise.
   */
  isDragInterceptionEnabled(): boolean {
    return this.#userDragInterceptionEnabled;
  }

  /**
   * @returns `true` if the page has JavaScript enabled, `false` otherwise.
   */
  isJavaScriptEnabled(): boolean {
    return this.#javascriptEnabled;
  }

  /**
   * Listen to page events.
   *
   * :::note
   *
   * This method exists to define event typings and handle proper wireup of
   * cooperative request interception. Actual event listening and dispatching is
   * delegated to {@link EventEmitter}.
   *
   * :::
   */
  override on<K extends keyof PageEventObject>(
    eventName: K,
    handler: (event: PageEventObject[K]) => void
  ): EventEmitter {
    if (eventName === 'request') {
      const wrap =
        this.#handlerMap.get(handler) ||
        ((event: HTTPRequest) => {
          event.enqueueInterceptAction(() => {
            return handler(event as PageEventObject[K]);
          });
        });

      this.#handlerMap.set(handler, wrap);

      return super.on(eventName, wrap);
    }
    return super.on(eventName, handler);
  }

  override once<K extends keyof PageEventObject>(
    eventName: K,
    handler: (event: PageEventObject[K]) => void
  ): EventEmitter {
    // Note: this method only exists to define the types; we delegate the impl
    // to EventEmitter.
    return super.once(eventName, handler);
  }

  override off<K extends keyof PageEventObject>(
    eventName: K,
    handler: (event: PageEventObject[K]) => void
  ): EventEmitter {
    if (eventName === 'request') {
      handler = this.#handlerMap.get(handler) || handler;
    }

    return super.off(eventName, handler);
  }

  /**
   * This method is typically coupled with an action that triggers file
   * choosing.
   *
   * :::caution
   *
   * This must be called before the file chooser is launched. It will not return
   * a currently active file chooser.
   *
   * :::
   *
   * @remarks
   * In non-headless Chromium, this method results in the native file picker
   * dialog `not showing up` for the user.
   *
   * @example
   * The following example clicks a button that issues a file chooser
   * and then responds with `/tmp/myfile.pdf` as if a user has selected this file.
   *
   * ```ts
   * const [fileChooser] = await Promise.all([
   *   page.waitForFileChooser(),
   *   page.click('#upload-file-button'),
   *   // some button that triggers file selection
   * ]);
   * await fileChooser.accept(['/tmp/myfile.pdf']);
   * ```
   */
  async waitForFileChooser(
    options: WaitTimeoutOptions = {}
  ): Promise<FileChooser> {
    if (!this.#fileChooserPromises.size) {
      await this.#client.send('Page.setInterceptFileChooserDialog', {
        enabled: true,
      });
    }

    const {timeout = this.#timeoutSettings.timeout()} = options;
    const promise = createDeferredPromiseWithTimer<FileChooser>(
      `Waiting for \`FileChooser\` failed: ${timeout}ms exceeded`
    );
    this.#fileChooserPromises.add(promise);
    return promise.catch(error => {
      this.#fileChooserPromises.delete(promise);
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
   *
   * ```ts
   * await page.setGeolocation({latitude: 59.95, longitude: 30.31667});
   * ```
   */
  async setGeolocation(options: GeolocationOptions): Promise<void> {
    const {longitude, latitude, accuracy = 0} = options;
    if (longitude < -180 || longitude > 180) {
      throw new Error(
        `Invalid longitude "${longitude}": precondition -180 <= LONGITUDE <= 180 failed.`
      );
    }
    if (latitude < -90 || latitude > 90) {
      throw new Error(
        `Invalid latitude "${latitude}": precondition -90 <= LATITUDE <= 90 failed.`
      );
    }
    if (accuracy < 0) {
      throw new Error(
        `Invalid accuracy "${accuracy}": precondition 0 <= ACCURACY failed.`
      );
    }
    await this.#client.send('Emulation.setGeolocationOverride', {
      longitude,
      latitude,
      accuracy,
    });
  }

  /**
   * @returns A target this page was created from.
   */
  target(): Target {
    return this.#target;
  }

  /**
   * @internal
   */
  _client(): CDPSession {
    return this.#client;
  }

  /**
   * Get the browser the page belongs to.
   */
  browser(): Browser {
    return this.#target.browser();
  }

  /**
   * Get the browser context that the page belongs to.
   */
  browserContext(): BrowserContext {
    return this.#target.browserContext();
  }

  #onTargetCrashed(): void {
    this.emit('error', new Error('Page crashed!'));
  }

  #onLogEntryAdded(event: Protocol.Log.EntryAddedEvent): void {
    const {level, text, args, source, url, lineNumber} = event.entry;
    if (args) {
      args.map(arg => {
        return releaseObject(this.#client, arg);
      });
    }
    if (source !== 'worker') {
      this.emit(
        PageEmittedEvents.Console,
        new ConsoleMessage(level, text, [], [{url, lineNumber}])
      );
    }
  }

  /**
   * @returns The page's main frame.
   *
   * @remarks
   * Page is guaranteed to have a main frame which persists during navigations.
   */
  mainFrame(): Frame {
    return this.#frameManager.mainFrame();
  }

  get keyboard(): Keyboard {
    return this.#keyboard;
  }

  get touchscreen(): Touchscreen {
    return this.#touchscreen;
  }

  get coverage(): Coverage {
    return this.#coverage;
  }

  get tracing(): Tracing {
    return this.#tracing;
  }

  get accessibility(): Accessibility {
    return this.#accessibility;
  }

  /**
   * @returns An array of all frames attached to the page.
   */
  frames(): Frame[] {
    return this.#frameManager.frames();
  }

  /**
   * @returns all of the dedicated {@link
   * https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API |
   * WebWorkers} associated with the page.
   *
   * @remarks
   * This does not contain ServiceWorkers
   */
  workers(): WebWorker[] {
    return Array.from(this.#workers.values());
  }

  /**
   * Activating request interception enables {@link HTTPRequest.abort},
   * {@link HTTPRequest.continue} and {@link HTTPRequest.respond} methods. This
   * provides the capability to modify network requests that are made by a page.
   *
   * Once request interception is enabled, every request will stall unless it's
   * continued, responded or aborted; or completed using the browser cache.
   *
   * Enabling request interception disables page caching.
   *
   * See the
   * {@link https://pptr.dev/next/guides/request-interception|Request interception guide}
   * for more details.
   *
   * @example
   * An example of a naïve request interceptor that aborts all image requests:
   *
   * ```ts
   * const puppeteer = require('puppeteer');
   * (async () => {
   *   const browser = await puppeteer.launch();
   *   const page = await browser.newPage();
   *   await page.setRequestInterception(true);
   *   page.on('request', interceptedRequest => {
   *     if (
   *       interceptedRequest.url().endsWith('.png') ||
   *       interceptedRequest.url().endsWith('.jpg')
   *     )
   *       interceptedRequest.abort();
   *     else interceptedRequest.continue();
   *   });
   *   await page.goto('https://example.com');
   *   await browser.close();
   * })();
   * ```
   *
   * @param value - Whether to enable request interception.
   */
  async setRequestInterception(value: boolean): Promise<void> {
    return this.#frameManager.networkManager.setRequestInterception(value);
  }

  /**
   * @param enabled - Whether to enable drag interception.
   *
   * @remarks
   * Activating drag interception enables the `Input.drag`,
   * methods This provides the capability to capture drag events emitted
   * on the page, which can then be used to simulate drag-and-drop.
   */
  async setDragInterception(enabled: boolean): Promise<void> {
    this.#userDragInterceptionEnabled = enabled;
    return this.#client.send('Input.setInterceptDrags', {enabled});
  }

  /**
   * @param enabled - When `true`, enables offline mode for the page.
   * @remarks
   * NOTE: while this method sets the network connection to offline, it does
   * not change the parameters used in [page.emulateNetworkConditions(networkConditions)]
   * (#pageemulatenetworkconditionsnetworkconditions)
   */
  setOfflineMode(enabled: boolean): Promise<void> {
    return this.#frameManager.networkManager.setOfflineMode(enabled);
  }

  /**
   * @param networkConditions - Passing `null` disables network condition emulation.
   * @example
   *
   * ```ts
   * const puppeteer = require('puppeteer');
   * const slow3G = puppeteer.networkConditions['Slow 3G'];
   *
   * (async () => {
   *   const browser = await puppeteer.launch();
   *   const page = await browser.newPage();
   *   await page.emulateNetworkConditions(slow3G);
   *   await page.goto('https://www.google.com');
   *   // other actions...
   *   await browser.close();
   * })();
   * ```
   *
   * @remarks
   * NOTE: This does not affect WebSockets and WebRTC PeerConnections (see
   * https://crbug.com/563644). To set the page offline, you can use
   * [page.setOfflineMode(enabled)](#pagesetofflinemodeenabled).
   */
  emulateNetworkConditions(
    networkConditions: NetworkConditions | null
  ): Promise<void> {
    return this.#frameManager.networkManager.emulateNetworkConditions(
      networkConditions
    );
  }

  /**
   * This setting will change the default maximum navigation time for the
   * following methods and related shortcuts:
   *
   * - {@link Page.goBack | page.goBack(options)}
   *
   * - {@link Page.goForward | page.goForward(options)}
   *
   * - {@link Page.goto | page.goto(url,options)}
   *
   * - {@link Page.reload | page.reload(options)}
   *
   * - {@link Page.setContent | page.setContent(html,options)}
   *
   * - {@link Page.waitForNavigation | page.waitForNavigation(options)}
   *   @param timeout - Maximum navigation time in milliseconds.
   */
  setDefaultNavigationTimeout(timeout: number): void {
    this.#timeoutSettings.setDefaultNavigationTimeout(timeout);
  }

  /**
   * @param timeout - Maximum time in milliseconds.
   */
  setDefaultTimeout(timeout: number): void {
    this.#timeoutSettings.setDefaultTimeout(timeout);
  }

  /**
   * Runs `document.querySelector` within the page. If no element matches the
   * selector, the return value resolves to `null`.
   *
   * @param selector - A `selector` to query page for
   * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors | selector}
   * to query page for.
   */
  async $<Selector extends string>(
    selector: Selector
  ): Promise<ElementHandle<NodeFor<Selector>> | null> {
    return this.mainFrame().$(selector);
  }

  /**
   * The method runs `document.querySelectorAll` within the page. If no elements
   * match the selector, the return value resolves to `[]`.
   * @remarks
   * Shortcut for {@link Frame.$$ | Page.mainFrame().$$(selector) }.
   * @param selector - A `selector` to query page for
   */
  async $$<Selector extends string>(
    selector: Selector
  ): Promise<Array<ElementHandle<NodeFor<Selector>>>> {
    return this.mainFrame().$$(selector);
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
   *
   * ```ts
   * const aHandle = await page.evaluateHandle('document');
   * ```
   *
   * @example
   * {@link JSHandle} instances can be passed as arguments to the `pageFunction`:
   *
   * ```ts
   * const aHandle = await page.evaluateHandle(() => document.body);
   * const resultHandle = await page.evaluateHandle(
   *   body => body.innerHTML,
   *   aHandle
   * );
   * console.log(await resultHandle.jsonValue());
   * await resultHandle.dispose();
   * ```
   *
   * Most of the time this function returns a {@link JSHandle},
   * but if `pageFunction` returns a reference to an element,
   * you instead get an {@link ElementHandle} back:
   *
   * @example
   *
   * ```ts
   * const button = await page.evaluateHandle(() =>
   *   document.querySelector('button')
   * );
   * // can call `click` because `button` is an `ElementHandle`
   * await button.click();
   * ```
   *
   * The TypeScript definitions assume that `evaluateHandle` returns
   * a `JSHandle`, but if you know it's going to return an
   * `ElementHandle`, pass it as the generic argument:
   *
   * ```ts
   * const button = await page.evaluateHandle<ElementHandle>(...);
   * ```
   *
   * @param pageFunction - a function that is run within the page
   * @param args - arguments to be passed to the pageFunction
   */
  async evaluateHandle<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>> {
    const context = await this.mainFrame().executionContext();
    return context.evaluateHandle(pageFunction, ...args);
  }

  /**
   * This method iterates the JavaScript heap and finds all objects with the
   * given prototype.
   *
   * @remarks
   * Shortcut for
   * {@link ExecutionContext.queryObjects |
   * page.mainFrame().executionContext().queryObjects(prototypeHandle)}.
   *
   * @example
   *
   * ```ts
   * // Create a Map object
   * await page.evaluate(() => (window.map = new Map()));
   * // Get a handle to the Map object prototype
   * const mapPrototype = await page.evaluateHandle(() => Map.prototype);
   * // Query all map instances into an array
   * const mapInstances = await page.queryObjects(mapPrototype);
   * // Count amount of map objects in heap
   * const count = await page.evaluate(maps => maps.length, mapInstances);
   * await mapInstances.dispose();
   * await mapPrototype.dispose();
   * ```
   *
   * @param prototypeHandle - a handle to the object prototype.
   * @returns Promise which resolves to a handle to an array of objects with
   * this prototype.
   */
  async queryObjects<Prototype>(
    prototypeHandle: JSHandle<Prototype>
  ): Promise<JSHandle<Prototype[]>> {
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
   * ```ts
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
   * ```ts
   * // if you don't provide HTMLInputElement here, TS will error
   * // as `value` is not on `Element`
   * const searchValue = await page.$eval(
   *   '#search',
   *   (el: HTMLInputElement) => el.value
   * );
   * ```
   *
   * The compiler should be able to infer the return type
   * from the `pageFunction` you provide. If it is unable to, you can use the generic
   * type to tell the compiler what return type you expect from `$eval`:
   *
   * @example
   *
   * ```ts
   * // The compiler can infer the return type in this case, but if it can't
   * // or if you want to be more explicit, provide it as the generic type.
   * const searchValue = await page.$eval<string>(
   *   '#search',
   *   (el: HTMLInputElement) => el.value
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
  async $eval<
    Selector extends string,
    Params extends unknown[],
    Func extends EvaluateFunc<
      [ElementHandle<NodeFor<Selector>>, ...Params]
    > = EvaluateFunc<[ElementHandle<NodeFor<Selector>>, ...Params]>
  >(
    selector: Selector,
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>> {
    return this.mainFrame().$eval(selector, pageFunction, ...args);
  }

  /**
   * This method runs `Array.from(document.querySelectorAll(selector))` within
   * the page and passes the result as the first argument to the `pageFunction`.
   *
   * @remarks
   * If `pageFunction` returns a promise `$$eval` will wait for the promise to
   * resolve and then return its value.
   *
   * @example
   *
   * ```ts
   * // get the amount of divs on the page
   * const divCount = await page.$$eval('div', divs => divs.length);
   *
   * // get the text content of all the `.options` elements:
   * const options = await page.$$eval('div > span.options', options => {
   *   return options.map(option => option.textContent);
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
   * ```ts
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
   * ```ts
   * // The compiler can infer the return type in this case, but if it can't
   * // or if you want to be more explicit, provide it as the generic type.
   * const allInputValues = await page.$$eval<string[]>(
   *   'input',
   *   (elements: HTMLInputElement[]) => elements.map(e => e.textContent)
   * );
   * ```
   *
   * @param selector - the
   * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors | selector}
   * to query for
   * @param pageFunction - the function to be evaluated in the page context.
   * Will be passed the result of
   * `Array.from(document.querySelectorAll(selector))` as its first argument.
   * @param args - any additional arguments to pass through to `pageFunction`.
   *
   * @returns The result of calling `pageFunction`. If it returns an element it
   * is wrapped in an {@link ElementHandle}, else the raw value itself is
   * returned.
   */
  async $$eval<
    Selector extends string,
    Params extends unknown[],
    Func extends EvaluateFunc<
      [Array<NodeFor<Selector>>, ...Params]
    > = EvaluateFunc<[Array<NodeFor<Selector>>, ...Params]>
  >(
    selector: Selector,
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>> {
    return this.mainFrame().$$eval(selector, pageFunction, ...args);
  }

  /**
   * The method evaluates the XPath expression relative to the page document as
   * its context node. If there are no such elements, the method resolves to an
   * empty array.
   *
   * @remarks
   * Shortcut for {@link Frame.$x | Page.mainFrame().$x(expression) }.
   *
   * @param expression - Expression to evaluate
   */
  async $x(expression: string): Promise<Array<ElementHandle<Node>>> {
    return this.mainFrame().$x(expression);
  }

  /**
   * If no URLs are specified, this method returns cookies for the current page
   * URL. If URLs are specified, only cookies for those URLs are returned.
   */
  async cookies(...urls: string[]): Promise<Protocol.Network.Cookie[]> {
    const originalCookies = (
      await this.#client.send('Network.getCookies', {
        urls: urls.length ? urls : [this.url()],
      })
    ).cookies;

    const unsupportedCookieAttributes = ['priority'];
    const filterUnsupportedAttributes = (
      cookie: Protocol.Network.Cookie
    ): Protocol.Network.Cookie => {
      for (const attr of unsupportedCookieAttributes) {
        delete (cookie as unknown as Record<string, unknown>)[attr];
      }
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
      if (!cookie.url && pageURL.startsWith('http')) {
        item.url = pageURL;
      }
      await this.#client.send('Network.deleteCookies', item);
    }
  }

  /**
   * @example
   *
   * ```ts
   * await page.setCookie(cookieObject1, cookieObject2);
   * ```
   */
  async setCookie(...cookies: Protocol.Network.CookieParam[]): Promise<void> {
    const pageURL = this.url();
    const startsWithHTTP = pageURL.startsWith('http');
    const items = cookies.map(cookie => {
      const item = Object.assign({}, cookie);
      if (!item.url && startsWithHTTP) {
        item.url = pageURL;
      }
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
    if (items.length) {
      await this.#client.send('Network.setCookies', {cookies: items});
    }
  }

  /**
   * Adds a `<script>` tag into the page with the desired URL or content.
   *
   * @remarks
   * Shortcut for
   * {@link Frame.addScriptTag | page.mainFrame().addScriptTag(options)}.
   *
   * @returns Promise which resolves to the added tag when the script's onload
   * fires or when the script content was injected into frame.
   */
  async addScriptTag(options: {
    url?: string;
    path?: string;
    content?: string;
    type?: string;
    id?: string;
  }): Promise<ElementHandle<HTMLScriptElement>> {
    return this.mainFrame().addScriptTag(options);
  }

  /**
   * Adds a `<link rel="stylesheet">` tag into the page with the desired URL or a
   * `<style type="text/css">` tag with the content.
   * @returns Promise which resolves to the added tag when the stylesheet's
   * onload fires or when the CSS content was injected into frame.
   */
  async addStyleTag(options: {
    url?: string;
    path?: string;
    content?: string;
  }): Promise<ElementHandle<Node>> {
    return this.mainFrame().addStyleTag(options);
  }

  /**
   * The method adds a function called `name` on the page's `window` object.
   * When called, the function executes `puppeteerFunction` in node.js and
   * returns a `Promise` which resolves to the return value of
   * `puppeteerFunction`.
   *
   * If the puppeteerFunction returns a `Promise`, it will be awaited.
   *
   * :::note
   *
   * Functions installed via `page.exposeFunction` survive navigations.
   *
   * :::note
   *
   * @example
   * An example of adding an `md5` function into the page:
   *
   * ```ts
   * const puppeteer = require('puppeteer');
   * const crypto = require('crypto');
   *
   * (async () => {
   *   const browser = await puppeteer.launch();
   *   const page = await browser.newPage();
   *   page.on('console', msg => console.log(msg.text()));
   *   await page.exposeFunction('md5', text =>
   *     crypto.createHash('md5').update(text).digest('hex')
   *   );
   *   await page.evaluate(async () => {
   *     // use window.md5 to compute hashes
   *     const myString = 'PUPPETEER';
   *     const myHash = await window.md5(myString);
   *     console.log(`md5 of ${myString} is ${myHash}`);
   *   });
   *   await browser.close();
   * })();
   * ```
   *
   * @example
   * An example of adding a `window.readfile` function into the page:
   *
   * ```ts
   * const puppeteer = require('puppeteer');
   * const fs = require('fs');
   *
   * (async () => {
   *   const browser = await puppeteer.launch();
   *   const page = await browser.newPage();
   *   page.on('console', msg => console.log(msg.text()));
   *   await page.exposeFunction('readfile', async filePath => {
   *     return new Promise((resolve, reject) => {
   *       fs.readFile(filePath, 'utf8', (err, text) => {
   *         if (err) reject(err);
   *         else resolve(text);
   *       });
   *     });
   *   });
   *   await page.evaluate(async () => {
   *     // use window.readfile to read contents of a file
   *     const content = await window.readfile('/etc/hosts');
   *     console.log(content);
   *   });
   *   await browser.close();
   * })();
   * ```
   *
   * @param name - Name of the function on the window object
   * @param pptrFunction - Callback function which will be called in Puppeteer's
   * context.
   */
  async exposeFunction(
    name: string,
    pptrFunction: Function | {default: Function}
  ): Promise<void> {
    if (this.#pageBindings.has(name)) {
      throw new Error(
        `Failed to add page binding with name ${name}: window['${name}'] already exists!`
      );
    }

    let exposedFunction: Function;
    switch (typeof pptrFunction) {
      case 'function':
        exposedFunction = pptrFunction;
        break;
      default:
        exposedFunction = pptrFunction.default;
        break;
    }

    this.#pageBindings.set(name, exposedFunction);

    const expression = pageBindingInitString('exposedFun', name);
    await this.#client.send('Runtime.addBinding', {name: name});
    await this.#client.send('Page.addScriptToEvaluateOnNewDocument', {
      source: expression,
    });
    await Promise.all(
      this.frames().map(frame => {
        return frame.evaluate(expression).catch(debugError);
      })
    );
  }

  /**
   * Provide credentials for `HTTP authentication`.
   *
   * @remarks
   * To disable authentication, pass `null`.
   */
  async authenticate(credentials: Credentials): Promise<void> {
    return this.#frameManager.networkManager.authenticate(credentials);
  }

  /**
   * The extra HTTP headers will be sent with every request the page initiates.
   *
   * :::tip
   *
   * All HTTP header names are lowercased. (HTTP headers are
   * case-insensitive, so this shouldn’t impact your server code.)
   *
   * :::
   *
   * :::note
   *
   * page.setExtraHTTPHeaders does not guarantee the order of headers in
   * the outgoing requests.
   *
   * :::
   *
   * @param headers - An object containing additional HTTP headers to be sent
   * with every request. All header values must be strings.
   */
  async setExtraHTTPHeaders(headers: Record<string, string>): Promise<void> {
    return this.#frameManager.networkManager.setExtraHTTPHeaders(headers);
  }

  /**
   * @param userAgent - Specific user agent to use in this page
   * @param userAgentData - Specific user agent client hint data to use in this
   * page
   * @returns Promise which resolves when the user agent is set.
   */
  async setUserAgent(
    userAgent: string,
    userAgentMetadata?: Protocol.Emulation.UserAgentMetadata
  ): Promise<void> {
    return this.#frameManager.networkManager.setUserAgent(
      userAgent,
      userAgentMetadata
    );
  }

  /**
   * @returns Object containing metrics as key/value pairs.
   *
   * - `Timestamp` : The timestamp when the metrics sample was taken.
   *
   * - `Documents` : Number of documents in the page.
   *
   * - `Frames` : Number of frames in the page.
   *
   * - `JSEventListeners` : Number of events in the page.
   *
   * - `Nodes` : Number of DOM nodes in the page.
   *
   * - `LayoutCount` : Total number of full or partial page layout.
   *
   * - `RecalcStyleCount` : Total number of page style recalculations.
   *
   * - `LayoutDuration` : Combined durations of all page layouts.
   *
   * - `RecalcStyleDuration` : Combined duration of all page style
   *   recalculations.
   *
   * - `ScriptDuration` : Combined duration of JavaScript execution.
   *
   * - `TaskDuration` : Combined duration of all tasks performed by the browser.
   *
   * - `JSHeapUsedSize` : Used JavaScript heap size.
   *
   * - `JSHeapTotalSize` : Total JavaScript heap size.
   *
   * @remarks
   * All timestamps are in monotonic time: monotonically increasing time
   * in seconds since an arbitrary point in the past.
   */
  async metrics(): Promise<Metrics> {
    const response = await this.#client.send('Performance.getMetrics');
    return this.#buildMetricsObject(response.metrics);
  }

  #emitMetrics(event: Protocol.Performance.MetricsEvent): void {
    this.emit(PageEmittedEvents.Metrics, {
      title: event.title,
      metrics: this.#buildMetricsObject(event.metrics),
    });
  }

  #buildMetricsObject(metrics?: Protocol.Performance.Metric[]): Metrics {
    const result: Record<
      Protocol.Performance.Metric['name'],
      Protocol.Performance.Metric['value']
    > = {};
    for (const metric of metrics || []) {
      if (supportedMetrics.has(metric.name)) {
        result[metric.name] = metric.value;
      }
    }
    return result;
  }

  #handleException(exceptionDetails: Protocol.Runtime.ExceptionDetails): void {
    const message = getExceptionMessage(exceptionDetails);
    const err = new Error(message);
    err.stack = ''; // Don't report clientside error with a node stack attached
    this.emit(PageEmittedEvents.PageError, err);
  }

  async #onConsoleAPI(
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
    const context = this.#frameManager.executionContextById(
      event.executionContextId,
      this.#client
    );
    const values = event.args.map(arg => {
      return createJSHandle(context, arg);
    });
    this.#addConsoleMessage(event.type, values, event.stackTrace);
  }

  async #onBindingCalled(
    event: Protocol.Runtime.BindingCalledEvent
  ): Promise<void> {
    let payload: {type: string; name: string; seq: number; args: unknown[]};
    try {
      payload = JSON.parse(event.payload);
    } catch {
      // The binding was either called by something in the page or it was
      // called before our wrapper was initialized.
      return;
    }
    const {type, name, seq, args} = payload;
    if (type !== 'exposedFun' || !this.#pageBindings.has(name)) {
      return;
    }
    let expression = null;
    try {
      const pageBinding = this.#pageBindings.get(name);
      assert(pageBinding);
      const result = await pageBinding(...args);
      expression = pageBindingDeliverResultString(name, seq, result);
    } catch (error) {
      if (isErrorLike(error)) {
        expression = pageBindingDeliverErrorString(
          name,
          seq,
          error.message,
          error.stack
        );
      } else {
        expression = pageBindingDeliverErrorValueString(name, seq, error);
      }
    }
    this.#client
      .send('Runtime.evaluate', {
        expression,
        contextId: event.executionContextId,
      })
      .catch(debugError);
  }

  #addConsoleMessage(
    eventType: ConsoleMessageType,
    args: JSHandle[],
    stackTrace?: Protocol.Runtime.StackTrace
  ): void {
    if (!this.listenerCount(PageEmittedEvents.Console)) {
      args.forEach(arg => {
        return arg.dispose();
      });
      return;
    }
    const textTokens = [];
    for (const arg of args) {
      const remoteObject = arg.remoteObject();
      if (remoteObject.objectId) {
        textTokens.push(arg.toString());
      } else {
        textTokens.push(valueFromRemoteObject(remoteObject));
      }
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
      eventType,
      textTokens.join(' '),
      args,
      stackTraceLocations
    );
    this.emit(PageEmittedEvents.Console, message);
  }

  #onDialog(event: Protocol.Page.JavascriptDialogOpeningEvent): void {
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
      this.#client,
      dialogType,
      event.message,
      event.defaultPrompt
    );
    this.emit(PageEmittedEvents.Dialog, dialog);
  }

  /**
   * Resets default white background
   */
  async #resetDefaultBackgroundColor() {
    await this.#client.send('Emulation.setDefaultBackgroundColorOverride');
  }

  /**
   * Hides default white background
   */
  async #setTransparentBackgroundColor(): Promise<void> {
    await this.#client.send('Emulation.setDefaultBackgroundColorOverride', {
      color: {r: 0, g: 0, b: 0, a: 0},
    });
  }

  /**
   *
   * @returns
   * @remarks Shortcut for
   * {@link Frame.url | page.mainFrame().url()}.
   */
  url(): string {
    return this.mainFrame().url();
  }

  async content(): Promise<string> {
    return await this.#frameManager.mainFrame().content();
  }

  /**
   * @param html - HTML markup to assign to the page.
   * @param options - Parameters that has some properties.
   * @remarks
   * The parameter `options` might have the following options.
   *
   * - `timeout` : Maximum time in milliseconds for resources to load, defaults
   *   to 30 seconds, pass `0` to disable timeout. The default value can be
   *   changed by using the {@link Page.setDefaultNavigationTimeout} or
   *   {@link Page.setDefaultTimeout} methods.
   *
   * - `waitUntil`: When to consider setting markup succeeded, defaults to
   *   `load`. Given an array of event strings, setting content is considered
   *   to be successful after all events have been fired. Events can be
   *   either:<br/>
   * - `load` : consider setting content to be finished when the `load` event
   *   is fired.<br/>
   * - `domcontentloaded` : consider setting content to be finished when the
   *   `DOMContentLoaded` event is fired.<br/>
   * - `networkidle0` : consider setting content to be finished when there are
   *   no more than 0 network connections for at least `500` ms.<br/>
   * - `networkidle2` : consider setting content to be finished when there are
   *   no more than 2 network connections for at least `500` ms.
   */
  async setContent(html: string, options: WaitForOptions = {}): Promise<void> {
    await this.#frameManager.mainFrame().setContent(html, options);
  }

  /**
   * @param url - URL to navigate page to. The URL should include scheme, e.g.
   * `https://`
   * @param options - Navigation Parameter
   * @returns Promise which resolves to the main resource response. In case of
   * multiple redirects, the navigation will resolve with the response of the
   * last redirect.
   * @remarks
   * The argument `options` might have the following properties:
   *
   * - `timeout` : Maximum navigation time in milliseconds, defaults to 30
   *   seconds, pass 0 to disable timeout. The default value can be changed by
   *   using the {@link Page.setDefaultNavigationTimeout} or
   *   {@link Page.setDefaultTimeout} methods.
   *
   * - `waitUntil`:When to consider navigation succeeded, defaults to `load`.
   *   Given an array of event strings, navigation is considered to be
   *   successful after all events have been fired. Events can be either:<br/>
   * - `load` : consider navigation to be finished when the load event is
   *   fired.<br/>
   * - `domcontentloaded` : consider navigation to be finished when the
   *   DOMContentLoaded event is fired.<br/>
   * - `networkidle0` : consider navigation to be finished when there are no
   *   more than 0 network connections for at least `500` ms.<br/>
   * - `networkidle2` : consider navigation to be finished when there are no
   *   more than 2 network connections for at least `500` ms.
   *
   * - `referer` : Referer header value. If provided it will take preference
   *   over the referer header value set by
   *   {@link Page.setExtraHTTPHeaders |page.setExtraHTTPHeaders()}.
   *
   * `page.goto` will throw an error if:
   *
   * - there's an SSL error (e.g. in case of self-signed certificates).
   * - target URL is invalid.
   * - the timeout is exceeded during navigation.
   * - the remote server does not respond or is unreachable.
   * - the main resource failed to load.
   *
   * `page.goto` will not throw an error when any valid HTTP status code is
   * returned by the remote server, including 404 "Not Found" and 500
   * "Internal Server Error". The status code for such responses can be
   * retrieved by calling response.status().
   *
   * NOTE: `page.goto` either throws an error or returns a main resource
   * response. The only exceptions are navigation to about:blank or navigation
   * to the same URL with a different hash, which would succeed and return null.
   *
   * NOTE: Headless mode doesn't support navigation to a PDF document. See the
   * {@link https://bugs.chromium.org/p/chromium/issues/detail?id=761295 |
   * upstream issue}.
   *
   * Shortcut for {@link Frame.goto | page.mainFrame().goto(url, options)}.
   */
  async goto(
    url: string,
    options: WaitForOptions & {referer?: string} = {}
  ): Promise<HTTPResponse | null> {
    return await this.#frameManager.mainFrame().goto(url, options);
  }

  /**
   * @param options - Navigation parameters which might have the following
   * properties:
   * @returns Promise which resolves to the main resource response. In case of
   * multiple redirects, the navigation will resolve with the response of the
   * last redirect.
   * @remarks
   * The argument `options` might have the following properties:
   *
   * - `timeout` : Maximum navigation time in milliseconds, defaults to 30
   *   seconds, pass 0 to disable timeout. The default value can be changed by
   *   using the {@link Page.setDefaultNavigationTimeout} or
   *   {@link Page.setDefaultTimeout} methods.
   *
   * - `waitUntil`: When to consider navigation succeeded, defaults to `load`.
   *   Given an array of event strings, navigation is considered to be
   *   successful after all events have been fired. Events can be either:<br/>
   * - `load` : consider navigation to be finished when the load event is
   *   fired.<br/>
   * - `domcontentloaded` : consider navigation to be finished when the
   *   DOMContentLoaded event is fired.<br/>
   * - `networkidle0` : consider navigation to be finished when there are no
   *   more than 0 network connections for at least `500` ms.<br/>
   * - `networkidle2` : consider navigation to be finished when there are no
   *   more than 2 network connections for at least `500` ms.
   */
  async reload(options?: WaitForOptions): Promise<HTTPResponse | null> {
    const result = await Promise.all([
      this.waitForNavigation(options),
      this.#client.send('Page.reload'),
    ]);

    return result[0];
  }

  /**
   * Waits for the page to navigate to a new URL or to reload. It is useful when
   * you run code that will indirectly cause the page to navigate.
   *
   * @example
   *
   * ```ts
   * const [response] = await Promise.all([
   *   page.waitForNavigation(), // The promise resolves after navigation has finished
   *   page.click('a.my-link'), // Clicking the link will indirectly cause a navigation
   * ]);
   * ```
   *
   * @remarks
   * Usage of the
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/History_API | History API}
   * to change the URL is considered a navigation.
   *
   * @param options - Navigation parameters which might have the following
   * properties:
   * @returns A `Promise` which resolves to the main resource response.
   *
   * - In case of multiple redirects, the navigation will resolve with the
   *   response of the last redirect.
   * - In case of navigation to a different anchor or navigation due to History
   *   API usage, the navigation will resolve with `null`.
   */
  async waitForNavigation(
    options: WaitForOptions = {}
  ): Promise<HTTPResponse | null> {
    return await this.#frameManager.mainFrame().waitForNavigation(options);
  }

  #sessionClosePromise(): Promise<Error> {
    if (!this.#disconnectPromise) {
      this.#disconnectPromise = new Promise(fulfill => {
        return this.#client.once(CDPSessionEmittedEvents.Disconnected, () => {
          return fulfill(new Error('Target closed'));
        });
      });
    }
    return this.#disconnectPromise;
  }

  /**
   * @param urlOrPredicate - A URL or predicate to wait for
   * @param options - Optional waiting parameters
   * @returns Promise which resolves to the matched response
   * @example
   *
   * ```ts
   * const firstResponse = await page.waitForResponse(
   *   'https://example.com/resource'
   * );
   * const finalResponse = await page.waitForResponse(
   *   response =>
   *     response.url() === 'https://example.com' && response.status() === 200
   * );
   * const finalResponse = await page.waitForResponse(async response => {
   *   return (await response.text()).includes('<html>');
   * });
   * return finalResponse.ok();
   * ```
   *
   * @remarks
   * Optional Waiting Parameters have:
   *
   * - `timeout`: Maximum wait time in milliseconds, defaults to `30` seconds, pass
   *   `0` to disable the timeout. The default value can be changed by using the
   *   {@link Page.setDefaultTimeout} method.
   */
  async waitForRequest(
    urlOrPredicate: string | ((req: HTTPRequest) => boolean | Promise<boolean>),
    options: {timeout?: number} = {}
  ): Promise<HTTPRequest> {
    const {timeout = this.#timeoutSettings.timeout()} = options;
    return waitForEvent(
      this.#frameManager.networkManager,
      NetworkManagerEmittedEvents.Request,
      request => {
        if (isString(urlOrPredicate)) {
          return urlOrPredicate === request.url();
        }
        if (typeof urlOrPredicate === 'function') {
          return !!urlOrPredicate(request);
        }
        return false;
      },
      timeout,
      this.#sessionClosePromise()
    );
  }

  /**
   * @param urlOrPredicate - A URL or predicate to wait for.
   * @param options - Optional waiting parameters
   * @returns Promise which resolves to the matched response.
   * @example
   *
   * ```ts
   * const firstResponse = await page.waitForResponse(
   *   'https://example.com/resource'
   * );
   * const finalResponse = await page.waitForResponse(
   *   response =>
   *     response.url() === 'https://example.com' && response.status() === 200
   * );
   * const finalResponse = await page.waitForResponse(async response => {
   *   return (await response.text()).includes('<html>');
   * });
   * return finalResponse.ok();
   * ```
   *
   * @remarks
   * Optional Parameter have:
   *
   * - `timeout`: Maximum wait time in milliseconds, defaults to `30` seconds,
   *   pass `0` to disable the timeout. The default value can be changed by using
   *   the {@link Page.setDefaultTimeout} method.
   */
  async waitForResponse(
    urlOrPredicate:
      | string
      | ((res: HTTPResponse) => boolean | Promise<boolean>),
    options: {timeout?: number} = {}
  ): Promise<HTTPResponse> {
    const {timeout = this.#timeoutSettings.timeout()} = options;
    return waitForEvent(
      this.#frameManager.networkManager,
      NetworkManagerEmittedEvents.Response,
      async response => {
        if (isString(urlOrPredicate)) {
          return urlOrPredicate === response.url();
        }
        if (typeof urlOrPredicate === 'function') {
          return !!(await urlOrPredicate(response));
        }
        return false;
      },
      timeout,
      this.#sessionClosePromise()
    );
  }

  /**
   * @param options - Optional waiting parameters
   * @returns Promise which resolves when network is idle
   */
  async waitForNetworkIdle(
    options: {idleTime?: number; timeout?: number} = {}
  ): Promise<void> {
    const {idleTime = 500, timeout = this.#timeoutSettings.timeout()} = options;

    const networkManager = this.#frameManager.networkManager;

    let idleResolveCallback: () => void;
    const idlePromise = new Promise<void>(resolve => {
      idleResolveCallback = resolve;
    });

    let abortRejectCallback: (error: Error) => void;
    const abortPromise = new Promise<Error>((_, reject) => {
      abortRejectCallback = reject;
    });

    let idleTimer: NodeJS.Timeout;
    const onIdle = () => {
      return idleResolveCallback();
    };

    const cleanup = () => {
      idleTimer && clearTimeout(idleTimer);
      abortRejectCallback(new Error('abort'));
    };

    const evaluate = () => {
      idleTimer && clearTimeout(idleTimer);
      if (networkManager.numRequestsInProgress() === 0) {
        idleTimer = setTimeout(onIdle, idleTime);
      }
    };

    evaluate();

    const eventHandler = () => {
      evaluate();
      return false;
    };

    const listenToEvent = (event: symbol) => {
      return waitForEvent(
        networkManager,
        event,
        eventHandler,
        timeout,
        abortPromise
      );
    };

    const eventPromises = [
      listenToEvent(NetworkManagerEmittedEvents.Request),
      listenToEvent(NetworkManagerEmittedEvents.Response),
    ];

    await Promise.race([
      idlePromise,
      ...eventPromises,
      this.#sessionClosePromise(),
    ]).then(
      r => {
        cleanup();
        return r;
      },
      error => {
        cleanup();
        throw error;
      }
    );
  }

  /**
   * @param urlOrPredicate - A URL or predicate to wait for.
   * @param options - Optional waiting parameters
   * @returns Promise which resolves to the matched frame.
   * @example
   *
   * ```ts
   * const frame = await page.waitForFrame(async frame => {
   *   return frame.name() === 'Test';
   * });
   * ```
   *
   * @remarks
   * Optional Parameter have:
   *
   * - `timeout`: Maximum wait time in milliseconds, defaults to `30` seconds,
   *   pass `0` to disable the timeout. The default value can be changed by using
   *   the {@link Page.setDefaultTimeout} method.
   */
  async waitForFrame(
    urlOrPredicate: string | ((frame: Frame) => boolean | Promise<boolean>),
    options: {timeout?: number} = {}
  ): Promise<Frame> {
    const {timeout = this.#timeoutSettings.timeout()} = options;

    let predicate: (frame: Frame) => Promise<boolean>;
    if (isString(urlOrPredicate)) {
      predicate = (frame: Frame) => {
        return Promise.resolve(urlOrPredicate === frame.url());
      };
    } else {
      predicate = (frame: Frame) => {
        const value = urlOrPredicate(frame);
        if (typeof value === 'boolean') {
          return Promise.resolve(value);
        }
        return value;
      };
    }

    const eventRace: Promise<Frame> = Promise.race([
      waitForEvent(
        this.#frameManager,
        FrameManagerEmittedEvents.FrameAttached,
        predicate,
        timeout,
        this.#sessionClosePromise()
      ),
      waitForEvent(
        this.#frameManager,
        FrameManagerEmittedEvents.FrameNavigated,
        predicate,
        timeout,
        this.#sessionClosePromise()
      ),
      ...this.frames().map(async frame => {
        if (await predicate(frame)) {
          return frame;
        }
        return await eventRace;
      }),
    ]);

    return eventRace;
  }

  /**
   * This method navigate to the previous page in history.
   * @param options - Navigation parameters
   * @returns Promise which resolves to the main resource response. In case of
   * multiple redirects, the navigation will resolve with the response of the
   * last redirect. If can not go back, resolves to `null`.
   * @remarks
   * The argument `options` might have the following properties:
   *
   * - `timeout` : Maximum navigation time in milliseconds, defaults to 30
   *   seconds, pass 0 to disable timeout. The default value can be changed by
   *   using the {@link Page.setDefaultNavigationTimeout} or
   *   {@link Page.setDefaultTimeout} methods.
   *
   * - `waitUntil` : When to consider navigation succeeded, defaults to `load`.
   *   Given an array of event strings, navigation is considered to be
   *   successful after all events have been fired. Events can be either:<br/>
   * - `load` : consider navigation to be finished when the load event is
   *   fired.<br/>
   * - `domcontentloaded` : consider navigation to be finished when the
   *   DOMContentLoaded event is fired.<br/>
   * - `networkidle0` : consider navigation to be finished when there are no
   *   more than 0 network connections for at least `500` ms.<br/>
   * - `networkidle2` : consider navigation to be finished when there are no
   *   more than 2 network connections for at least `500` ms.
   */
  async goBack(options: WaitForOptions = {}): Promise<HTTPResponse | null> {
    return this.#go(-1, options);
  }

  /**
   * This method navigate to the next page in history.
   * @param options - Navigation Parameter
   * @returns Promise which resolves to the main resource response. In case of
   * multiple redirects, the navigation will resolve with the response of the
   * last redirect. If can not go forward, resolves to `null`.
   * @remarks
   * The argument `options` might have the following properties:
   *
   * - `timeout` : Maximum navigation time in milliseconds, defaults to 30
   *   seconds, pass 0 to disable timeout. The default value can be changed by
   *   using the {@link Page.setDefaultNavigationTimeout} or
   *   {@link Page.setDefaultTimeout} methods.
   *
   * - `waitUntil`: When to consider navigation succeeded, defaults to `load`.
   *   Given an array of event strings, navigation is considered to be
   *   successful after all events have been fired. Events can be either:<br/>
   * - `load` : consider navigation to be finished when the load event is
   *   fired.<br/>
   * - `domcontentloaded` : consider navigation to be finished when the
   *   DOMContentLoaded event is fired.<br/>
   * - `networkidle0` : consider navigation to be finished when there are no
   *   more than 0 network connections for at least `500` ms.<br/>
   * - `networkidle2` : consider navigation to be finished when there are no
   *   more than 2 network connections for at least `500` ms.
   */
  async goForward(options: WaitForOptions = {}): Promise<HTTPResponse | null> {
    return this.#go(+1, options);
  }

  async #go(
    delta: number,
    options: WaitForOptions
  ): Promise<HTTPResponse | null> {
    const history = await this.#client.send('Page.getNavigationHistory');
    const entry = history.entries[history.currentIndex + delta];
    if (!entry) {
      return null;
    }
    const result = await Promise.all([
      this.waitForNavigation(options),
      this.#client.send('Page.navigateToHistoryEntry', {entryId: entry.id}),
    ]);
    return result[0];
  }

  /**
   * Brings page to front (activates tab).
   */
  async bringToFront(): Promise<void> {
    await this.#client.send('Page.bringToFront');
  }

  /**
   * Emulates given device metrics and user agent.
   *
   * @remarks
   * This method is a shortcut for calling two methods:
   * {@link Page.setUserAgent} and {@link Page.setViewport} To aid emulation,
   * Puppeteer provides a list of device descriptors that can be obtained via
   * {@link devices}. `page.emulate` will resize the page. A lot of websites
   * don't expect phones to change size, so you should emulate before navigating
   * to the page.
   * @example
   *
   * ```ts
   * const puppeteer = require('puppeteer');
   * const iPhone = puppeteer.devices['iPhone 6'];
   * (async () => {
   *   const browser = await puppeteer.launch();
   *   const page = await browser.newPage();
   *   await page.emulate(iPhone);
   *   await page.goto('https://www.google.com');
   *   // other actions...
   *   await browser.close();
   * })();
   * ```
   *
   * @remarks List of all available devices is available in the source code:
   * {@link https://github.com/puppeteer/puppeteer/blob/main/src/common/DeviceDescriptors.ts | src/common/DeviceDescriptors.ts}.
   */
  async emulate(options: {
    viewport: Viewport;
    userAgent: string;
  }): Promise<void> {
    await Promise.all([
      this.setViewport(options.viewport),
      this.setUserAgent(options.userAgent),
    ]);
  }

  /**
   * @param enabled - Whether or not to enable JavaScript on the page.
   * @returns
   * @remarks
   * NOTE: changing this value won't affect scripts that have already been run.
   * It will take full effect on the next navigation.
   */
  async setJavaScriptEnabled(enabled: boolean): Promise<void> {
    if (this.#javascriptEnabled === enabled) {
      return;
    }
    this.#javascriptEnabled = enabled;
    await this.#client.send('Emulation.setScriptExecutionDisabled', {
      value: !enabled,
    });
  }

  /**
   * Toggles bypassing page's Content-Security-Policy.
   * @param enabled - sets bypassing of page's Content-Security-Policy.
   * @remarks
   * NOTE: CSP bypassing happens at the moment of CSP initialization rather than
   * evaluation. Usually, this means that `page.setBypassCSP` should be called
   * before navigating to the domain.
   */
  async setBypassCSP(enabled: boolean): Promise<void> {
    await this.#client.send('Page.setBypassCSP', {enabled});
  }

  /**
   * @param type - Changes the CSS media type of the page. The only allowed
   * values are `screen`, `print` and `null`. Passing `null` disables CSS media
   * emulation.
   * @example
   *
   * ```ts
   * await page.evaluate(() => matchMedia('screen').matches);
   * // → true
   * await page.evaluate(() => matchMedia('print').matches);
   * // → false
   *
   * await page.emulateMediaType('print');
   * await page.evaluate(() => matchMedia('screen').matches);
   * // → false
   * await page.evaluate(() => matchMedia('print').matches);
   * // → true
   *
   * await page.emulateMediaType(null);
   * await page.evaluate(() => matchMedia('screen').matches);
   * // → true
   * await page.evaluate(() => matchMedia('print').matches);
   * // → false
   * ```
   */
  async emulateMediaType(type?: string): Promise<void> {
    assert(
      type === 'screen' ||
        type === 'print' ||
        (type ?? undefined) === undefined,
      'Unsupported media type: ' + type
    );
    await this.#client.send('Emulation.setEmulatedMedia', {
      media: type || '',
    });
  }

  /**
   * Enables CPU throttling to emulate slow CPUs.
   * @param factor - slowdown factor (1 is no throttle, 2 is 2x slowdown, etc).
   */
  async emulateCPUThrottling(factor: number | null): Promise<void> {
    assert(
      factor === null || factor >= 1,
      'Throttling rate should be greater or equal to 1'
    );
    await this.#client.send('Emulation.setCPUThrottlingRate', {
      rate: factor !== null ? factor : 1,
    });
  }

  /**
   * @param features - `<?Array<Object>>` Given an array of media feature
   * objects, emulates CSS media features on the page. Each media feature object
   * must have the following properties:
   * @example
   *
   * ```ts
   * await page.emulateMediaFeatures([
   *   {name: 'prefers-color-scheme', value: 'dark'},
   * ]);
   * await page.evaluate(
   *   () => matchMedia('(prefers-color-scheme: dark)').matches
   * );
   * // → true
   * await page.evaluate(
   *   () => matchMedia('(prefers-color-scheme: light)').matches
   * );
   * // → false
   *
   * await page.emulateMediaFeatures([
   *   {name: 'prefers-reduced-motion', value: 'reduce'},
   * ]);
   * await page.evaluate(
   *   () => matchMedia('(prefers-reduced-motion: reduce)').matches
   * );
   * // → true
   * await page.evaluate(
   *   () => matchMedia('(prefers-reduced-motion: no-preference)').matches
   * );
   * // → false
   *
   * await page.emulateMediaFeatures([
   *   {name: 'prefers-color-scheme', value: 'dark'},
   *   {name: 'prefers-reduced-motion', value: 'reduce'},
   * ]);
   * await page.evaluate(
   *   () => matchMedia('(prefers-color-scheme: dark)').matches
   * );
   * // → true
   * await page.evaluate(
   *   () => matchMedia('(prefers-color-scheme: light)').matches
   * );
   * // → false
   * await page.evaluate(
   *   () => matchMedia('(prefers-reduced-motion: reduce)').matches
   * );
   * // → true
   * await page.evaluate(
   *   () => matchMedia('(prefers-reduced-motion: no-preference)').matches
   * );
   * // → false
   *
   * await page.emulateMediaFeatures([{name: 'color-gamut', value: 'p3'}]);
   * await page.evaluate(() => matchMedia('(color-gamut: srgb)').matches);
   * // → true
   * await page.evaluate(() => matchMedia('(color-gamut: p3)').matches);
   * // → true
   * await page.evaluate(() => matchMedia('(color-gamut: rec2020)').matches);
   * // → false
   * ```
   */
  async emulateMediaFeatures(features?: MediaFeature[]): Promise<void> {
    if (!features) {
      await this.#client.send('Emulation.setEmulatedMedia', {});
    }
    if (Array.isArray(features)) {
      for (const mediaFeature of features) {
        const name = mediaFeature.name;
        assert(
          /^(?:prefers-(?:color-scheme|reduced-motion)|color-gamut)$/.test(
            name
          ),
          'Unsupported media feature: ' + name
        );
      }
      await this.#client.send('Emulation.setEmulatedMedia', {
        features: features,
      });
    }
  }

  /**
   * @param timezoneId - Changes the timezone of the page. See
   * {@link https://source.chromium.org/chromium/chromium/deps/icu.git/+/faee8bc70570192d82d2978a71e2a615788597d1:source/data/misc/metaZones.txt | ICU’s metaZones.txt}
   * for a list of supported timezone IDs. Passing
   * `null` disables timezone emulation.
   */
  async emulateTimezone(timezoneId?: string): Promise<void> {
    try {
      await this.#client.send('Emulation.setTimezoneOverride', {
        timezoneId: timezoneId || '',
      });
    } catch (error) {
      if (isErrorLike(error) && error.message.includes('Invalid timezone')) {
        throw new Error(`Invalid timezone ID: ${timezoneId}`);
      }
      throw error;
    }
  }

  /**
   * Emulates the idle state.
   * If no arguments set, clears idle state emulation.
   *
   * @example
   *
   * ```ts
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
   */
  async emulateIdleState(overrides?: {
    isUserActive: boolean;
    isScreenUnlocked: boolean;
  }): Promise<void> {
    if (overrides) {
      await this.#client.send('Emulation.setIdleOverride', {
        isUserActive: overrides.isUserActive,
        isScreenUnlocked: overrides.isScreenUnlocked,
      });
    } else {
      await this.#client.send('Emulation.clearIdleOverride');
    }
  }

  /**
   * Simulates the given vision deficiency on the page.
   *
   * @example
   *
   * ```ts
   * const puppeteer = require('puppeteer');
   *
   * (async () => {
   *   const browser = await puppeteer.launch();
   *   const page = await browser.newPage();
   *   await page.goto('https://v8.dev/blog/10-years');
   *
   *   await page.emulateVisionDeficiency('achromatopsia');
   *   await page.screenshot({path: 'achromatopsia.png'});
   *
   *   await page.emulateVisionDeficiency('deuteranopia');
   *   await page.screenshot({path: 'deuteranopia.png'});
   *
   *   await page.emulateVisionDeficiency('blurredVision');
   *   await page.screenshot({path: 'blurred-vision.png'});
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
      await this.#client.send('Emulation.setEmulatedVisionDeficiency', {
        type: type || 'none',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * `page.setViewport` will resize the page. A lot of websites don't expect
   * phones to change size, so you should set the viewport before navigating to
   * the page.
   *
   * In the case of multiple pages in a single browser, each page can have its
   * own viewport size.
   * @example
   *
   * ```ts
   * const page = await browser.newPage();
   * await page.setViewport({
   *   width: 640,
   *   height: 480,
   *   deviceScaleFactor: 1,
   * });
   * await page.goto('https://example.com');
   * ```
   *
   * @param viewport -
   * @remarks
   * Argument viewport have following properties:
   *
   * - `width`: page width in pixels. required
   *
   * - `height`: page height in pixels. required
   *
   * - `deviceScaleFactor`: Specify device scale factor (can be thought of as
   *   DPR). Defaults to `1`.
   *
   * - `isMobile`: Whether the meta viewport tag is taken into account. Defaults
   *   to `false`.
   *
   * - `hasTouch`: Specifies if viewport supports touch events. Defaults to `false`
   *
   * - `isLandScape`: Specifies if viewport is in landscape mode. Defaults to false.
   *
   * NOTE: in certain cases, setting viewport will reload the page in order to
   * set the isMobile or hasTouch properties.
   */
  async setViewport(viewport: Viewport): Promise<void> {
    const needsReload = await this.#emulationManager.emulateViewport(viewport);
    this.#viewport = viewport;
    if (needsReload) {
      await this.reload();
    }
  }

  /**
   * @returns
   *
   * - `width`: page's width in pixels
   *
   * - `height`: page's height in pixels
   *
   * - `deviceScalarFactor`: Specify device scale factor (can be though of as
   *   dpr). Defaults to `1`.
   *
   * - `isMobile`: Whether the meta viewport tag is taken into account. Defaults
   *   to `false`.
   *
   * - `hasTouch`: Specifies if viewport supports touch events. Defaults to
   *   `false`.
   *
   * - `isLandScape`: Specifies if viewport is in landscape mode. Defaults to
   *   `false`.
   */
  viewport(): Viewport | null {
    return this.#viewport;
  }

  /**
   * Evaluates a function in the page's context and returns the result.
   *
   * If the function passed to `page.evaluteHandle` returns a Promise, the
   * function will wait for the promise to resolve and return its value.
   *
   * @example
   *
   * ```ts
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
   *
   * ```ts
   * const aHandle = await page.evaluate('1 + 2');
   * ```
   *
   * To get the best TypeScript experience, you should pass in as the
   * generic the type of `pageFunction`:
   *
   * ```ts
   * const aHandle = await page.evaluate(() => 2);
   * ```
   *
   * @example
   *
   * {@link ElementHandle} instances (including {@link JSHandle}s) can be passed
   * as arguments to the `pageFunction`:
   *
   * ```ts
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
  async evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>> {
    return this.#frameManager.mainFrame().evaluate(pageFunction, ...args);
  }

  /**
   * Adds a function which would be invoked in one of the following scenarios:
   *
   * - whenever the page is navigated
   *
   * - whenever the child frame is attached or navigated. In this case, the
   *   function is invoked in the context of the newly attached frame.
   *
   * The function is invoked after the document was created but before any of
   * its scripts were run. This is useful to amend the JavaScript environment,
   * e.g. to seed `Math.random`.
   * @param pageFunction - Function to be evaluated in browser context
   * @param args - Arguments to pass to `pageFunction`
   * @example
   * An example of overriding the navigator.languages property before the page loads:
   *
   * ```ts
   * // preload.js
   *
   * // overwrite the `languages` property to use a custom getter
   * Object.defineProperty(navigator, 'languages', {
   * get: function () {
   * return ['en-US', 'en', 'bn'];
   * },
   * });
   *
   * // In your puppeteer script, assuming the preload.js file is
   * in same folder of our script
   * const preloadFile = fs.readFileSync('./preload.js', 'utf8');
   * await page.evaluateOnNewDocument(preloadFile);
   * ```
   */
  async evaluateOnNewDocument<
    Params extends unknown[],
    Func extends (...args: Params) => unknown = (...args: Params) => unknown
  >(pageFunction: Func | string, ...args: Params): Promise<void> {
    const source = evaluationString(pageFunction, ...args);
    await this.#client.send('Page.addScriptToEvaluateOnNewDocument', {
      source,
    });
  }

  /**
   * Toggles ignoring cache for each request based on the enabled state. By
   * default, caching is enabled.
   * @param enabled - sets the `enabled` state of cache
   */
  async setCacheEnabled(enabled = true): Promise<void> {
    await this.#frameManager.networkManager.setCacheEnabled(enabled);
  }

  /**
   * @remarks
   * Options object which might have the following properties:
   *
   * - `path` : The file path to save the image to. The screenshot type
   *   will be inferred from file extension. If `path` is a relative path, then
   *   it is resolved relative to
   *   {@link https://nodejs.org/api/process.html#process_process_cwd
   *   | current working directory}.
   *   If no path is provided, the image won't be saved to the disk.
   *
   * - `type` : Specify screenshot type, can be either `jpeg` or `png`.
   *   Defaults to 'png'.
   *
   * - `quality` : The quality of the image, between 0-100. Not
   *   applicable to `png` images.
   *
   * - `fullPage` : When true, takes a screenshot of the full
   *   scrollable page. Defaults to `false`.
   *
   * - `clip` : An object which specifies clipping region of the page.
   *   Should have the following fields:<br/>
   * - `x` : x-coordinate of top-left corner of clip area.<br/>
   * - `y` : y-coordinate of top-left corner of clip area.<br/>
   * - `width` : width of clipping area.<br/>
   * - `height` : height of clipping area.
   *
   * - `omitBackground` : Hides default white background and allows
   *   capturing screenshots with transparency. Defaults to `false`.
   *
   * - `encoding` : The encoding of the image, can be either base64 or
   *   binary. Defaults to `binary`.
   *
   * - `captureBeyondViewport` : When true, captures screenshot
   *   {@link https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-captureScreenshot
   *   | beyond the viewport}. When false, falls back to old behaviour,
   *   and cuts the screenshot by the viewport size. Defaults to `true`.
   *
   * - `fromSurface` : When true, captures screenshot
   *   {@link https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-captureScreenshot
   *   | from the surface rather than the view}. When false, works only in
   *   headful mode and ignores page viewport (but not browser window's
   *   bounds). Defaults to `true`.
   *
   * NOTE: Screenshots take at least 1/6 second on OS X. See
   * {@link https://crbug.com/741689} for discussion.
   * @returns Promise which resolves to buffer or a base64 string (depending on
   * the value of `encoding`) with captured screenshot.
   */
  async screenshot(options: ScreenshotOptions = {}): Promise<Buffer | string> {
    let screenshotType = Protocol.Page.CaptureScreenshotRequestFormat.Png;
    // options.type takes precedence over inferring the type from options.path
    // because it may be a 0-length file with no extension created beforehand
    // (i.e. as a temp file).
    if (options.type) {
      screenshotType =
        options.type as Protocol.Page.CaptureScreenshotRequestFormat;
    } else if (options.path) {
      const filePath = options.path;
      const extension = filePath
        .slice(filePath.lastIndexOf('.') + 1)
        .toLowerCase();
      switch (extension) {
        case 'png':
          screenshotType = Protocol.Page.CaptureScreenshotRequestFormat.Png;
          break;
        case 'jpeg':
        case 'jpg':
          screenshotType = Protocol.Page.CaptureScreenshotRequestFormat.Jpeg;
          break;
        case 'webp':
          screenshotType = Protocol.Page.CaptureScreenshotRequestFormat.Webp;
          break;
        default:
          throw new Error(
            `Unsupported screenshot type for extension \`.${extension}\``
          );
      }
    }

    if (options.quality) {
      assert(
        screenshotType === Protocol.Page.CaptureScreenshotRequestFormat.Jpeg ||
          screenshotType === Protocol.Page.CaptureScreenshotRequestFormat.Webp,
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
    return this.#screenshotTaskQueue.postTask(() => {
      return this.#screenshotTask(screenshotType, options);
    });
  }

  async #screenshotTask(
    format: Protocol.Page.CaptureScreenshotRequestFormat,
    options: ScreenshotOptions = {}
  ): Promise<Buffer | string> {
    await this.#client.send('Target.activateTarget', {
      targetId: this.#target._targetId,
    });
    let clip = options.clip ? processClip(options.clip) : undefined;
    const captureBeyondViewport =
      typeof options.captureBeyondViewport === 'boolean'
        ? options.captureBeyondViewport
        : true;
    const fromSurface =
      typeof options.fromSurface === 'boolean'
        ? options.fromSurface
        : undefined;

    if (options.fullPage) {
      const metrics = await this.#client.send('Page.getLayoutMetrics');
      // Fallback to `contentSize` in case of using Firefox.
      const {width, height} = metrics.cssContentSize || metrics.contentSize;

      // Overwrite clip for full page.
      clip = {x: 0, y: 0, width, height, scale: 1};

      if (!captureBeyondViewport) {
        const {
          isMobile = false,
          deviceScaleFactor = 1,
          isLandscape = false,
        } = this.#viewport || {};
        const screenOrientation: Protocol.Emulation.ScreenOrientation =
          isLandscape
            ? {angle: 90, type: 'landscapePrimary'}
            : {angle: 0, type: 'portraitPrimary'};
        await this.#client.send('Emulation.setDeviceMetricsOverride', {
          mobile: isMobile,
          width,
          height,
          deviceScaleFactor,
          screenOrientation,
        });
      }
    }
    const shouldSetDefaultBackground =
      options.omitBackground && (format === 'png' || format === 'webp');
    if (shouldSetDefaultBackground) {
      await this.#setTransparentBackgroundColor();
    }

    const result = await this.#client.send('Page.captureScreenshot', {
      format,
      quality: options.quality,
      clip,
      captureBeyondViewport,
      fromSurface,
    });
    if (shouldSetDefaultBackground) {
      await this.#resetDefaultBackgroundColor();
    }

    if (options.fullPage && this.#viewport) {
      await this.setViewport(this.#viewport);
    }

    const buffer =
      options.encoding === 'base64'
        ? result.data
        : Buffer.from(result.data, 'base64');

    if (options.path) {
      try {
        const fs = (await importFS()).promises;
        await fs.writeFile(options.path, buffer);
      } catch (error) {
        if (error instanceof TypeError) {
          throw new Error(
            'Screenshots can only be written to a file path in a Node-like environment.'
          );
        }
        throw error;
      }
    }
    return buffer;

    function processClip(
      clip: ScreenshotClip
    ): ScreenshotClip & {scale: number} {
      const x = Math.round(clip.x);
      const y = Math.round(clip.y);
      const width = Math.round(clip.width + clip.x - x);
      const height = Math.round(clip.height + clip.y - y);
      return {x, y, width, height, scale: 1};
    }
  }

  /**
   * Generates a PDF of the page with the `print` CSS media type.
   * @remarks
   *
   * NOTE: PDF generation is only supported in Chrome headless mode.
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
   * @param options - options for generating the PDF.
   */
  async createPDFStream(options: PDFOptions = {}): Promise<Readable> {
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
      omitBackground = false,
      timeout = 30000,
    } = options;

    let paperWidth = 8.5;
    let paperHeight = 11;
    if (options.format) {
      const format =
        _paperFormats[options.format.toLowerCase() as LowerCasePaperFormat];
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
      await this.#setTransparentBackgroundColor();
    }

    const printCommandPromise = this.#client.send('Page.printToPDF', {
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

    const result = await waitWithTimeout(
      printCommandPromise,
      'Page.printToPDF',
      timeout
    );

    if (omitBackground) {
      await this.#resetDefaultBackgroundColor();
    }

    assert(result.stream, '`stream` is missing from `Page.printToPDF');
    return getReadableFromProtocolStream(this.#client, result.stream);
  }

  /**
   * @param options -
   * @returns
   */
  async pdf(options: PDFOptions = {}): Promise<Buffer> {
    const {path = undefined} = options;
    const readable = await this.createPDFStream(options);
    const buffer = await getReadableAsBuffer(readable, path);
    assert(buffer, 'Could not create buffer');
    return buffer;
  }

  /**
   * @returns The page's title
   * @remarks
   * Shortcut for {@link Frame.title | page.mainFrame().title()}.
   */
  async title(): Promise<string> {
    return this.mainFrame().title();
  }

  async close(
    options: {runBeforeUnload?: boolean} = {runBeforeUnload: undefined}
  ): Promise<void> {
    const connection = this.#client.connection();
    assert(
      connection,
      'Protocol error: Connection closed. Most likely the page has been closed.'
    );
    const runBeforeUnload = !!options.runBeforeUnload;
    if (runBeforeUnload) {
      await this.#client.send('Page.close');
    } else {
      await connection.send('Target.closeTarget', {
        targetId: this.#target._targetId,
      });
      await this.#target._isClosedPromise;
    }
  }

  /**
   * Indicates that the page has been closed.
   * @returns
   */
  isClosed(): boolean {
    return this.#closed;
  }

  get mouse(): Mouse {
    return this.#mouse;
  }

  /**
   * This method fetches an element with `selector`, scrolls it into view if
   * needed, and then uses {@link Page.mouse} to click in the center of the
   * element. If there's no element matching `selector`, the method throws an
   * error.
   * @remarks Bear in mind that if `click()` triggers a navigation event and
   * there's a separate `page.waitForNavigation()` promise to be resolved, you
   * may end up with a race condition that yields unexpected results. The
   * correct pattern for click and wait for navigation is the following:
   *
   * ```ts
   * const [response] = await Promise.all([
   *   page.waitForNavigation(waitOptions),
   *   page.click(selector, clickOptions),
   * ]);
   * ```
   *
   * Shortcut for {@link Frame.click | page.mainFrame().click(selector[, options]) }.
   * @param selector - A `selector` to search for element to click. If there are
   * multiple elements satisfying the `selector`, the first will be clicked
   * @param options - `Object`
   * @returns Promise which resolves when the element matching `selector` is
   * successfully clicked. The Promise will be rejected if there is no element
   * matching `selector`.
   */
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

  /**
   * This method fetches an element with `selector` and focuses it. If there's no
   * element matching `selector`, the method throws an error.
   * @param selector - A
   * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors | selector }
   * of an element to focus. If there are multiple elements satisfying the
   * selector, the first will be focused.
   * @returns Promise which resolves when the element matching selector is
   * successfully focused. The promise will be rejected if there is no element
   * matching selector.
   * @remarks
   * Shortcut for {@link Frame.focus | page.mainFrame().focus(selector)}.
   */
  focus(selector: string): Promise<void> {
    return this.mainFrame().focus(selector);
  }

  /**
   * This method fetches an element with `selector`, scrolls it into view if
   * needed, and then uses {@link Page.mouse} to hover over the center of the element.
   * If there's no element matching `selector`, the method throws an error.
   * @param selector - A
   * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors | selector}
   * to search for element to hover. If there are multiple elements satisfying
   * the selector, the first will be hovered.
   * @returns Promise which resolves when the element matching `selector` is
   * successfully hovered. Promise gets rejected if there's no element matching
   * `selector`.
   * @remarks
   * Shortcut for {@link Page.hover | page.mainFrame().hover(selector)}.
   */
  hover(selector: string): Promise<void> {
    return this.mainFrame().hover(selector);
  }

  /**
   * Triggers a `change` and `input` event once all the provided options have been
   * selected. If there's no `<select>` element matching `selector`, the method
   * throws an error.
   *
   * @example
   *
   * ```ts
   * page.select('select#colors', 'blue'); // single selection
   * page.select('select#colors', 'red', 'green', 'blue'); // multiple selections
   * ```
   *
   * @param selector - A
   * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors | Selector}
   * to query the page for
   * @param values - Values of options to select. If the `<select>` has the
   * `multiple` attribute, all values are considered, otherwise only the first one
   * is taken into account.
   * @returns
   *
   * @remarks
   * Shortcut for {@link Frame.select | page.mainFrame().select()}
   */
  select(selector: string, ...values: string[]): Promise<string[]> {
    return this.mainFrame().select(selector, ...values);
  }

  /**
   * This method fetches an element with `selector`, scrolls it into view if
   * needed, and then uses {@link Page.touchscreen} to tap in the center of the element.
   * If there's no element matching `selector`, the method throws an error.
   * @param selector - A
   * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors | Selector}
   * to search for element to tap. If there are multiple elements satisfying the
   * selector, the first will be tapped.
   * @returns
   * @remarks
   * Shortcut for {@link Frame.tap | page.mainFrame().tap(selector)}.
   */
  tap(selector: string): Promise<void> {
    return this.mainFrame().tap(selector);
  }

  /**
   * Sends a `keydown`, `keypress/input`, and `keyup` event for each character
   * in the text.
   *
   * To press a special key, like `Control` or `ArrowDown`, use {@link Keyboard.press}.
   * @example
   *
   * ```ts
   * await page.type('#mytextarea', 'Hello');
   * // Types instantly
   * await page.type('#mytextarea', 'World', {delay: 100});
   * // Types slower, like a user
   * ```
   *
   * @param selector - A
   * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors | selector}
   * of an element to type into. If there are multiple elements satisfying the
   * selector, the first will be used.
   * @param text - A text to type into a focused element.
   * @param options - have property `delay` which is the Time to wait between
   * key presses in milliseconds. Defaults to `0`.
   * @returns
   * @remarks
   */
  type(
    selector: string,
    text: string,
    options?: {delay: number}
  ): Promise<void> {
    return this.mainFrame().type(selector, text, options);
  }

  /**
   * @deprecated Use `new Promise(r => setTimeout(r, milliseconds));`.
   *
   * Causes your script to wait for the given number of milliseconds.
   *
   * @remarks
   * It's generally recommended to not wait for a number of seconds, but instead
   * use {@link Frame.waitForSelector}, {@link Frame.waitForXPath} or
   * {@link Frame.waitForFunction} to wait for exactly the conditions you want.
   *
   * @example
   *
   * Wait for 1 second:
   *
   * ```ts
   * await page.waitForTimeout(1000);
   * ```
   *
   * @param milliseconds - the number of milliseconds to wait.
   */
  waitForTimeout(milliseconds: number): Promise<void> {
    return this.mainFrame().waitForTimeout(milliseconds);
  }

  /**
   * Wait for the `selector` to appear in page. If at the moment of calling the
   * method the `selector` already exists, the method will return immediately. If
   * the `selector` doesn't appear after the `timeout` milliseconds of waiting, the
   * function will throw.
   *
   * This method works across navigations:
   *
   * ```ts
   * const puppeteer = require('puppeteer');
   * (async () => {
   *   const browser = await puppeteer.launch();
   *   const page = await browser.newPage();
   *   let currentURL;
   *   page
   *     .waitForSelector('img')
   *     .then(() => console.log('First URL with image: ' + currentURL));
   *   for (currentURL of [
   *     'https://example.com',
   *     'https://google.com',
   *     'https://bbc.com',
   *   ]) {
   *     await page.goto(currentURL);
   *   }
   *   await browser.close();
   * })();
   * ```
   *
   * @param selector - A
   * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors | selector}
   * of an element to wait for
   * @param options - Optional waiting parameters
   * @returns Promise which resolves when element specified by selector string
   * is added to DOM. Resolves to `null` if waiting for hidden: `true` and
   * selector is not found in DOM.
   * @remarks
   * The optional Parameter in Arguments `options` are :
   *
   * - `Visible`: A boolean wait for element to be present in DOM and to be
   *   visible, i.e. to not have `display: none` or `visibility: hidden` CSS
   *   properties. Defaults to `false`.
   *
   * - `hidden`: Wait for element to not be found in the DOM or to be hidden,
   *   i.e. have `display: none` or `visibility: hidden` CSS properties. Defaults to
   *   `false`.
   *
   * - `timeout`: maximum time to wait for in milliseconds. Defaults to `30000`
   *   (30 seconds). Pass `0` to disable timeout. The default value can be changed
   *   by using the {@link Page.setDefaultTimeout} method.
   */
  async waitForSelector<Selector extends string>(
    selector: Selector,
    options: Exclude<WaitForSelectorOptions, 'root'> = {}
  ): Promise<ElementHandle<NodeFor<Selector>> | null> {
    return await this.mainFrame().waitForSelector(selector, options);
  }

  /**
   * Wait for the `xpath` to appear in page. If at the moment of calling the
   * method the `xpath` already exists, the method will return immediately. If
   * the `xpath` doesn't appear after the `timeout` milliseconds of waiting, the
   * function will throw.
   *
   * This method works across navigation
   *
   * ```ts
   * const puppeteer = require('puppeteer');
   * (async () => {
   *   const browser = await puppeteer.launch();
   *   const page = await browser.newPage();
   *   let currentURL;
   *   page
   *     .waitForXPath('//img')
   *     .then(() => console.log('First URL with image: ' + currentURL));
   *   for (currentURL of [
   *     'https://example.com',
   *     'https://google.com',
   *     'https://bbc.com',
   *   ]) {
   *     await page.goto(currentURL);
   *   }
   *   await browser.close();
   * })();
   * ```
   *
   * @param xpath - A
   * {@link https://developer.mozilla.org/en-US/docs/Web/XPath | xpath} of an
   * element to wait for
   * @param options - Optional waiting parameters
   * @returns Promise which resolves when element specified by xpath string is
   * added to DOM. Resolves to `null` if waiting for `hidden: true` and xpath is
   * not found in DOM.
   * @remarks
   * The optional Argument `options` have properties:
   *
   * - `visible`: A boolean to wait for element to be present in DOM and to be
   *   visible, i.e. to not have `display: none` or `visibility: hidden` CSS
   *   properties. Defaults to `false`.
   *
   * - `hidden`: A boolean wait for element to not be found in the DOM or to be
   *   hidden, i.e. have `display: none` or `visibility: hidden` CSS properties.
   *   Defaults to `false`.
   *
   * - `timeout`: A number which is maximum time to wait for in milliseconds.
   *   Defaults to `30000` (30 seconds). Pass `0` to disable timeout. The default
   *   value can be changed by using the {@link Page.setDefaultTimeout} method.
   */
  waitForXPath(
    xpath: string,
    options: {
      visible?: boolean;
      hidden?: boolean;
      timeout?: number;
    } = {}
  ): Promise<ElementHandle<Node> | null> {
    return this.mainFrame().waitForXPath(xpath, options);
  }

  /**
   * Waits for a function to finish evaluating in the page's context.
   *
   * @example
   * The {@link Page.waitForFunction} can be used to observe viewport size change:
   *
   * ```ts
   * const puppeteer = require('puppeteer');
   * (async () => {
   *   const browser = await puppeteer.launch();
   *   const page = await browser.newPage();
   *   const watchDog = page.waitForFunction('window.innerWidth < 100');
   *   await page.setViewport({width: 50, height: 50});
   *   await watchDog;
   *   await browser.close();
   * })();
   * ```
   *
   * @example
   * To pass arguments from node.js to the predicate of
   * {@link Page.waitForFunction} function:
   *
   * ```ts
   * const selector = '.foo';
   * await page.waitForFunction(
   *   selector => !!document.querySelector(selector),
   *   {},
   *   selector
   * );
   * ```
   *
   * @example
   * The predicate of {@link Page.waitForFunction} can be asynchronous too:
   *
   * ```ts
   * const username = 'github-username';
   * await page.waitForFunction(
   *   async username => {
   *     const githubResponse = await fetch(
   *       `https://api.github.com/users/${username}`
   *     );
   *     const githubUser = await githubResponse.json();
   *     // show the avatar
   *     const img = document.createElement('img');
   *     img.src = githubUser.avatar_url;
   *     // wait 3 seconds
   *     await new Promise((resolve, reject) => setTimeout(resolve, 3000));
   *     img.remove();
   *   },
   *   {},
   *   username
   * );
   * ```
   *
   * @param pageFunction - Function to be evaluated in browser context
   * @param options - Optional waiting parameters
   *
   * - `polling` - An interval at which the `pageFunction` is executed, defaults
   *   to `raf`. If `polling` is a number, then it is treated as an interval in
   *   milliseconds at which the function would be executed. If polling is a
   *   string, then it can be one of the following values:
   *   - `raf` - to constantly execute `pageFunction` in
   *     `requestAnimationFrame` callback. This is the tightest polling mode
   *     which is suitable to observe styling changes.
   *   - `mutation`- to execute pageFunction on every DOM mutation.
   * - `timeout` - maximum time to wait for in milliseconds. Defaults to `30000`
   *   (30 seconds). Pass `0` to disable timeout. The default value can be
   *   changed by using the {@link Page.setDefaultTimeout} method.
   *   @param args - Arguments to pass to `pageFunction`
   *   @returns A `Promise` which resolves to a JSHandle/ElementHandle of the the
   *   `pageFunction`'s return value.
   */
  waitForFunction<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    pageFunction: Func | string,
    options: {
      timeout?: number;
      polling?: string | number;
    } = {},
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>> {
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
  if (typeof parameter === 'undefined') {
    return undefined;
  }
  let pixels;
  if (isNumber(parameter)) {
    // Treat numbers as pixel values to be aligned with phantom's paperSize.
    pixels = parameter;
  } else if (isString(parameter)) {
    const text = parameter;
    let unit = text.substring(text.length - 2).toLowerCase();
    let valueText = '';
    if (unit in unitToPixels) {
      valueText = text.substring(0, text.length - 2);
    } else {
      // In case of unknown unit try to parse the whole parameter as number of pixels.
      // This is consistent with phantom's paperSize behavior.
      unit = 'px';
      valueText = text;
    }
    const value = Number(valueText);
    assert(!isNaN(value), 'Failed to parse parameter value: ' + text);
    pixels = value * unitToPixels[unit as keyof typeof unitToPixels];
  } else {
    throw new Error(
      'page.pdf() Cannot handle parameter type: ' + typeof parameter
    );
  }
  return pixels / 96;
}
