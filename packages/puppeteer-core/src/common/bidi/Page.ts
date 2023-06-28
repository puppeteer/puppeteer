/**
 * Copyright 2022 Google Inc. All rights reserved.
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

import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';
import Protocol from 'devtools-protocol';

import {
  GeolocationOptions,
  MediaFeature,
  Page as PageBase,
  PageEmittedEvents,
  ScreenshotOptions,
  WaitForOptions,
} from '../../api/Page.js';
import {assert} from '../../util/assert.js';
import {Deferred} from '../../util/Deferred.js';
import {Accessibility} from '../Accessibility.js';
import {ConsoleMessage, ConsoleMessageLocation} from '../ConsoleMessage.js';
import {Coverage} from '../Coverage.js';
import {EmulationManager} from '../EmulationManager.js';
import {TargetCloseError} from '../Errors.js';
import {Handler} from '../EventEmitter.js';
import {FrameTree} from '../FrameTree.js';
import {NetworkManagerEmittedEvents} from '../NetworkManager.js';
import {PDFOptions} from '../PDFOptions.js';
import {Viewport} from '../PuppeteerViewport.js';
import {TimeoutSettings} from '../TimeoutSettings.js';
import {Tracing} from '../Tracing.js';
import {EvaluateFunc, HandleFor} from '../types.js';
import {
  debugError,
  isString,
  waitForEvent,
  waitWithTimeout,
  withSourcePuppeteerURLIfNone,
} from '../util.js';

import {Browser} from './Browser.js';
import {BrowserContext} from './BrowserContext.js';
import {BrowsingContext} from './BrowsingContext.js';
import {Connection} from './Connection.js';
import {Frame} from './Frame.js';
import {HTTPRequest} from './HTTPRequest.js';
import {HTTPResponse} from './HTTPResponse.js';
import {Keyboard, Mouse, Touchscreen} from './Input.js';
import {NetworkManager} from './NetworkManager.js';
import {getBidiHandle} from './Realm.js';
import {BidiSerializer} from './Serializer.js';

/**
 * @internal
 */
export class Page extends PageBase {
  #accessibility: Accessibility;
  #timeoutSettings = new TimeoutSettings();
  #browserContext: BrowserContext;
  #connection: Connection;
  #frameTree = new FrameTree<Frame>();
  #networkManager: NetworkManager;
  #viewport: Viewport | null = null;
  #closedDeferred = Deferred.create<TargetCloseError>();
  #subscribedEvents = new Map<string, Handler<any>>([
    ['log.entryAdded', this.#onLogEntryAdded.bind(this)],
    ['browsingContext.load', this.#onFrameLoaded.bind(this)],
    [
      'browsingContext.domContentLoaded',
      this.#onFrameDOMContentLoaded.bind(this),
    ],
    ['browsingContext.contextCreated', this.#onFrameAttached.bind(this)],
    ['browsingContext.contextDestroyed', this.#onFrameDetached.bind(this)],
    ['browsingContext.fragmentNavigated', this.#onFrameNavigated.bind(this)],
  ]) as Map<Bidi.Session.SubscriptionRequestEvent, Handler>;
  #networkManagerEvents = new Map<symbol, Handler<any>>([
    [
      NetworkManagerEmittedEvents.Request,
      this.emit.bind(this, PageEmittedEvents.Request),
    ],
    [
      NetworkManagerEmittedEvents.RequestServedFromCache,
      this.emit.bind(this, PageEmittedEvents.RequestServedFromCache),
    ],
    [
      NetworkManagerEmittedEvents.RequestFailed,
      this.emit.bind(this, PageEmittedEvents.RequestFailed),
    ],
    [
      NetworkManagerEmittedEvents.RequestFinished,
      this.emit.bind(this, PageEmittedEvents.RequestFinished),
    ],
    [
      NetworkManagerEmittedEvents.Response,
      this.emit.bind(this, PageEmittedEvents.Response),
    ],
  ]);
  #tracing: Tracing;
  #coverage: Coverage;
  #emulationManager: EmulationManager;
  #mouse: Mouse;
  #touchscreen: Touchscreen;
  #keyboard: Keyboard;

  constructor(
    browserContext: BrowserContext,
    info: Omit<Bidi.BrowsingContext.Info, 'url'> & {
      url?: string;
    }
  ) {
    super();
    this.#browserContext = browserContext;
    this.#connection = browserContext.connection;

    this.#networkManager = new NetworkManager(this.#connection, this);
    this.#onFrameAttached({
      ...info,
      url: info.url ?? 'about:blank',
      children: info.children ?? [],
    });

    for (const [event, subscriber] of this.#subscribedEvents) {
      this.#connection.on(event, subscriber);
    }

    for (const [event, subscriber] of this.#networkManagerEvents) {
      this.#networkManager.on(event, subscriber);
    }

    // TODO: https://github.com/w3c/webdriver-bidi/issues/443
    this.#accessibility = new Accessibility(
      this.mainFrame().context().cdpSession
    );
    this.#tracing = new Tracing(this.mainFrame().context().cdpSession);
    this.#coverage = new Coverage(this.mainFrame().context().cdpSession);
    this.#emulationManager = new EmulationManager(
      this.mainFrame().context().cdpSession
    );
    this.#mouse = new Mouse(this.mainFrame().context());
    this.#touchscreen = new Touchscreen(this.mainFrame().context());
    this.#keyboard = new Keyboard(this.mainFrame().context());
  }

  override get accessibility(): Accessibility {
    return this.#accessibility;
  }

  override get tracing(): Tracing {
    return this.#tracing;
  }

  override get coverage(): Coverage {
    return this.#coverage;
  }

  override get mouse(): Mouse {
    return this.#mouse;
  }

  override get touchscreen(): Touchscreen {
    return this.#touchscreen;
  }

  override get keyboard(): Keyboard {
    return this.#keyboard;
  }

  override browser(): Browser {
    return this.#browserContext.browser();
  }

  override browserContext(): BrowserContext {
    return this.#browserContext;
  }

  override mainFrame(): Frame {
    const mainFrame = this.#frameTree.getMainFrame();
    assert(mainFrame, 'Requesting main frame too early!');
    return mainFrame;
  }

  override frames(): Frame[] {
    return Array.from(this.#frameTree.frames());
  }

  frame(frameId?: string): Frame | null {
    return this.#frameTree.getById(frameId ?? '') || null;
  }

  childFrames(frameId: string): Frame[] {
    return this.#frameTree.childFrames(frameId);
  }

  #onFrameLoaded(info: Bidi.BrowsingContext.NavigationInfo): void {
    const frame = this.frame(info.context);
    if (frame && this.mainFrame() === frame) {
      this.emit(PageEmittedEvents.Load);
    }
  }

  #onFrameDOMContentLoaded(info: Bidi.BrowsingContext.NavigationInfo): void {
    const frame = this.frame(info.context);
    if (frame && this.mainFrame() === frame) {
      this.emit(PageEmittedEvents.DOMContentLoaded);
    }
  }

  #onFrameAttached(info: Bidi.BrowsingContext.Info): void {
    if (
      !this.frame(info.context) &&
      (this.frame(info.parent ?? '') || !this.#frameTree.getMainFrame())
    ) {
      const context = new BrowsingContext(
        this.#connection,
        this.#timeoutSettings,
        info
      );
      this.#connection.registerBrowsingContexts(context);

      const frame = new Frame(
        this,
        context,
        this.#timeoutSettings,
        info.parent
      );
      this.#frameTree.addFrame(frame);
      this.emit(PageEmittedEvents.FrameAttached, frame);
    }
  }

  async #onFrameNavigated(
    info: Bidi.BrowsingContext.NavigationInfo
  ): Promise<void> {
    const frameId = info.context;

    let frame = this.frame(frameId);
    // Detach all child frames first.
    if (frame) {
      frame = await this.#frameTree.waitForFrame(frameId);
      this.emit(PageEmittedEvents.FrameNavigated, frame);
    }
  }

  #onFrameDetached(info: Bidi.BrowsingContext.Info): void {
    const frame = this.frame(info.context);

    if (frame) {
      if (frame === this.mainFrame()) {
        this.emit(PageEmittedEvents.Close);
      }
      this.#removeFramesRecursively(frame);
    }
  }

  #removeFramesRecursively(frame: Frame): void {
    for (const child of frame.childFrames()) {
      this.#removeFramesRecursively(child);
    }
    frame.dispose();
    this.#networkManager.clearMapAfterFrameDispose(frame);
    this.#frameTree.removeFrame(frame);
    this.emit(PageEmittedEvents.FrameDetached, frame);
  }

  #onLogEntryAdded(event: Bidi.Log.LogEntry): void {
    const frame = this.frame(event.source.context);
    if (!frame) {
      return;
    }
    if (isConsoleLogEntry(event)) {
      const args = event.args.map(arg => {
        return getBidiHandle(frame.context(), arg, frame);
      });

      const text = args
        .reduce((value, arg) => {
          const parsedValue = arg.isPrimitiveValue
            ? BidiSerializer.deserialize(arg.remoteValue())
            : arg.toString();
          return `${value} ${parsedValue}`;
        }, '')
        .slice(1);

      this.emit(
        PageEmittedEvents.Console,
        new ConsoleMessage(
          event.method as any,
          text,
          args,
          getStackTraceLocations(event.stackTrace)
        )
      );
    } else if (isJavaScriptLogEntry(event)) {
      let message = event.text ?? '';

      if (event.stackTrace) {
        for (const callFrame of event.stackTrace.callFrames) {
          const location =
            callFrame.url +
            ':' +
            callFrame.lineNumber +
            ':' +
            callFrame.columnNumber;
          const functionName = callFrame.functionName || '<anonymous>';
          message += `\n    at ${functionName} (${location})`;
        }
      }

      const error = new Error(message);
      error.stack = ''; // Don't capture Puppeteer stacktrace.

      this.emit(PageEmittedEvents.PageError, error);
    } else {
      debugError(
        `Unhandled LogEntry with type "${event.type}", text "${event.text}" and level "${event.level}"`
      );
    }
  }

  getNavigationResponse(id: string | null): HTTPResponse | null {
    return this.#networkManager.getNavigationResponse(id);
  }

  override async close(): Promise<void> {
    if (this.#closedDeferred.finished()) {
      return;
    }
    this.#closedDeferred.resolve(new TargetCloseError('Page closed!'));
    this.#networkManager.dispose();

    await this.#connection.send('browsingContext.close', {
      context: this.mainFrame()._id,
    });
    this.emit(PageEmittedEvents.Close);
    this.removeAllListeners();
  }

  override async evaluateHandle<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>> {
    pageFunction = withSourcePuppeteerURLIfNone(
      this.evaluateHandle.name,
      pageFunction
    );
    return this.mainFrame().evaluateHandle(pageFunction, ...args);
  }

  override async evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
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

  override async goto(
    url: string,
    options?: WaitForOptions & {
      referer?: string | undefined;
      referrerPolicy?: string | undefined;
    }
  ): Promise<HTTPResponse | null> {
    return this.mainFrame().goto(url, options);
  }

  override async reload(
    options?: WaitForOptions
  ): Promise<HTTPResponse | null> {
    const [response] = await Promise.all([
      this.waitForResponse(response => {
        return (
          response.request().isNavigationRequest() &&
          response.url() === this.url()
        );
      }),
      this.mainFrame().context().reload(options),
    ]);

    return response;
  }

  override url(): string {
    return this.mainFrame().url();
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

  override async setContent(
    html: string,
    options: WaitForOptions = {}
  ): Promise<void> {
    await this.mainFrame().setContent(html, options);
  }

  override async content(): Promise<string> {
    return this.mainFrame().content();
  }

  override isJavaScriptEnabled(): boolean {
    return this.#emulationManager.javascriptEnabled;
  }

  override async setGeolocation(options: GeolocationOptions): Promise<void> {
    return await this.#emulationManager.setGeolocation(options);
  }

  override async setJavaScriptEnabled(enabled: boolean): Promise<void> {
    return await this.#emulationManager.setJavaScriptEnabled(enabled);
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
      // TODO: reload seems to hang in BiDi.
      // await this.reload();
    }
  }

  override viewport(): Viewport | null {
    return this.#viewport;
  }

  override async pdf(options: PDFOptions = {}): Promise<Buffer> {
    const {path = undefined} = options;
    const {
      printBackground: background,
      margin,
      landscape,
      width,
      height,
      pageRanges,
      scale,
      preferCSSPageSize,
      timeout,
    } = this._getPDFOptions(options, 'cm');
    const {result} = await waitWithTimeout(
      this.#connection.send('browsingContext.print', {
        context: this.mainFrame()._id,
        background,
        margin,
        orientation: landscape ? 'landscape' : 'portrait',
        page: {
          width,
          height,
        },
        pageRanges: pageRanges.split(', '),
        scale,
        shrinkToFit: !preferCSSPageSize,
      }),
      'browsingContext.print',
      timeout
    );

    const buffer = Buffer.from(result.data, 'base64');

    await this._maybeWriteBufferToFile(path, buffer);

    return buffer;
  }

  override async createPDFStream(
    options?: PDFOptions | undefined
  ): Promise<Readable> {
    const buffer = await this.pdf(options);
    try {
      const {Readable} = await import('stream');
      return Readable.from(buffer);
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error(
          'Can only pass a file path in a Node-like environment.'
        );
      }
      throw error;
    }
  }

  override screenshot(
    options: ScreenshotOptions & {encoding: 'base64'}
  ): Promise<string>;
  override screenshot(
    options?: ScreenshotOptions & {encoding?: 'binary'}
  ): never;
  override async screenshot(
    options: ScreenshotOptions = {}
  ): Promise<Buffer | string> {
    const {path = undefined, encoding, ...args} = options;
    if (Object.keys(args).length >= 1) {
      throw new Error('BiDi only supports "encoding" and "path" options');
    }

    const {result} = await this.#connection.send(
      'browsingContext.captureScreenshot',
      {
        context: this.mainFrame()._id,
      }
    );

    if (encoding === 'base64') {
      return result.data;
    }

    const buffer = Buffer.from(result.data, 'base64');
    await this._maybeWriteBufferToFile(path, buffer);

    return buffer;
  }

  override waitForRequest(
    urlOrPredicate: string | ((req: HTTPRequest) => boolean | Promise<boolean>),
    options: {timeout?: number} = {}
  ): Promise<HTTPRequest> {
    const {timeout = this.#timeoutSettings.timeout()} = options;
    return waitForEvent(
      this.#networkManager,
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
      this.#closedDeferred.valueOrThrow()
    );
  }

  override waitForResponse(
    urlOrPredicate:
      | string
      | ((res: HTTPResponse) => boolean | Promise<boolean>),
    options: {timeout?: number} = {}
  ): Promise<HTTPResponse> {
    const {timeout = this.#timeoutSettings.timeout()} = options;
    return waitForEvent(
      this.#networkManager,
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
      this.#closedDeferred.valueOrThrow()
    );
  }

  override async waitForNetworkIdle(
    options: {idleTime?: number; timeout?: number} = {}
  ): Promise<void> {
    const {idleTime = 500, timeout = this.#timeoutSettings.timeout()} = options;

    await this._waitForNetworkIdle(
      this.#networkManager,
      idleTime,
      timeout,
      this.#closedDeferred
    );
  }

  override title(): Promise<string> {
    return this.mainFrame().title();
  }
}

function isConsoleLogEntry(
  event: Bidi.Log.LogEntry
): event is Bidi.Log.ConsoleLogEntry {
  return event.type === 'console';
}

function isJavaScriptLogEntry(
  event: Bidi.Log.LogEntry
): event is Bidi.Log.JavascriptLogEntry {
  return event.type === 'javascript';
}

function getStackTraceLocations(
  stackTrace?: Bidi.Script.StackTrace
): ConsoleMessageLocation[] {
  const stackTraceLocations: ConsoleMessageLocation[] = [];
  if (stackTrace) {
    for (const callFrame of stackTrace.callFrames) {
      stackTraceLocations.push({
        url: callFrame.url,
        lineNumber: callFrame.lineNumber,
        columnNumber: callFrame.columnNumber,
      });
    }
  }
  return stackTraceLocations;
}
