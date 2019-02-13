const {helper} = require('./helper');
const {Keyboard, Mouse} = require('./Input');
const {Dialog} = require('./Dialog');
const {TimeoutError} = require('./Errors');
const fs = require('fs');
const mime = require('mime');
const util = require('util');
const EventEmitter = require('events');
const {createHandle} = require('./JSHandle');
const {Events} = require('./Events');
const {FrameManager} = require('./FrameManager');
const {NetworkManager} = require('./NetworkManager');
const {TimeoutSettings} = require('./TimeoutSettings');

const writeFileAsync = util.promisify(fs.writeFile);

/**
 * @internal
 */
class PageSession extends EventEmitter {
  constructor(connection, pageId) {
    super();
    this._connection = connection;
    this._pageId = pageId;
    const wrapperSymbol = Symbol('listenerWrapper');

    function wrapperListener(listener, params) {
      if (params.pageId === pageId)
        listener.call(null, params);
    }

    this.on('removeListener', (eventName, listener) => {
      this._connection.removeListener(eventName, listener[wrapperSymbol]);
    });
    this.on('newListener', (eventName, listener) => {
      if (!listener[wrapperSymbol])
        listener[wrapperSymbol] = wrapperListener.bind(null, listener);
      this._connection.on(eventName, listener[wrapperSymbol]);
    });
  }

  async send(method, params = {}) {
    params = Object.assign({}, params, {pageId: this._pageId});
    return await this._connection.send(method, params);
  }
}

class Page extends EventEmitter {
  /**
   *
   * @param {!Puppeteer.Connection} connection
   * @param {!Puppeteer.Target} target
   * @param {string} pageId
   * @param {?Puppeteer.Viewport} defaultViewport
   */
  static async create(connection, target, pageId, defaultViewport) {
    const session = new PageSession(connection, pageId);
    const page = new Page(session, target);
    await session.send('Page.enable');
    if (defaultViewport)
      await page.setViewport(defaultViewport);
    return page;
  }

  /**
   * @param {!PageSession} session
   * @param {!Puppeteer.Target} target
   */
  constructor(session, target) {
    super();
    this._timeoutSettings = new TimeoutSettings();
    this._session = session;
    this._target = target;
    this._keyboard = new Keyboard(session);
    this._mouse = new Mouse(session, this._keyboard);
    this._isClosed = false;
    this._frameManager = new FrameManager(session, this, this._timeoutSettings);
    this._networkManager = new NetworkManager(session, this._frameManager);
    this._eventListeners = [
      helper.addEventListener(this._session, 'Page.uncaughtError', this._onUncaughtError.bind(this)),
      helper.addEventListener(this._session, 'Page.consoleAPICalled', this._onConsole.bind(this)),
      helper.addEventListener(this._session, 'Page.dialogOpened', this._onDialogOpened.bind(this)),
      helper.addEventListener(this._session, 'Browser.tabClosed', this._onClosed.bind(this)),
      helper.addEventListener(this._frameManager, Events.FrameManager.Load, () => this.emit(Events.Page.Load)),
      helper.addEventListener(this._frameManager, Events.FrameManager.DOMContentLoaded, () => this.emit(Events.Page.DOMContentLoaded)),
      helper.addEventListener(this._frameManager, Events.FrameManager.FrameAttached, frame => this.emit(Events.Page.FrameAttached, frame)),
      helper.addEventListener(this._frameManager, Events.FrameManager.FrameDetached, frame => this.emit(Events.Page.FrameDetached, frame)),
      helper.addEventListener(this._frameManager, Events.FrameManager.FrameNavigated, frame => this.emit(Events.Page.FrameNavigated, frame)),
      helper.addEventListener(this._networkManager, Events.NetworkManager.Request, request => this.emit(Events.Page.Request, request)),
      helper.addEventListener(this._networkManager, Events.NetworkManager.Response, response => this.emit(Events.Page.Response, response)),
      helper.addEventListener(this._networkManager, Events.NetworkManager.RequestFinished, request => this.emit(Events.Page.RequestFinished, request)),
      helper.addEventListener(this._networkManager, Events.NetworkManager.RequestFailed, request => this.emit(Events.Page.RequestFailed, request)),
    ];
    this._viewport = null;
  }

  /**
   * @param {number} timeout
   */
  setDefaultNavigationTimeout(timeout) {
    this._timeoutSettings.setDefaultNavigationTimeout(timeout);
  }

  /**
   * @param {number} timeout
   */
  setDefaultTimeout(timeout) {
    this._timeoutSettings.setDefaultTimeout(timeout);
  }

  /**
   * @param {string} userAgent
   */
  async setUserAgent(userAgent) {
    await this._session.send('Page.setUserAgent', {userAgent});
  }

  /**
   * @param {string} userAgent
   */
  async setJavaScriptEnabled(enabled) {
    await this._session.send('Page.setJavascriptEnabled', {enabled});
  }

  /**
   * @param {string} userAgent
   */
  async setCacheEnabled(enabled) {
    await this._session.send('Page.setCacheDisabled', {cacheDisabled: !enabled});
  }

  /**
   * @param {{viewport: !Puppeteer.Viewport, userAgent: string}} options
   */
  async emulate(options) {
    await Promise.all([
      this.setViewport(options.viewport),
      this.setUserAgent(options.userAgent),
    ]);
  }

  /**
   * @return {BrowserContext}
   */
  browserContext() {
    return this._target.browserContext();
  }

  _onUncaughtError(params) {
    let error = new Error(params.message);
    error.stack = params.stack;
    this.emit(Events.Page.PageError, error);
  }

  viewport() {
    return this._viewport;
  }

  /**
   * @param {!Puppeteer.Viewport} viewport
   */
  async setViewport(viewport) {
    const {
      width,
      height,
      isMobile = false,
      deviceScaleFactor = 1,
      hasTouch = false,
      isLandscape = false,
    } = viewport;
    await this._session.send('Page.setViewport', {
      viewport: { width, height, isMobile, deviceScaleFactor, hasTouch, isLandscape },
    });
    const oldIsMobile = this._viewport ? this._viewport.isMobile : false;
    const oldHasTouch = this._viewport ? this._viewport.hasTouch : false;
    this._viewport = viewport;
    if (oldIsMobile !== isMobile || oldHasTouch !== hasTouch)
      await this.reload();
  }

  /**
   * @param {function()|string} pageFunction
   * @param {!Array<*>} args
   */
  async evaluateOnNewDocument(pageFunction, ...args) {
    const script = helper.evaluationString(pageFunction, ...args);
    await this._session.send('Page.addScriptToEvaluateOnNewDocument', { script });
  }

  browser() {
    return this._target.browser();
  }

  target() {
    return this._target;
  }

  url() {
    return this._frameManager.mainFrame().url();
  }

  frames() {
    return this._frameManager.frames();
  }

  _onDialogOpened(params) {
    this.emit(Events.Page.Dialog, new Dialog(this._session, params));
  }

  mainFrame() {
    return this._frameManager.mainFrame();
  }

  get keyboard(){
    return this._keyboard;
  }

  get mouse(){
    return this._mouse;
  }

  _normalizeWaitUntil(waitUntil) {
    if (!Array.isArray(waitUntil))
      waitUntil = [waitUntil];
    for (const condition of waitUntil) {
      if (condition !== 'load' && condition !== 'domcontentloaded')
        throw new Error('Unknown waitUntil condition: ' + condition);
    }
    return waitUntil;
  }

  /**
   * @param {!{timeout?: number, waitUntil?: string|!Array<string>}} options
   */
  async waitForNavigation(options = {}) {
    const {
      timeout = this._timeoutSettings.navigationTimeout(),
      waitUntil = ['load'],
    } = options;
    const frame = this._frameManager.mainFrame();
    const normalizedWaitUntil = this._normalizeWaitUntil(waitUntil);

    const timeoutError = new TimeoutError('Navigation Timeout Exceeded: ' + timeout + 'ms');
    let timeoutCallback;
    const timeoutPromise = new Promise(resolve => timeoutCallback = resolve.bind(null, timeoutError));
    const timeoutId = timeout ? setTimeout(timeoutCallback, timeout) : null;

    const nextNavigationDog = new NextNavigationWatchdog(this._session, frame);
    const error1 = await Promise.race([
      nextNavigationDog.promise(),
      timeoutPromise,
    ]);
    nextNavigationDog.dispose();

    // If timeout happened first - throw.
    if (error1) {
      clearTimeout(timeoutId);
      throw error1;
    }

    const {navigationId, url} = nextNavigationDog.navigation();

    if (!navigationId) {
      // Same document navigation happened.
      clearTimeout(timeoutId);
      return null;
    }

    const watchDog = new NavigationWatchdog(this._session, frame, this._networkManager, navigationId, url, normalizedWaitUntil);
    const error = await Promise.race([
      timeoutPromise,
      watchDog.promise(),
    ]);
    watchDog.dispose();
    clearTimeout(timeoutId);
    if (error)
      throw error;
    return watchDog.navigationResponse();
  }

  /**
   * @param {string} url
   * @param {!{timeout?: number, waitUntil?: string|!Array<string>}} options
   */
  async goto(url, options = {}) {
    const {
      timeout = this._timeoutSettings.navigationTimeout(),
      waitUntil = ['load'],
    } = options;
    const frame = this._frameManager.mainFrame();
    const normalizedWaitUntil = this._normalizeWaitUntil(waitUntil);
    const {navigationId} = await this._session.send('Page.navigate', {
      frameId: frame._frameId,
      url,
    });
    if (!navigationId)
      return;

    const timeoutError = new TimeoutError('Navigation Timeout Exceeded: ' + timeout + 'ms');
    let timeoutCallback;
    const timeoutPromise = new Promise(resolve => timeoutCallback = resolve.bind(null, timeoutError));
    const timeoutId = timeout ? setTimeout(timeoutCallback, timeout) : null;

    const watchDog = new NavigationWatchdog(this._session, frame, this._networkManager, navigationId, url, normalizedWaitUntil);
    const error = await Promise.race([
      timeoutPromise,
      watchDog.promise(),
    ]);
    watchDog.dispose();
    clearTimeout(timeoutId);
    if (error)
      throw error;
    return watchDog.navigationResponse();
  }

  /**
   * @param {!{timeout?: number, waitUntil?: string|!Array<string>}} options
   */
  async goBack(options = {}) {
    const {
      timeout = this._timeoutSettings.navigationTimeout(),
      waitUntil = ['load'],
    } = options;
    const frame = this._frameManager.mainFrame();
    const normalizedWaitUntil = this._normalizeWaitUntil(waitUntil);
    const {navigationId, navigationURL} = await this._session.send('Page.goBack', {
      frameId: frame._frameId,
    });
    if (!navigationId)
      return null;

    const timeoutError = new TimeoutError('Navigation Timeout Exceeded: ' + timeout + 'ms');
    let timeoutCallback;
    const timeoutPromise = new Promise(resolve => timeoutCallback = resolve.bind(null, timeoutError));
    const timeoutId = timeout ? setTimeout(timeoutCallback, timeout) : null;

    const watchDog = new NavigationWatchdog(this._session, frame, this._networkManager, navigationId, navigationURL, normalizedWaitUntil);
    const error = await Promise.race([
      timeoutPromise,
      watchDog.promise(),
    ]);
    watchDog.dispose();
    clearTimeout(timeoutId);
    if (error)
      throw error;
    return watchDog.navigationResponse();
  }

  /**
   * @param {!{timeout?: number, waitUntil?: string|!Array<string>}} options
   */
  async goForward(options = {}) {
    const {
      timeout = this._timeoutSettings.navigationTimeout(),
      waitUntil = ['load'],
    } = options;
    const frame = this._frameManager.mainFrame();
    const normalizedWaitUntil = this._normalizeWaitUntil(waitUntil);
    const {navigationId, navigationURL} = await this._session.send('Page.goForward', {
      frameId: frame._frameId,
    });
    if (!navigationId)
      return null;

    const timeoutError = new TimeoutError('Navigation Timeout Exceeded: ' + timeout + 'ms');
    let timeoutCallback;
    const timeoutPromise = new Promise(resolve => timeoutCallback = resolve.bind(null, timeoutError));
    const timeoutId = timeout ? setTimeout(timeoutCallback, timeout) : null;

    const watchDog = new NavigationWatchdog(this._session, frame, this._networkManager, navigationId, navigationURL, normalizedWaitUntil);
    const error = await Promise.race([
      timeoutPromise,
      watchDog.promise(),
    ]);
    watchDog.dispose();
    clearTimeout(timeoutId);
    if (error)
      throw error;
    return watchDog.navigationResponse();
  }

  /**
   * @param {!{timeout?: number, waitUntil?: string|!Array<string>}} options
   */
  async reload(options = {}) {
    const {
      timeout = this._timeoutSettings.navigationTimeout(),
      waitUntil = ['load'],
    } = options;
    const frame = this._frameManager.mainFrame();
    const normalizedWaitUntil = this._normalizeWaitUntil(waitUntil);
    const {navigationId, navigationURL} = await this._session.send('Page.reload', {
      frameId: frame._frameId,
    });
    if (!navigationId)
      return null;

    const timeoutError = new TimeoutError('Navigation Timeout Exceeded: ' + timeout + 'ms');
    let timeoutCallback;
    const timeoutPromise = new Promise(resolve => timeoutCallback = resolve.bind(null, timeoutError));
    const timeoutId = timeout ? setTimeout(timeoutCallback, timeout) : null;

    const watchDog = new NavigationWatchdog(this._session, frame, this._networkManager, navigationId, navigationURL, normalizedWaitUntil);
    const error = await Promise.race([
      timeoutPromise,
      watchDog.promise(),
    ]);
    watchDog.dispose();
    clearTimeout(timeoutId);
    if (error)
      throw error;
    return watchDog.navigationResponse();
  }

  /**
   * @param {{fullPage?: boolean, clip?: {width: number, height: number, x: number, y: number}, encoding?: string, path?: string}} options
   * @return {Promise<string|Buffer>}
   */
  async screenshot(options = {}) {
    const {data} = await this._session.send('Page.screenshot', {
      mimeType: getScreenshotMimeType(options),
      fullPage: options.fullPage,
      clip: options.clip,
    });
    const buffer = options.encoding === 'base64' ? data : Buffer.from(data, 'base64');
    if (options.path)
      await writeFileAsync(options.path, buffer);
    return buffer;
  }

  async evaluate(pageFunction, ...args) {
    return await this._frameManager.mainFrame().evaluate(pageFunction, ...args);
  }

  /**
   * @param {!{content?: string, path?: string, type?: string, url?: string}} options
   * @return {!Promise<!ElementHandle>}
   */
  async addScriptTag(options) {
    return await this._frameManager.mainFrame().addScriptTag(options);
  }

  /**
   * @param {!{content?: string, path?: string, url?: string}} options
   * @return {!Promise<!ElementHandle>}
   */
  async addStyleTag(options) {
    return await this._frameManager.mainFrame().addStyleTag(options);
  }

  /**
   * @param {string} selector
   * @param {!{delay?: number, button?: string, clickCount?: number}=} options
   */
  async click(selector, options = {}) {
    return await this._frameManager.mainFrame().click(selector, options);
  }

  /**
   * @param {string} selector
   * @param {string} text
   * @param {{delay: (number|undefined)}=} options
   */
  async type(selector, text, options) {
    return await this._frameManager.mainFrame().type(selector, text, options);
  }

  /**
   * @param {string} selector
   */
  async focus(selector) {
    return await this._frameManager.mainFrame().focus(selector);
  }

  /**
   * @param {string} selector
   */
  async hover(selector) {
    return await this._frameManager.mainFrame().hover(selector);
  }

  /**
   * @param {(string|number|Function)} selectorOrFunctionOrTimeout
   * @param {!{polling?: string|number, timeout?: number, visible?: boolean, hidden?: boolean}=} options
   * @param {!Array<*>} args
   * @return {!Promise<!JSHandle>}
   */
  async waitFor(selectorOrFunctionOrTimeout, options = {}, ...args) {
    return await this._frameManager.mainFrame().waitFor(selectorOrFunctionOrTimeout, options, ...args);
  }

  /**
   * @param {Function|string} pageFunction
   * @param {!{polling?: string|number, timeout?: number}=} options
   * @return {!Promise<!JSHandle>}
   */
  async waitForFunction(pageFunction, options = {}, ...args) {
    return await this._frameManager.mainFrame().waitForFunction(pageFunction, options, ...args);
  }

  /**
   * @param {string} selector
   * @param {!{timeout?: number, visible?: boolean, hidden?: boolean}=} options
   * @return {!Promise<!ElementHandle>}
   */
  async waitForSelector(selector, options = {}) {
    return await this._frameManager.mainFrame().waitForSelector(selector, options);
  }

  /**
   * @param {string} xpath
   * @param {!{timeout?: number, visible?: boolean, hidden?: boolean}=} options
   * @return {!Promise<!ElementHandle>}
   */
  async waitForXPath(xpath, options = {}) {
    return await this._frameManager.mainFrame().waitForXPath(xpath, options);
  }

  /**
   * @return {!Promise<string>}
   */
  async title() {
    return await this._frameManager.mainFrame().title();
  }

  /**
   * @param {string} selector
   * @return {!Promise<?ElementHandle>}
   */
  async $(selector) {
    return await this._frameManager.mainFrame().$(selector);
  }

  /**
   * @param {string} selector
   * @return {!Promise<!Array<!ElementHandle>>}
   */
  async $$(selector) {
    return await this._frameManager.mainFrame().$$(selector);
  }

  /**
   * @param {string} selector
   * @param {Function|String} pageFunction
   * @param {!Array<*>} args
   * @return {!Promise<(!Object|undefined)>}
   */
  async $eval(selector, pageFunction, ...args) {
    return await this._frameManager.mainFrame().$eval(selector, pageFunction, ...args);
  }

  /**
   * @param {string} selector
   * @param {Function|String} pageFunction
   * @param {!Array<*>} args
   * @return {!Promise<(!Object|undefined)>}
   */
  async $$eval(selector, pageFunction, ...args) {
    return await this._frameManager.mainFrame().$$eval(selector, pageFunction, ...args);
  }

  /**
   * @param {string} expression
   * @return {!Promise<!Array<!ElementHandle>>}
   */
  async $x(expression) {
    return await this._frameManager.mainFrame().$x(expression);
  }

  async evaluateHandle(pageFunction, ...args) {
    return await this._frameManager.mainFrame().evaluateHandle(pageFunction, ...args);
  }

  /**
  * @param {string} selector
  * @param {!Array<string>} values
  * @return {!Promise<!Array<string>>}
  */
  async select(selector, ...values) {
    return await this._frameManager.mainFrame().select(selector, ...values);
  }

  async close() {
    await this._session.send('Browser.closePage' );
  }

  async content() {
    return await this._frameManager.mainFrame().content();
  }

  /**
   * @param {string} html
   */
  async setContent(html) {
    return await this._frameManager.mainFrame().setContent(html);
  }

  _onClosed() {
    this._isClosed = true;
    this._frameManager.dispose();
    helper.removeEventListeners(this._eventListeners);
    this.emit(Events.Page.Close);
  }

  _onConsole({type, args, frameId}) {
    const frame = this._frameManager.frame(frameId);
    this.emit(Events.Page.Console, new ConsoleMessage(type, args.map(arg => createHandle(frame._executionContext, arg))));
  }

  /**
   * @return {boolean}
   */
  isClosed() {
    return this._isClosed;
  }
}

class ConsoleMessage {
  /**
   * @param {string} type
   * @param {!Array<!JSHandle>} args
   */
  constructor(type, args) {
    this._type = type;
    this._args = args;
  }

  /**
   * @return {string}
   */
  type() {
    return this._type;
  }

  /**
   * @return {!Array<!JSHandle>}
   */
  args() {
    return this._args;
  }

  /**
   * @return {string}
   */
  text() {
    return this._args.map(arg => {
      if (arg._objectId)
        return arg.toString();
      return arg._deserializeValue(arg._protocolValue);
    }).join(' ');
  }
}

function getScreenshotMimeType(options) {
  // options.type takes precedence over inferring the type from options.path
  // because it may be a 0-length file with no extension created beforehand (i.e. as a temp file).
  if (options.type) {
    if (options.type === 'png')
      return 'image/png';
    if (options.type === 'jpeg')
      return 'image/jpeg';
    throw new Error('Unknown options.type value: ' + options.type);
  }
  if (options.path) {
    const fileType = mime.getType(options.path);
    if (fileType === 'image/png' || fileType === 'image/jpeg')
      return fileType;
    throw new Error('Unsupported screnshot mime type: ' + fileType);
  }
  return 'image/png';
}

/**
 * @internal
 */
class NextNavigationWatchdog {
  constructor(session, navigatedFrame) {
    this._navigatedFrame = navigatedFrame;
    this._promise = new Promise(x => this._resolveCallback = x);
    this._navigation = null;
    this._eventListeners = [
      helper.addEventListener(session, 'Page.navigationStarted', this._onNavigationStarted.bind(this)),
      helper.addEventListener(session, 'Page.sameDocumentNavigation', this._onSameDocumentNavigation.bind(this)),
    ];
  }

  promise() {
    return this._promise;
  }

  navigation() {
    return this._navigation;
  }

  _onNavigationStarted(params) {
    if (params.frameId === this._navigatedFrame._frameId) {
      this._navigation = {
        navigationId: params.navigationId,
        url: params.url,
      };
      this._resolveCallback();
    }
  }

  _onSameDocumentNavigation(params) {
    if (params.frameId === this._navigatedFrame._frameId) {
      this._navigation = {
        navigationId: null,
      };
      this._resolveCallback();
    }
  }

  dispose() {
    helper.removeEventListeners(this._eventListeners);
  }
}

/**
 * @internal
 */
class NavigationWatchdog {
  constructor(session, navigatedFrame, networkManager, targetNavigationId, targetURL, firedEvents) {
    this._navigatedFrame = navigatedFrame;
    this._targetNavigationId = targetNavigationId;
    this._firedEvents = firedEvents;
    this._targetURL = targetURL;

    this._promise = new Promise(x => this._resolveCallback = x);
    this._navigationRequest = null;

    const check = this._checkNavigationComplete.bind(this);
    this._eventListeners = [
      helper.addEventListener(session, 'Page.eventFired', check),
      helper.addEventListener(session, 'Page.frameAttached', check),
      helper.addEventListener(session, 'Page.frameDetached', check),
      helper.addEventListener(session, 'Page.navigationStarted', check),
      helper.addEventListener(session, 'Page.navigationCommitted', check),
      helper.addEventListener(session, 'Page.navigationAborted', this._onNavigationAborted.bind(this)),
      helper.addEventListener(networkManager, Events.NetworkManager.Request, this._onRequest.bind(this)),
    ];
    check();
  }

  _onRequest(request) {
    if (request.frame() !== this._navigatedFrame || !request.isNavigationRequest())
      return;
    this._navigationRequest = request;
  }

  navigationResponse() {
    return this._navigationRequest ? this._navigationRequest.response() : null;
  }

  _checkNavigationComplete() {
    if (this._navigatedFrame._lastCommittedNavigationId === this._targetNavigationId
        && checkFiredEvents(this._navigatedFrame, this._firedEvents)) {
      this._resolveCallback(null);
    }

    function checkFiredEvents(frame, firedEvents) {
      for (const subframe of frame._children) {
        if (!checkFiredEvents(subframe, firedEvents))
          return false;
      }
      return firedEvents.every(event => frame._firedEvents.has(event));
    }
  }

  _onNavigationAborted(params) {
    if (params.frameId === this._navigatedFrame._frameId && params.navigationId === this._targetNavigationId)
      this._resolveCallback(new Error('Navigation to ' + this._targetURL + ' failed: ' + params.errorText));
  }

  promise() {
    return this._promise;
  }

  dispose() {
    helper.removeEventListeners(this._eventListeners);
  }
}

module.exports = {Page, ConsoleMessage};
