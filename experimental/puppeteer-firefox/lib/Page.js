const {helper, debugError, assert} = require('./helper');
const {Keyboard, Mouse, Touchscreen} = require('./Input');
const {Dialog} = require('./Dialog');
const {TimeoutError} = require('./Errors');
const fs = require('fs');
const mime = require('mime');
const util = require('util');
const EventEmitter = require('events');
const {createHandle} = require('./JSHandle');
const {Events} = require('./Events');
const {Connection} = require('./Connection');
const {FrameManager, normalizeWaitUntil} = require('./FrameManager');
const {NetworkManager} = require('./NetworkManager');
const {TimeoutSettings} = require('./TimeoutSettings');
const {NavigationWatchdog} = require('./NavigationWatchdog');
const {Accessibility} = require('./Accessibility');

const writeFileAsync = util.promisify(fs.writeFile);

class Page extends EventEmitter {
  /**
   *
   * @param {!Puppeteer.JugglerSession} connection
   * @param {!Puppeteer.Target} target
   * @param {?Puppeteer.Viewport} defaultViewport
   */
  static async create(session, target, defaultViewport) {
    const page = new Page(session, target);
    await Promise.all([
      session.send('Runtime.enable'),
      session.send('Network.enable'),
      session.send('Page.enable'),
    ]);

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
    this._touchscreen = new Touchscreen(session, this._keyboard, this._mouse);
    this._accessibility = new Accessibility(session);
    this._closed = false;
    /** @type {!Map<string, Function>} */
    this._pageBindings = new Map();
    this._networkManager = new NetworkManager(session);
    this._frameManager = new FrameManager(session, this, this._networkManager, this._timeoutSettings);
    this._networkManager.setFrameManager(this._frameManager);
    this._eventListeners = [
      helper.addEventListener(this._session, 'Page.uncaughtError', this._onUncaughtError.bind(this)),
      helper.addEventListener(this._session, 'Runtime.console', this._onConsole.bind(this)),
      helper.addEventListener(this._session, 'Page.dialogOpened', this._onDialogOpened.bind(this)),
      helper.addEventListener(this._session, 'Page.bindingCalled', this._onBindingCalled.bind(this)),
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
    this._target._isClosedPromise.then(() => {
      this._closed = true;
      this._frameManager.dispose();
      this._networkManager.dispose();
      helper.removeEventListeners(this._eventListeners);
      this.emit(Events.Page.Close);
    });
  }

  /**
   * @param {!Array<string>} urls
   * @return {!Promise<!Array<Network.Cookie>>}
   */
  async cookies(...urls) {
    const connection = Connection.fromSession(this._session);
    return (await connection.send('Browser.getCookies', {
      browserContextId: this._target._context._browserContextId,
      urls: urls.length ? urls : [this.url()]
    })).cookies;
  }

  /**
   * @param {Array<Protocol.Network.deleteCookiesParameters>} cookies
   */
  async deleteCookie(...cookies) {
    const pageURL = this.url();
    const items = [];
    for (const cookie of cookies) {
      const item = {
        url: cookie.url,
        domain: cookie.domain,
        path: cookie.path,
        name: cookie.name,
      };
      if (!item.url && pageURL.startsWith('http'))
        item.url = pageURL;
      items.push(item);
    }

    const connection = Connection.fromSession(this._session);
    await connection.send('Browser.deleteCookies', {
      browserContextId: this._target._context._browserContextId,
      cookies: items,
    });
  }

  /**
   * @param {Array<Network.CookieParam>} cookies
   */
  async setCookie(...cookies) {
    const pageURL = this.url();
    const startsWithHTTP = pageURL.startsWith('http');
    const items = cookies.map(cookie => {
      const item = Object.assign({}, cookie);
      if (!item.url && startsWithHTTP)
        item.url = pageURL;
      assert(item.url !== 'about:blank', `Blank page can not have cookie "${item.name}"`);
      assert(!String.prototype.startsWith.call(item.url || '', 'data:'), `Data URL page can not have cookie "${item.name}"`);
      return item;
    });
    await this.deleteCookie(...items);
    if (items.length) {
      const connection = Connection.fromSession(this._session);
      await connection.send('Browser.setCookies', {
        browserContextId: this._target._context._browserContextId,
        cookies: items
      });
    }
  }

  async setRequestInterception(enabled) {
    await this._networkManager.setRequestInterception(enabled);
  }

  async setExtraHTTPHeaders(headers) {
    await this._networkManager.setExtraHTTPHeaders(headers);
  }

  /**
   * @param {?string} mediaType
   */
  async emulateMedia(mediaType) {
    assert(mediaType === 'screen' || mediaType === 'print' || mediaType === null, 'Unsupported media type: ' + mediaType);
    await this._session.send('Page.setEmulatedMedia', {media: mediaType || ''});
  }

  /**
   * @param {string} name
   * @param {Function} puppeteerFunction
   */
  async exposeFunction(name, puppeteerFunction) {
    if (this._pageBindings.has(name))
      throw new Error(`Failed to add page binding with name ${name}: window['${name}'] already exists!`);
    this._pageBindings.set(name, puppeteerFunction);

    const expression = helper.evaluationString(addPageBinding, name);
    await this._session.send('Page.addBinding', {name: name});
    await this._session.send('Page.addScriptToEvaluateOnNewDocument', {script: expression});
    await Promise.all(this.frames().map(frame => frame.evaluate(expression).catch(debugError)));

    function addPageBinding(bindingName) {
      const binding = window[bindingName];
      window[bindingName] = (...args) => {
        const me = window[bindingName];
        let callbacks = me['callbacks'];
        if (!callbacks) {
          callbacks = new Map();
          me['callbacks'] = callbacks;
        }
        const seq = (me['lastSeq'] || 0) + 1;
        me['lastSeq'] = seq;
        const promise = new Promise((resolve, reject) => callbacks.set(seq, {resolve, reject}));
        binding(JSON.stringify({name: bindingName, seq, args}));
        return promise;
      };
    }
  }

  /**
   * @param {!Protocol.Runtime.bindingCalledPayload} event
   */
  async _onBindingCalled(event) {
    const {name, seq, args} = JSON.parse(event.payload);
    let expression = null;
    try {
      const result = await this._pageBindings.get(name)(...args);
      expression = helper.evaluationString(deliverResult, name, seq, result);
    } catch (error) {
      if (error instanceof Error)
        expression = helper.evaluationString(deliverError, name, seq, error.message, error.stack);
      else
        expression = helper.evaluationString(deliverErrorValue, name, seq, error);
    }
    this._session.send('Runtime.evaluate', { expression, executionContextId: event.executionContextId }).catch(debugError);

    /**
     * @param {string} name
     * @param {number} seq
     * @param {*} result
     */
    function deliverResult(name, seq, result) {
      window[name]['callbacks'].get(seq).resolve(result);
      window[name]['callbacks'].delete(seq);
    }

    /**
     * @param {string} name
     * @param {number} seq
     * @param {string} message
     * @param {string} stack
     */
    function deliverError(name, seq, message, stack) {
      const error = new Error(message);
      error.stack = stack;
      window[name]['callbacks'].get(seq).reject(error);
      window[name]['callbacks'].delete(seq);
    }

    /**
     * @param {string} name
     * @param {number} seq
     * @param {*} value
     */
    function deliverErrorValue(name, seq, value) {
      window[name]['callbacks'].get(seq).reject(value);
      window[name]['callbacks'].delete(seq);
    }
  }

  /**
   * @param {(string|Function)} urlOrPredicate
   * @param {!{timeout?: number}=} options
   * @return {!Promise<!Puppeteer.Request>}
   */
  async waitForRequest(urlOrPredicate, options = {}) {
    const {
      timeout = this._timeoutSettings.timeout(),
    } = options;
    return helper.waitForEvent(this._networkManager, Events.NetworkManager.Request, request => {
      if (helper.isString(urlOrPredicate))
        return (urlOrPredicate === request.url());
      if (typeof urlOrPredicate === 'function')
        return !!(urlOrPredicate(request));
      return false;
    }, timeout);
  }

  /**
   * @param {(string|Function)} urlOrPredicate
   * @param {!{timeout?: number}=} options
   * @return {!Promise<!Puppeteer.Response>}
   */
  async waitForResponse(urlOrPredicate, options = {}) {
    const {
      timeout = this._timeoutSettings.timeout(),
    } = options;
    return helper.waitForEvent(this._networkManager, Events.NetworkManager.Response, response => {
      if (helper.isString(urlOrPredicate))
        return (urlOrPredicate === response.url());
      if (typeof urlOrPredicate === 'function')
        return !!(urlOrPredicate(response));
      return false;
    }, timeout);
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
    const error = new Error(params.message);
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

  get accessibility() {
    return this._accessibility;
  }

  get keyboard(){
    return this._keyboard;
  }

  get mouse(){
    return this._mouse;
  }

  get touchscreen(){
    return this._touchscreen;
  }

  /**
   * @param {!{timeout?: number, waitUntil?: string|!Array<string>}} options
   */
  async waitForNavigation(options = {}) {
    return this._frameManager.mainFrame().waitForNavigation(options);
  }

  /**
   * @param {string} url
   * @param {!{timeout?: number, waitUntil?: string|!Array<string>}} options
   */
  async goto(url, options = {}) {
    return this._frameManager.mainFrame().goto(url, options);
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
    const normalizedWaitUntil = normalizeWaitUntil(waitUntil);
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
    const normalizedWaitUntil = normalizeWaitUntil(waitUntil);
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
    const normalizedWaitUntil = normalizeWaitUntil(waitUntil);
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
      clip: processClip(options.clip),
    });
    const buffer = options.encoding === 'base64' ? data : Buffer.from(data, 'base64');
    if (options.path)
      await writeFileAsync(options.path, buffer);
    return buffer;

    function processClip(clip) {
      if (!clip)
        return undefined;
      const x = Math.round(clip.x);
      const y = Math.round(clip.y);
      const width = Math.round(clip.width + clip.x - x);
      const height = Math.round(clip.height + clip.y - y);
      return {x, y, width, height};
    }
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
   */
  tap(selector) {
    return this.mainFrame().tap(selector);
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

  async close(options = {}) {
    const {
      runBeforeUnload = false,
    } = options;
    await this._session.send('Page.close', { runBeforeUnload });
    if (!runBeforeUnload)
      await this._target._isClosedPromise;
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

  _onConsole({type, args, executionContextId, location}) {
    const context = this._frameManager.executionContextById(executionContextId);
    this.emit(Events.Page.Console, new ConsoleMessage(type, args.map(arg => createHandle(context, arg)), location));
  }

  /**
   * @return {boolean}
   */
  isClosed() {
    return this._closed;
  }
}

class ConsoleMessage {
  /**
   * @param {string} type
   * @param {!Array<!JSHandle>} args
   */
  constructor(type, args, location) {
    this._type = type;
    this._args = args;
    this._location = location;
  }

  location() {
    return this._location;
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

module.exports = {Page, ConsoleMessage};
