const {helper, assert} = require('./helper');
const {TimeoutError} = require('./Errors');
const fs = require('fs');
const util = require('util');
const EventEmitter = require('events');
const {Events} = require('./Events');
const {ExecutionContext} = require('./ExecutionContext');
const {NavigationWatchdog, NextNavigationWatchdog} = require('./NavigationWatchdog');
const {DOMWorld} = require('./DOMWorld');

const readFileAsync = util.promisify(fs.readFile);

class FrameManager extends EventEmitter {
  /**
   * @param {PageSession} session
   * @param {Page} page
   */
  constructor(session, page, networkManager, timeoutSettings) {
    super();
    this._session = session;
    this._page = page;
    this._networkManager = networkManager;
    this._timeoutSettings = timeoutSettings;
    this._mainFrame = null;
    this._frames = new Map();
    /** @type {!Map<string, !ExecutionContext>} */
    this._contextIdToContext = new Map();
    this._eventListeners = [
      helper.addEventListener(this._session, 'Page.eventFired', this._onEventFired.bind(this)),
      helper.addEventListener(this._session, 'Page.frameAttached', this._onFrameAttached.bind(this)),
      helper.addEventListener(this._session, 'Page.frameDetached', this._onFrameDetached.bind(this)),
      helper.addEventListener(this._session, 'Page.navigationCommitted', this._onNavigationCommitted.bind(this)),
      helper.addEventListener(this._session, 'Page.sameDocumentNavigation', this._onSameDocumentNavigation.bind(this)),
      helper.addEventListener(this._session, 'Runtime.executionContextCreated', this._onExecutionContextCreated.bind(this)),
      helper.addEventListener(this._session, 'Runtime.executionContextDestroyed', this._onExecutionContextDestroyed.bind(this)),
    ];
  }

  executionContextById(executionContextId) {
    return this._contextIdToContext.get(executionContextId) || null;
  }

  _onExecutionContextCreated({executionContextId, auxData}) {
    const frameId = auxData ? auxData.frameId : null;
    const frame = this._frames.get(frameId) || null;
    const context = new ExecutionContext(this._session, frame, executionContextId);
    if (frame)
      frame._mainWorld._setContext(context);
    this._contextIdToContext.set(executionContextId, context);
  }

  _onExecutionContextDestroyed({executionContextId}) {
    const context = this._contextIdToContext.get(executionContextId);
    if (!context)
      return;
    this._contextIdToContext.delete(executionContextId);
    if (context._frame)
      context._frame._mainWorld._setContext(null);
  }

  frame(frameId) {
    return this._frames.get(frameId);
  }

  mainFrame() {
    return this._mainFrame;
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

  _onNavigationCommitted(params) {
    const frame = this._frames.get(params.frameId);
    frame._navigated(params.url, params.name, params.navigationId);
    frame._DOMContentLoadedFired = false;
    frame._loadFired = false;
    this.emit(Events.FrameManager.FrameNavigated, frame);
  }

  _onSameDocumentNavigation(params) {
    const frame = this._frames.get(params.frameId);
    frame._url = params.url;
    this.emit(Events.FrameManager.FrameNavigated, frame);
  }

  _onFrameAttached(params) {
    const frame = new Frame(this._session, this, this._networkManager, this._page, params.frameId, this._timeoutSettings);
    const parentFrame = this._frames.get(params.parentFrameId) || null;
    if (parentFrame) {
      frame._parentFrame = parentFrame;
      parentFrame._children.add(frame);
    } else {
      assert(!this._mainFrame, 'INTERNAL ERROR: re-attaching main frame!');
      this._mainFrame = frame;
    }
    this._frames.set(params.frameId, frame);
    this.emit(Events.FrameManager.FrameAttached, frame);
  }

  _onFrameDetached(params) {
    const frame = this._frames.get(params.frameId);
    this._frames.delete(params.frameId);
    frame._detach();
    this.emit(Events.FrameManager.FrameDetached, frame);
  }

  _onEventFired({frameId, name}) {
    const frame = this._frames.get(frameId);
    frame._firedEvents.add(name.toLowerCase());
    if (frame === this._mainFrame) {
      if (name === 'load')
        this.emit(Events.FrameManager.Load);
      else if (name === 'DOMContentLoaded')
        this.emit(Events.FrameManager.DOMContentLoaded);
    }
  }

  dispose() {
    helper.removeEventListeners(this._eventListeners);
  }
}

class Frame {
  /**
   * @param {*} session
   * @param {!Page} page
   * @param {string} frameId
   */
  constructor(session, frameManager, networkManager, page, frameId, timeoutSettings) {
    this._session = session;
    this._page = page;
    this._frameManager = frameManager;
    this._networkManager = networkManager;
    this._timeoutSettings = timeoutSettings;
    this._frameId = frameId;
    /** @type {?Frame} */
    this._parentFrame = null;
    this._url = '';
    this._name = '';
    /** @type {!Set<!Frame>} */
    this._children = new Set();
    this._detached = false;


    this._firedEvents = new Set();

    this._mainWorld = new DOMWorld(this, timeoutSettings);
  }

  async executionContext() {
    return this._mainWorld.executionContext();
  }

  /**
   * @param {!{timeout?: number, waitUntil?: string|!Array<string>}} options
   */
  async waitForNavigation(options = {}) {
    const {
      timeout = this._timeoutSettings.navigationTimeout(),
      waitUntil = ['load'],
    } = options;
    const normalizedWaitUntil = normalizeWaitUntil(waitUntil);

    const timeoutError = new TimeoutError('Navigation Timeout Exceeded: ' + timeout + 'ms');
    let timeoutCallback;
    const timeoutPromise = new Promise(resolve => timeoutCallback = resolve.bind(null, timeoutError));
    const timeoutId = timeout ? setTimeout(timeoutCallback, timeout) : null;

    const nextNavigationDog = new NextNavigationWatchdog(this._session, this);
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

    const watchDog = new NavigationWatchdog(this._session, this, this._networkManager, navigationId, url, normalizedWaitUntil);
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
      referer,
    } = options;
    const normalizedWaitUntil = normalizeWaitUntil(waitUntil);
    const {navigationId} = await this._session.send('Page.navigate', {
      frameId: this._frameId,
      referer,
      url,
    });
    if (!navigationId)
      return;

    const timeoutError = new TimeoutError('Navigation Timeout Exceeded: ' + timeout + 'ms');
    let timeoutCallback;
    const timeoutPromise = new Promise(resolve => timeoutCallback = resolve.bind(null, timeoutError));
    const timeoutId = timeout ? setTimeout(timeoutCallback, timeout) : null;

    const watchDog = new NavigationWatchdog(this._session, this, this._networkManager, navigationId, url, normalizedWaitUntil);
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
   * @param {string} selector
   * @param {!{delay?: number, button?: string, clickCount?: number}=} options
   */
  async click(selector, options = {}) {
    return this._mainWorld.click(selector, options);
  }

  /**
   * @param {string} selector
   */
  async tap(selector) {
    return this._mainWorld.tap(selector);
  }

  /**
   * @param {string} selector
   * @param {string} text
   * @param {{delay: (number|undefined)}=} options
   */
  async type(selector, text, options) {
    return this._mainWorld.type(selector, text, options);
  }

  /**
   * @param {string} selector
   */
  async focus(selector) {
    return this._mainWorld.focus(selector);
  }

  /**
   * @param {string} selector
   */
  async hover(selector) {
    return this._mainWorld.hover(selector);
  }

  _detach() {
    this._parentFrame._children.delete(this);
    this._parentFrame = null;
    this._detached = true;
    this._mainWorld._detach();
  }

  _navigated(url, name, navigationId) {
    this._url = url;
    this._name = name;
    this._lastCommittedNavigationId = navigationId;
    this._firedEvents.clear();
  }

  /**
  * @param {string} selector
  * @param {!Array<string>} values
  * @return {!Promise<!Array<string>>}
  */
  select(selector, ...values) {
    return this._mainWorld.select(selector, ...values);
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
    return this._mainWorld.waitForFunction(pageFunction, options, ...args);
  }

  /**
   * @param {string} selector
   * @param {!{timeout?: number, visible?: boolean, hidden?: boolean}=} options
   * @return {!Promise<!ElementHandle>}
   */
  waitForSelector(selector, options) {
    return this._mainWorld.waitForSelector(selector, options);
  }

  /**
   * @param {string} xpath
   * @param {!{timeout?: number, visible?: boolean, hidden?: boolean}=} options
   * @return {!Promise<!ElementHandle>}
   */
  waitForXPath(xpath, options) {
    return this._mainWorld.waitForXPath(xpath, options);
  }

  /**
   * @return {!Promise<String>}
   */
  async content() {
    return this._mainWorld.content();
  }

  /**
   * @param {string} html
   */
  async setContent(html) {
    return this._mainWorld.setContent(html);
  }

  async evaluate(pageFunction, ...args) {
    return this._mainWorld.evaluate(pageFunction, ...args);
  }

  /**
   * @param {string} selector
   * @return {!Promise<?ElementHandle>}
   */
  async $(selector) {
    return this._mainWorld.$(selector);
  }

  /**
   * @param {string} selector
   * @return {!Promise<!Array<!ElementHandle>>}
   */
  async $$(selector) {
    return this._mainWorld.$$(selector);
  }

  /**
   * @param {string} selector
   * @param {Function|String} pageFunction
   * @param {!Array<*>} args
   * @return {!Promise<(!Object|undefined)>}
   */
  async $eval(selector, pageFunction, ...args) {
    return this._mainWorld.$eval(selector, pageFunction, ...args);
  }

  /**
   * @param {string} selector
   * @param {Function|String} pageFunction
   * @param {!Array<*>} args
   * @return {!Promise<(!Object|undefined)>}
   */
  async $$eval(selector, pageFunction, ...args) {
    return this._mainWorld.$$eval(selector, pageFunction, ...args);
  }

  /**
   * @param {string} expression
   * @return {!Promise<!Array<!ElementHandle>>}
   */
  async $x(expression) {
    return this._mainWorld.$x(expression);
  }

  async evaluateHandle(pageFunction, ...args) {
    return this._mainWorld.evaluateHandle(pageFunction, ...args);
  }

  /**
   * @param {!{content?: string, path?: string, type?: string, url?: string}} options
   * @return {!Promise<!ElementHandle>}
   */
  async addScriptTag(options) {
    return this._mainWorld.addScriptTag(options);
  }

  /**
   * @param {!{content?: string, path?: string, url?: string}} options
   * @return {!Promise<!ElementHandle>}
   */
  async addStyleTag(options) {
    return this._mainWorld.addStyleTag(options);
  }

  /**
   * @return {!Promise<string>}
   */
  async title() {
    return this._mainWorld.title();
  }

  name() {
    return this._name;
  }

  isDetached() {
    return this._detached;
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

function normalizeWaitUntil(waitUntil) {
  if (!Array.isArray(waitUntil))
    waitUntil = [waitUntil];
  for (const condition of waitUntil) {
    if (condition !== 'load' && condition !== 'domcontentloaded')
      throw new Error('Unknown waitUntil condition: ' + condition);
  }
  return waitUntil;
}

module.exports = {FrameManager, Frame, normalizeWaitUntil};
