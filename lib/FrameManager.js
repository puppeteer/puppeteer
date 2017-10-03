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
const ElementHandle = require('./ElementHandle');

class FrameManager extends EventEmitter {
  /**
   * @param {!Session} client
   * @param {!Object} frameTree
   * @param {!Mouse} mouse
   * @param {!Touchscreen} touchscreen
   */
  constructor(client, mouse, touchscreen) {
    super();
    this._client = client;
    this._mouse = mouse;
    this._touchscreen = touchscreen;
    /** @type {!Map<string, !Frame>} */
    this._frames = new Map();

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
    const frame = new Frame(this._client, this._mouse, this._touchscreen, parentFrame, frameId);
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
        this._frames.delete(frame._id, frame);
        frame._id = framePayload.id;
      } else {
        // Initial main frame navigation.
        frame = new Frame(this._client, this._mouse, this._touchscreen, null, framePayload.id);
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

  _onExecutionContextCreated(context) {
    const frameId = context.auxData && context.auxData.isDefault ? context.auxData.frameId : null;
    const frame = this._frames.get(frameId);
    if (!frame)
      return;
    frame._defaultContextId = context.id;
    for (const waitTask of frame._waitTasks)
      waitTask.rerun();
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
   * @param {!Frame} frame
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
   * @param {!Session} client
   * @param {!Mouse} mouse
   * @param {!Touchscreen} touchscreen
   * @param {?Frame} parentFrame
   * @param {string} frameId
   */
  constructor(client, mouse, touchscreen, parentFrame, frameId) {
    this._client = client;
    this._mouse = mouse;
    this._touchscreen = touchscreen;
    this._parentFrame = parentFrame;
    this._url = '';
    this._id = frameId;
    this._defaultContextId = '<not-initialized>';
    /** @type {!Set<!WaitTask>} */
    this._waitTasks = new Set();

    /** @type {!Set<!Frame>} */
    this._childFrames = new Set();
    if (this._parentFrame)
      this._parentFrame._childFrames.add(this);
  }

  /**
   * @param {function()|string} pageFunction
   * @param {!Array<*>} args
   * @return {!Promise<(!Object|undefined)>}
   */
  async evaluate(pageFunction, ...args) {
    const remoteObject = await this._rawEvaluate(pageFunction, ...args);
    return await helper.serializeRemoteObject(this._client, remoteObject);
  }

  /**
   * @param {string} selector
   * @return {!Promise<?ElementHandle>}
   */
  async $(selector) {
    const remoteObject = await this._rawEvaluate(selector => document.querySelector(selector), selector);
    if (remoteObject.subtype === 'node')
      return new ElementHandle(this, this._client, remoteObject, this._mouse, this._touchscreen);
    await helper.releaseObject(this._client, remoteObject);
    return null;
  }

  /**
   * @param {string} selector
   * @param {function()|string} pageFunction
   * @param {!Array<*>} args
   * @return {!Promise<(!Object|undefined)>}
   */
  async $eval(selector, pageFunction, ...args) {
    const elementHandle = await this.$(selector);
    if (!elementHandle)
      throw new Error(`Error: failed to find element matching selector "${selector}"`);
    args = [elementHandle].concat(args);
    const result = await this.evaluate(pageFunction, ...args);
    await elementHandle.dispose();
    return result;
  }

  /**
   * @param {string} selector
   * @return {!Promise<!Array<!ElementHandle>>}
   */
  async $$(selector) {
    const remoteObject = await this._rawEvaluate(selector => Array.from(document.querySelectorAll(selector)), selector);
    const response = await this._client.send('Runtime.getProperties', {
      objectId: remoteObject.objectId,
      ownProperties: true
    });
    const properties = response.result;
    const result = [];
    const releasePromises = [helper.releaseObject(this._client, remoteObject)];
    for (const property of properties) {
      if (property.enumerable && property.value.subtype === 'node')
        result.push(new ElementHandle(this, this._client, property.value, this._mouse, this._touchscreen));
      else
        releasePromises.push(helper.releaseObject(this._client, property.value));
    }
    await Promise.all(releasePromises);
    return result;
  }

  /**
   * @param {function()|string} pageFunction
   * @param {!Array<*>} args
   * @return {!Promise<(!Object|undefined)>}
   */
  async _rawEvaluate(pageFunction, ...args) {
    if (helper.isString(pageFunction)) {
      const contextId = this._defaultContextId;
      const expression = pageFunction;
      const { exceptionDetails, result: remoteObject } = await this._client.send('Runtime.evaluate', { expression, contextId, returnByValue: false, awaitPromise: true});
      if (exceptionDetails)
        throw new Error('Evaluation failed: ' + helper.getExceptionMessage(exceptionDetails));
      return remoteObject;
    }

    const { exceptionDetails, result: remoteObject } = await this._client.send('Runtime.callFunctionOn', {
      functionDeclaration: pageFunction.toString(),
      executionContextId: this._defaultContextId,
      arguments: args.map(convertArgument.bind(this)),
      returnByValue: false,
      awaitPromise: true
    });
    if (exceptionDetails)
      throw new Error('Evaluation failed: ' + helper.getExceptionMessage(exceptionDetails));
    return remoteObject;

    /**
     * @param {*} arg
     * @return {*}
     * @this {Frame}
     */
    function convertArgument(arg) {
      if (Object.is(arg, -0))
        return { unserializableValue: '-0' };
      if (Object.is(arg, Infinity))
        return { unserializableValue: 'Infinity' };
      if (Object.is(arg, -Infinity))
        return { unserializableValue: '-Infinity' };
      if (Object.is(arg, NaN))
        return { unserializableValue: 'NaN' };
      if (arg instanceof ElementHandle) {
        if (arg._frame !== this)
          throw new Error('ElementHandles passed as arguments should belong to the frame that does evaluation');
        const objectId = arg._remoteObjectId();
        if (!objectId)
          throw new Error('ElementHandle is disposed!');
        return { objectId };
      }
      return { value: arg };
    }
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
   * @param {string} filePath
   * @return {!Promise<*>}
   */
  async injectFile(filePath) {
    let contents = await new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return reject(err);
        resolve(data);
      });
    });
    contents += `//# sourceURL=` + filePath.replace(/\n/g,'');
    return this.evaluate(contents);
  }

  /**
   * @param {string} url
   */
  async addScriptTag(url) {
    return this.evaluate(addScriptTag, url);

    /**
     * @param {string} url
     */
    function addScriptTag(url) {
      const script = document.createElement('script');
      script.src = url;
      const promise = new Promise(x => script.onload = x);
      document.head.appendChild(script);
      return promise;
    }
  }

  /**
   * @param {string} url
   */
  async addStyleTag(url) {
    return this.evaluate(addStyleTag, url);

    /**
     * @param {string} url
     */
    function addStyleTag(url) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      const promise = new Promise(x => link.onload = x);
      document.head.appendChild(link);
      return promise;
    }
  }

  /**
   * @param {(string|number|function())} selectorOrTimeout
   * @param {!Object=} options
   * @param {!Array<*>} args
   * @return {!Promise}
   */
  waitFor(selectorOrFunctionOrTimeout, options = {}, ...args) {
    if (helper.isString(selectorOrFunctionOrTimeout))
      return this.waitForSelector(selectorOrFunctionOrTimeout, options);
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
    const polling = waitForVisible ? 'raf' : 'mutation';
    return this.waitForFunction(predicate, {timeout, polling}, selector, waitForVisible);

    /**
     * @param {string} selector
     * @param {boolean} waitForVisible
     * @return {boolean}
     */
    function predicate(selector, waitForVisible) {
      const node = document.querySelector(selector);
      if (!node)
        return false;
      if (!waitForVisible)
        return true;
      const style = window.getComputedStyle(node);
      return style && style.display !== 'none' && style.visibility !== 'hidden';
    }
  }

  /**
   * @param {function()} pageFunction
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
   * @param {string} polling
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
   * @return {!Promise<!Element>}
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

module.exports = FrameManager;
