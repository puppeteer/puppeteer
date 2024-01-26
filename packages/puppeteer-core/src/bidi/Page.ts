/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {Readable} from 'stream';

import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';
import type Protocol from 'devtools-protocol';

import {
  firstValueFrom,
  from,
  map,
  raceWith,
  zip,
} from '../../third_party/rxjs/rxjs.js';
import type {CDPSession} from '../api/CDPSession.js';
import type {BoundingBox} from '../api/ElementHandle.js';
import type {WaitForOptions} from '../api/Frame.js';
import type {HTTPResponse} from '../api/HTTPResponse.js';
import {
  Page,
  PageEvent,
  type GeolocationOptions,
  type MediaFeature,
  type NewDocumentScriptEvaluation,
  type ScreenshotOptions,
} from '../api/Page.js';
import {Accessibility} from '../cdp/Accessibility.js';
import {Coverage} from '../cdp/Coverage.js';
import {EmulationManager as CdpEmulationManager} from '../cdp/EmulationManager.js';
import {FrameTree} from '../cdp/FrameTree.js';
import {Tracing} from '../cdp/Tracing.js';
import {
  ConsoleMessage,
  type ConsoleMessageLocation,
} from '../common/ConsoleMessage.js';
import {TargetCloseError, UnsupportedOperation} from '../common/Errors.js';
import type {Handler} from '../common/EventEmitter.js';
import {NetworkManagerEvent} from '../common/NetworkManagerEvents.js';
import type {PDFOptions} from '../common/PDFOptions.js';
import type {Awaitable} from '../common/types.js';
import {
  debugError,
  evaluationString,
  NETWORK_IDLE_TIME,
  parsePDFOptions,
  timeout,
  validateDialogType,
} from '../common/util.js';
import type {Viewport} from '../common/Viewport.js';
import {assert} from '../util/assert.js';
import {Deferred} from '../util/Deferred.js';
import {disposeSymbol} from '../util/disposable.js';
import {isErrorLike} from '../util/ErrorLike.js';

import type {BidiBrowser} from './Browser.js';
import type {BidiBrowserContext} from './BrowserContext.js';
import {
  BrowsingContextEvent,
  CdpSessionWrapper,
  type BrowsingContext,
} from './BrowsingContext.js';
import type {BidiConnection} from './Connection.js';
import {BidiDeserializer} from './Deserializer.js';
import {BidiDialog} from './Dialog.js';
import {BidiElementHandle} from './ElementHandle.js';
import {EmulationManager} from './EmulationManager.js';
import {BidiFrame} from './Frame.js';
import type {BidiHTTPRequest} from './HTTPRequest.js';
import type {BidiHTTPResponse} from './HTTPResponse.js';
import {BidiKeyboard, BidiMouse, BidiTouchscreen} from './Input.js';
import type {BidiJSHandle} from './JSHandle.js';
import {getBiDiReadinessState, rewriteNavigationError} from './lifecycle.js';
import {BidiNetworkManager} from './NetworkManager.js';
import {createBidiHandle} from './Realm.js';
import type {BiDiPageTarget} from './Target.js';

/**
 * @internal
 */
export class BidiPage extends Page {
  #accessibility: Accessibility;
  #connection: BidiConnection;
  #frameTree = new FrameTree<BidiFrame>();
  #networkManager: BidiNetworkManager;
  #viewport: Viewport | null = null;
  #closedDeferred = Deferred.create<never, TargetCloseError>();
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
  readonly #networkManagerEvents = [
    [
      NetworkManagerEvent.Request,
      (request: BidiHTTPRequest) => {
        this.emit(PageEvent.Request, request);
      },
    ],
    [
      NetworkManagerEvent.RequestServedFromCache,
      (request: BidiHTTPRequest) => {
        this.emit(PageEvent.RequestServedFromCache, request);
      },
    ],
    [
      NetworkManagerEvent.RequestFailed,
      (request: BidiHTTPRequest) => {
        this.emit(PageEvent.RequestFailed, request);
      },
    ],
    [
      NetworkManagerEvent.RequestFinished,
      (request: BidiHTTPRequest) => {
        this.emit(PageEvent.RequestFinished, request);
      },
    ],
    [
      NetworkManagerEvent.Response,
      (response: BidiHTTPResponse) => {
        this.emit(PageEvent.Response, response);
      },
    ],
  ] as const;

  readonly #browsingContextEvents = new Map<symbol, Handler<any>>([
    [BrowsingContextEvent.Created, this.#onContextCreated.bind(this)],
    [BrowsingContextEvent.Destroyed, this.#onContextDestroyed.bind(this)],
  ]);
  #tracing: Tracing;
  #coverage: Coverage;
  #cdpEmulationManager: CdpEmulationManager;
  #emulationManager: EmulationManager;
  #mouse: BidiMouse;
  #touchscreen: BidiTouchscreen;
  #keyboard: BidiKeyboard;
  #browsingContext: BrowsingContext;
  #browserContext: BidiBrowserContext;
  #target: BiDiPageTarget;

  _client(): CDPSession {
    return this.mainFrame().context().cdpSession;
  }

  constructor(
    browsingContext: BrowsingContext,
    browserContext: BidiBrowserContext,
    target: BiDiPageTarget
  ) {
    super();
    this.#browsingContext = browsingContext;
    this.#browserContext = browserContext;
    this.#target = target;
    this.#connection = browsingContext.connection;

    for (const [event, subscriber] of this.#browsingContextEvents) {
      this.#browsingContext.on(event, subscriber);
    }

    this.#networkManager = new BidiNetworkManager(this.#connection, this);

    for (const [event, subscriber] of this.#subscribedEvents) {
      this.#connection.on(event, subscriber);
    }

    for (const [event, subscriber] of this.#networkManagerEvents) {
      // TODO: remove any
      this.#networkManager.on(event, subscriber as any);
    }

    const frame = new BidiFrame(
      this,
      this.#browsingContext,
      this._timeoutSettings,
      this.#browsingContext.parent
    );
    this.#frameTree.addFrame(frame);
    this.emit(PageEvent.FrameAttached, frame);

    // TODO: https://github.com/w3c/webdriver-bidi/issues/443
    this.#accessibility = new Accessibility(
      this.mainFrame().context().cdpSession
    );
    this.#tracing = new Tracing(this.mainFrame().context().cdpSession);
    this.#coverage = new Coverage(this.mainFrame().context().cdpSession);
    this.#cdpEmulationManager = new CdpEmulationManager(
      this.mainFrame().context().cdpSession
    );
    this.#emulationManager = new EmulationManager(browsingContext);
    this.#mouse = new BidiMouse(this.mainFrame().context());
    this.#touchscreen = new BidiTouchscreen(this.mainFrame().context());
    this.#keyboard = new BidiKeyboard(this);
  }

  /**
   * @internal
   */
  get connection(): BidiConnection {
    return this.#connection;
  }

  override async setUserAgent(
    userAgent: string,
    userAgentMetadata?: Protocol.Emulation.UserAgentMetadata | undefined
  ): Promise<void> {
    // TODO: handle CDP-specific cases such as mprach.
    await this._client().send('Network.setUserAgentOverride', {
      userAgent: userAgent,
      userAgentMetadata: userAgentMetadata,
    });
  }

  override async setBypassCSP(enabled: boolean): Promise<void> {
    // TODO: handle CDP-specific cases such as mprach.
    await this._client().send('Page.setBypassCSP', {enabled});
  }

  override async queryObjects<Prototype>(
    prototypeHandle: BidiJSHandle<Prototype>
  ): Promise<BidiJSHandle<Prototype[]>> {
    assert(!prototypeHandle.disposed, 'Prototype JSHandle is disposed!');
    assert(
      prototypeHandle.id,
      'Prototype JSHandle must not be referencing primitive value'
    );
    const response = await this.mainFrame().client.send(
      'Runtime.queryObjects',
      {
        prototypeObjectId: prototypeHandle.id,
      }
    );
    return createBidiHandle(this.mainFrame().mainRealm(), {
      type: 'array',
      handle: response.objects.objectId,
    }) as BidiJSHandle<Prototype[]>;
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

  override get mouse(): BidiMouse {
    return this.#mouse;
  }

  override get touchscreen(): BidiTouchscreen {
    return this.#touchscreen;
  }

  override get keyboard(): BidiKeyboard {
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

  /**
   * @internal
   */
  async focusedFrame(): Promise<BidiFrame> {
    using frame = await this.mainFrame()
      .isolatedRealm()
      .evaluateHandle(() => {
        let frame: HTMLIFrameElement | undefined;
        let win: Window | null = window;
        while (win?.document.activeElement instanceof HTMLIFrameElement) {
          frame = win.document.activeElement;
          win = frame.contentWindow;
        }
        return frame;
      });
    if (!(frame instanceof BidiElementHandle)) {
      return this.mainFrame();
    }
    return await frame.contentFrame();
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
      this.emit(PageEvent.Load, undefined);
    }
  }

  #onFrameFragmentNavigated(info: Bidi.BrowsingContext.NavigationInfo): void {
    const frame = this.frame(info.context);
    if (frame) {
      this.emit(PageEvent.FrameNavigated, frame);
    }
  }

  #onFrameDOMContentLoaded(info: Bidi.BrowsingContext.NavigationInfo): void {
    const frame = this.frame(info.context);
    if (frame) {
      frame._hasStartedLoading = true;
      if (this.mainFrame() === frame) {
        this.emit(PageEvent.DOMContentLoaded, undefined);
      }
      this.emit(PageEvent.FrameNavigated, frame);
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
        this._timeoutSettings,
        context.parent
      );
      this.#frameTree.addFrame(frame);
      if (frame !== this.mainFrame()) {
        this.emit(PageEvent.FrameAttached, frame);
      }
    }
  }

  #onContextDestroyed(context: BrowsingContext): void {
    const frame = this.frame(context.id);

    if (frame) {
      if (frame === this.mainFrame()) {
        this.emit(PageEvent.Close, undefined);
      }
      this.#removeFramesRecursively(frame);
    }
  }

  #removeFramesRecursively(frame: BidiFrame): void {
    for (const child of frame.childFrames()) {
      this.#removeFramesRecursively(child);
    }
    frame[disposeSymbol]();
    this.#networkManager.clearMapAfterFrameDispose(frame);
    this.#frameTree.removeFrame(frame);
    this.emit(PageEvent.FrameDetached, frame);
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
            ? BidiDeserializer.deserialize(arg.remoteValue())
            : arg.toString();
          return `${value} ${parsedValue}`;
        }, '')
        .slice(1);

      this.emit(
        PageEvent.Console,
        new ConsoleMessage(
          event.method as any,
          text,
          args,
          getStackTraceLocations(event.stackTrace)
        )
      );
    } else if (isJavaScriptLogEntry(event)) {
      const error = new Error(event.text ?? '');

      const messageHeight = error.message.split('\n').length;
      const messageLines = error.stack!.split('\n').splice(0, messageHeight);

      const stackLines = [];
      if (event.stackTrace) {
        for (const frame of event.stackTrace.callFrames) {
          // Note we need to add `1` because the values are 0-indexed.
          stackLines.push(
            `    at ${frame.functionName || '<anonymous>'} (${frame.url}:${
              frame.lineNumber + 1
            }:${frame.columnNumber + 1})`
          );
          if (stackLines.length >= Error.stackTraceLimit) {
            break;
          }
        }
      }

      error.stack = [...messageLines, ...stackLines].join('\n');
      this.emit(PageEvent.PageError, error);
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
    this.emit(PageEvent.Dialog, dialog);
  }

  getNavigationResponse(id?: string | null): BidiHTTPResponse | null {
    return this.#networkManager.getNavigationResponse(id);
  }

  override isClosed(): boolean {
    return this.#closedDeferred.finished();
  }

  override async close(options?: {runBeforeUnload?: boolean}): Promise<void> {
    if (this.#closedDeferred.finished()) {
      return;
    }

    this.#closedDeferred.reject(new TargetCloseError('Page closed!'));
    this.#networkManager.dispose();

    await this.#connection.send('browsingContext.close', {
      context: this.mainFrame()._id,
      promptUnload: options?.runBeforeUnload ?? false,
    });

    this.emit(PageEvent.Close, undefined);
    this.removeAllListeners();
  }

  override async reload(
    options: WaitForOptions = {}
  ): Promise<BidiHTTPResponse | null> {
    const {
      waitUntil = 'load',
      timeout: ms = this._timeoutSettings.navigationTimeout(),
    } = options;

    const [readiness, networkIdle] = getBiDiReadinessState(waitUntil);

    const result$ = zip(
      from(
        this.#connection.send('browsingContext.reload', {
          context: this.mainFrame()._id,
          wait: readiness,
        })
      ),
      ...(networkIdle !== null
        ? [
            this.waitForNetworkIdle$({
              timeout: ms,
              concurrency: networkIdle === 'networkidle2' ? 2 : 0,
              idleTime: NETWORK_IDLE_TIME,
            }),
          ]
        : [])
    ).pipe(
      map(([{result}]) => {
        return result;
      }),
      raceWith(timeout(ms), from(this.#closedDeferred.valueOrThrow())),
      rewriteNavigationError(this.url(), ms)
    );

    const result = await firstValueFrom(result$);
    return this.getNavigationResponse(result.navigation);
  }

  override setDefaultNavigationTimeout(timeout: number): void {
    this._timeoutSettings.setDefaultNavigationTimeout(timeout);
  }

  override setDefaultTimeout(timeout: number): void {
    this._timeoutSettings.setDefaultTimeout(timeout);
  }

  override getDefaultTimeout(): number {
    return this._timeoutSettings.timeout();
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
    if (!this.#browsingContext.supportsCdp()) {
      await this.#emulationManager.emulateViewport(viewport);
      this.#viewport = viewport;
      return;
    }
    const needsReload =
      await this.#cdpEmulationManager.emulateViewport(viewport);
    this.#viewport = viewport;
    if (needsReload) {
      await this.reload();
    }
  }

  override viewport(): Viewport | null {
    return this.#viewport;
  }

  override async pdf(options: PDFOptions = {}): Promise<Buffer> {
    const {timeout: ms = this._timeoutSettings.timeout(), path = undefined} =
      options;
    const {
      printBackground: background,
      margin,
      landscape,
      width,
      height,
      pageRanges: ranges,
      scale,
      preferCSSPageSize,
    } = parsePDFOptions(options, 'cm');
    const pageRanges = ranges ? ranges.split(', ') : [];
    const {result} = await firstValueFrom(
      from(
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
        })
      ).pipe(raceWith(timeout(ms)))
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

  override async _screenshot(
    options: Readonly<ScreenshotOptions>
  ): Promise<string> {
    const {clip, type, captureBeyondViewport, quality} = options;
    if (options.omitBackground !== undefined && options.omitBackground) {
      throw new UnsupportedOperation(`BiDi does not support 'omitBackground'.`);
    }
    if (options.optimizeForSpeed !== undefined && options.optimizeForSpeed) {
      throw new UnsupportedOperation(
        `BiDi does not support 'optimizeForSpeed'.`
      );
    }
    if (options.fromSurface !== undefined && !options.fromSurface) {
      throw new UnsupportedOperation(`BiDi does not support 'fromSurface'.`);
    }
    if (clip !== undefined && clip.scale !== undefined && clip.scale !== 1) {
      throw new UnsupportedOperation(
        `BiDi does not support 'scale' in 'clip'.`
      );
    }

    let box: BoundingBox | undefined;
    if (clip) {
      if (captureBeyondViewport) {
        box = clip;
      } else {
        // The clip is always with respect to the document coordinates, so we
        // need to convert this to viewport coordinates when we aren't capturing
        // beyond the viewport.
        const [pageLeft, pageTop] = await this.evaluate(() => {
          if (!window.visualViewport) {
            throw new Error('window.visualViewport is not supported.');
          }
          return [
            window.visualViewport.pageLeft,
            window.visualViewport.pageTop,
          ] as const;
        });
        box = {
          ...clip,
          x: clip.x - pageLeft,
          y: clip.y - pageTop,
        };
      }
    }

    const {
      result: {data},
    } = await this.#connection.send('browsingContext.captureScreenshot', {
      context: this.mainFrame()._id,
      origin: captureBeyondViewport ? 'document' : 'viewport',
      format: {
        type: `image/${type}`,
        ...(quality !== undefined ? {quality: quality / 100} : {}),
      },
      ...(box ? {clip: {type: 'box', ...box}} : {}),
    });
    return data;
  }

  override async createCDPSession(): Promise<CDPSession> {
    const {sessionId} = await this.mainFrame()
      .context()
      .cdpSession.send('Target.attachToTarget', {
        targetId: this.mainFrame()._id,
        flatten: true,
      });
    return new CdpSessionWrapper(this.mainFrame().context(), sessionId);
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
      contexts: [this.mainFrame()._id],
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

  override isDragInterceptionEnabled(): boolean {
    return false;
  }

  override async setCacheEnabled(enabled?: boolean): Promise<void> {
    // TODO: handle CDP-specific cases such as mprach.
    await this._client().send('Network.setCacheDisabled', {
      cacheDisabled: !enabled,
    });
  }

  override isServiceWorkerBypassed(): never {
    throw new UnsupportedOperation();
  }

  override target(): BiDiPageTarget {
    return this.#target;
  }

  override waitForFileChooser(): never {
    throw new UnsupportedOperation();
  }

  override workers(): never {
    throw new UnsupportedOperation();
  }

  override setRequestInterception(): never {
    throw new UnsupportedOperation();
  }

  override setDragInterception(): never {
    throw new UnsupportedOperation();
  }

  override setBypassServiceWorker(): never {
    throw new UnsupportedOperation();
  }

  override setOfflineMode(): never {
    throw new UnsupportedOperation();
  }

  override emulateNetworkConditions(): never {
    throw new UnsupportedOperation();
  }

  override cookies(): never {
    throw new UnsupportedOperation();
  }

  override setCookie(): never {
    throw new UnsupportedOperation();
  }

  override deleteCookie(): never {
    throw new UnsupportedOperation();
  }

  override removeExposedFunction(): never {
    // TODO: Quick win?
    throw new UnsupportedOperation();
  }

  override authenticate(): never {
    throw new UnsupportedOperation();
  }

  override setExtraHTTPHeaders(): never {
    throw new UnsupportedOperation();
  }

  override metrics(): never {
    throw new UnsupportedOperation();
  }

  override async goBack(
    options: WaitForOptions = {}
  ): Promise<HTTPResponse | null> {
    return await this.#go(-1, options);
  }

  override async goForward(
    options: WaitForOptions = {}
  ): Promise<HTTPResponse | null> {
    return await this.#go(+1, options);
  }

  async #go(
    delta: number,
    options: WaitForOptions
  ): Promise<HTTPResponse | null> {
    try {
      const result = await Promise.all([
        this.waitForNavigation(options),
        this.#connection.send('browsingContext.traverseHistory', {
          delta,
          context: this.mainFrame()._id,
        }),
      ]);
      return result[0];
    } catch (err) {
      // TODO: waitForNavigation should be cancelled if an error happens.
      if (isErrorLike(err)) {
        if (err.message.includes('no such history entry')) {
          return null;
        }
      }
      throw err;
    }
  }

  override waitForDevicePrompt(): never {
    throw new UnsupportedOperation();
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
