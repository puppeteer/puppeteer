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

const fs = require('fs');
const EventEmitter = require('events');
const {helper} = require('./helper');
const {ExecutionContext, JSHandle} = require('./ExecutionContext');
const ElementHandle = require('./ElementHandle');

const readFileAsync = helper.promisify(fs.readFile);

class FrameManager extends EventEmitter {
  /**
   * @param {!Puppeteer.Session} client
   * @param {!Puppeteer.Page} page
   */
  constructor(client, page) {
    super();
    this._client = client;
    this._page = page;
    /** @type {!Map<string, !Frame>} */
    this._frames = new Map();
    /** @type {!Map<string, !ExecutionContext>} */
    this._contextIdToContext = new Map();

    this._client.on('Page.frameAttached', event => this._onFrameAttached(event.frameId, event.parentFrameId));
    this._client.on('Page.frameNavigated', event => this._onFrameNavigated(event.frame));
    this._client.on('Page.frameDetached', event => this._onFrameDetached(event.frameId));
    this._client.on('Runtime.executionContextCreated', event => this._onExecutionContextCreated(event.context));
  }

  /**
   * @return {!Frame}
   */
  mainFrame() {
    return this._mainFrame;
  }

  /**
   * @return {!Array<!Frame>}
   */
  frames() {
    return Array.from(this._frames.values());
  }

  /**
   * @param {string} frameId
   * @param {?string} parentFrameId
   * @return {?Frame}
   */
  _onFrameAttached(frameId, parentFrameId) {
    if (this._frames.has(frameId))
      return;
    console.assert(parentFrameId);
    const parentFrame = this._frames.get(parentFrameId);
    const frame = new Frame(this._client, this._page, parentFrame, frameId);
    this._frames.set(frame._id, frame);
    this.emit(FrameManager.Events.FrameAttached, frame);
  }

  /**
   * @param {!Object} framePayload
   */
  _onFrameNavigated(framePayload) {
    const isMainFrame = !framePayload.parentId;
    let frame = isMainFrame ? this._mainFrame : this._frames.get(framePayload.id);
    console.assert(isMainFrame || frame, 'We either navigate top level or have old version of the navigated frame');

    // Detach all child frames first.
    if (frame) {
      for (const child of frame.childFrames())
        this._removeFramesRecursively(child);
    }

    // Update or create main frame.
    if (isMainFrame) {
      if (frame) {
        // Update frame id to retain frame identity on cross-process navigation.
        this._frames.delete(frame._id);
        frame._id = framePayload.id;
      } else {
        // Initial main frame navigation.
        frame = new Frame(this._client, this._page, null, framePayload.id);
      }
      this._frames.set(framePayload.id, frame);
      this._mainFrame = frame;
    }

    // Update frame payload.
    frame._navigated(framePayload);

    this.emit(FrameManager.Events.FrameNavigated, frame);
  }

  /**
   * @param {string} frameId
   */
  _onFrameDetached(frameId) {
    const frame = this._frames.get(frameId);
    if (frame)
      this._removeFramesRecursively(frame);
  }

  _onExecutionContextCreated(contextPayload) {
    const context = new ExecutionContext(this._client, contextPayload.id, this.createJSHandle.bind(this, contextPayload.id));
    this._contextIdToContext.set(contextPayload.id, context);

    const frameId = contextPayload.auxData && contextPayload.auxData.isDefault ? contextPayload.auxData.frameId : null;
    const frame = this._frames.get(frameId);
    if (!frame)
      return;
    frame._context = context;
    for (const waitTask of frame._waitTasks)
      waitTask.rerun();
  }

  _onExecutionContextDestroyed(contextPayload) {
    this._contextIdToContext.delete(contextPayload.id);
  }

  /**
   * @param {string} contextId
   * @param {*} remoteObject
   * @return {!JSHandle}
   */
  createJSHandle(contextId, remoteObject) {
    const context = this._contextIdToContext.get(contextId);
    console.assert(context, 'INTERNAL ERROR: missing context with id = ' + contextId);
    if (remoteObject.subtype === 'node')
      return new ElementHandle(context, this._client, remoteObject, this._page);
    return new JSHandle(context, this._client, remoteObject);
  }

  /**
   * @param {!Frame} frame
   */
  _removeFramesRecursively(frame) {
    for (const child of frame.childFrames())
      this._removeFramesRecursively(child);
    frame._detach();
    this._frames.delete(frame._id);
    this.emit(FrameManager.Events.FrameDetached, frame);
  }

  /**
   * @return {boolean}
   */
  isMainFrameLoadingFailed() {
    return !!this._mainFrame._loadingFailed;
  }
}

/** @enum {string} */
FrameManager.Events = {
  FrameAttached: 'frameattached',
  FrameNavigated: 'framenavigated',
  FrameDetached: 'framedetached'
};

/**
 * @unrestricted
 */
class Frame {
  /**
   * @param {!Puppeteer.Session} client
   * @param {?Frame} parentFrame
   * @param {string} frameId
   */
  constructor(client, page, parentFrame, frameId) {
    this._client = client;
    this._page = page;
    this._parentFrame = parentFrame;
    this._url = '';
    this._id = frameId;
    this._context = null;
    /** @type {!Set<!WaitTask>} */
    this._waitTasks = new Set();

    /** @type {!Set<!Frame>} */
    this._childFrames = new Set();
    if (this._parentFrame)
      this._parentFrame._childFrames.add(this);
  }

  /**
   * @return {!ExecutionContext}
   */
  executionContext() {
    return this._context;
  }

  /**
   * @param {Function|string} pageFunction
   * @param {!Array<*>} args
   * @return {!Promise<*>}
   */
  async evaluate(pageFunction, ...args) {
    return this._context.evaluate(pageFunction, ...args);
  }

  /**
   * @param {string} selector
   * @return {!Promise<?ElementHandle>}
   */
  async $(selector) {
    const handle = await this._context.evaluateHandle(selector => document.querySelector(selector), selector);
    const element = handle.asElement();
    if (element)
      return element;
    await handle.dispose();
    return null;
  }

  /**
   * @param {string} selector
   * @param {Function|string} pageFunction
   * @param {!Array<*>} args
   * @return {!Promise<(!Object|undefined)>}
   */
  async $eval(selector, pageFunction, ...args) {
    const elementHandle = await this.$(selector);
    if (!elementHandle)
      throw new Error(`Error: failed to find element matching selector "${selector}"`);
    const result = await this.evaluate(pageFunction, elementHandle, ...args);
    await elementHandle.dispose();
    return result;
  }

  /**
   * @param {string} selector
   * @param {Function|string} pageFunction
   * @param {!Array<*>} args
   * @return {!Promise<(!Object|undefined)>}
   */
  async $$eval(selector, pageFunction, ...args) {
    const arrayHandle = await this._context.evaluateHandle(selector => Array.from(document.querySelectorAll(selector)), selector);
    const result = await this.evaluate(pageFunction, arrayHandle, ...args);
    await arrayHandle.dispose();
    return result;
  }

  /**
   * @param {string} selector
   * @return {!Promise<!Array<!ElementHandle>>}
   */
  async $$(selector) {
    const arrayHandle = await this._context.evaluateHandle(selector => document.querySelectorAll(selector), selector);
    const properties = await arrayHandle.getProperties();
    await arrayHandle.dispose();
    const result = [];
    for (const property of properties.values()) {
      const elementHandle = property.asElement();
      if (elementHandle)
        result.push(elementHandle);
    }
    return result;
  }

  /**
   * @return {string}
   */
  name() {
    return this._name || '';
  }

  /**
   * @return {string}
   */
  url() {
    return this._url;
  }

  /**
   * @return {?Frame}
   */
  parentFrame() {
    return this._parentFrame;
  }

  /**
   * @return {!Array.<!Frame>}
   */
  childFrames() {
    return Array.from(this._childFrames);
  }

  /**
   * @return {boolean}
   */
  isDetached() {
    return this._detached;
  }

  /**
   * @param {Object} options
   * @return {!Promise}
   */
  async addScriptTag(options) {
    if (typeof options.url === 'string')
      return this.evaluate(addScriptUrl, options.url);

    if (typeof options.path === 'string') {
      let contents = await readFileAsync(options.path, 'utf8');
      contents += '//# sourceURL=' + options.path.replace(/\n/g, '');

      return this.evaluate(addScriptContent, contents);
    }

    if (typeof options.content === 'string')
      return this.evaluate(addScriptContent, options.content);

    throw new Error('Provide an object with a `url`, `path` or `content` property');

    /**
     * @param {string} url
     */
    function addScriptUrl(url) {
      const script = document.createElement('script');
      script.src = url;
      const promise = new Promise(x => script.onload = x);
      document.head.appendChild(script);
      return promise;
    }

    /**
     * @param {string} content
     */
    function addScriptContent(content) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.text = content;
      document.head.appendChild(script);
    }
  }

  /**
   * @param {Object} options
   * @return {!Promise}
   */
  async addStyleTag(options) {
    if (typeof options.url === 'string')
      return this.evaluate(addStyleUrl, options.url);

    if (typeof options.path === 'string') {
      let contents = await readFileAsync(options.path, 'utf8');
      contents += '/*# sourceURL=' + options.path.replace(/\n/g, '') + '*/';

      return this.evaluate(addStyleContent, contents);
    }

    if (typeof options.content === 'string')
      return this.evaluate(addStyleContent, options.content);

    throw new Error('Provide an object with a `url`, `path` or `content` property');

    /**
     * @param {string} url
     */
    function addStyleUrl(url) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      const promise = new Promise(x => link.onload = x);
      document.head.appendChild(link);
      return promise;
    }

    /**
     * @param {string} content
     */
    function addStyleContent(content) {
      const style = document.createElement('style');
      style.type = 'text/css';
      style.appendChild(document.createTextNode(content));
      document.head.appendChild(style);
    }
  }

  /**
   * @param {(string|number|Function)} selectorOrFunctionOrTimeout
   * @param {!Object=} options
   * @param {!Array<*>} args
   * @return {!Promise}
   */
  waitFor(selectorOrFunctionOrTimeout, options = {}, ...args) {
    if (helper.isString(selectorOrFunctionOrTimeout))
      return this.waitForSelector(/** @type {string} */(selectorOrFunctionOrTimeout), options);
    if (helper.isNumber(selectorOrFunctionOrTimeout))
      return new Promise(fulfill => setTimeout(fulfill, selectorOrFunctionOrTimeout));
    if (typeof selectorOrFunctionOrTimeout === 'function')
      return this.waitForFunction(selectorOrFunctionOrTimeout, options, ...args);
    return Promise.reject(new Error('Unsupported target type: ' + (typeof selectorOrFunctionOrTimeout)));
  }

  /**
   * @param {string} selector
   * @param {!Object=} options
   * @return {!Promise}
   */
  waitForSelector(selector, options = {}) {
    const timeout = options.timeout || 30000;
    const waitForVisible = !!options.visible;
    const waitForHidden = !!options.hidden;
    const polling = waitForVisible || waitForHidden ? 'raf' : 'mutation';
    return this.waitForFunction(predicate, {timeout, polling}, selector, waitForVisible, waitForHidden);

    /**
     * @param {string} selector
     * @param {boolean} waitForVisible
     * @param {boolean} waitForHidden
     * @return {boolean}
     */
    function predicate(selector, waitForVisible, waitForHidden) {
      const node = document.querySelector(selector);
      if (!node)
        return waitForHidden;
      if (!waitForVisible && !waitForHidden)
        return true;
      const style = window.getComputedStyle(node);
      const isVisible = style && style.display !== 'none' && style.visibility !== 'hidden';
      return (waitForVisible === isVisible || waitForHidden === !isVisible);
    }
  }

  /**
   * @param {Function} pageFunction
   * @param {!Object=} options
   * @return {!Promise}
   */
  waitForFunction(pageFunction, options = {}, ...args) {
    const timeout = options.timeout || 30000;
    const polling = options.polling || 'raf';
    const predicateCode = 'return ' + helper.evaluationString(pageFunction, ...args);
    return new WaitTask(this, predicateCode, polling, timeout).promise;
  }

  /**
   * @return {!Promise<string>}
   */
  async title() {
    return this.evaluate(() =>  document.title);
  }

  /**
   * @param {!Object} framePayload
   */
  _navigated(framePayload) {
    this._name = framePayload.name;
    this._url = framePayload.url;
    this._loadingFailed = !!framePayload.unreachableUrl;
  }

  _detach() {
    for (const waitTask of this._waitTasks)
      waitTask.terminate(new Error('waitForSelector failed: frame got detached.'));
    this._detached = true;
    if (this._parentFrame)
      this._parentFrame._childFrames.delete(this);
    this._parentFrame = null;
  }
}
helper.tracePublicAPI(Frame);

class WaitTask {
  /**
   * @param {!Frame} frame
   * @param {string} predicateBody
   * @param {string|number} polling
   * @param {number} timeout
   */
  constructor(frame, predicateBody, polling, timeout) {
    if (helper.isString(polling))
      console.assert(polling === 'raf' || polling === 'mutation', 'Unknown polling option: ' + polling);
    else if (helper.isNumber(polling))
      console.assert(polling > 0, 'Cannot poll with non-positive interval: ' + polling);
    else
      throw new Error('Unknown polling options: ' + polling);

    this._frame = frame;
    this._pageScript = helper.evaluationString(waitForPredicatePageFunction, predicateBody, polling, timeout);
    this._runCount = 0;
    frame._waitTasks.add(this);
    this.promise = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
    // Since page navigation requires us to re-install the pageScript, we should track
    // timeout on our end.
    this._timeoutTimer = setTimeout(() => this.terminate(new Error(`waiting failed: timeout ${timeout}ms exceeded`)), timeout);
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
    let success = false;
    let error = null;
    try {
      success = await this._frame.evaluate(this._pageScript);
    } catch (e) {
      error = e;
    }

    if (this._terminated || runCount !== this._runCount)
      return;

    // Ignore timeouts in pageScript - we track timeouts ourselves.
    if (!success && !error)
      return;

    // When the page is navigated, the promise is rejected.
    // We will try again in the new execution context.
    if (error && error.message.includes('Execution context was destroyed'))
      return;

    // We could have tried to evaluate in a context which was already
    // destroyed.
    if (error && error.message.includes('Cannot find context with specified id'))
      return;

    if (error)
      this._reject(error);
    else
      this._resolve();

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
 * @return {!Promise<boolean>}
 */
async function waitForPredicatePageFunction(predicateBody, polling, timeout) {
  const predicate = new Function(predicateBody);
  let timedOut = false;
  setTimeout(() => timedOut = true, timeout);
  if (polling === 'raf')
    await pollRaf();
  else if (polling === 'mutation')
    await pollMutation();
  else if (typeof polling === 'number')
    await pollInterval(polling);
  return !timedOut;

  /**
   * @return {!Promise}
   */
  function pollMutation() {
    if (predicate())
      return Promise.resolve();

    let fulfill;
    const result = new Promise(x => fulfill = x);
    const observer = new MutationObserver(mutations => {
      if (timedOut || predicate()) {
        observer.disconnect();
        fulfill();
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
   * @return {!Promise}
   */
  function pollRaf() {
    let fulfill;
    const result = new Promise(x => fulfill = x);
    onRaf();
    return result;

    function onRaf() {
      if (timedOut || predicate())
        fulfill();
      else
        requestAnimationFrame(onRaf);
    }
  }

  /**
   * @param {number} pollInterval
   * @return {!Promise}
   */
  function pollInterval(pollInterval) {
    let fulfill;
    const result = new Promise(x => fulfill = x);
    onTimeout();
    return result;

    function onTimeout() {
      if (timedOut || predicate())
        fulfill();
      else
        setTimeout(onTimeout, pollInterval);
    }
  }
}

module.exports = {FrameManager, Frame};
