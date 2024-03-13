/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';
import type Protocol from 'devtools-protocol';

import {firstValueFrom, from, raceWith} from '../../third_party/rxjs/rxjs.js';
import type {CDPSession} from '../api/CDPSession.js';
import type {BoundingBox} from '../api/ElementHandle.js';
import type {WaitForOptions} from '../api/Frame.js';
import type {HTTPResponse} from '../api/HTTPResponse.js';
import type {
  GeolocationOptions,
  MediaFeature,
  PageEvents,
} from '../api/Page.js';
import {
  Page,
  PageEvent,
  type NewDocumentScriptEvaluation,
  type ScreenshotOptions,
} from '../api/Page.js';
import {Accessibility} from '../cdp/Accessibility.js';
import {Coverage} from '../cdp/Coverage.js';
import {EmulationManager} from '../cdp/EmulationManager.js';
import {Tracing} from '../cdp/Tracing.js';
import type {
  Cookie,
  CookieParam,
  CookieSameSite,
  DeleteCookiesRequest,
} from '../common/Cookie.js';
import {UnsupportedOperation} from '../common/Errors.js';
import {EventEmitter} from '../common/EventEmitter.js';
import type {PDFOptions} from '../common/PDFOptions.js';
import type {Awaitable} from '../common/types.js';
import {evaluationString, parsePDFOptions, timeout} from '../common/util.js';
import type {Viewport} from '../common/Viewport.js';
import {assert} from '../util/assert.js';
import {bubble} from '../util/decorators.js';
import {isErrorLike} from '../util/ErrorLike.js';

import type {BidiBrowser} from './Browser.js';
import type {BidiBrowserContext} from './BrowserContext.js';
import type {BidiCdpSession} from './CDPSession.js';
import type {BrowsingContext} from './core/BrowsingContext.js';
import {BidiFrame} from './Frame.js';
import type {BidiHTTPResponse} from './HTTPResponse.js';
import {BidiKeyboard, BidiMouse, BidiTouchscreen} from './Input.js';
import type {BidiJSHandle} from './JSHandle.js';
import {rewriteNavigationError} from './util.js';
import type {BidiWebWorker} from './WebWorker.js';

/**
 * @internal
 */
export class BidiPage extends Page {
  static from(
    browserContext: BidiBrowserContext,
    browsingContext: BrowsingContext
  ): BidiPage {
    const page = new BidiPage(browserContext, browsingContext);
    page.#initialize();
    return page;
  }

  @bubble()
  accessor trustedEmitter = new EventEmitter<PageEvents>();

  readonly #browserContext: BidiBrowserContext;
  readonly #frame: BidiFrame;
  #viewport: Viewport | null = null;
  readonly #workers = new Set<BidiWebWorker>();

  readonly keyboard: BidiKeyboard;
  readonly mouse: BidiMouse;
  readonly touchscreen: BidiTouchscreen;
  readonly accessibility: Accessibility;
  readonly tracing: Tracing;
  readonly coverage: Coverage;
  readonly #cdpEmulationManager: EmulationManager;

  _client(): BidiCdpSession {
    return this.#frame.client;
  }

  private constructor(
    browserContext: BidiBrowserContext,
    browsingContext: BrowsingContext
  ) {
    super();
    this.#browserContext = browserContext;
    this.#frame = BidiFrame.from(this, browsingContext);

    this.#cdpEmulationManager = new EmulationManager(this.#frame.client);
    this.accessibility = new Accessibility(this.#frame.client);
    this.tracing = new Tracing(this.#frame.client);
    this.coverage = new Coverage(this.#frame.client);
    this.keyboard = new BidiKeyboard(this);
    this.mouse = new BidiMouse(this);
    this.touchscreen = new BidiTouchscreen(this);
  }

  #initialize() {
    this.#frame.browsingContext.on('closed', () => {
      this.trustedEmitter.emit(PageEvent.Close, undefined);
      this.trustedEmitter.removeAllListeners();
    });

    this.trustedEmitter.on(PageEvent.WorkerCreated, worker => {
      this.#workers.add(worker as BidiWebWorker);
    });
    this.trustedEmitter.on(PageEvent.WorkerDestroyed, worker => {
      this.#workers.delete(worker as BidiWebWorker);
    });
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
    const response = await this.#frame.client.send('Runtime.queryObjects', {
      prototypeObjectId: prototypeHandle.id,
    });
    return this.#frame.mainRealm().createHandle({
      type: 'array',
      handle: response.objects.objectId,
    }) as BidiJSHandle<Prototype[]>;
  }

  override browser(): BidiBrowser {
    return this.browserContext().browser();
  }

  override browserContext(): BidiBrowserContext {
    return this.#browserContext;
  }

  override mainFrame(): BidiFrame {
    return this.#frame;
  }

  async focusedFrame(): Promise<BidiFrame> {
    using handle = (await this.mainFrame()
      .isolatedRealm()
      .evaluateHandle(() => {
        let win = window;
        while (
          win.document.activeElement instanceof win.HTMLIFrameElement ||
          win.document.activeElement instanceof win.HTMLFrameElement
        ) {
          if (win.document.activeElement.contentWindow === null) {
            break;
          }
          win = win.document.activeElement.contentWindow as typeof win;
        }
        return win;
      })) as BidiJSHandle<Window & typeof globalThis>;
    const value = handle.remoteValue();
    assert(value.type === 'window');
    const frame = this.frames().find(frame => {
      return frame._id === value.value.context;
    });
    assert(frame);
    return frame;
  }

  override frames(): BidiFrame[] {
    const frames = [this.#frame];
    for (const frame of frames) {
      frames.push(...frame.childFrames());
    }
    return frames;
  }

  override isClosed(): boolean {
    return this.#frame.detached;
  }

  override async close(options?: {runBeforeUnload?: boolean}): Promise<void> {
    try {
      await this.#frame.browsingContext.close(options?.runBeforeUnload);
    } catch {
      return;
    }
  }

  override async reload(
    options: WaitForOptions = {}
  ): Promise<BidiHTTPResponse | null> {
    const [response] = await Promise.all([
      this.#frame.waitForNavigation(options),
      this.#frame.browsingContext.reload(),
    ]).catch(
      rewriteNavigationError(
        this.url(),
        options.timeout ?? this._timeoutSettings.navigationTimeout()
      )
    );
    return response;
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
    if (!this.browser().cdpSupported) {
      await this.#frame.browsingContext.setViewport({
        viewport:
          viewport.width && viewport.height
            ? {
                width: viewport.width,
                height: viewport.height,
              }
            : null,
        devicePixelRatio: viewport.deviceScaleFactor
          ? viewport.deviceScaleFactor
          : null,
      });
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
    const data = await firstValueFrom(
      from(
        this.#frame.browsingContext.print({
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

    const buffer = Buffer.from(data, 'base64');

    await this._maybeWriteBufferToFile(path, buffer);

    return buffer;
  }

  override async createPDFStream(
    options?: PDFOptions | undefined
  ): Promise<ReadableStream<Uint8Array>> {
    const buffer = await this.pdf(options);

    return new ReadableStream({
      start(controller) {
        controller.enqueue(buffer);
        controller.close();
      },
    });
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

    const data = await this.#frame.browsingContext.captureScreenshot({
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
    return await this.#frame.createCDPSession();
  }

  override async bringToFront(): Promise<void> {
    await this.#frame.browsingContext.activate();
  }

  override async evaluateOnNewDocument<
    Params extends unknown[],
    Func extends (...args: Params) => unknown = (...args: Params) => unknown,
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<NewDocumentScriptEvaluation> {
    const expression = evaluationExpression(pageFunction, ...args);
    const script =
      await this.#frame.browsingContext.addPreloadScript(expression);

    return {identifier: script};
  }

  override async removeScriptToEvaluateOnNewDocument(
    id: string
  ): Promise<void> {
    await this.#frame.browsingContext.removePreloadScript(id);
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

  override async cookies(...urls: string[]): Promise<Cookie[]> {
    const normalizedUrls = (urls.length ? urls : [this.url()]).map(url => {
      return new URL(url);
    });

    const cookies = await this.#frame.browsingContext.getCookies();
    return cookies
      .map(cookie => {
        return bidiToPuppeteerCookie(cookie);
      })
      .filter(cookie => {
        return normalizedUrls.some(url => {
          return testUrlMatchCookie(cookie, url);
        });
      });
  }

  override isServiceWorkerBypassed(): never {
    throw new UnsupportedOperation();
  }

  override target(): never {
    throw new UnsupportedOperation();
  }

  override waitForFileChooser(): never {
    throw new UnsupportedOperation();
  }

  override workers(): BidiWebWorker[] {
    return [...this.#workers];
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

  override async setCookie(...cookies: CookieParam[]): Promise<void> {
    const pageURL = this.url();
    const pageUrlStartsWithHTTP = pageURL.startsWith('http');
    for (const cookie of cookies) {
      let cookieUrl = cookie.url || '';
      if (!cookieUrl && pageUrlStartsWithHTTP) {
        cookieUrl = pageURL;
      }
      assert(
        cookieUrl !== 'about:blank',
        `Blank page can not have cookie "${cookie.name}"`
      );
      assert(
        !String.prototype.startsWith.call(cookieUrl || '', 'data:'),
        `Data URL page can not have cookie "${cookie.name}"`
      );

      const normalizedUrl = URL.canParse(cookieUrl)
        ? new URL(cookieUrl)
        : undefined;

      const domain = cookie.domain ?? normalizedUrl?.hostname;
      assert(
        domain !== undefined,
        `At least one of the url and domain needs to be specified`
      );

      const bidiCookie: Bidi.Storage.PartialCookie = {
        domain: domain,
        name: cookie.name,
        value: {
          type: 'string',
          value: cookie.value,
        },
        ...(cookie.path !== undefined ? {path: cookie.path} : {}),
        ...(cookie.httpOnly !== undefined ? {httpOnly: cookie.httpOnly} : {}),
        ...(cookie.secure !== undefined ? {secure: cookie.secure} : {}),
        ...(cookie.sameSite !== undefined
          ? {sameSite: convertCookiesSameSiteCdpToBiDi(cookie.sameSite)}
          : {}),
        ...(cookie.expires !== undefined ? {expiry: cookie.expires} : {}),
        // Chrome-specific properties.
        ...cdpSpecificCookiePropertiesFromPuppeteerToBidi(
          cookie,
          'sameParty',
          'sourceScheme',
          'priority',
          'url'
        ),
      };

      if (cookie.partitionKey !== undefined) {
        await this.browserContext().userContext.setCookie(
          bidiCookie,
          cookie.partitionKey
        );
      } else {
        await this.#frame.browsingContext.setCookie(bidiCookie);
      }
    }
  }

  override async deleteCookie(
    ...cookies: DeleteCookiesRequest[]
  ): Promise<void> {
    await Promise.all(
      cookies.map(async deleteCookieRequest => {
        const cookieUrl = deleteCookieRequest.url ?? this.url();
        const normalizedUrl = URL.canParse(cookieUrl)
          ? new URL(cookieUrl)
          : undefined;

        const domain = deleteCookieRequest.domain ?? normalizedUrl?.hostname;
        assert(
          domain !== undefined,
          `At least one of the url and domain needs to be specified`
        );

        const filter = {
          domain: domain,
          name: deleteCookieRequest.name,
          ...(deleteCookieRequest.path !== undefined
            ? {path: deleteCookieRequest.path}
            : {}),
        };
        await this.#frame.browsingContext.deleteCookie(filter);
      })
    );
  }

  override async removeExposedFunction(name: string): Promise<void> {
    await this.#frame.removeExposedFunction(name);
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
    return await this.#go(1, options);
  }

  async #go(
    delta: number,
    options: WaitForOptions
  ): Promise<HTTPResponse | null> {
    try {
      const [response] = await Promise.all([
        this.waitForNavigation(options),
        this.#frame.browsingContext.traverseHistory(delta),
      ]);
      return response;
    } catch (error) {
      // TODO: waitForNavigation should be cancelled if an error happens.
      if (isErrorLike(error)) {
        if (error.message.includes('no such history entry')) {
          return null;
        }
      }
      throw error;
    }
  }

  override waitForDevicePrompt(): never {
    throw new UnsupportedOperation();
  }
}

function evaluationExpression(fun: Function | string, ...args: unknown[]) {
  return `() => {${evaluationString(fun, ...args)}}`;
}

/**
 * Check domains match.
 * According to cookies spec, this check should match subdomains as well, but CDP
 * implementation does not do that, so this method matches only the exact domains, not
 * what is written in the spec:
 * https://datatracker.ietf.org/doc/html/rfc6265#section-5.1.3
 */
function testUrlMatchCookieHostname(
  cookie: Cookie,
  normalizedUrl: URL
): boolean {
  const cookieDomain = cookie.domain.toLowerCase();
  const urlHostname = normalizedUrl.hostname.toLowerCase();
  return cookieDomain === urlHostname;
}

/**
 * Check paths match.
 * Spec: https://datatracker.ietf.org/doc/html/rfc6265#section-5.1.4
 */
function testUrlMatchCookiePath(cookie: Cookie, normalizedUrl: URL): boolean {
  const uriPath = normalizedUrl.pathname;
  const cookiePath = cookie.path;

  if (uriPath === cookiePath) {
    // The cookie-path and the request-path are identical.
    return true;
  }
  if (uriPath.startsWith(cookiePath)) {
    // The cookie-path is a prefix of the request-path.
    if (cookiePath.endsWith('/')) {
      // The last character of the cookie-path is %x2F ("/").
      return true;
    }
    if (uriPath[cookiePath.length] === '/') {
      // The first character of the request-path that is not included in the cookie-path
      // is a %x2F ("/") character.
      return true;
    }
  }
  return false;
}

/**
 * Checks the cookie matches the URL according to the spec:
 */
function testUrlMatchCookie(cookie: Cookie, url: URL): boolean {
  const normalizedUrl = new URL(url);
  assert(cookie !== undefined);
  if (!testUrlMatchCookieHostname(cookie, normalizedUrl)) {
    return false;
  }
  return testUrlMatchCookiePath(cookie, normalizedUrl);
}

function bidiToPuppeteerCookie(bidiCookie: Bidi.Network.Cookie): Cookie {
  return {
    name: bidiCookie.name,
    // Presents binary value as base64 string.
    value: bidiCookie.value.value,
    domain: bidiCookie.domain,
    path: bidiCookie.path,
    size: bidiCookie.size,
    httpOnly: bidiCookie.httpOnly,
    secure: bidiCookie.secure,
    sameSite: convertCookiesSameSiteBiDiToCdp(bidiCookie.sameSite),
    expires: bidiCookie.expiry ?? -1,
    session: bidiCookie.expiry === undefined || bidiCookie.expiry <= 0,
    // Extending with CDP-specific properties with `goog:` prefix.
    ...cdpSpecificCookiePropertiesFromBidiToPuppeteer(
      bidiCookie,
      'sameParty',
      'sourceScheme',
      'partitionKey',
      'partitionKeyOpaque',
      'priority'
    ),
  };
}

const CDP_SPECIFIC_PREFIX = 'goog:';

/**
 * Gets CDP-specific properties from the BiDi cookie and returns them as a new object.
 */
function cdpSpecificCookiePropertiesFromBidiToPuppeteer(
  bidiCookie: Bidi.Network.Cookie,
  ...propertyNames: Array<keyof Cookie>
): Partial<Cookie> {
  const result: Partial<Cookie> = {};
  for (const property of propertyNames) {
    if (bidiCookie[CDP_SPECIFIC_PREFIX + property] !== undefined) {
      result[property] = bidiCookie[CDP_SPECIFIC_PREFIX + property];
    }
  }
  return result;
}

/**
 * Gets CDP-specific properties from the cookie, adds CDP-specific prefixes and returns
 * them as a new object which can be used in BiDi.
 */
function cdpSpecificCookiePropertiesFromPuppeteerToBidi(
  cookieParam: CookieParam,
  ...propertyNames: Array<keyof CookieParam>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const property of propertyNames) {
    if (cookieParam[property] !== undefined) {
      result[CDP_SPECIFIC_PREFIX + property] = cookieParam[property];
    }
  }
  return result;
}

function convertCookiesSameSiteBiDiToCdp(
  sameSite: Bidi.Network.SameSite | undefined
): CookieSameSite {
  return sameSite === 'strict' ? 'Strict' : sameSite === 'lax' ? 'Lax' : 'None';
}

function convertCookiesSameSiteCdpToBiDi(
  sameSite: CookieSameSite | undefined
): Bidi.Network.SameSite {
  return sameSite === 'Strict'
    ? Bidi.Network.SameSite.Strict
    : sameSite === 'Lax'
      ? Bidi.Network.SameSite.Lax
      : Bidi.Network.SameSite.None;
}
