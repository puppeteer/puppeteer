const {helper, assert, debugError} = require('./helper');
const {Keyboard, Mouse} = require('./Input');
const {constants} = require('./common');
const {Dialog} = require('./Dialog');
const {TimeoutError} = require('./Errors');
const fs = require('fs');
const mime = require('mime');
const util = require('util');
const EventEmitter = require('events');
const {JSHandle, createHandle} = require('./JSHandle');
const {Events} = require('./Events');
const {ExecutionContext} = require('./ExecutionContext');

const writeFileAsync = util.promisify(fs.writeFile);
const readFileAsync = util.promisify(fs.readFile);

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
    this._session = session;
    this._target = target;
    this._keyboard = new Keyboard(session);
    this._mouse = new Mouse(session, this._keyboard);
    this._isClosed = false;
    this._mainFrame = null;
    this._frames = new Map();
    this._eventListeners = [
      helper.addEventListener(this._session, 'Page.eventFired', this._onEventFired.bind(this)),
      helper.addEventListener(this._session, 'Page.uncaughtError', this._onUncaughtError.bind(this)),
      helper.addEventListener(this._session, 'Page.consoleAPICalled', this._onConsole.bind(this)),
      helper.addEventListener(this._session, 'Page.dialogOpened', this._onDialogOpened.bind(this)),
      helper.addEventListener(this._session, 'Browser.tabClosed', this._onClosed.bind(this)),
      helper.addEventListener(this._session, 'Page.frameAttached', this._onFrameAttached.bind(this)),
      helper.addEventListener(this._session, 'Page.frameDetached', this._onFrameDetached.bind(this)),
      helper.addEventListener(this._session, 'Page.navigationCommitted', this._onNavigationCommitted.bind(this)),
      helper.addEventListener(this._session, 'Page.sameDocumentNavigation', this._onSameDocumentNavigation.bind(this)),
    ];
    this._viewport = null;
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
    return this._mainFrame.url();
  }

  frames() {
    /** @type {!Array<!Frame>} */
    let frames = [];
    collect(this._mainFrame);
    return frames;

    function collect(frame) {
      frames.push(frame);
      for (const subframe of frame._children)
        collect(subframe);
    }
  }

  _onDialogOpened(params) {
    this.emit(Events.Page.Dialog, new Dialog(this._session, params));
  }

  _onFrameAttached(params) {
    const frame = new Frame(this._session, this, params.frameId);
    const parentFrame = this._frames.get(params.parentFrameId) || null;
    if (parentFrame) {
      frame._parentFrame = parentFrame;
      parentFrame._children.add(frame);
    } else {
      assert(!this._mainFrame, 'INTERNAL ERROR: re-attaching main frame!');
      this._mainFrame = frame;
    }
    this._frames.set(params.frameId, frame);
    this.emit(Events.Page.FrameAttached, frame);
  }

  mainFrame() {
    return this._mainFrame;
  }

  _onFrameDetached(params) {
    const frame = this._frames.get(params.frameId);
    this._frames.delete(params.frameId);
    frame._detach();
    this.emit(Events.Page.FrameDetached, frame);
  }

  _onNavigationCommitted(params) {
    const frame = this._frames.get(params.frameId);
    frame._navigated(params.url, params.name, params.navigationId);
    frame._DOMContentLoadedFired = false;
    frame._loadFired = false;
    this.emit(Events.Page.FrameNavigated, frame);
  }

  _onSameDocumentNavigation(params) {
    const frame = this._frames.get(params.frameId);
    frame._url = params.url;
    this.emit(Events.Page.FrameNavigated, frame);
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
      timeout = constants.DEFAULT_NAVIGATION_TIMEOUT,
      waitUntil = ['load'],
    } = options;
    const frame = this._mainFrame;
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
      return;
    }

    const watchDog = new NavigationWatchdog(this._session, frame, navigationId, url, normalizedWaitUntil);
    const error = await Promise.race([
      timeoutPromise,
      watchDog.promise(),
    ]);
    watchDog.dispose();
    clearTimeout(timeoutId);
    if (error)
      throw error;
  }

  /**
   * @param {string} url
   * @param {!{timeout?: number, waitUntil?: string|!Array<string>}} options
   */
  async goto(url, options = {}) {
    const {
      timeout = constants.DEFAULT_NAVIGATION_TIMEOUT,
      waitUntil = ['load'],
    } = options;
    const frame = this._mainFrame;
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

    const watchDog = new NavigationWatchdog(this._session, frame, navigationId, url, normalizedWaitUntil);
    const error = await Promise.race([
      timeoutPromise,
      watchDog.promise(),
    ]);
    watchDog.dispose();
    clearTimeout(timeoutId);
    if (error)
      throw error;
  }

  /**
   * @param {!{timeout?: number, waitUntil?: string|!Array<string>}} options
   */
  async goBack(options = {}) {
    const {
      timeout = constants.DEFAULT_NAVIGATION_TIMEOUT,
      waitUntil = ['load'],
    } = options;
    const frame = this._mainFrame;
    const normalizedWaitUntil = this._normalizeWaitUntil(waitUntil);
    const {navigationId, navigationURL} = await this._session.send('Page.goBack', {
      frameId: frame._frameId,
    });
    if (!navigationId)
      return;

    const timeoutError = new TimeoutError('Navigation Timeout Exceeded: ' + timeout + 'ms');
    let timeoutCallback;
    const timeoutPromise = new Promise(resolve => timeoutCallback = resolve.bind(null, timeoutError));
    const timeoutId = timeout ? setTimeout(timeoutCallback, timeout) : null;

    const watchDog = new NavigationWatchdog(this._session, frame, navigationId, navigationURL, normalizedWaitUntil);
    const error = await Promise.race([
      timeoutPromise,
      watchDog.promise(),
    ]);
    watchDog.dispose();
    clearTimeout(timeoutId);
    if (error)
      throw error;
  }

  /**
   * @param {!{timeout?: number, waitUntil?: string|!Array<string>}} options
   */
  async goForward(options = {}) {
    const {
      timeout = constants.DEFAULT_NAVIGATION_TIMEOUT,
      waitUntil = ['load'],
    } = options;
    const frame = this._mainFrame;
    const normalizedWaitUntil = this._normalizeWaitUntil(waitUntil);
    const {navigationId, navigationURL} = await this._session.send('Page.goForward', {
      frameId: frame._frameId,
    });
    if (!navigationId)
      return;

    const timeoutError = new TimeoutError('Navigation Timeout Exceeded: ' + timeout + 'ms');
    let timeoutCallback;
    const timeoutPromise = new Promise(resolve => timeoutCallback = resolve.bind(null, timeoutError));
    const timeoutId = timeout ? setTimeout(timeoutCallback, timeout) : null;

    const watchDog = new NavigationWatchdog(this._session, frame, navigationId, navigationURL, normalizedWaitUntil);
    const error = await Promise.race([
      timeoutPromise,
      watchDog.promise(),
    ]);
    watchDog.dispose();
    clearTimeout(timeoutId);
    if (error)
      throw error;
  }

  /**
   * @param {!{timeout?: number, waitUntil?: string|!Array<string>}} options
   */
  async reload(options = {}) {
    const {
      timeout = constants.DEFAULT_NAVIGATION_TIMEOUT,
      waitUntil = ['load'],
    } = options;
    const frame = this._mainFrame;
    const normalizedWaitUntil = this._normalizeWaitUntil(waitUntil);
    const {navigationId, navigationURL} = await this._session.send('Page.reload', {
      frameId: frame._frameId,
    });
    if (!navigationId)
      return;

    const timeoutError = new TimeoutError('Navigation Timeout Exceeded: ' + timeout + 'ms');
    let timeoutCallback;
    const timeoutPromise = new Promise(resolve => timeoutCallback = resolve.bind(null, timeoutError));
    const timeoutId = timeout ? setTimeout(timeoutCallback, timeout) : null;

    const watchDog = new NavigationWatchdog(this._session, frame, navigationId, navigationURL, normalizedWaitUntil);
    const error = await Promise.race([
      timeoutPromise,
      watchDog.promise(),
    ]);
    watchDog.dispose();
    clearTimeout(timeoutId);
    if (error)
      throw error;
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
    return await this._mainFrame.evaluate(pageFunction, ...args);
  }

  /**
   * @param {!{content?: string, path?: string, type?: string, url?: string}} options
   * @return {!Promise<!ElementHandle>}
   */
  async addScriptTag(options) {
    return await this._mainFrame.addScriptTag(options);
  }

  /**
   * @param {!{content?: string, path?: string, url?: string}} options
   * @return {!Promise<!ElementHandle>}
   */
  async addStyleTag(options) {
    return await this._mainFrame.addStyleTag(options);
  }

  /**
   * @param {string} selector
   * @param {!{delay?: number, button?: string, clickCount?: number}=} options
   */
  async click(selector, options = {}) {
    return await this._mainFrame.click(selector, options);
  }

  /**
   * @param {string} selector
   * @param {string} text
   * @param {{delay: (number|undefined)}=} options
   */
  async type(selector, text, options) {
    return await this._mainFrame.type(selector, text, options);
  }

  /**
   * @param {string} selector
   */
  async focus(selector) {
    return await this._mainFrame.focus(selector);
  }

  /**
   * @param {string} selector
   */
  async hover(selector) {
    return await this._mainFrame.hover(selector);
  }

  /**
   * @param {(string|number|Function)} selectorOrFunctionOrTimeout
   * @param {!{polling?: string|number, timeout?: number, visible?: boolean, hidden?: boolean}=} options
   * @param {!Array<*>} args
   * @return {!Promise<!JSHandle>}
   */
  async waitFor(selectorOrFunctionOrTimeout, options = {}, ...args) {
    return await this._mainFrame.waitFor(selectorOrFunctionOrTimeout, options, ...args);
  }

  /**
   * @param {Function|string} pageFunction
   * @param {!{polling?: string|number, timeout?: number}=} options
   * @return {!Promise<!JSHandle>}
   */
  async waitForFunction(pageFunction, options = {}, ...args) {
    return await this._mainFrame.waitForFunction(pageFunction, options, ...args);
  }

  /**
   * @param {string} selector
   * @param {!{timeout?: number, visible?: boolean, hidden?: boolean}=} options
   * @return {!Promise<!ElementHandle>}
   */
  async waitForSelector(selector, options = {}) {
    return await this._mainFrame.waitForSelector(selector, options);
  }

  /**
   * @param {string} xpath
   * @param {!{timeout?: number, visible?: boolean, hidden?: boolean}=} options
   * @return {!Promise<!ElementHandle>}
   */
  async waitForXPath(xpath, options = {}) {
    return await this._mainFrame.waitForXPath(xpath, options);
  }

  /**
   * @return {!Promise<string>}
   */
  async title() {
    return await this._mainFrame.title();
  }

  /**
   * @param {string} selector
   * @return {!Promise<?ElementHandle>}
   */
  async $(selector) {
    return await this._mainFrame.$(selector);
  }

  /**
   * @param {string} selector
   * @return {!Promise<!Array<!ElementHandle>>}
   */
  async $$(selector) {
    return await this._mainFrame.$$(selector);
  }

  /**
   * @param {string} selector
   * @param {Function|String} pageFunction
   * @param {!Array<*>} args
   * @return {!Promise<(!Object|undefined)>}
   */
  async $eval(selector, pageFunction, ...args) {
    return await this._mainFrame.$eval(selector, pageFunction, ...args);
  }

  /**
   * @param {string} selector
   * @param {Function|String} pageFunction
   * @param {!Array<*>} args
   * @return {!Promise<(!Object|undefined)>}
   */
  async $$eval(selector, pageFunction, ...args) {
    return await this._mainFrame.$$eval(selector, pageFunction, ...args);
  }

  /**
   * @param {string} expression
   * @return {!Promise<!Array<!ElementHandle>>}
   */
  async $x(expression) {
    return await this._mainFrame.$x(expression);
  }

  async evaluateHandle(pageFunction, ...args) {
    return await this._mainFrame.evaluateHandle(pageFunction, ...args);
  }

  /**
  * @param {string} selector
  * @param {!Array<string>} values
  * @return {!Promise<!Array<string>>}
  */
  async select(selector, ...values) {
    return await this._mainFrame.select(selector, ...values);
  }

  async close() {
    await this._session.send('Browser.closePage' );
  }

  async content() {
    return await this._mainFrame.content();
  }

  /**
   * @param {string} html
   */
  async setContent(html) {
    return await this._mainFrame.setContent(html);
  }

  _onClosed() {
    this._isClosed = true;
    helper.removeEventListeners(this._eventListeners);
    this.emit(Events.Page.Close);
  }

  _onEventFired({frameId, name}) {
    const frame = this._frames.get(frameId);
    frame._firedEvents.add(name.toLowerCase());
    if (frame === this._mainFrame) {
      if (name === 'load')
        this.emit(Events.Page.Load);
      else if (name === 'DOMContentLoaded')
        this.emit(Events.Page.DOMContentLoaded);
    }
  }

  _onLoadFired({frameId}) {
    const frame = this._frames.get(frameId);
    frame._firedEvents.add('load');
  }

  _onConsole({type, args, frameId}) {
    const frame = this._frames.get(frameId);
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

class Frame {
  /**
   * @param {*} session
   * @param {!Page} page
   * @param {string} frameId
   */
  constructor(session, page, frameId) {
    this._session = session;
    this._page = page;
    this._frameId = frameId;
    /** @type {?Frame} */
    this._parentFrame = null;
    this._url = '';
    this._name = '';
    /** @type {!Set<!Frame>} */
    this._children = new Set();
    this._isDetached = false;

    this._firedEvents = new Set();

    /** @type {!Set<!WaitTask>} */
    this._waitTasks = new Set();
    this._documentPromise = null;

    this._executionContext = new ExecutionContext(this._session, this, this._frameId);
  }

  async executionContext() {
    return this._executionContext;
  }

  /**
   * @param {string} selector
   * @param {!{delay?: number, button?: string, clickCount?: number}=} options
   */
  async click(selector, options = {}) {
    const handle = await this.$(selector);
    assert(handle, 'No node found for selector: ' + selector);
    await handle.click(options);
    await handle.dispose();
  }

  /**
   * @param {string} selector
   * @param {string} text
   * @param {{delay: (number|undefined)}=} options
   */
  async type(selector, text, options) {
    const handle = await this.$(selector);
    assert(handle, 'No node found for selector: ' + selector);
    await handle.type(text, options);
    await handle.dispose();
  }

  /**
   * @param {string} selector
   */
  async focus(selector) {
    const handle = await this.$(selector);
    assert(handle, 'No node found for selector: ' + selector);
    await handle.focus();
    await handle.dispose();
  }

  /**
   * @param {string} selector
   */
  async hover(selector) {
    const handle = await this.$(selector);
    assert(handle, 'No node found for selector: ' + selector);
    await handle.hover();
    await handle.dispose();
  }

  _detach() {
    this._parentFrame._children.delete(this);
    this._parentFrame = null;
    this._isDetached = true;
    for (const waitTask of this._waitTasks)
      waitTask.terminate(new Error('waitForFunction failed: frame got detached.'));
  }

  _navigated(url, name, navigationId) {
    this._url = url;
    this._name = name;
    this._lastCommittedNavigationId = navigationId;
    this._documentPromise = null;
    this._firedEvents.clear();
  }

  /**
  * @param {string} selector
  * @param {!Array<string>} values
  * @return {!Promise<!Array<string>>}
  */
  select(selector, ...values) {
    for (const value of values)
      assert(helper.isString(value), 'Values must be strings. Found value "' + value + '" of type "' + (typeof value) + '"');
    return this.$eval(selector, (element, values) => {
      if (element.nodeName.toLowerCase() !== 'select')
        throw new Error('Element is not a <select> element.');

      const options = Array.from(element.options);
      element.value = undefined;
      for (const option of options) {
        option.selected = values.includes(option.value);
        if (option.selected && !element.multiple)
          break;
      }
      element.dispatchEvent(new Event('input', { 'bubbles': true }));
      element.dispatchEvent(new Event('change', { 'bubbles': true }));
      return options.filter(option => option.selected).map(option => option.value);
    }, values);
  }

  /**
   * @param {(string|number|Function)} selectorOrFunctionOrTimeout
   * @param {!{polling?: string|number, timeout?: number, visible?: boolean, hidden?: boolean}=} options
   * @param {!Array<*>} args
   * @return {!Promise<!JSHandle>}
   */
  waitFor(selectorOrFunctionOrTimeout, options, ...args) {
    const xPathPattern = '//';

    if (helper.isString(selectorOrFunctionOrTimeout)) {
      const string = /** @type {string} */ (selectorOrFunctionOrTimeout);
      if (string.startsWith(xPathPattern))
        return this.waitForXPath(string, options);
      return this.waitForSelector(string, options);
    }
    if (helper.isNumber(selectorOrFunctionOrTimeout))
      return new Promise(fulfill => setTimeout(fulfill, /** @type {number} */ (selectorOrFunctionOrTimeout)));
    if (typeof selectorOrFunctionOrTimeout === 'function')
      return this.waitForFunction(selectorOrFunctionOrTimeout, options, ...args);
    return Promise.reject(new Error('Unsupported target type: ' + (typeof selectorOrFunctionOrTimeout)));
  }

  /**
   * @param {Function|string} pageFunction
   * @param {!{polling?: string|number, timeout?: number}=} options
   * @return {!Promise<!JSHandle>}
   */
  waitForFunction(pageFunction, options = {}, ...args) {
    const {
      polling = 'raf',
      timeout = 30000
    } = options;
    return new WaitTask(this, pageFunction, 'function', polling, timeout, ...args).promise;
  }

  /**
   * @param {string} selector
   * @param {!{timeout?: number, visible?: boolean, hidden?: boolean}=} options
   * @return {!Promise<!ElementHandle>}
   */
  waitForSelector(selector, options) {
    return this._waitForSelectorOrXPath(selector, false, options);
  }

  /**
   * @param {string} xpath
   * @param {!{timeout?: number, visible?: boolean, hidden?: boolean}=} options
   * @return {!Promise<!ElementHandle>}
   */
  waitForXPath(xpath, options) {
    return this._waitForSelectorOrXPath(xpath, true, options);
  }

  /**
   * @param {string} selectorOrXPath
   * @param {boolean} isXPath
   * @param {!{timeout?: number, visible?: boolean, hidden?: boolean}=} options
   * @return {!Promise<!ElementHandle>}
   */
  _waitForSelectorOrXPath(selectorOrXPath, isXPath, options = {}) {
    const {
      visible: waitForVisible = false,
      hidden: waitForHidden = false,
      timeout = 30000
    } = options;
    const polling = waitForVisible || waitForHidden ? 'raf' : 'mutation';
    const title = `${isXPath ? 'XPath' : 'selector'} "${selectorOrXPath}"${waitForHidden ? ' to be hidden' : ''}`;
    return new WaitTask(this, predicate, title, polling, timeout, selectorOrXPath, isXPath, waitForVisible, waitForHidden).promise;

    /**
     * @param {string} selectorOrXPath
     * @param {boolean} isXPath
     * @param {boolean} waitForVisible
     * @param {boolean} waitForHidden
     * @return {?Node|boolean}
     */
    function predicate(selectorOrXPath, isXPath, waitForVisible, waitForHidden) {
      const node = isXPath
        ? document.evaluate(selectorOrXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
        : document.querySelector(selectorOrXPath);
      if (!node)
        return waitForHidden;
      if (!waitForVisible && !waitForHidden)
        return node;
      const element = /** @type {Element} */ (node.nodeType === Node.TEXT_NODE ? node.parentElement : node);

      const style = window.getComputedStyle(element);
      const isVisible = style && style.visibility !== 'hidden' && hasVisibleBoundingBox();
      const success = (waitForVisible === isVisible || waitForHidden === !isVisible);
      return success ? node : null;

      /**
       * @return {boolean}
       */
      function hasVisibleBoundingBox() {
        const rect = element.getBoundingClientRect();
        return !!(rect.top || rect.bottom || rect.width || rect.height);
      }
    }
  }

  /**
   * @return {!Promise<String>}
   */
  async content() {
    return await this.evaluate(() => {
      let retVal = '';
      if (document.doctype)
        retVal = new XMLSerializer().serializeToString(document.doctype);
      if (document.documentElement)
        retVal += document.documentElement.outerHTML;
      return retVal;
    });
  }

  /**
   * @param {string} html
   */
  async setContent(html) {
    await this.evaluate(html => {
      document.open();
      document.write(html);
      document.close();
    }, html);
  }

  async evaluate(pageFunction, ...args) {
    return this._executionContext.evaluate(pageFunction, ...args);
  }

  _document() {
    if (!this._documentPromise)
      this._documentPromise = this.evaluateHandle('document').then(handle => handle.asElement());
    return this._documentPromise;
  }

  /**
   * @param {string} selector
   * @return {!Promise<?ElementHandle>}
   */
  async $(selector) {
    const document = await this._document();
    return document.$(selector);
  }

  /**
   * @param {string} selector
   * @return {!Promise<!Array<!ElementHandle>>}
   */
  async $$(selector) {
    const document = await this._document();
    return document.$$(selector);
  }

  /**
   * @param {string} selector
   * @param {Function|String} pageFunction
   * @param {!Array<*>} args
   * @return {!Promise<(!Object|undefined)>}
   */
  async $eval(selector, pageFunction, ...args) {
    const document = await this._document();
    return document.$eval(selector, pageFunction, ...args);
  }

  /**
   * @param {string} selector
   * @param {Function|String} pageFunction
   * @param {!Array<*>} args
   * @return {!Promise<(!Object|undefined)>}
   */
  async $$eval(selector, pageFunction, ...args) {
    const document = await this._document();
    return document.$$eval(selector, pageFunction, ...args);
  }

  /**
   * @param {string} expression
   * @return {!Promise<!Array<!ElementHandle>>}
   */
  async $x(expression) {
    const document = await this._document();
    return document.$x(expression);
  }

  async evaluateHandle(pageFunction, ...args) {
    return this._executionContext.evaluateHandle(pageFunction, ...args);
  }

  /**
   * @param {!{content?: string, path?: string, type?: string, url?: string}} options
   * @return {!Promise<!ElementHandle>}
   */
  async addScriptTag(options) {
    if (typeof options.url === 'string') {
      const url = options.url;
      try {
        return (await this.evaluateHandle(addScriptUrl, url, options.type)).asElement();
      } catch (error) {
        throw new Error(`Loading script from ${url} failed`);
      }
    }

    if (typeof options.path === 'string') {
      let contents = await readFileAsync(options.path, 'utf8');
      contents += '//# sourceURL=' + options.path.replace(/\n/g, '');
      return (await this.evaluateHandle(addScriptContent, contents, options.type)).asElement();
    }

    if (typeof options.content === 'string') {
      return (await this.evaluateHandle(addScriptContent, options.content, options.type)).asElement();
    }

    throw new Error('Provide an object with a `url`, `path` or `content` property');

    /**
     * @param {string} url
     * @param {string} type
     * @return {!Promise<!HTMLElement>}
     */
    async function addScriptUrl(url, type) {
      const script = document.createElement('script');
      script.src = url;
      if (type)
        script.type = type;
      const promise = new Promise((res, rej) => {
        script.onload = res;
        script.onerror = rej;
      });
      document.head.appendChild(script);
      await promise;
      return script;
    }

    /**
     * @param {string} content
     * @param {string} type
     * @return {!HTMLElement}
     */
    function addScriptContent(content, type = 'text/javascript') {
      const script = document.createElement('script');
      script.type = type;
      script.text = content;
      let error = null;
      script.onerror = e => error = e;
      document.head.appendChild(script);
      if (error)
        throw error;
      return script;
    }
  }

  /**
   * @param {!{content?: string, path?: string, url?: string}} options
   * @return {!Promise<!ElementHandle>}
   */
  async addStyleTag(options) {
    if (typeof options.url === 'string') {
      const url = options.url;
      try {
        return (await this.evaluateHandle(addStyleUrl, url)).asElement();
      } catch (error) {
        throw new Error(`Loading style from ${url} failed`);
      }
    }

    if (typeof options.path === 'string') {
      let contents = await readFileAsync(options.path, 'utf8');
      contents += '/*# sourceURL=' + options.path.replace(/\n/g, '') + '*/';
      return (await this.evaluateHandle(addStyleContent, contents)).asElement();
    }

    if (typeof options.content === 'string') {
      return (await this.evaluateHandle(addStyleContent, options.content)).asElement();
    }

    throw new Error('Provide an object with a `url`, `path` or `content` property');

    /**
     * @param {string} url
     * @return {!Promise<!HTMLElement>}
     */
    async function addStyleUrl(url) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      const promise = new Promise((res, rej) => {
        link.onload = res;
        link.onerror = rej;
      });
      document.head.appendChild(link);
      await promise;
      return link;
    }

    /**
     * @param {string} content
     * @return {!Promise<!HTMLElement>}
     */
    async function addStyleContent(content) {
      const style = document.createElement('style');
      style.type = 'text/css';
      style.appendChild(document.createTextNode(content));
      const promise = new Promise((res, rej) => {
        style.onload = res;
        style.onerror = rej;
      });
      document.head.appendChild(style);
      await promise;
      return style;
    }
  }

  /**
   * @return {!Promise<string>}
   */
  async title() {
    return this.evaluate(() => document.title);
  }

  name() {
    return this._name;
  }

  isDetached() {
    return this._isDetached;
  }

  childFrames() {
    return Array.from(this._children);
  }

  url() {
    return this._url;
  }

  parentFrame() {
    return this._parentFrame;
  }
}

/**
 * @internal
 */
class WaitTask {
  /**
   * @param {!Frame} frame
   * @param {Function|string} predicateBody
   * @param {string|number} polling
   * @param {number} timeout
   * @param {!Array<*>} args
   */
  constructor(frame, predicateBody, title, polling, timeout, ...args) {
    if (helper.isString(polling))
      assert(polling === 'raf' || polling === 'mutation', 'Unknown polling option: ' + polling);
    else if (helper.isNumber(polling))
      assert(polling > 0, 'Cannot poll with non-positive interval: ' + polling);
    else
      throw new Error('Unknown polling options: ' + polling);

    this._frame = frame;
    this._polling = polling;
    this._timeout = timeout;
    this._predicateBody = helper.isString(predicateBody) ? 'return ' + predicateBody : 'return (' + predicateBody + ')(...args)';
    this._args = args;
    this._runCount = 0;
    frame._waitTasks.add(this);
    this.promise = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
    // Since page navigation requires us to re-install the pageScript, we should track
    // timeout on our end.
    if (timeout) {
      const timeoutError = new TimeoutError(`waiting for ${title} failed: timeout ${timeout}ms exceeded`);
      this._timeoutTimer = setTimeout(() => this.terminate(timeoutError), timeout);
    }
    this.rerun();
  }

  /**
   * @param {!Error} error
   */
  terminate(error) {
    this._terminated = true;
    this._reject(error);
    this._cleanup();
  }

  async rerun() {
    const runCount = ++this._runCount;
    /** @type {?JSHandle} */
    let success = null;
    let error = null;
    try {
      success = await this._frame.evaluateHandle(waitForPredicatePageFunction, this._predicateBody, this._polling, this._timeout, ...this._args);
    } catch (e) {
      error = e;
    }

    if (this._terminated || runCount !== this._runCount) {
      if (success)
        await success.dispose();
      return;
    }

    // Ignore timeouts in pageScript - we track timeouts ourselves.
    // If the frame's execution context has already changed, `frame.evaluate` will
    // throw an error - ignore this predicate run altogether.
    if (!error && await this._frame.evaluate(s => !s, success).catch(e => true)) {
      await success.dispose();
      return;
    }

    // When the page is navigated, the promise is rejected.
    // Try again right away.
    if (error && error.message.includes('Execution context was destroyed')) {
      this.rerun();
      return;
    }

    if (error)
      this._reject(error);
    else
      this._resolve(success);

    this._cleanup();
  }

  _cleanup() {
    clearTimeout(this._timeoutTimer);
    this._frame._waitTasks.delete(this);
    this._runningTask = null;
  }
}

/**
 * @param {string} predicateBody
 * @param {string} polling
 * @param {number} timeout
 * @return {!Promise<*>}
 */
async function waitForPredicatePageFunction(predicateBody, polling, timeout, ...args) {
  const predicate = new Function('...args', predicateBody);
  let timedOut = false;
  if (timeout)
    setTimeout(() => timedOut = true, timeout);
  if (polling === 'raf')
    return await pollRaf();
  if (polling === 'mutation')
    return await pollMutation();
  if (typeof polling === 'number')
    return await pollInterval(polling);

  /**
   * @return {!Promise<*>}
   */
  function pollMutation() {
    const success = predicate.apply(null, args);
    if (success)
      return Promise.resolve(success);

    let fulfill;
    const result = new Promise(x => fulfill = x);
    const observer = new MutationObserver(mutations => {
      if (timedOut) {
        observer.disconnect();
        fulfill();
      }
      const success = predicate.apply(null, args);
      if (success) {
        observer.disconnect();
        fulfill(success);
      }
    });
    observer.observe(document, {
      childList: true,
      subtree: true,
      attributes: true
    });
    return result;
  }

  /**
   * @return {!Promise<*>}
   */
  function pollRaf() {
    let fulfill;
    const result = new Promise(x => fulfill = x);
    onRaf();
    return result;

    function onRaf() {
      if (timedOut) {
        fulfill();
        return;
      }
      const success = predicate.apply(null, args);
      if (success)
        fulfill(success);
      else
        requestAnimationFrame(onRaf);
    }
  }

  /**
   * @param {number} pollInterval
   * @return {!Promise<*>}
   */
  function pollInterval(pollInterval) {
    let fulfill;
    const result = new Promise(x => fulfill = x);
    onTimeout();
    return result;

    function onTimeout() {
      if (timedOut) {
        fulfill();
        return;
      }
      const success = predicate.apply(null, args);
      if (success)
        fulfill(success);
      else
        setTimeout(onTimeout, pollInterval);
    }
  }
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
  constructor(session, navigatedFrame, targetNavigationId, targetURL, firedEvents) {
    this._navigatedFrame = navigatedFrame;
    this._targetNavigationId = targetNavigationId;
    this._firedEvents = firedEvents;
    this._targetURL = targetURL;

    this._promise = new Promise(x => this._resolveCallback = x);

    const check = this._checkNavigationComplete.bind(this);
    this._eventListeners = [
      helper.addEventListener(session, 'Page.eventFired', check),
      helper.addEventListener(session, 'Page.frameAttached', check),
      helper.addEventListener(session, 'Page.frameDetached', check),
      helper.addEventListener(session, 'Page.navigationStarted', check),
      helper.addEventListener(session, 'Page.navigationCommitted', check),
      helper.addEventListener(session, 'Page.navigationAborted', this._onNavigationAborted.bind(this)),
    ];
    check();
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

module.exports = {Page, Frame, ConsoleMessage};
