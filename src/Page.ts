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
import { EventEmitter } from 'events';
import * as mime from 'mime';
import { Protocol } from 'devtools-protocol';
import { Events } from './Events';
import { Connection, CDPSession } from './Connection';
import { Dialog } from './Dialog';
import { EmulationManager } from './EmulationManager';
import { FrameManager, Frame } from './FrameManager';
import { Keyboard, Mouse, Touchscreen } from './Input';
import { Tracing } from './Tracing';
import { helper, debugError, assert } from './helper';
import { Coverage } from './Coverage';
import { Worker } from './Worker';
import { createJSHandle, ElementHandle, JSHandle } from './JSHandle';
import { Accessibility } from './Accessibility';
import { TimeoutSettings } from './TimeoutSettings';
import { Target } from './Target';
import {
  Viewport,
  AnyFunction,
  EvaluateFn,
  SerializableOrJSHandle,
  EvaluateFnReturnType,
  FrameBase,
  WaitForSelectorOptionsHidden,
  WaitForSelectorOptions,
  NavigationOptions,
  DirectNavigationOptions,
  StyleTagOptions,
  ScriptTagOptions,
  ClickOptions,
  PageFnOptions,
  WrapElementHandle,
  UnwrapElementHandle,
  MediaType
} from './types';
import { TaskQueue } from './TaskQueue';
import { Browser, BrowserContext } from './Browser';
import { Response } from './NetworkManager';

const noop = () => undefined;
const writeFileAsync = helper.promisify(fs.writeFile);
const { hasOwnProperty } = Object.prototype;

export class Page extends EventEmitter implements FrameBase {
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

  get mouse(): Mouse {
    return this._mouse;
  }

  public static PaperFormats: Record<string, { width: number; height: number }> = {
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
    a6: { width: 4.13, height: 5.83 }
  };

  public static async create(
    client: CDPSession,
    target: Target,
    ignoreHTTPSErrors: boolean,
    defaultViewport: Viewport | null | undefined,
    screenshotTaskQueue: TaskQueue
  ): Promise<Page> {
    const page = new Page(client, target, ignoreHTTPSErrors, screenshotTaskQueue);
    await page._initialize();
    if (defaultViewport) await page.setViewport(defaultViewport);
    return page;
  }

  /* @internal */
  public _javascriptEnabled: boolean;

  public emulateMedia = this.emulateMediaType;

  private _closed = false;
  private _client: CDPSession;
  private _target: Target;
  private _screenshotTaskQueue: TaskQueue;
  private _pageBindings = new Map<string, AnyFunction>();
  private _keyboard: Keyboard;
  private _mouse: Mouse;
  private _viewport: Viewport | null = null;
  private _workers = new Map<string, Worker>();
  private _tracing: Tracing;
  private _coverage: Coverage;
  private _timeoutSettings: TimeoutSettings;
  private _touchscreen: Touchscreen;
  private _accessibility: Accessibility;
  private _frameManager: FrameManager;
  private _emulationManager: EmulationManager;
  private _fileChooserInterceptors = new Set<(chooser: FileChooser) => void>();
  private _disconnectPromise?: Promise<Error>;

  constructor(client: CDPSession, target: Target, ignoreHTTPSErrors: boolean, screenshotTaskQueue: TaskQueue) {
    super();
    this._client = client;
    this._target = target;
    this._keyboard = new Keyboard(client);
    this._mouse = new Mouse(client, this._keyboard);
    this._timeoutSettings = new TimeoutSettings();
    this._touchscreen = new Touchscreen(client, this._keyboard);
    this._accessibility = new Accessibility(client);
    this._frameManager = new FrameManager(client, this, ignoreHTTPSErrors, this._timeoutSettings);
    this._emulationManager = new EmulationManager(client);
    this._tracing = new Tracing(client);
    this._coverage = new Coverage(client);
    this._javascriptEnabled = true;

    this._screenshotTaskQueue = screenshotTaskQueue;

    client.on('Target.attachedToTarget', event => {
      if (event.targetInfo.type !== 'worker') {
        // If we don't detach from service workers, they will never die.
        client
            .send('Target.detachFromTarget', {
              sessionId: event.sessionId
            })
            .catch(debugError);
        return;
      }
      const session = Connection.fromSession(client).session(event.sessionId)!;
      const worker = new Worker(session, event.targetInfo.url, this._addConsoleMessage, this._handleException);
      this._workers.set(event.sessionId, worker);
      this.emit(Events.Page.WorkerCreated, worker);
    });
    client.on('Target.detachedFromTarget', event => {
      const worker = this._workers.get(event.sessionId);
      if (!worker) return;
      this.emit(Events.Page.WorkerDestroyed, worker);
      this._workers.delete(event.sessionId);
    });

    this._frameManager.on(Events.FrameManager.FrameAttached, event => this.emit(Events.Page.FrameAttached, event));
    this._frameManager.on(Events.FrameManager.FrameDetached, event => this.emit(Events.Page.FrameDetached, event));
    this._frameManager.on(Events.FrameManager.FrameNavigated, event => this.emit(Events.Page.FrameNavigated, event));

    const networkManager = this._frameManager.networkManager();
    networkManager.on(Events.NetworkManager.Request, event => this.emit(Events.Page.Request, event));
    networkManager.on(Events.NetworkManager.Response, event => this.emit(Events.Page.Response, event));
    networkManager.on(Events.NetworkManager.RequestFailed, event => this.emit(Events.Page.RequestFailed, event));
    networkManager.on(Events.NetworkManager.RequestFinished, event => this.emit(Events.Page.RequestFinished, event));

    client.on('Page.domContentEventFired', () => this.emit(Events.Page.DOMContentLoaded));
    client.on('Page.loadEventFired', () => this.emit(Events.Page.Load));
    client.on('Runtime.consoleAPICalled', event => this._onConsoleAPI(event));
    client.on('Runtime.bindingCalled', event => {
      this._onBindingCalled(event).catch(noop);
    });
    client.on('Page.javascriptDialogOpening', event => this._onDialog(event));
    client.on('Runtime.exceptionThrown', exception => this._handleException(exception.exceptionDetails));
    client.on('Inspector.targetCrashed', () => this._onTargetCrashed());
    client.on('Performance.metrics', event => this._emitMetrics(event));
    client.on('Log.entryAdded', event => this._onLogEntryAdded(event));
    client.on('Page.fileChooserOpened', event => {
      this._onFileChooser(event).catch(console.error);
    });
    this._target._isClosedPromise.then(() => {
      this.emit(Events.Page.Close);
      this._closed = true;
    }, noop);
  }

  private async _initialize() {
    await Promise.all([
      this._frameManager.initialize(),
      this._client.send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true }),
      this._client.send('Performance.enable'),
      this._client.send('Log.enable'),
      this._client.send('Page.setInterceptFileChooserDialog', { enabled: true })
    ]);
  }

  public async waitForFileChooser(options: { timeout?: number } = {}) {
    const { timeout = this._timeoutSettings.timeout() } = options;
    let callback!: (chooser: FileChooser) => void;
    const promise = new Promise<FileChooser>(x => (callback = x));
    this._fileChooserInterceptors.add(callback);
    return helper.waitWithTimeout(promise, 'waiting for file chooser', timeout).catch(e => {
      this._fileChooserInterceptors.delete(callback);
      throw e;
    });
  }

  public async setGeolocation(options: { longitude: number; latitude: number; accuracy: number | undefined }) {
    const { longitude, latitude, accuracy = 0 } = options;
    if (longitude < -180 || longitude > 180)
      throw new Error(`Invalid longitude "${longitude}": precondition -180 <= LONGITUDE <= 180 failed.`);
    if (latitude < -90 || latitude > 90)
      throw new Error(`Invalid latitude "${latitude}": precondition -90 <= LATITUDE <= 90 failed.`);
    if (accuracy < 0) throw new Error(`Invalid accuracy "${accuracy}": precondition 0 <= ACCURACY failed.`);
    await this._client.send('Emulation.setGeolocationOverride', { longitude, latitude, accuracy });
  }

  public target(): Target {
    return this._target;
  }

  public browser(): Browser {
    return this._target.browser();
  }

  public browserContext(): BrowserContext {
    return this._target.browserContext();
  }

  public mainFrame(): Frame {
    return this._frameManager.mainFrame()!;
  }

  public frames(): Frame[] {
    return this._frameManager.frames();
  }

  public workers(): Worker[] {
    return Array.from(this._workers.values());
  }

  public async setRequestInterception(value: boolean) {
    return this._frameManager.networkManager().setRequestInterception(value);
  }

  public setOfflineMode(enabled: boolean) {
    return this._frameManager.networkManager().setOfflineMode(enabled);
  }

  public setDefaultNavigationTimeout(timeout: number) {
    this._timeoutSettings.setDefaultNavigationTimeout(timeout);
  }

  public setDefaultTimeout(timeout: number) {
    this._timeoutSettings.setDefaultTimeout(timeout);
  }

  public async $(selector: string): Promise<ElementHandle | null> {
    return this.mainFrame().$(selector);
  }

  public async evaluateHandle<V extends EvaluateFn<any>>(
    pageFunction: V,
    ...args: SerializableOrJSHandle[]
  ): Promise<JSHandle<EvaluateFnReturnType<V>>> {
    const context = await this.mainFrame().executionContext();
    return context.evaluateHandle(pageFunction, ...args);
  }

  public async queryObjects(prototypeHandle: JSHandle): Promise<JSHandle> {
    const context = await this.mainFrame().executionContext();
    return context.queryObjects(prototypeHandle);
  }

  $eval<R>(selector: string, pageFunction: (element: Element) => R | Promise<R>): Promise<WrapElementHandle<R>>;
  $eval<R, X1>(
    selector: string,
    pageFunction: (element: Element, x1: UnwrapElementHandle<X1>) => R | Promise<R>,
    x1: X1
  ): Promise<WrapElementHandle<R>>;
  $eval<R, X1, X2>(
    selector: string,
    pageFunction: (element: Element, x1: UnwrapElementHandle<X1>, x2: UnwrapElementHandle<X2>) => R | Promise<R>,
    x1: X1,
    x2: X2
  ): Promise<WrapElementHandle<R>>;
  $eval<R, X1, X2, X3>(
    selector: string,
    pageFunction: (
      element: Element,
      x1: UnwrapElementHandle<X1>,
      x2: UnwrapElementHandle<X2>,
      x3: UnwrapElementHandle<X3>
    ) => R | Promise<R>,
    x1: X1,
    x2: X2,
    x3: X3
  ): Promise<WrapElementHandle<R>>;
  $eval<R>(
    selector: string,
    pageFunction: (element: Element, ...args: any[]) => R | Promise<R>,
    ...args: SerializableOrJSHandle[]
  ): Promise<WrapElementHandle<R>>;
  public $eval(...args: Parameters<FrameBase['$eval']>) {
    return this.mainFrame().$eval(...args);
  }

  $$eval<R>(selector: string, pageFunction: (elements: Element[]) => R | Promise<R>): Promise<WrapElementHandle<R>>;
  $$eval<R, X1>(
    selector: string,
    pageFunction: (elements: Element[], x1: UnwrapElementHandle<X1>) => R | Promise<R>,
    x1: X1
  ): Promise<WrapElementHandle<R>>;
  $$eval<R, X1, X2>(
    selector: string,
    pageFunction: (elements: Element[], x1: UnwrapElementHandle<X1>, x2: UnwrapElementHandle<X2>) => R | Promise<R>,
    x1: X1,
    x2: X2
  ): Promise<WrapElementHandle<R>>;
  $$eval<R, X1, X2, X3>(
    selector: string,
    pageFunction: (
      elements: Element[],
      x1: UnwrapElementHandle<X1>,
      x2: UnwrapElementHandle<X2>,
      x3: UnwrapElementHandle<X3>
    ) => R | Promise<R>,
    x1: X1,
    x2: X2,
    x3: X3
  ): Promise<WrapElementHandle<R>>;
  $$eval<R>(
    selector: string,
    pageFunction: (elements: Element[], ...args: any[]) => R | Promise<R>,
    ...args: SerializableOrJSHandle[]
  ): Promise<WrapElementHandle<R>>;
  public $$eval(...args: Parameters<FrameBase['$$eval']>) {
    return this.mainFrame().$$eval(...args);
  }

  public async $$(selector: string): Promise<ElementHandle[]> {
    return this.mainFrame().$$(selector);
  }

  public async $x(expression: string): Promise<ElementHandle[]> {
    return this.mainFrame().$x(expression);
  }

  public async cookies(...urls: string[]): Promise<Protocol.Network.Cookie[]> {
    return (
      await this._client.send('Network.getCookies', {
        urls: urls.length ? urls : [this.url()]
      })
    ).cookies;
  }

  public async deleteCookie(...cookies: Protocol.Network.DeleteCookiesRequest[]) {
    const pageURL = this.url();
    for (const cookie of cookies) {
      const item = Object.assign({}, cookie);
      if (!cookie.url && pageURL.startsWith('http')) item.url = pageURL;
      await this._client.send('Network.deleteCookies', item);
    }
  }

  public async setCookie(...cookies: Protocol.Network.CookieParam[]) {
    const pageURL = this.url();
    const startsWithHTTP = pageURL.startsWith('http');
    const items = cookies.map(cookie => {
      const item = Object.assign({}, cookie);
      if (!item.url && startsWithHTTP) item.url = pageURL;
      assert(item.url !== 'about:blank', `Blank page can not have cookie "${item.name}"`);
      assert(
          !String.prototype.startsWith.call(item.url || '', 'data:'),
          `Data URL page can not have cookie "${item.name}"`
      );
      return item;
    });
    await this.deleteCookie(...items);
    if (items.length) await this._client.send('Network.setCookies', { cookies: items });
  }

  public async addScriptTag(options: ScriptTagOptions): Promise<ElementHandle> {
    return this.mainFrame().addScriptTag(options);
  }

  public async addStyleTag(options: StyleTagOptions): Promise<ElementHandle> {
    return this.mainFrame().addStyleTag(options);
  }

  public async exposeFunction(name: string, puppeteerFunction: AnyFunction) {
    if (this._pageBindings.has(name))
      throw new Error(`Failed to add page binding with name ${name}: window['${name}'] already exists!`);
    this._pageBindings.set(name, puppeteerFunction);

    const expression = helper.evaluationString(addPageBinding, name);
    await this._client.send('Runtime.addBinding', { name });
    await this._client.send('Page.addScriptToEvaluateOnNewDocument', { source: expression });
    await Promise.all(this.frames().map(frame => frame.evaluate(expression).catch(debugError)));

    function addPageBinding(bindingName: string) {
      const binding = (window as any)[bindingName];
      (window as any)[bindingName] = (...args: any[]) => {
        const me = (window as any)[bindingName];
        let callbacks = me.callbacks;
        if (!callbacks) {
          callbacks = new Map();
          me.callbacks = callbacks;
        }
        const seq = (me.lastSeq || 0) + 1;
        me.lastSeq = seq;
        const promise = new Promise((resolve, reject) => callbacks.set(seq, { resolve, reject }));
        binding(JSON.stringify({ name: bindingName, seq, args }));
        return promise;
      };
    }
  }

  public async authenticate(credentials?: { username: string; password: string }) {
    return this._frameManager.networkManager().authenticate(credentials);
  }

  public async setExtraHTTPHeaders(headers: Record<string, string>) {
    return this._frameManager.networkManager().setExtraHTTPHeaders(headers);
  }

  public async setUserAgent(userAgent: string) {
    return this._frameManager.networkManager().setUserAgent(userAgent);
  }

  public async metrics(): Promise<Metrics> {
    const response = await this._client.send('Performance.getMetrics');
    return this._buildMetricsObject(response.metrics);
  }

  private _buildMetricsObject(metrics: Protocol.Performance.Metric[] = []): Metrics {
    const result: Metrics = {};
    for (const metric of metrics)
      if (supportedMetrics.has(metric.name as keyof Metrics)) result[metric.name as keyof Metrics] = metric.value;

    return result;
  }

  private _handleException = (exceptionDetails: Protocol.Runtime.ExceptionDetails) => {
    const message = helper.getExceptionMessage(exceptionDetails);
    const err = new Error(message);
    err.stack = ''; // Don't report clientside error with a node stack attached
    this.emit(Events.Page.PageError, err);
  };

  private _onConsoleAPI(event: Protocol.Runtime.ConsoleAPICalledEvent) {
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
    const context = this._frameManager.executionContextById(event.executionContextId);
    const values = event.args.map(arg => createJSHandle(context, arg));
    this._addConsoleMessage(event.type, values, event.stackTrace);
  }

  private async _onBindingCalled(event: Protocol.Runtime.BindingCalledEvent) {
    const { name, seq, args } = JSON.parse(event.payload);
    let expression = null;
    try {
      const result = await this._pageBindings.get(name)!(...args);
      expression = helper.evaluationString(deliverResult, name, seq, result);
    } catch (error) {
      if (error instanceof Error)
        expression = helper.evaluationString(deliverError, name, seq, error.message, error.stack);
      else expression = helper.evaluationString(deliverErrorValue, name, seq, error);
    }
    this._client.send('Runtime.evaluate', { expression, contextId: event.executionContextId }).catch(debugError);

    function deliverResult(name: string, seq: number, result: any) {
      (window as any)[name].callbacks.get(seq).resolve(result);
      (window as any)[name].callbacks.delete(seq);
    }

    function deliverError(name: string, seq: number, message: string, stack: string) {
      const error = new Error(message);
      error.stack = stack;
      (window as any)[name].callbacks.get(seq).reject(error);
      (window as any)[name].callbacks.delete(seq);
    }

    function deliverErrorValue(name: string, seq: number, value: any) {
      (window as any)[name].callbacks.get(seq).reject(value);
      (window as any)[name].callbacks.delete(seq);
    }
  }

  public url(): string {
    return this.mainFrame().url();
  }

  public async content(): Promise<string> {
    return this._frameManager.mainFrame()!.content();
  }

  public async setContent(html: string, options?: NavigationOptions) {
    await this._frameManager.mainFrame()!.setContent(html, options);
  }

  public async goto(url: string, options?: DirectNavigationOptions): Promise<Response> {
    return this._frameManager.mainFrame()!.goto(url, options);
  }

  public async reload(options?: NavigationOptions): Promise<Response> {
    const [response] = await Promise.all([this.waitForNavigation(options), this._client.send('Page.reload')] as const);
    return response;
  }

  public async waitForNavigation(options: NavigationOptions = {}): Promise<Response> {
    return this._frameManager.mainFrame()!.waitForNavigation(options);
  }

  public async waitForRequest(
    urlOrPredicate: string | AnyFunction,
    options: { timeout?: number } = {}
  ): Promise<Request> {
    const { timeout = this._timeoutSettings.timeout() } = options;
    return helper.waitForEvent(
        this._frameManager.networkManager(),
        Events.NetworkManager.Request,
        request => {
          if (helper.isString(urlOrPredicate)) return urlOrPredicate === request.url();
          if (typeof urlOrPredicate === 'function') return !!urlOrPredicate(request);
          return false;
        },
        timeout,
        this._sessionClosePromise()
    );
  }

  public async waitForResponse(
    urlOrPredicate: string | AnyFunction,
    options: { timeout?: number } = {}
  ): Promise<Response> {
    const { timeout = this._timeoutSettings.timeout() } = options;
    return helper.waitForEvent(
        this._frameManager.networkManager(),
        Events.NetworkManager.Response,
        response => {
          if (helper.isString(urlOrPredicate)) return urlOrPredicate === response.url();
          if (typeof urlOrPredicate === 'function') return !!urlOrPredicate(response);
          return false;
        },
        timeout,
        this._sessionClosePromise()
    );
  }

  public async goBack(options?: NavigationOptions): Promise<Response | null> {
    return this._go(-1, options);
  }

  public async goForward(options?: NavigationOptions): Promise<Response | null> {
    return this._go(+1, options);
  }

  public async bringToFront() {
    await this._client.send('Page.bringToFront');
  }

  public async emulate(options: { viewport: Viewport; userAgent: string }) {
    await Promise.all([this.setViewport(options.viewport), this.setUserAgent(options.userAgent)]);
  }

  public async setJavaScriptEnabled(enabled: boolean) {
    if (this._javascriptEnabled === enabled) return;
    this._javascriptEnabled = enabled;
    await this._client.send('Emulation.setScriptExecutionDisabled', { value: !enabled });
  }

  public async setBypassCSP(enabled: boolean) {
    await this._client.send('Page.setBypassCSP', { enabled });
  }

  public async emulateMediaType(type?: MediaType | null) {
    assert(
        type === 'screen' || type === 'print' || type === null || type === undefined,
        'Unsupported media type: ' + type
    );
    await this._client.send('Emulation.setEmulatedMedia', { media: type || '' });
  }

  public async emulateMediaFeatures(features?: Protocol.Emulation.MediaFeature[] | null): Promise<void> {
    if (features === null || features === undefined)
      await this._client.send('Emulation.setEmulatedMedia', { features: undefined });
    if (Array.isArray(features)) {
      features.every(mediaFeature => {
        const name = mediaFeature.name;
        assert(/^prefers-(?:color-scheme|reduced-motion)$/.test(name), 'Unsupported media feature: ' + name);
        return true;
      });
      await this._client.send('Emulation.setEmulatedMedia', { features });
    }
  }

  public async emulateTimezone(timezoneId?: string): Promise<void> {
    try {
      await this._client.send('Emulation.setTimezoneOverride', { timezoneId: timezoneId || '' });
    } catch (exception) {
      if (exception.message.includes('Invalid timezone')) throw new Error(`Invalid timezone ID: ${timezoneId}`);
      throw exception;
    }
  }

  public async setViewport(viewport: Viewport): Promise<void> {
    const needsReload = await this._emulationManager.emulateViewport(viewport);
    this._viewport = viewport;
    if (needsReload) await this.reload();
  }

  public viewport(): Viewport | null {
    return this._viewport;
  }

  public async evaluate<V extends EvaluateFn<any>>(
    pageFunction: V,
    ...args: SerializableOrJSHandle[]
  ): Promise<EvaluateFnReturnType<V>> {
    return this._frameManager.mainFrame()!.evaluate(pageFunction, ...args);
  }

  /**
   * Adds a function which would be invoked in one of the following scenarios: whenever the page is navigated; whenever the child frame is attached or navigated.
   * The function is invoked after the document was created but before any of its scripts were run. This is useful to amend JavaScript environment, e.g. to seed Math.random.
   * @param pageFunction The function to be evaluated in browser context.
   * @param args The arguments to pass to the `fn`.
   */
  public async evaluateOnNewDocument(pageFunction: EvaluateFn, ...args: SerializableOrJSHandle[]) {
    const source = helper.evaluationString(pageFunction, ...args);
    await this._client.send('Page.addScriptToEvaluateOnNewDocument', { source });
  }

  public async setCacheEnabled(enabled = true) {
    await this._frameManager.networkManager().setCacheEnabled(enabled);
  }

  public async screenshot(options?: BinaryScreenShotOptions): Promise<Buffer>;
  public async screenshot(options?: Base64ScreenShotOptions): Promise<string>;
  public async screenshot(options?: ScreenshotOptions): Promise<string | Buffer>;
  public async screenshot(options: ScreenshotOptions = {}): Promise<string | Buffer> {
    let screenshotType: 'png' | 'jpeg' | null = null;
    // options.type takes precedence over inferring the type from options.path
    // because it may be a 0-length file with no extension created beforehand (i.e. as a temp file).
    if (options.type) {
      assert(options.type === 'png' || options.type === 'jpeg', 'Unknown options.type value: ' + options.type);
      screenshotType = options.type;
    } else if (options.path) {
      const mimeType = mime.getType(options.path);
      if (mimeType === 'image/png') screenshotType = 'png';
      else if (mimeType === 'image/jpeg') screenshotType = 'jpeg';
      assert(screenshotType, 'Unsupported screenshot mime type: ' + mimeType);
    }

    if (!screenshotType) screenshotType = 'png';

    if (options.quality) {
      assert(screenshotType === 'jpeg', 'options.quality is unsupported for the ' + screenshotType + ' screenshots');
      assert(
          typeof options.quality === 'number',
          'Expected options.quality to be a number but found ' + typeof options.quality
      );
      assert(Number.isInteger(options.quality), 'Expected options.quality to be an integer');
      assert(
          options.quality >= 0 && options.quality <= 100,
          'Expected options.quality to be between 0 and 100 (inclusive), got ' + options.quality
      );
    }
    assert(!options.clip || !options.fullPage, 'options.clip and options.fullPage are exclusive');
    if (options.clip) {
      assert(
          typeof options.clip.x === 'number',
          'Expected options.clip.x to be a number but found ' + typeof options.clip.x
      );
      assert(
          typeof options.clip.y === 'number',
          'Expected options.clip.y to be a number but found ' + typeof options.clip.y
      );
      assert(
          typeof options.clip.width === 'number',
          'Expected options.clip.width to be a number but found ' + typeof options.clip.width
      );
      assert(
          typeof options.clip.height === 'number',
          'Expected options.clip.height to be a number but found ' + typeof options.clip.height
      );
      assert(options.clip.width !== 0, 'Expected options.clip.width not to be 0.');
      assert(options.clip.height !== 0, 'Expected options.clip.height not to be 0.');
    }
    return this._screenshotTaskQueue.postTask(this._screenshotTask.bind(this, screenshotType, options));
  }

  private async _screenshotTask(format: 'png' | 'jpeg', options: ScreenshotOptions = {}): Promise<Buffer | string> {
    await this._client.send('Target.activateTarget', { targetId: this._target._targetId });
    let clip = options.clip ? processClip(options.clip) : undefined;

    if (options.fullPage) {
      const metrics = await this._client.send('Page.getLayoutMetrics');
      const width = Math.ceil(metrics.contentSize.width);
      const height = Math.ceil(metrics.contentSize.height);

      // Overwrite clip for full page at all times.
      clip = { x: 0, y: 0, width, height, scale: 1 };
      const { isMobile = false, deviceScaleFactor = 1, isLandscape = false } = this._viewport || {};
      const screenOrientation: Protocol.Emulation.ScreenOrientation = isLandscape
        ? { angle: 90, type: 'landscapePrimary' }
        : { angle: 0, type: 'portraitPrimary' };
      await this._client.send('Emulation.setDeviceMetricsOverride', {
        mobile: isMobile,
        width,
        height,
        deviceScaleFactor,
        screenOrientation
      });
    }
    const shouldSetDefaultBackground = options.omitBackground && format === 'png';
    if (shouldSetDefaultBackground)
      await this._client.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
    const result = await this._client.send('Page.captureScreenshot', { format, quality: options.quality, clip });
    if (shouldSetDefaultBackground) await this._client.send('Emulation.setDefaultBackgroundColorOverride');

    if (options.fullPage && this._viewport) await this.setViewport(this._viewport);

    const buffer = options.encoding === 'base64' ? result.data : Buffer.from(result.data, 'base64');
    if (options.path) await writeFileAsync(options.path, buffer);
    return buffer;
  }

  public async pdf(options: PDFOptions = {}): Promise<Buffer | null> {
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
      path = null
    } = options;

    let paperWidth = 8.5;
    let paperHeight = 11;
    if (options.format) {
      const format = Page.PaperFormats[options.format.toLowerCase()];
      assert(format, 'Unknown paper format: ' + options.format);
      paperWidth = format.width;
      paperHeight = format.height;
    } else {
      paperWidth = convertPrintParameterToInches(options.width) || paperWidth;
      paperHeight = convertPrintParameterToInches(options.height) || paperHeight;
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
      preferCSSPageSize
    });
    return helper.readProtocolStream(this._client, result.stream!, path);
  }

  public async title(): Promise<string> {
    return this.mainFrame().title();
  }

  public async close(options: { runBeforeUnload: boolean | undefined } = { runBeforeUnload: undefined }) {
    assert(!!this._client._connection, 'Protocol error: Connection closed. Most likely the page has been closed.');
    const runBeforeUnload = !!options.runBeforeUnload;
    if (runBeforeUnload) {
      await this._client.send('Page.close');
    } else {
      await this._client._connection.send('Target.closeTarget', { targetId: this._target._targetId });
      await this._target._isClosedPromise;
    }
  }

  public isClosed(): boolean {
    return this._closed;
  }

  public click(selector: string, options: ClickOptions = {}) {
    return this.mainFrame().click(selector, options);
  }

  public focus(selector: string) {
    return this.mainFrame().focus(selector);
  }

  public hover(selector: string) {
    return this.mainFrame().hover(selector);
  }

  public select(selector: string, ...values: string[]): Promise<string[]> {
    return this.mainFrame().select(selector, ...values);
  }

  public tap(selector: string) {
    return this.mainFrame().tap(selector);
  }

  public type(selector: string, text: string, options?: { delay: number | undefined }) {
    return this.mainFrame().type(selector, text, options);
  }

  waitFor(duration: number): Promise<void>;
  waitFor(selector: string, options: WaitForSelectorOptionsHidden): Promise<ElementHandle | null>;
  waitFor(selector: string, options?: WaitForSelectorOptions): Promise<ElementHandle>;
  waitFor(selector: EvaluateFn, options?: WaitForSelectorOptions, ...args: SerializableOrJSHandle[]): Promise<JSHandle>;
  public waitFor(
    selector: string | number | EvaluateFn,
    options?: WaitForSelectorOptionsHidden,
    ...args: SerializableOrJSHandle[]
  ): Promise<ElementHandle | JSHandle | null | void> {
    return this.mainFrame().waitFor(selector as string, options, ...args);
  }

  public waitForSelector(selector: string, options: WaitForSelectorOptions = {}): Promise<ElementHandle | null> {
    return this.mainFrame().waitForSelector(selector, options);
  }

  public waitForXPath(xpath: string, options: WaitForSelectorOptions = {}): Promise<ElementHandle | null> {
    return this.mainFrame().waitForXPath(xpath, options);
  }

  public waitForFunction(
    pageFunction: EvaluateFn,
    options: PageFnOptions = {},
    ...args: SerializableOrJSHandle[]
  ): Promise<JSHandle> {
    return this.mainFrame().waitForFunction(pageFunction, options, ...args);
  }

  private async _onFileChooser(event: Protocol.Page.FileChooserOpenedEvent) {
    if (!this._fileChooserInterceptors.size)
      return;
    const frame = this._frameManager.frame(event.frameId);
    const context = await frame!.executionContext();
    const element = await context._adoptBackendNodeId(event.backendNodeId);
    const interceptors = Array.from(this._fileChooserInterceptors);
    this._fileChooserInterceptors.clear();
    const fileChooser = new FileChooser(element, event);
    for (const interceptor of interceptors)
      interceptor.call(null, fileChooser);
  }

  private _onTargetCrashed() {
    this.emit('error', new Error('Page crashed!'));
  }

  private _onLogEntryAdded(event: Protocol.Log.EntryAddedEvent) {
    const { level, text, args, source, url, lineNumber } = event.entry;
    if (args) args.map(arg => helper.releaseObject(this._client, arg));
    if (source !== 'worker') this.emit(Events.Page.Console, new ConsoleMessage(level, text, [], { url, lineNumber }));
  }

  private _emitMetrics(event: Protocol.Performance.MetricsEvent) {
    this.emit(Events.Page.Metrics, {
      title: event.title,
      metrics: this._buildMetricsObject(event.metrics)
    });
  }

  private _addConsoleMessage = (type: string, args: JSHandle[], stackTrace?: Protocol.Runtime.StackTrace) => {
    if (!this.listenerCount(Events.Page.Console)) {
      for (const arg of args) arg.dispose().catch(noop);
      return;
    }
    const textTokens: string[] = [];
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
          columnNumber: stackTrace.callFrames[0].columnNumber
        }
        : {};
    const message = new ConsoleMessage(type, textTokens.join(' '), args, location);
    this.emit(Events.Page.Console, message);
  };

  private _onDialog(event: Protocol.Page.JavascriptDialogOpeningEvent) {
    let dialogType = null;
    if (event.type === 'alert') dialogType = Dialog.Type.Alert;
    else if (event.type === 'confirm') dialogType = Dialog.Type.Confirm;
    else if (event.type === 'prompt') dialogType = Dialog.Type.Prompt;
    else if (event.type === 'beforeunload') dialogType = Dialog.Type.BeforeUnload;
    assert(dialogType, 'Unknown javascript dialog type: ' + event.type);
    const dialog = new Dialog(this._client, dialogType, event.message, event.defaultPrompt);
    this.emit(Events.Page.Dialog, dialog);
  }

  private _sessionClosePromise() {
    if (!this._disconnectPromise) {
      this._disconnectPromise = new Promise(fulfill =>
        this._client.once(Events.CDPSession.Disconnected, () => fulfill(new Error('Target closed')))
      );
    }
    return this._disconnectPromise;
  }

  private async _go(delta: number, options?: NavigationOptions): Promise<Response | null> {
    const history = await this._client.send('Page.getNavigationHistory');
    const entry = history.entries[history.currentIndex + delta];
    if (!entry) return null;
    const [response] = await Promise.all([
      this.waitForNavigation(options),
      this._client.send('Page.navigateToHistoryEntry', { entryId: entry.id })
    ] as const);
    return response;
  }
}

function processClip(clip: { x: number; y: number; width: number; height: number }) {
  const x = Math.round(clip.x);
  const y = Math.round(clip.y);
  const width = Math.round(clip.width + clip.x - x);
  const height = Math.round(clip.height + clip.y - y);
  return { x, y, width, height, scale: 1 };
}

export interface PDFOptions {
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
  margin?: { top?: string | number; bottom?: string | number; left?: string | number; right?: string | number };
  path?: string;
}

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

export interface BoundingBox {
  /** The x-coordinate of top-left corner. */
  x: number;
  /** The y-coordinate of top-left corner. */
  y: number;
  /** The width. */
  width: number;
  /** The height. */
  height: number;
}

export interface ScreenshotOptions {
  /**
   * The file path to save the image to. The screenshot type will be inferred from file extension.
   * If `path` is a relative path, then it is resolved relative to current working directory.
   * If no path is provided, the image won't be saved to the disk.
   */
  path?: string;

  /**
   * The screenshot type.
   * @default 'png'
   */
  type?: 'jpeg' | 'png';

  /** The quality of the image, between 0-100. Not applicable to png images. */
  quality?: number;

  /**
   * When true, takes a screenshot of the full scrollable page.
   * @default false
   */
  fullPage?: boolean;

  /**
   * An object which specifies clipping region of the page.
   */
  clip?: BoundingBox;

  /**
   * Hides default white background and allows capturing screenshots with transparency.
   * @default false
   */
  omitBackground?: boolean;

  /**
   * The encoding of the image, can be either base64 or binary.
   * @default binary
   */
  encoding?: 'base64' | 'binary';
}

export interface BinaryScreenShotOptions extends ScreenshotOptions {
  encoding?: 'binary';
}

export interface Base64ScreenShotOptions extends ScreenshotOptions {
  encoding: 'base64';
}

const supportedMetrics = new Set<keyof Metrics>([
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
  'JSHeapTotalSize'
]);

const unitToPixels = {
  px: 1,
  in: 96,
  cm: 37.8,
  mm: 3.78
} as const;

function convertPrintParameterToInches(parameter: string | number | undefined): number | undefined {
  if (typeof parameter === 'undefined') return undefined;
  let pixels;
  if (helper.isNumber(parameter)) {
    // Treat numbers as pixel values to be aligned with phantom's paperSize.
    pixels = parameter;
  } else if (helper.isString(parameter)) {
    const text = parameter;
    let unit = text.substring(text.length - 2).toLowerCase();
    let valueText = '';
    if (hasOwnProperty.call(unitToPixels, unit)) {
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
    throw new Error('page.pdf() Cannot handle parameter type: ' + typeof parameter);
  }
  return pixels / 96;
}

export interface ConsoleMessageLocation {
  url?: string;
  lineNumber?: number;
  columnNumber?: number;
}

export class ConsoleMessage {
  constructor(
    private _type: string,
    private _text: string,
    private _args: JSHandle[],
    private _location: ConsoleMessageLocation = {}
  ) {}
  public type() {
    return this._type;
  }
  public text() {
    return this._text;
  }
  public args() {
    return this._args;
  }
  public location() {
    return this._location;
  }
}

export class FileChooser {
  private _element: ElementHandle;
  private _handled: boolean;
  private _multiple: boolean;

  constructor(element: ElementHandle, event: Protocol.Page.FileChooserOpenedEvent) {
    this._element = element;
    this._multiple = event.mode !== 'selectSingle';
    this._handled = false;
  }

  /** Whether file chooser allow for multiple file selection. */
  public isMultiple(): boolean {
    return this._multiple;
  }

  /**
   * Accept the file chooser request with given paths.
   * If some of the filePaths are relative paths, then they are resolved relative to the current working directory.
   */
  public async accept(filePaths: string[]): Promise<void> {
    assert(!this._handled, 'Cannot accept FileChooser which is already handled!');
    this._handled = true;
    await this._element.uploadFile(...filePaths);
  }

  /** Closes the file chooser without selecting any files. */
  public async cancel(): Promise<void> { // eslint-disable-line @typescript-eslint/require-await
    assert(!this._handled, 'Cannot cancel FileChooser which is already handled!');
    this._handled = true;
  }
}
