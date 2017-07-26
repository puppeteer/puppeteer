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

let fs = require('fs');
let EventEmitter = require('events');
let helper = require('./helper');

class FrameManager extends EventEmitter {
  /**
   * @param {!Connection} client
   * @param {!Mouse} mouse
   * @return {!Promise<!FrameManager>}
   */
  static async create(client, mouse) {
    let mainFramePayload = await client.send('Page.getResourceTree');
    return new FrameManager(client, mainFramePayload.frameTree, mouse);
  }

  /**
   * @param {!Connection} client
   * @param {!Object} frameTree
   * @param {!Mouse} mouse
   */
  constructor(client, frameTree, mouse) {
    super();
    this._client = client;
    this._mouse = mouse;
    /** @type {!Map<string, !Frame>} */
    this._frames = new Map();
    this._mainFrame = this._addFramesRecursively(null, frameTree);

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
    let parentFrame = this._frames.get(parentFrameId);
    let frame = new Frame(this._client, this._mouse, parentFrame, frameId);
    this._frames.set(frame._id, frame);
    this.emit(FrameManager.Events.FrameAttached, frame);
  }

  /**
   * @param {!Object} framePayload
   */
  _onFrameNavigated(framePayload) {
    let frame = this._frames.get(framePayload.id);
    if (!frame) {
      // Simulate missed "frameAttached" for a main frame navigation to the new backend process.
      console.assert(!framePayload.parentId, 'Main frame shouldn\'t have parent frame id.');
      frame = this._mainFrame;
    }
    this._navigateFrame(frame, framePayload);
  }

  /**
   * @param {string} frameId
   */
  _onFrameDetached(frameId) {
    let frame = this._frames.get(frameId);
    if (frame)
      this._removeFramesRecursively(frame);
  }

  _onExecutionContextCreated(context) {
    const frameId = context.auxData && context.auxData.isDefault ? context.auxData.frameId : null;
    const frame = this._frames.get(frameId);
    if (!frame)
      return;
    frame._defaultContextId = context.id;
  }

  /**
   * @param {!Frame} frame
   * @param {?Object} newFramePayload
   */
  _navigateFrame(frame, newFramePayload) {
    // Detach all child frames first.
    for (let child of frame.childFrames())
      this._removeFramesRecursively(child);
    this._frames.delete(frame._id);

    // Update frame id to retain frame identity.
    frame._id = newFramePayload.id;

    frame._navigated(newFramePayload);
    this._frames.set(newFramePayload.id, frame);
    this.emit(FrameManager.Events.FrameNavigated, frame);
  }

  /**
   * @param {?Frame} parentFrame
   * @param {!Object} frameTreePayload
   * @return {!Frame}
   */
  _addFramesRecursively(parentFrame, frameTreePayload) {
    let framePayload = frameTreePayload.frame;
    let frame = new Frame(this._client, this._mouse, parentFrame, framePayload.id);
    frame._navigated(framePayload);
    this._frames.set(frame._id, frame);

    for (let i = 0; frameTreePayload.childFrames && i < frameTreePayload.childFrames.length; ++i)
      this._addFramesRecursively(frame, frameTreePayload.childFrames[i]);
    return frame;
  }

  /**
   * @param {!Frame} frame
   */
  _removeFramesRecursively(frame) {
    for (let child of frame.childFrames())
      this._removeFramesRecursively(child);
    frame._detach();
    this._frames.delete(frame._id);
    this.emit(FrameManager.Events.FrameDetached, frame);
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
   * @param {!Connection} client
   * @param {!Mouse} mouse
   * @param {?Frame} parentFrame
   * @param {string} frameId
   */
  constructor(client, mouse, parentFrame, frameId) {
    this._client = client;
    this._mouse = mouse;
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
   * @param {function()} pageFunction
   * @param {!Array<*>} args
   * @return {!Promise<(!Object|undefined)>}
   */
  async evaluate(pageFunction, ...args) {
    return this._evaluateExpression(helper.evaluationString(pageFunction, ...args), true);
  }

  /**
   * @param {string} expression
   * @param {boolean} awaitPromise
   * @return {!Promise<(!Object|undefined)>}
   */
  async _evaluateExpression(expression, awaitPromise) {
    const contextId = this._defaultContextId;
    if (awaitPromise)
      expression = `Promise.resolve(${expression})`;
    let { exceptionDetails, result: remoteObject }  = await this._client.send('Runtime.evaluate', { expression, contextId, returnByValue: false, awaitPromise});
    if (exceptionDetails)
      throw new Error('Evaluation failed: ' + helper.getExceptionMessage(exceptionDetails));
    return await helper.serializeRemoteObject(this._client, remoteObject);
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
   * @return {!Promise}
   */
  async injectFile(filePath) {
    let contents = await new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return reject(err);
        resolve(data);
      });
    });
    contents += `//# sourceURL=` + filePath.replace(/\n/g,'');
    return this._evaluateExpression(contents, false);
  }

  /**
   * @param {string} url
   * @return {!Promise}
   */
  async addScriptTag(url) {
    return this.evaluate(addScriptTag, url);

    /**
     * @param {string} url
     */
    function addScriptTag(url) {
      let script = document.createElement('script');
      script.src = url;
      let promise = new Promise(x => script.onload = x);
      document.head.appendChild(script);
      return promise;
    }
  }

  /**
   * @param {(string|number)} selectorOrTimeout
   * @param {!Object=} options
   * @return {!Promise}
   */
  waitFor(selectorOrTimeout, options = {}) {
    if (typeof selectorOrTimeout === 'string' || selectorOrTimeout instanceof String)
      return this.waitForSelector(selectorOrTimeout, options);
    if (typeof selectorOrTimeout === 'number' || selectorOrTimeout instanceof Number)
      return new Promise(fulfill => setTimeout(fulfill, selectorOrTimeout));
    return Promise.reject(new Error('Unsupported target type: ' + (typeof selectorOrTimeout)));
  }

  /**
   * @param {string} selector
   * @param {!Object=} options
   * @return {!Promise}
   */
  waitForSelector(selector, options = {}) {
    const timeout = options.timeout || 30000;
    const waitForVisible = !!options.visible;
    const pageScript = helper.evaluationString(waitForSelectorPageFunction, selector, waitForVisible, timeout);
    return new WaitTask(this, pageScript, timeout).promise;
  }

  /**
   * @template T
   * @param {string} selector
   * @param {function(!Element):T} pageFunction
   * @param {!Array<*>} args
   * @return {!Promise<?T>}
   */
  async $(selector, pageFunction, ...args) {
    let argsString = ['node'].concat(args.map(x => JSON.stringify(x))).join(',');
    let expression = `(()=>{
      let node = document.querySelector(${JSON.stringify(selector)});
      if (!node)
        return null;
      return (${pageFunction})(${argsString});
    })()`;
    return this._evaluateExpression(expression, true);
  }

  /**
   * @template T
   * @param {string} selector
   * @param {function(!Element):T} pageFunction
   * @param {!Array<*>} args
   * @return {!Promise<!Array<T>>}
   */
  async $$(selector, pageFunction, ...args) {
    let argsString = ['node, index'].concat(args.map(x => JSON.stringify(x))).join(',');
    let expression = `(()=>{
      let nodes = document.querySelectorAll(${JSON.stringify(selector)});
      return Array.prototype.map.call(nodes, (node, index) => (${pageFunction})(${argsString}));
    })()`;
    return this._evaluateExpression(expression, true);
  }

  /**
   * @return {!Promise<string>}
   */
  async title() {
    return this.evaluate(() =>  document.title);
  }

  /**
   * @param {string} selector
   * @return {!Promise<{x: number, y: number}>}
   */
  async _centerOfElement(selector) {
    let center = await this.evaluate(selector => {
      let element = document.querySelector(selector);
      if (!element)
        return null;
      element.scrollIntoViewIfNeeded();
      let rect = element.getBoundingClientRect();
      return {
        x: (Math.max(rect.left, 0) + Math.min(rect.right, window.innerWidth)) / 2,
        y: (Math.max(rect.top, 0) + Math.min(rect.bottom, window.innerHeight)) / 2
      };
    }, selector);
    if (!center)
      throw new Error('No node found for selector: ' + selector);
    return center;
  }

  /**
   * @param {string} selector
   * @return {!Promise}
   */
  async hover(selector) {
    let {x, y} = await this._centerOfElement(selector);
    await this._mouse.move(x, y);
  }

  /**
   * @param {string} selector
   * @param {!Object=} options
   * @return {!Promise}
   */
  async click(selector, options) {
    let {x, y} = await this._centerOfElement(selector);
    await this._mouse.click(x, y, options);
  }

  /**
   * @param {string} selector
   * @return {!Promise}
   */
  async focus(selector) {
    let success = await this.evaluate(selector => {
      let node = document.querySelector(selector);
      if (!node)
        return false;
      node.focus();
      return true;
    }, selector);
    if (!success)
      throw new Error('No node found for selector: ' + selector);
  }

  /**
   * @param {!Object} framePayload
   */
  _navigated(framePayload) {
    this._name = framePayload.name;
    this._url = framePayload.url;
    for (let waitTask of this._waitTasks)
      waitTask.rerun();
  }

  _detach() {
    for (let waitTask of this._waitTasks)
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
   * @param {string} pageScript
   * @param {number} timeout
   */
  constructor(frame, pageScript, timeout) {
    this._frame = frame;
    this._pageScript = pageScript;
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
      success = await this._frame._evaluateExpression(this._pageScript, true);
    } catch (e) {
      error = e;
    }

    if (this._terminated || runCount !== this._runCount)
      return;

    // Ignore timeouts in pageScript - we track timeouts ourselves.
    if (!success && !error)
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
 * @param {string} selector
 * @param {boolean} waitForVisible
 * @param {number} timeout
 * @return {!Promise<boolean>}
 */
async function waitForSelectorPageFunction(selector, visible, timeout) {
  let timedOut = false;
  setTimeout(() => timedOut = true, timeout);
  await waitForDOM();
  await waitForVisible();
  return !timedOut;

  /**
   * @return {!Promise<!Element>}
   */
  function waitForDOM() {
    let node = document.querySelector(selector);
    if (node)
      return Promise.resolve();

    let fulfill;
    const result = new Promise(x => fulfill = x);
    const observer = new MutationObserver(mutations => {
      const node = document.querySelector(selector);
      if (node || timedOut) {
        observer.disconnect();
        fulfill();
      }
    });
    observer.observe(document, {
      childList: true,
      subtree: true
    });
    return result;
  }

  /**
   * @return {!Promise<!Element>}
   */
  function waitForVisible() {
    let fulfill;
    const result = new Promise(x => fulfill = x);
    onRaf();
    return result;

    function onRaf() {
      if (timedOut) {
        fulfill();
        return;
      }
      const node = document.querySelector(selector);
      const style = node ? window.getComputedStyle(node) : null;
      if (!style || style.display === 'none' || style.visibility === 'hidden') {
        requestAnimationFrame(onRaf);
        return;
      }
      fulfill();
    }
  }
}

module.exports = FrameManager;
