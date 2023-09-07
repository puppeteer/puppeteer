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
  NewDocumentScriptEvaluation,
  Page,
  PageEmittedEvents,
  ScreenshotOptions,
  WaitForOptions,
} from '../../api/Page.js';
import {assert} from '../../util/assert.js';
import {Deferred} from '../../util/Deferred.js';
import {Accessibility} from '../Accessibility.js';
import {CDPSession} from '../Connection.js';
import {ConsoleMessage, ConsoleMessageLocation} from '../ConsoleMessage.js';
import {Coverage} from '../Coverage.js';
import {EmulationManager as CDPEmulationManager} from '../EmulationManager.js';
import {TargetCloseError} from '../Errors.js';
import {Handler} from '../EventEmitter.js';
import {FrameTree} from '../FrameTree.js';
import {NetworkManagerEmittedEvents} from '../NetworkManager.js';
import {PDFOptions} from '../PDFOptions.js';
import {Viewport} from '../PuppeteerViewport.js';
import {TimeoutSettings} from '../TimeoutSettings.js';
import {Tracing} from '../Tracing.js';
import {Awaitable} from '../types.js';
import {
  debugError,
  evaluationString,
  isString,
  validateDialogType,
  waitForEvent,
  waitWithTimeout,
} from '../util.js';

import {BidiBrowser} from './Browser.js';
import {BidiBrowserContext} from './BrowserContext.js';
import {
  BrowsingContext,
  BrowsingContextEmittedEvents,
  CDPSessionWrapper,
} from './BrowsingContext.js';
import {Connection} from './Connection.js';
import {BidiDialog} from './Dialog.js';
import {EmulationManager} from './EmulationManager.js';
import {BidiFrame} from './Frame.js';
import {HTTPRequest} from './HTTPRequest.js';
import {HTTPResponse} from './HTTPResponse.js';
import {Keyboard, Mouse, Touchscreen} from './Input.js';
import {NetworkManager} from './NetworkManager.js';
import {createBidiHandle} from './Realm.js';
import {BidiSerializer} from './Serializer.js';

/**
 * @internal
 */
export class BidiPage extends Page {
  #accessibility: Accessibility;
  #timeoutSettings = new TimeoutSettings();
  #connection: Connection;
  #frameTree = new FrameTree<BidiFrame>();
  #networkManager: NetworkManager;
  #viewport: Viewport | null = null;
  #closedDeferred = Deferred.create<TargetCloseError>();
  #subscribedEvents = new Map<Bidi.Event['method'], Handler<any>>([
    ['log.entryAdded', this.#onLogEntryAdded.bind(this)],
    ['browsingContext.load', this.#onFrameLoaded.bind(this)],
    [
      'browsingContext.fragmentNavigated',
      this.#onFrameFragmentNavigated.bind(this),
    ],
    [
      'browsingContext.domContentLoaded',
      this.#onFrameDOMContentLoaded.bind(this),
    ],
    ['browsingContext.userPromptOpened', this.#onDialog.bind(this)],
  ]);
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

  #browsingContextEvents = new Map<symbol, Handler<any>>([
    [BrowsingContextEmittedEvents.Created, this.#onContextCreated.bind(this)],
    [
      BrowsingContextEmittedEvents.Destroyed,
      this.#onContextDestroyed.bind(this),
    ],
  ]);
  #tracing: Tracing;
  #coverage: Coverage;
  #cdpEmulationManager: CDPEmulationManager;
  #emulationManager: EmulationManager;
  #mouse: Mouse;
  #touchscreen: Touchscreen;
  #keyboard: Keyboard;
  #browsingContext: BrowsingContext;
  #browserContext: BidiBrowserContext;

  _client(): CDPSession {
    return this.mainFrame().context().cdpSession;
  }

  constructor(
    browsingContext: BrowsingContext,
    browserContext: BidiBrowserContext
  ) {
    super();
    this.#browsingContext = browsingContext;
    this.#browserContext = browserContext;
    this.#connection = browsingContext.connection;

    for (const [event, subscriber] of this.#browsingContextEvents) {
      this.#browsingContext.on(event, subscriber);
    }

    this.#networkManager = new NetworkManager(this.#connection, this);

    for (const [event, subscriber] of this.#subscribedEvents) {
      this.#connection.on(event, subscriber);
    }

    for (const [event, subscriber] of this.#networkManagerEvents) {
      this.#networkManager.on(event, subscriber);
    }

    const frame = new BidiFrame(
      this,
      this.#browsingContext,
      this.#timeoutSettings,
      this.#browsingContext.parent
    );
    this.#frameTree.addFrame(frame);
    this.emit(PageEmittedEvents.FrameAttached, frame);

    // TODO: https://github.com/w3c/webdriver-bidi/issues/443
    this.#accessibility = new Accessibility(
      this.mainFrame().context().cdpSession
    );
    this.#tracing = new Tracing(this.mainFrame().context().cdpSession);
    this.#coverage = new Coverage(this.mainFrame().context().cdpSession);
    this.#cdpEmulationManager = new CDPEmulationManager(
      this.mainFrame().context().cdpSession
    );
    this.#emulationManager = new EmulationManager(browsingContext);
    this.#mouse = new Mouse(this.mainFrame().context());
    this.#touchscreen = new Touchscreen(this.mainFrame().context());
    this.#keyboard = new Keyboard(this.mainFrame().context());
  }

  _setBrowserContext(browserContext: BidiBrowserContext): void {
    this.#browserContext = browserContext;
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

  override browser(): BidiBrowser {
    return this.browserContext().browser();
  }

  override browserContext(): BidiBrowserContext {
    return this.#browserContext;
  }

  override mainFrame(): BidiFrame {
    const mainFrame = this.#frameTree.getMainFrame();
    assert(mainFrame, 'Requesting main frame too early!');
    return mainFrame;
  }

  override frames(): BidiFrame[] {
    return Array.from(this.#frameTree.frames());
  }

  frame(frameId?: string): BidiFrame | null {
    return this.#frameTree.getById(frameId ?? '') || null;
  }

  childFrames(frameId: string): BidiFrame[] {
    return this.#frameTree.childFrames(frameId);
  }

  #onFrameLoaded(info: Bidi.BrowsingContext.NavigationInfo): void {
    const frame = this.frame(info.context);
    if (frame && this.mainFrame() === frame) {
      this.emit(PageEmittedEvents.Load);
    }
  }

  #onFrameFragmentNavigated(info: Bidi.BrowsingContext.NavigationInfo): void {
    const frame = this.frame(info.context);
    if (frame) {
      this.emit(PageEmittedEvents.FrameNavigated, frame);
    }
  }

  #onFrameDOMContentLoaded(info: Bidi.BrowsingContext.NavigationInfo): void {
    const frame = this.frame(info.context);
    if (frame) {
      frame._hasStartedLoading = true;
      if (this.mainFrame() === frame) {
        this.emit(PageEmittedEvents.DOMContentLoaded);
      }
      this.emit(PageEmittedEvents.FrameNavigated, frame);
    }
  }

  #onContextCreated(context: BrowsingContext): void {
    if (
      !this.frame(context.id) &&
      (this.frame(context.parent ?? '') || !this.#frameTree.getMainFrame())
    ) {
      const frame = new BidiFrame(
        this,
        context,
        this.#timeoutSettings,
        context.parent
      );
      this.#frameTree.addFrame(frame);
      if (frame !== this.mainFrame()) {
        this.emit(PageEmittedEvents.FrameAttached, frame);
      }
    }
  }

  #onContextDestroyed(context: BrowsingContext): void {
    const frame = this.frame(context.id);

    if (frame) {
      if (frame === this.mainFrame()) {
        this.emit(PageEmittedEvents.Close);
      }
      this.#removeFramesRecursively(frame);
    }
  }

  #removeFramesRecursively(frame: BidiFrame): void {
    for (const child of frame.childFrames()) {
      this.#removeFramesRecursively(child);
    }
    frame[Symbol.dispose]();
    this.#networkManager.clearMapAfterFrameDispose(frame);
    this.#frameTree.removeFrame(frame);
    this.emit(PageEmittedEvents.FrameDetached, frame);
  }

  #onLogEntryAdded(event: Bidi.Log.Entry): void {
    const frame = this.frame(event.source.context);
    if (!frame) {
      return;
    }
    if (isConsoleLogEntry(event)) {
      const args = event.args.map(arg => {
        return createBidiHandle(frame.mainRealm(), arg);
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

  #onDialog(event: Bidi.BrowsingContext.UserPromptOpenedParameters): void {
    const frame = this.frame(event.context);
    if (!frame) {
      return;
    }
    const type = validateDialogType(event.type);

    const dialog = new BidiDialog(
      frame.context(),
      type,
      event.message,
      event.defaultValue
    );
    this.emit(PageEmittedEvents.Dialog, dialog);
  }

  getNavigationResponse(id: string | null): HTTPResponse | null {
    return this.#networkManager.getNavigationResponse(id);
  }

  override isClosed(): boolean {
    return this.#closedDeferred.finished();
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
      this.mainFrame()
        .context()
        .reload({
          ...options,
          timeout:
            options?.timeout ?? this.#timeoutSettings.navigationTimeout(),
        }),
    ]);

    return response;
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

  override isJavaScriptEnabled(): boolean {
    return this.#cdpEmulationManager.javascriptEnabled;
  }

  override async setGeolocation(options: GeolocationOptions): Promise<void> {
    return await this.#cdpEmulationManager.setGeolocation(options);
  }

  override async setJavaScriptEnabled(enabled: boolean): Promise<void> {
    return await this.#cdpEmulationManager.setJavaScriptEnabled(enabled);
  }

  override async emulateMediaType(type?: string): Promise<void> {
    return await this.#cdpEmulationManager.emulateMediaType(type);
  }

  override async emulateCPUThrottling(factor: number | null): Promise<void> {
    return await this.#cdpEmulationManager.emulateCPUThrottling(factor);
  }

  override async emulateMediaFeatures(
    features?: MediaFeature[]
  ): Promise<void> {
    return await this.#cdpEmulationManager.emulateMediaFeatures(features);
  }

  override async emulateTimezone(timezoneId?: string): Promise<void> {
    return await this.#cdpEmulationManager.emulateTimezone(timezoneId);
  }

  override async emulateIdleState(overrides?: {
    isUserActive: boolean;
    isScreenUnlocked: boolean;
  }): Promise<void> {
    return await this.#cdpEmulationManager.emulateIdleState(overrides);
  }

  override async emulateVisionDeficiency(
    type?: Protocol.Emulation.SetEmulatedVisionDeficiencyRequest['type']
  ): Promise<void> {
    return await this.#cdpEmulationManager.emulateVisionDeficiency(type);
  }

  override async setViewport(viewport: Viewport): Promise<void> {
    if (!this.#browsingContext.supportsCDP()) {
      await this.#emulationManager.emulateViewport(viewport);
      this.#viewport = viewport;
      return;
    }
    const needsReload =
      await this.#cdpEmulationManager.emulateViewport(viewport);
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
      pageRanges: ranges,
      scale,
      preferCSSPageSize,
      timeout,
    } = this._getPDFOptions(options, 'cm');
    const pageRanges = ranges ? ranges.split(', ') : [];
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
        pageRanges,
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

  override async waitForRequest(
    urlOrPredicate: string | ((req: HTTPRequest) => boolean | Promise<boolean>),
    options: {timeout?: number} = {}
  ): Promise<HTTPRequest> {
    const {timeout = this.#timeoutSettings.timeout()} = options;
    return await waitForEvent(
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

  override async waitForResponse(
    urlOrPredicate:
      | string
      | ((res: HTTPResponse) => boolean | Promise<boolean>),
    options: {timeout?: number} = {}
  ): Promise<HTTPResponse> {
    const {timeout = this.#timeoutSettings.timeout()} = options;
    return await waitForEvent(
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

  override async createCDPSession(): Promise<CDPSession> {
    const {sessionId} = await this.mainFrame()
      .context()
      .cdpSession.send('Target.attachToTarget', {
        targetId: this.mainFrame()._id,
        flatten: true,
      });
    return new CDPSessionWrapper(this.mainFrame().context(), sessionId);
  }

  override async bringToFront(): Promise<void> {
    await this.#connection.send('browsingContext.activate', {
      context: this.mainFrame()._id,
    });
  }

  override async evaluateOnNewDocument<
    Params extends unknown[],
    Func extends (...args: Params) => unknown = (...args: Params) => unknown,
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<NewDocumentScriptEvaluation> {
    const expression = evaluationExpression(pageFunction, ...args);
    const {result} = await this.#connection.send('script.addPreloadScript', {
      functionDeclaration: expression,
      // TODO: should change spec to accept browsingContext
    });

    return {identifier: result.script};
  }

  override async removeScriptToEvaluateOnNewDocument(
    id: string
  ): Promise<void> {
    await this.#connection.send('script.removePreloadScript', {
      script: id,
    });
  }

  override async exposeFunction<Args extends unknown[], Ret>(
    name: string,
    pptrFunction:
      | ((...args: Args) => Awaitable<Ret>)
      | {default: (...args: Args) => Awaitable<Ret>}
  ): Promise<void> {
    return await this.mainFrame().exposeFunction(
      name,
      'default' in pptrFunction ? pptrFunction.default : pptrFunction
    );
  }
}

function isConsoleLogEntry(
  event: Bidi.Log.Entry
): event is Bidi.Log.ConsoleLogEntry {
  return event.type === 'console';
}

function isJavaScriptLogEntry(
  event: Bidi.Log.Entry
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

function evaluationExpression(fun: Function | string, ...args: unknown[]) {
  return `() => {${evaluationString(fun, ...args)}}`;
}
