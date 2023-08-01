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

import type {Readable} from 'stream';

import {Protocol} from 'devtools-protocol';

import type {Browser} from '../api/Browser.js';
import type {BrowserContext} from '../api/BrowserContext.js';
import {ElementHandle} from '../api/ElementHandle.js';
import {Frame} from '../api/Frame.js';
import {HTTPRequest} from '../api/HTTPRequest.js';
import {HTTPResponse} from '../api/HTTPResponse.js';
import {JSHandle} from '../api/JSHandle.js';
import {
  GeolocationOptions,
  MediaFeature,
  Metrics,
  NewDocumentScriptEvaluation,
  Page,
  PageEmittedEvents,
  ScreenshotClip,
  ScreenshotOptions,
  WaitForOptions,
  WaitTimeoutOptions,
} from '../api/Page.js';
import {assert} from '../util/assert.js';
import {Deferred} from '../util/Deferred.js';
import {isErrorLike} from '../util/ErrorLike.js';

import {Accessibility} from './Accessibility.js';
import {Binding} from './Binding.js';
import {
  CDPSession,
  CDPSessionEmittedEvents,
  isTargetClosedError,
} from './Connection.js';
import {ConsoleMessage, ConsoleMessageType} from './ConsoleMessage.js';
import {Coverage} from './Coverage.js';
import {DeviceRequestPrompt} from './DeviceRequestPrompt.js';
import {CDPDialog} from './Dialog.js';
import {EmulationManager} from './EmulationManager.js';
import {TargetCloseError} from './Errors.js';
import {FileChooser} from './FileChooser.js';
import {FrameManager, FrameManagerEmittedEvents} from './FrameManager.js';
import {CDPKeyboard, CDPMouse, CDPTouchscreen} from './Input.js';
import {MAIN_WORLD} from './IsolatedWorlds.js';
import {
  Credentials,
  NetworkConditions,
  NetworkManagerEmittedEvents,
} from './NetworkManager.js';
import {PDFOptions} from './PDFOptions.js';
import {Viewport} from './PuppeteerViewport.js';
import {CDPTarget} from './Target.js';
import {TargetManagerEmittedEvents} from './TargetManager.js';
import {TaskQueue} from './TaskQueue.js';
import {TimeoutSettings} from './TimeoutSettings.js';
import {Tracing} from './Tracing.js';
import {BindingPayload, EvaluateFunc, HandleFor} from './types.js';
import {
  createClientError,
  createJSHandle,
  debugError,
  evaluationString,
  getReadableAsBuffer,
  getReadableFromProtocolStream,
  isString,
  pageBindingInitString,
  releaseObject,
  validateDialogType,
  valueFromRemoteObject,
  waitForEvent,
  waitWithTimeout,
  withSourcePuppeteerURLIfNone,
} from './util.js';
import {WebWorker} from './WebWorker.js';

/**
 * @internal
 */
export class CDPPage extends Page {
  /**
   * @internal
   */
  static async _create(
    client: CDPSession,
    target: CDPTarget,
    ignoreHTTPSErrors: boolean,
    defaultViewport: Viewport | null,
    screenshotTaskQueue: TaskQueue
  ): Promise<CDPPage> {
    const page = new CDPPage(
      client,
      target,
      ignoreHTTPSErrors,
      screenshotTaskQueue
    );
    await page.#initialize();
    if (defaultViewport) {
      try {
        await page.setViewport(defaultViewport);
      } catch (err) {
        if (isErrorLike(err) && isTargetClosedError(err)) {
          debugError(err);
        } else {
          throw err;
        }
      }
    }
    return page;
  }

  #closed = false;
  #client: CDPSession;
  #target: CDPTarget;
  #keyboard: CDPKeyboard;
  #mouse: CDPMouse;
  #timeoutSettings = new TimeoutSettings();
  #touchscreen: CDPTouchscreen;
  #accessibility: Accessibility;
  #frameManager: FrameManager;
  #emulationManager: EmulationManager;
  #tracing: Tracing;
  #bindings = new Map<string, Binding>();
  #exposedFunctions = new Map<string, string>();
  #coverage: Coverage;
  #viewport: Viewport | null;
  #screenshotTaskQueue: TaskQueue;
  #workers = new Map<string, WebWorker>();
  #fileChooserDeferreds = new Set<Deferred<FileChooser>>();
  #sessionCloseDeferred = Deferred.create<TargetCloseError>();
  #serviceWorkerBypassed = false;
  #userDragInterceptionEnabled = false;

  /**
   * @internal
   */
  constructor(
    client: CDPSession,
    target: CDPTarget,
    ignoreHTTPSErrors: boolean,
    screenshotTaskQueue: TaskQueue
  ) {
    super();
    this.#client = client;
    this.#target = target;
    this.#keyboard = new CDPKeyboard(client);
    this.#mouse = new CDPMouse(client, this.#keyboard);
    this.#touchscreen = new CDPTouchscreen(client, this.#keyboard);
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

    client.once(CDPSessionEmittedEvents.Disconnected, () => {
      return this.#sessionCloseDeferred.resolve(
        new TargetCloseError('Target closed')
      );
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
    this.#target._isClosedDeferred
      .valueOrThrow()
      .then(() => {
        this.#target
          ._targetManager()
          .removeTargetInterceptor(this.#client, this.#onAttachedToTarget);

        this.#target
          ._targetManager()
          .off(
            TargetManagerEmittedEvents.TargetGone,
            this.#onDetachedFromTarget
          );
        this.emit(PageEmittedEvents.Close);
        this.#closed = true;
      })
      .catch(debugError);
  }

  #onDetachedFromTarget = (target: CDPTarget) => {
    const sessionId = target._session()?.id();
    const worker = this.#workers.get(sessionId!);
    if (!worker) {
      return;
    }
    this.#workers.delete(sessionId!);
    this.emit(PageEmittedEvents.WorkerDestroyed, worker);
  };

  #onAttachedToTarget = (createdTarget: CDPTarget) => {
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
    try {
      await Promise.all([
        this.#frameManager.initialize(),
        this.#client.send('Performance.enable'),
        this.#client.send('Log.enable'),
      ]);
    } catch (err) {
      if (isErrorLike(err) && isTargetClosedError(err)) {
        debugError(err);
      } else {
        throw err;
      }
    }
  }

  async #onFileChooser(
    event: Protocol.Page.FileChooserOpenedEvent
  ): Promise<void> {
    if (!this.#fileChooserDeferreds.size) {
      return;
    }

    const frame = this.#frameManager.frame(event.frameId);
    assert(frame, 'This should never happen.');

    // This is guaranteed to be an HTMLInputElement handle by the event.
    const handle = (await frame.worlds[MAIN_WORLD].adoptBackendNode(
      event.backendNodeId
    )) as ElementHandle<HTMLInputElement>;

    const fileChooser = new FileChooser(handle, event);
    for (const promise of this.#fileChooserDeferreds) {
      promise.resolve(fileChooser);
    }
    this.#fileChooserDeferreds.clear();
  }

  /**
   * @internal
   */
  _client(): CDPSession {
    return this.#client;
  }

  override isServiceWorkerBypassed(): boolean {
    return this.#serviceWorkerBypassed;
  }

  override isDragInterceptionEnabled(): boolean {
    return this.#userDragInterceptionEnabled;
  }

  override isJavaScriptEnabled(): boolean {
    return this.#emulationManager.javascriptEnabled;
  }

  override waitForFileChooser(
    options: WaitTimeoutOptions = {}
  ): Promise<FileChooser> {
    const needsEnable = this.#fileChooserDeferreds.size === 0;
    const {timeout = this.#timeoutSettings.timeout()} = options;
    const deferred = Deferred.create<FileChooser>({
      message: `Waiting for \`FileChooser\` failed: ${timeout}ms exceeded`,
      timeout,
    });
    this.#fileChooserDeferreds.add(deferred);
    let enablePromise: Promise<void> | undefined;
    if (needsEnable) {
      enablePromise = this.#client.send('Page.setInterceptFileChooserDialog', {
        enabled: true,
      });
    }
    return Promise.all([deferred.valueOrThrow(), enablePromise])
      .then(([result]) => {
        return result;
      })
      .catch(error => {
        this.#fileChooserDeferreds.delete(deferred);
        throw error;
      });
  }

  override async setGeolocation(options: GeolocationOptions): Promise<void> {
    return await this.#emulationManager.setGeolocation(options);
  }

  override target(): CDPTarget {
    return this.#target;
  }

  override browser(): Browser {
    return this.#target.browser();
  }

  override browserContext(): BrowserContext {
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

  override mainFrame(): Frame {
    return this.#frameManager.mainFrame();
  }

  override get keyboard(): CDPKeyboard {
    return this.#keyboard;
  }

  override get touchscreen(): CDPTouchscreen {
    return this.#touchscreen;
  }

  override get coverage(): Coverage {
    return this.#coverage;
  }

  override get tracing(): Tracing {
    return this.#tracing;
  }

  override get accessibility(): Accessibility {
    return this.#accessibility;
  }

  override frames(): Frame[] {
    return this.#frameManager.frames();
  }

  override workers(): WebWorker[] {
    return Array.from(this.#workers.values());
  }

  override async setRequestInterception(value: boolean): Promise<void> {
    return this.#frameManager.networkManager.setRequestInterception(value);
  }

  override async setBypassServiceWorker(bypass: boolean): Promise<void> {
    this.#serviceWorkerBypassed = bypass;
    return this.#client.send('Network.setBypassServiceWorker', {bypass});
  }

  override async setDragInterception(enabled: boolean): Promise<void> {
    this.#userDragInterceptionEnabled = enabled;
    return this.#client.send('Input.setInterceptDrags', {enabled});
  }

  override setOfflineMode(enabled: boolean): Promise<void> {
    return this.#frameManager.networkManager.setOfflineMode(enabled);
  }

  override emulateNetworkConditions(
    networkConditions: NetworkConditions | null
  ): Promise<void> {
    return this.#frameManager.networkManager.emulateNetworkConditions(
      networkConditions
    );
  }

  override setDefaultNavigationTimeout(timeout: number): void {
    this.#timeoutSettings.setDefaultNavigationTimeout(timeout);
  }

  override setDefaultTimeout(timeout: number): void {
    this.#timeoutSettings.setDefaultTimeout(timeout);
  }

  override getDefaultTimeout(): number {
    return this.#timeoutSettings.timeout();
  }

  override async evaluateHandle<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>,
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>> {
    pageFunction = withSourcePuppeteerURLIfNone(
      this.evaluateHandle.name,
      pageFunction
    );
    const context = await this.mainFrame().executionContext();
    return context.evaluateHandle(pageFunction, ...args);
  }

  override async queryObjects<Prototype>(
    prototypeHandle: JSHandle<Prototype>
  ): Promise<JSHandle<Prototype[]>> {
    const context = await this.mainFrame().executionContext();
    assert(!prototypeHandle.disposed, 'Prototype JSHandle is disposed!');
    assert(
      prototypeHandle.id,
      'Prototype JSHandle must not be referencing primitive value'
    );
    const response = await context._client.send('Runtime.queryObjects', {
      prototypeObjectId: prototypeHandle.id,
    });
    return createJSHandle(context, response.objects) as HandleFor<Prototype[]>;
  }

  override async cookies(
    ...urls: string[]
  ): Promise<Protocol.Network.Cookie[]> {
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

  override async deleteCookie(
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

  override async setCookie(
    ...cookies: Protocol.Network.CookieParam[]
  ): Promise<void> {
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

  override async exposeFunction(
    name: string,
    pptrFunction: Function | {default: Function}
  ): Promise<void> {
    if (this.#bindings.has(name)) {
      throw new Error(
        `Failed to add page binding with name ${name}: window['${name}'] already exists!`
      );
    }

    let binding: Binding;
    switch (typeof pptrFunction) {
      case 'function':
        binding = new Binding(
          name,
          pptrFunction as (...args: unknown[]) => unknown
        );
        break;
      default:
        binding = new Binding(
          name,
          pptrFunction.default as (...args: unknown[]) => unknown
        );
        break;
    }

    this.#bindings.set(name, binding);

    const expression = pageBindingInitString('exposedFun', name);
    await this.#client.send('Runtime.addBinding', {name});
    const {identifier} = await this.#client.send(
      'Page.addScriptToEvaluateOnNewDocument',
      {
        source: expression,
      }
    );

    this.#exposedFunctions.set(name, identifier);

    await Promise.all(
      this.frames().map(frame => {
        return frame.evaluate(expression).catch(debugError);
      })
    );
  }

  override async removeExposedFunction(name: string): Promise<void> {
    const exposedFun = this.#exposedFunctions.get(name);
    if (!exposedFun) {
      throw new Error(
        `Failed to remove page binding with name ${name}: window['${name}'] does not exists!`
      );
    }

    await this.#client.send('Runtime.removeBinding', {name});
    await this.removeScriptToEvaluateOnNewDocument(exposedFun);

    await Promise.all(
      this.frames().map(frame => {
        return frame
          .evaluate(name => {
            // Removes the dangling Puppeteer binding wrapper.
            // @ts-expect-error: In a different context.
            globalThis[name] = undefined;
          }, name)
          .catch(debugError);
      })
    );

    this.#exposedFunctions.delete(name);
    this.#bindings.delete(name);
  }

  override async authenticate(credentials: Credentials): Promise<void> {
    return this.#frameManager.networkManager.authenticate(credentials);
  }

  override async setExtraHTTPHeaders(
    headers: Record<string, string>
  ): Promise<void> {
    return this.#frameManager.networkManager.setExtraHTTPHeaders(headers);
  }

  override async setUserAgent(
    userAgent: string,
    userAgentMetadata?: Protocol.Emulation.UserAgentMetadata
  ): Promise<void> {
    return this.#frameManager.networkManager.setUserAgent(
      userAgent,
      userAgentMetadata
    );
  }

  override async metrics(): Promise<Metrics> {
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
    this.emit(PageEmittedEvents.PageError, createClientError(exceptionDetails));
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
    const context = this.#frameManager.getExecutionContextById(
      event.executionContextId,
      this.#client
    );
    if (!context) {
      debugError(
        new Error(
          `ExecutionContext not found for a console message: ${JSON.stringify(
            event
          )}`
        )
      );
      return;
    }
    const values = event.args.map(arg => {
      return createJSHandle(context, arg);
    });
    this.#addConsoleMessage(event.type, values, event.stackTrace);
  }

  async #onBindingCalled(
    event: Protocol.Runtime.BindingCalledEvent
  ): Promise<void> {
    let payload: BindingPayload;
    try {
      payload = JSON.parse(event.payload);
    } catch {
      // The binding was either called by something in the page or it was
      // called before our wrapper was initialized.
      return;
    }
    const {type, name, seq, args, isTrivial} = payload;
    if (type !== 'exposedFun') {
      return;
    }

    const context = this.#frameManager.executionContextById(
      event.executionContextId,
      this.#client
    );
    if (!context) {
      return;
    }

    const binding = this.#bindings.get(name);
    await binding?.run(context, seq, args, isTrivial);
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
    const type = validateDialogType(event.type);
    const dialog = new CDPDialog(
      this.#client,
      type,
      event.message,
      event.defaultPrompt
    );
    this.emit(PageEmittedEvents.Dialog, dialog);
  }

  override url(): string {
    return this.mainFrame().url();
  }

  override async content(): Promise<string> {
    return await this.mainFrame().content();
  }

  override async setContent(
    html: string,
    options: WaitForOptions = {}
  ): Promise<void> {
    await this.mainFrame().setContent(html, options);
  }

  override async goto(
    url: string,
    options: WaitForOptions & {referer?: string; referrerPolicy?: string} = {}
  ): Promise<HTTPResponse | null> {
    return await this.mainFrame().goto(url, options);
  }

  override async reload(
    options?: WaitForOptions
  ): Promise<HTTPResponse | null> {
    const result = await Promise.all([
      this.waitForNavigation(options),
      this.#client.send('Page.reload'),
    ]);

    return result[0];
  }

  override async createCDPSession(): Promise<CDPSession> {
    return await this.target().createCDPSession();
  }

  override async waitForRequest(
    urlOrPredicate: string | ((req: HTTPRequest) => boolean | Promise<boolean>),
    options: {timeout?: number} = {}
  ): Promise<HTTPRequest> {
    const {timeout = this.#timeoutSettings.timeout()} = options;
    return waitForEvent(
      this.#frameManager.networkManager,
      NetworkManagerEmittedEvents.Request,
      async request => {
        if (isString(urlOrPredicate)) {
          return urlOrPredicate === request.url();
        }
        if (typeof urlOrPredicate === 'function') {
          return !!(await urlOrPredicate(request));
        }
        return false;
      },
      timeout,
      this.#sessionCloseDeferred.valueOrThrow()
    );
  }

  override async waitForResponse(
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
      this.#sessionCloseDeferred.valueOrThrow()
    );
  }

  override async waitForNetworkIdle(
    options: {idleTime?: number; timeout?: number} = {}
  ): Promise<void> {
    const {idleTime = 500, timeout = this.#timeoutSettings.timeout()} = options;

    await this._waitForNetworkIdle(
      this.#frameManager.networkManager,
      idleTime,
      timeout,
      this.#sessionCloseDeferred
    );
  }

  override async waitForFrame(
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

    const eventRace: Promise<Frame> = Deferred.race([
      waitForEvent(
        this.#frameManager,
        FrameManagerEmittedEvents.FrameAttached,
        predicate,
        timeout,
        this.#sessionCloseDeferred.valueOrThrow()
      ),
      waitForEvent(
        this.#frameManager,
        FrameManagerEmittedEvents.FrameNavigated,
        predicate,
        timeout,
        this.#sessionCloseDeferred.valueOrThrow()
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

  override async goBack(
    options: WaitForOptions = {}
  ): Promise<HTTPResponse | null> {
    return this.#go(-1, options);
  }

  override async goForward(
    options: WaitForOptions = {}
  ): Promise<HTTPResponse | null> {
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

  override async bringToFront(): Promise<void> {
    await this.#client.send('Page.bringToFront');
  }

  override async setJavaScriptEnabled(enabled: boolean): Promise<void> {
    return await this.#emulationManager.setJavaScriptEnabled(enabled);
  }

  override async setBypassCSP(enabled: boolean): Promise<void> {
    await this.#client.send('Page.setBypassCSP', {enabled});
  }

  override async emulateMediaType(type?: string): Promise<void> {
    return await this.#emulationManager.emulateMediaType(type);
  }

  override async emulateCPUThrottling(factor: number | null): Promise<void> {
    return await this.#emulationManager.emulateCPUThrottling(factor);
  }

  override async emulateMediaFeatures(
    features?: MediaFeature[]
  ): Promise<void> {
    return await this.#emulationManager.emulateMediaFeatures(features);
  }

  override async emulateTimezone(timezoneId?: string): Promise<void> {
    return await this.#emulationManager.emulateTimezone(timezoneId);
  }

  override async emulateIdleState(overrides?: {
    isUserActive: boolean;
    isScreenUnlocked: boolean;
  }): Promise<void> {
    return await this.#emulationManager.emulateIdleState(overrides);
  }

  override async emulateVisionDeficiency(
    type?: Protocol.Emulation.SetEmulatedVisionDeficiencyRequest['type']
  ): Promise<void> {
    return await this.#emulationManager.emulateVisionDeficiency(type);
  }

  override async setViewport(viewport: Viewport): Promise<void> {
    const needsReload = await this.#emulationManager.emulateViewport(viewport);
    this.#viewport = viewport;
    if (needsReload) {
      await this.reload();
    }
  }

  override viewport(): Viewport | null {
    return this.#viewport;
  }

  override async evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>,
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>> {
    pageFunction = withSourcePuppeteerURLIfNone(
      this.evaluate.name,
      pageFunction
    );
    return this.mainFrame().evaluate(pageFunction, ...args);
  }

  override async evaluateOnNewDocument<
    Params extends unknown[],
    Func extends (...args: Params) => unknown = (...args: Params) => unknown,
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<NewDocumentScriptEvaluation> {
    const source = evaluationString(pageFunction, ...args);
    const {identifier} = await this.#client.send(
      'Page.addScriptToEvaluateOnNewDocument',
      {
        source,
      }
    );

    return {identifier};
  }

  override async removeScriptToEvaluateOnNewDocument(
    identifier: string
  ): Promise<void> {
    await this.#client.send('Page.removeScriptToEvaluateOnNewDocument', {
      identifier,
    });
  }

  override async setCacheEnabled(enabled = true): Promise<void> {
    await this.#frameManager.networkManager.setCacheEnabled(enabled);
  }

  override screenshot(
    options: ScreenshotOptions & {encoding: 'base64'}
  ): Promise<string>;
  override screenshot(
    options?: ScreenshotOptions & {encoding?: 'binary'}
  ): Promise<Buffer>;
  override async screenshot(
    options: ScreenshotOptions = {}
  ): Promise<Buffer | string> {
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
    let captureBeyondViewport = options.captureBeyondViewport ?? true;
    const fromSurface = options.fromSurface;

    if (options.fullPage) {
      // Overwrite clip for full page.
      clip = undefined;

      if (!captureBeyondViewport) {
        const metrics = await this.#client.send('Page.getLayoutMetrics');
        // Fallback to `contentSize` in case of using Firefox.
        const {width, height} = metrics.cssContentSize || metrics.contentSize;
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
    } else if (!clip) {
      captureBeyondViewport = false;
    }

    const shouldSetDefaultBackground =
      options.omitBackground && (format === 'png' || format === 'webp');
    if (shouldSetDefaultBackground) {
      await this.#emulationManager.setTransparentBackgroundColor();
    }

    const result = await this.#client.send('Page.captureScreenshot', {
      format,
      optimizeForSpeed: options.optimizeForSpeed,
      quality: options.quality,
      clip: clip && {
        ...clip,
        scale: clip.scale ?? 1,
      },
      captureBeyondViewport,
      fromSurface,
    });
    if (shouldSetDefaultBackground) {
      await this.#emulationManager.resetDefaultBackgroundColor();
    }

    if (options.fullPage && this.#viewport) {
      await this.setViewport(this.#viewport);
    }

    if (options.encoding === 'base64') {
      return result.data;
    }

    const buffer = Buffer.from(result.data, 'base64');
    await this._maybeWriteBufferToFile(options.path, buffer);

    return buffer;

    function processClip(clip: ScreenshotClip): ScreenshotClip {
      const x = Math.round(clip.x);
      const y = Math.round(clip.y);
      const width = Math.round(clip.width + clip.x - x);
      const height = Math.round(clip.height + clip.y - y);
      return {x, y, width, height, scale: clip.scale};
    }
  }

  override async createPDFStream(options: PDFOptions = {}): Promise<Readable> {
    const {
      landscape,
      displayHeaderFooter,
      headerTemplate,
      footerTemplate,
      printBackground,
      scale,
      width: paperWidth,
      height: paperHeight,
      margin,
      pageRanges,
      preferCSSPageSize,
      omitBackground,
      timeout,
    } = this._getPDFOptions(options);

    if (omitBackground) {
      await this.#emulationManager.setTransparentBackgroundColor();
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
      marginTop: margin.top,
      marginBottom: margin.bottom,
      marginLeft: margin.left,
      marginRight: margin.right,
      pageRanges,
      preferCSSPageSize,
    });

    const result = await waitWithTimeout(
      printCommandPromise,
      'Page.printToPDF',
      timeout
    );

    if (omitBackground) {
      await this.#emulationManager.resetDefaultBackgroundColor();
    }

    assert(result.stream, '`stream` is missing from `Page.printToPDF');
    return getReadableFromProtocolStream(this.#client, result.stream);
  }

  override async pdf(options: PDFOptions = {}): Promise<Buffer> {
    const {path = undefined} = options;
    const readable = await this.createPDFStream(options);
    const buffer = await getReadableAsBuffer(readable, path);
    assert(buffer, 'Could not create buffer');
    return buffer;
  }

  override async title(): Promise<string> {
    return this.mainFrame().title();
  }

  override async close(
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
      await this.#target._isClosedDeferred.valueOrThrow();
    }
  }

  override isClosed(): boolean {
    return this.#closed;
  }

  override get mouse(): CDPMouse {
    return this.#mouse;
  }

  /**
   * This method is typically coupled with an action that triggers a device
   * request from an api such as WebBluetooth.
   *
   * :::caution
   *
   * This must be called before the device request is made. It will not return a
   * currently active device prompt.
   *
   * :::
   *
   * @example
   *
   * ```ts
   * const [devicePrompt] = Promise.all([
   *   page.waitForDevicePrompt(),
   *   page.click('#connect-bluetooth'),
   * ]);
   * await devicePrompt.select(
   *   await devicePrompt.waitForDevice(({name}) => name.includes('My Device'))
   * );
   * ```
   */
  override waitForDevicePrompt(
    options: WaitTimeoutOptions = {}
  ): Promise<DeviceRequestPrompt> {
    return this.mainFrame().waitForDevicePrompt(options);
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
