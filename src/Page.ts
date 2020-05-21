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

import * as fs from 'fs';
import * as EventEmitter from 'events';
import * as mime from 'mime';
import { Events } from './Events';
import { Connection, CDPSession } from './Connection';
import { Dialog } from './Dialog';
import { EmulationManager } from './EmulationManager';
import { Frame, FrameManager } from './FrameManager';
import { Keyboard, Mouse, Touchscreen, MouseButtonInput } from './Input';
import { Tracing } from './Tracing';
import { helper, debugError, assert } from './helper';
import { Coverage } from './Coverage';
import { Worker as PuppeteerWorker } from './Worker';
import { Browser, BrowserContext } from './Browser';
import { Target } from './Target';
import { createJSHandle, JSHandle, ElementHandle } from './JSHandle';
import type { Viewport } from './PuppeteerViewport';
import { Credentials } from './NetworkManager';
import { Request as PuppeteerRequest } from './Request';
import { Response as PuppeteerResponse } from './Response';
import { Accessibility } from './Accessibility';
import { TimeoutSettings } from './TimeoutSettings';
import { FileChooser } from './FileChooser';
import { ConsoleMessage } from './ConsoleMessage';
import { PuppeteerLifeCycleEvent } from './LifecycleWatcher';
import Protocol from './protocol';

const writeFileAsync = helper.promisify(fs.writeFile);

interface Metrics {
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

interface WaitForOptions {
  timeout?: number;
  waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
}

interface MediaFeature {
  name: string;
  value: string;
}

interface ScreenshotClip {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ScreenshotOptions {
  type?: 'png' | 'jpeg';
  path?: string;
  fullPage?: boolean;
  clip?: ScreenshotClip;
  quality?: number;
  omitBackground?: boolean;
  encoding?: string;
}

interface PDFMargin {
  top?: string | number;
  bottom?: string | number;
  left?: string | number;
  right?: string | number;
}

interface PDFOptions {
  scale?: number;
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  printBackground?: boolean;
  landscape?: boolean;
  pageRanges?: string;
  format?: string;
  width?: string | number;
  height?: string | number;
  preferCSSPageSize?: boolean;
  margin?: PDFMargin;
  path?: string;
}

interface PaperFormat {
  width: number;
  height: number;
}

const paperFormats: Record<string, PaperFormat> = {
  letter: { width: 8.5, height: 11 },
  legal: { width: 8.5, height: 14 },
  tabloid: { width: 11, height: 17 },
  ledger: { width: 17, height: 11 },
  a0: { width: 33.1, height: 46.8 },
  a1: { width: 23.4, height: 33.1 },
  a2: { width: 16.54, height: 23.4 },
  a3: { width: 11.7, height: 16.54 },
  a4: { width: 8.27, height: 11.7 },
  a5: { width: 5.83, height: 8.27 },
  a6: { width: 4.13, height: 5.83 },
} as const;

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

export class Page extends EventEmitter {
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

  _closed = false;
  _client: CDPSession;
  _target: Target;
  _keyboard: Keyboard;
  _mouse: Mouse;
  _timeoutSettings = new TimeoutSettings();
  _touchscreen: Touchscreen;
  _accessibility: Accessibility;
  _frameManager: FrameManager;
  _emulationManager: EmulationManager;
  _tracing: Tracing;
  _pageBindings = new Map<string, Function>();
  _coverage: Coverage;
  _javascriptEnabled = true;
  _viewport: Viewport | null;
  _screenshotTaskQueue: ScreenshotTaskQueue;
  _workers = new Map<string, PuppeteerWorker>();
  // TODO: improve this typedef - it's a function that takes a file chooser or something?
  _fileChooserInterceptors = new Set<Function>();

  _disconnectPromise?: Promise<Error>;

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
      const worker = new PuppeteerWorker(
        session,
        event.targetInfo.url,
        this._addConsoleMessage.bind(this),
        this._handleException.bind(this)
      );
      this._workers.set(event.sessionId, worker);
      this.emit(Events.Page.WorkerCreated, worker);
    });
    client.on('Target.detachedFromTarget', (event) => {
      const worker = this._workers.get(event.sessionId);
      if (!worker) return;
      this.emit(Events.Page.WorkerDestroyed, worker);
      this._workers.delete(event.sessionId);
    });

    this._frameManager.on(Events.FrameManager.FrameAttached, (event) =>
      this.emit(Events.Page.FrameAttached, event)
    );
    this._frameManager.on(Events.FrameManager.FrameDetached, (event) =>
      this.emit(Events.Page.FrameDetached, event)
    );
    this._frameManager.on(Events.FrameManager.FrameNavigated, (event) =>
      this.emit(Events.Page.FrameNavigated, event)
    );

    const networkManager = this._frameManager.networkManager();
    networkManager.on(Events.NetworkManager.Request, (event) =>
      this.emit(Events.Page.Request, event)
    );
    networkManager.on(Events.NetworkManager.Response, (event) =>
      this.emit(Events.Page.Response, event)
    );
    networkManager.on(Events.NetworkManager.RequestFailed, (event) =>
      this.emit(Events.Page.RequestFailed, event)
    );
    networkManager.on(Events.NetworkManager.RequestFinished, (event) =>
      this.emit(Events.Page.RequestFinished, event)
    );
    this._fileChooserInterceptors = new Set();

    client.on('Page.domContentEventFired', () =>
      this.emit(Events.Page.DOMContentLoaded)
    );
    client.on('Page.loadEventFired', () => this.emit(Events.Page.Load));
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
      this.emit(Events.Page.Close);
      this._closed = true;
    });
  }

  async _initialize(): Promise<void> {
    await Promise.all([
      this._frameManager.initialize(),
      this._client.send('Target.setAutoAttach', {
        autoAttach: true,
        waitForDebuggerOnStart: false,
        flatten: true,
      }),
      this._client.send('Performance.enable', {}),
      this._client.send('Log.enable', {}),
    ]);
  }

  async _onFileChooser(
    event: Protocol.Page.fileChooserOpenedPayload
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

  async waitForFileChooser(
    options: { timeout?: number } = {}
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

  async setGeolocation(options: {
    longitude: number;
    latitude: number;
    accuracy?: number;
  }): Promise<void> {
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

  target(): Target {
    return this._target;
  }

  browser(): Browser {
    return this._target.browser();
  }

  browserContext(): BrowserContext {
    return this._target.browserContext();
  }

  _onTargetCrashed(): void {
    this.emit('error', new Error('Page crashed!'));
  }

  _onLogEntryAdded(event: Protocol.Log.entryAddedPayload): void {
    const { level, text, args, source, url, lineNumber } = event.entry;
    if (args) args.map((arg) => helper.releaseObject(this._client, arg));
    if (source !== 'worker')
      this.emit(
        Events.Page.Console,
        new ConsoleMessage(level, text, [], { url, lineNumber })
      );
  }

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

  frames(): Frame[] {
    return this._frameManager.frames();
  }

  workers(): PuppeteerWorker[] {
    return Array.from(this._workers.values());
  }

  async setRequestInterception(value: boolean): Promise<void> {
    return this._frameManager.networkManager().setRequestInterception(value);
  }

  setOfflineMode(enabled: boolean): Promise<void> {
    return this._frameManager.networkManager().setOfflineMode(enabled);
  }

  setDefaultNavigationTimeout(timeout: number): void {
    this._timeoutSettings.setDefaultNavigationTimeout(timeout);
  }

  setDefaultTimeout(timeout: number): void {
    this._timeoutSettings.setDefaultTimeout(timeout);
  }

  async $(selector: string): Promise<ElementHandle | null> {
    return this.mainFrame().$(selector);
  }

  async evaluateHandle(
    pageFunction: Function | string,
    ...args: unknown[]
  ): Promise<JSHandle> {
    const context = await this.mainFrame().executionContext();
    return context.evaluateHandle(pageFunction, ...args);
  }

  async queryObjects(prototypeHandle: JSHandle): Promise<JSHandle> {
    const context = await this.mainFrame().executionContext();
    return context.queryObjects(prototypeHandle);
  }

  async $eval<ReturnType extends any>(
    selector: string,
    pageFunction: Function | string,
    ...args: unknown[]
  ): Promise<ReturnType> {
    return this.mainFrame().$eval<ReturnType>(selector, pageFunction, ...args);
  }

  async $$eval<ReturnType extends any>(
    selector: string,
    pageFunction: Function | string,
    ...args: unknown[]
  ): Promise<ReturnType> {
    return this.mainFrame().$$eval<ReturnType>(selector, pageFunction, ...args);
  }

  async $$(selector: string): Promise<ElementHandle[]> {
    return this.mainFrame().$$(selector);
  }

  async $x(expression: string): Promise<ElementHandle[]> {
    return this.mainFrame().$x(expression);
  }

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
    ...cookies: Protocol.Network.deleteCookiesParameters[]
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

    const expression = helper.evaluationString(addPageBinding, name);
    await this._client.send('Runtime.addBinding', { name: name });
    await this._client.send('Page.addScriptToEvaluateOnNewDocument', {
      source: expression,
    });
    await Promise.all(
      this.frames().map((frame) => frame.evaluate(expression).catch(debugError))
    );

    function addPageBinding(bindingName): void {
      /* Cast window to any here as we're about to add properties to it
       * via win[bindingName] which TypeScript doesn't like.
       */
      const win = window as any;
      const binding = win[bindingName];

      win[bindingName] = (...args: unknown[]): Promise<unknown> => {
        const me = window[bindingName];
        let callbacks = me['callbacks'];
        if (!callbacks) {
          callbacks = new Map();
          me['callbacks'] = callbacks;
        }
        const seq = (me['lastSeq'] || 0) + 1;
        me['lastSeq'] = seq;
        const promise = new Promise((resolve, reject) =>
          callbacks.set(seq, { resolve, reject })
        );
        binding(JSON.stringify({ name: bindingName, seq, args }));
        return promise;
      };
    }
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

  _emitMetrics(event: Protocol.Performance.metricsPayload): void {
    this.emit(Events.Page.Metrics, {
      title: event.title,
      metrics: this._buildMetricsObject(event.metrics),
    });
  }

  _buildMetricsObject(metrics?: Protocol.Performance.Metric[]): Metrics {
    const result = {};
    for (const metric of metrics || []) {
      if (supportedMetrics.has(metric.name)) result[metric.name] = metric.value;
    }
    return result;
  }

  _handleException(exceptionDetails: Protocol.Runtime.ExceptionDetails): void {
    const message = helper.getExceptionMessage(exceptionDetails);
    const err = new Error(message);
    err.stack = ''; // Don't report clientside error with a node stack attached
    this.emit(Events.Page.PageError, err);
  }

  async _onConsoleAPI(
    event: Protocol.Runtime.consoleAPICalledPayload
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

  async _onBindingCalled(
    event: Protocol.Runtime.bindingCalledPayload
  ): Promise<void> {
    const { name, seq, args } = JSON.parse(event.payload);
    let expression = null;
    try {
      const result = await this._pageBindings.get(name)(...args);
      expression = helper.evaluationString(deliverResult, name, seq, result);
    } catch (error) {
      if (error instanceof Error)
        expression = helper.evaluationString(
          deliverError,
          name,
          seq,
          error.message,
          error.stack
        );
      else
        expression = helper.evaluationString(
          deliverErrorValue,
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

    function deliverResult(name: string, seq: number, result: unknown): void {
      window[name]['callbacks'].get(seq).resolve(result);
      window[name]['callbacks'].delete(seq);
    }

    function deliverError(
      name: string,
      seq: number,
      message: string,
      stack: string
    ): void {
      const error = new Error(message);
      error.stack = stack;
      window[name]['callbacks'].get(seq).reject(error);
      window[name]['callbacks'].delete(seq);
    }

    function deliverErrorValue(
      name: string,
      seq: number,
      value: unknown
    ): void {
      window[name]['callbacks'].get(seq).reject(value);
      window[name]['callbacks'].delete(seq);
    }
  }

  _addConsoleMessage(
    type: string,
    args: JSHandle[],
    stackTrace?: Protocol.Runtime.StackTrace
  ): void {
    if (!this.listenerCount(Events.Page.Console)) {
      args.forEach((arg) => arg.dispose());
      return;
    }
    const textTokens = [];
    for (const arg of args) {
      const remoteObject = arg._remoteObject;
      if (remoteObject.objectId) textTokens.push(arg.toString());
      else textTokens.push(helper.valueFromRemoteObject(remoteObject));
    }
    const location =
      stackTrace && stackTrace.callFrames.length
        ? {
            url: stackTrace.callFrames[0].url,
            lineNumber: stackTrace.callFrames[0].lineNumber,
            columnNumber: stackTrace.callFrames[0].columnNumber,
          }
        : {};
    const message = new ConsoleMessage(
      type,
      textTokens.join(' '),
      args,
      location
    );
    this.emit(Events.Page.Console, message);
  }

  _onDialog(event: Protocol.Page.javascriptDialogOpeningPayload): void {
    let dialogType = null;
    if (event.type === 'alert') dialogType = Dialog.Type.Alert;
    else if (event.type === 'confirm') dialogType = Dialog.Type.Confirm;
    else if (event.type === 'prompt') dialogType = Dialog.Type.Prompt;
    else if (event.type === 'beforeunload')
      dialogType = Dialog.Type.BeforeUnload;
    assert(dialogType, 'Unknown javascript dialog type: ' + event.type);

    const dialog = new Dialog(
      this._client,
      dialogType,
      event.message,
      event.defaultPrompt
    );
    this.emit(Events.Page.Dialog, dialog);
  }

  url(): string {
    return this.mainFrame().url();
  }

  async content(): Promise<string> {
    return await this._frameManager.mainFrame().content();
  }

  async setContent(html: string, options: WaitForOptions): Promise<void> {
    await this._frameManager.mainFrame().setContent(html, options);
  }

  async goto(
    url: string,
    options: WaitForOptions & { referer?: string }
  ): Promise<PuppeteerResponse> {
    return await this._frameManager.mainFrame().goto(url, options);
  }

  async reload(options?: WaitForOptions): Promise<PuppeteerResponse | null> {
    const result = await Promise.all<
      PuppeteerResponse,
      Protocol.Page.reloadReturnValue
    >([this.waitForNavigation(options), this._client.send('Page.reload')]);

    return result[0];
  }

  async waitForNavigation(
    options: WaitForOptions = {}
  ): Promise<PuppeteerResponse | null> {
    return await this._frameManager.mainFrame().waitForNavigation(options);
  }

  _sessionClosePromise(): Promise<Error> {
    if (!this._disconnectPromise)
      this._disconnectPromise = new Promise((fulfill) =>
        this._client.once(Events.CDPSession.Disconnected, () =>
          fulfill(new Error('Target closed'))
        )
      );
    return this._disconnectPromise;
  }

  async waitForRequest(
    urlOrPredicate: string | Function,
    options: { timeout?: number } = {}
  ): Promise<PuppeteerRequest> {
    const { timeout = this._timeoutSettings.timeout() } = options;
    return helper.waitForEvent(
      this._frameManager.networkManager(),
      Events.NetworkManager.Request,
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
    urlOrPredicate: string | Function,
    options: { timeout?: number } = {}
  ): Promise<PuppeteerResponse> {
    const { timeout = this._timeoutSettings.timeout() } = options;
    return helper.waitForEvent(
      this._frameManager.networkManager(),
      Events.NetworkManager.Response,
      (response) => {
        if (helper.isString(urlOrPredicate))
          return urlOrPredicate === response.url();
        if (typeof urlOrPredicate === 'function')
          return !!urlOrPredicate(response);
        return false;
      },
      timeout,
      this._sessionClosePromise()
    );
  }

  async goBack(options: WaitForOptions): Promise<PuppeteerResponse | null> {
    return this._go(-1, options);
  }

  async goForward(options: WaitForOptions): Promise<PuppeteerResponse | null> {
    return this._go(+1, options);
  }

  async _go(
    delta: number,
    options: WaitForOptions
  ): Promise<PuppeteerResponse | null> {
    const history = await this._client.send('Page.getNavigationHistory');
    const entry = history.entries[history.currentIndex + delta];
    if (!entry) return null;
    const result = await Promise.all<
      PuppeteerResponse,
      Protocol.Page.navigateToHistoryEntryReturnValue
    >([
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
          /^prefers-(?:color-scheme|reduced-motion)$/.test(name),
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

  async setViewport(viewport: Viewport): Promise<void> {
    const needsReload = await this._emulationManager.emulateViewport(viewport);
    this._viewport = viewport;
    if (needsReload) await this.reload();
  }

  viewport(): Viewport | null {
    return this._viewport;
  }

  async evaluate<ReturnType extends any>(
    pageFunction: Function | string,
    ...args: unknown[]
  ): Promise<ReturnType> {
    return this._frameManager
      .mainFrame()
      .evaluate<ReturnType>(pageFunction, ...args);
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
    // because it may be a 0-length file with no extension created beforehand (i.e. as a temp file).
    if (options.type) {
      assert(
        options.type === 'png' || options.type === 'jpeg',
        'Unknown options.type value: ' + options.type
      );
      screenshotType = options.type;
    } else if (options.path) {
      const mimeType = mime.getType(options.path);
      if (mimeType === 'image/png') screenshotType = 'png';
      else if (mimeType === 'image/jpeg') screenshotType = 'jpeg';
      assert(screenshotType, 'Unsupported screenshot mime type: ' + mimeType);
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

  async _screenshotTask(
    format: 'png' | 'jpeg',
    options?: ScreenshotOptions
  ): Promise<Buffer | string> {
    await this._client.send('Target.activateTarget', {
      targetId: this._target._targetId,
    });
    let clip = options.clip ? processClip(options.clip) : undefined;

    if (options.fullPage) {
      const metrics = await this._client.send('Page.getLayoutMetrics');
      const width = Math.ceil(metrics.contentSize.width);
      const height = Math.ceil(metrics.contentSize.height);

      // Overwrite clip for full page at all times.
      clip = { x: 0, y: 0, width, height, scale: 1 };
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
    const shouldSetDefaultBackground =
      options.omitBackground && format === 'png';
    if (shouldSetDefaultBackground)
      await this._client.send('Emulation.setDefaultBackgroundColorOverride', {
        color: { r: 0, g: 0, b: 0, a: 0 },
      });
    const result = await this._client.send('Page.captureScreenshot', {
      format,
      quality: options.quality,
      clip,
    });
    if (shouldSetDefaultBackground)
      await this._client.send('Emulation.setDefaultBackgroundColorOverride');

    if (options.fullPage && this._viewport)
      await this.setViewport(this._viewport);

    const buffer =
      options.encoding === 'base64'
        ? result.data
        : Buffer.from(result.data, 'base64');
    if (options.path) await writeFileAsync(options.path, buffer);
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
      button?: MouseButtonInput;
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

  waitFor(
    selectorOrFunctionOrTimeout: string | number | Function,
    options: {
      visible?: boolean;
      hidden?: boolean;
      timeout?: number;
      polling?: string | number;
    } = {},
    ...args: unknown[]
  ): Promise<JSHandle> {
    return this.mainFrame().waitFor(
      selectorOrFunctionOrTimeout,
      options,
      ...args
    );
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
    pageFunction: Function,
    options: {
      timeout?: number;
      polling?: string | number;
    } = {},
    ...args: unknown[]
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
