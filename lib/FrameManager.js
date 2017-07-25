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

    /** @type {!Map<string, string>} */
    this._frameIdToExecutionContextId = new Map();

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

    if (!parentFrameId) {
      // Navigation to the new backend process.
      this._navigateFrame(this._mainFrame, frameId, null);
      return;
    }
    let parentFrame = this._frames.get(parentFrameId);
    let frame = new Frame(this, parentFrame, frameId, null);
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
    this._navigateFrame(frame, framePayload.id, framePayload);
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
    if (context.auxData && context.auxData.isDefault && context.auxData.frameId)
      this._frameIdToExecutionContextId.set(context.auxData.frameId, context.id);
  }

  /**
   * @param {!Frame} frame
   * @param {string} newFrameId
   * @param {?Object} newFramePayload
   */
  _navigateFrame(frame, newFrameId, newFramePayload) {
    // Detach all child frames first.
    for (let child of frame.childFrames())
      this._removeFramesRecursively(child);
    this._frames.delete(frame._id, frame);
    this._frameIdToExecutionContextId.delete(frame._id);
    frame._id = newFrameId;
    frame._adoptPayload(newFramePayload);
    this._frames.set(newFrameId, frame);
    this.emit(FrameManager.Events.FrameNavigated, frame);
  }

  /**
   * @param {?Frame} parentFrame
   * @param {!Object} frameTreePayload
   * @return {!Frame}
   */
  _addFramesRecursively(parentFrame, frameTreePayload) {
    let framePayload = frameTreePayload.frame;
    let frame = new Frame(this, parentFrame, framePayload.id, framePayload);
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
    this._frameIdToExecutionContextId.delete(frame._id);
    this.emit(FrameManager.Events.FrameDetached, frame);
  }

  /**
   * @param {!Frame} frame
   * @param {string} expression
   * @return {!Promise<(!Object|undefined)>}
   */
  async _evaluateOnFrame(frame, expression) {
    let contextId = undefined;
    if (frame !== this._mainFrame) {
      contextId = this._frameIdToExecutionContextId.get(frame._id);
      console.assert(contextId, 'Frame does not have default context to evaluate in!');
    }
    expression = `Promise.resolve(${expression})`;
    let { exceptionDetails, result: remoteObject }  = await this._client.send('Runtime.evaluate', { expression, contextId, returnByValue: false, awaitPromise: true });
    if (exceptionDetails)
      throw new Error('Evaluation failed: ' + helper.getExceptionMessage(exceptionDetails));
    return await helper.serializeRemoteObject(this._client, remoteObject);
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
   * @param {!FrameManager} frameManager
   * @param {?Frame} parentFrame
   * @param {string} frameId
   * @param {?Object} payload
   */
  constructor(frameManager, parentFrame, frameId, payload) {
    this._frameManager = frameManager;
    this._parentFrame = parentFrame;
    this._url = '';
    this._id = frameId;
    /** @type {!Set<!WaitTask>} */
    this._waitTasks = new Set();

    this._adoptPayload(payload);

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
    return this._frameManager._evaluateOnFrame(this, helper.evaluationString(pageFunction, ...args));
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
    const waitTask = new WaitTask(this._frameManager, this, pageScript, timeout);

    this._waitTasks.add(waitTask);
    let cleanup = () => this._waitTasks.delete(waitTask);
    waitTask.promise.then(cleanup, cleanup);
    return waitTask.promise;
  }

  /**
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
    return this._frameManager._evaluateOnFrame(this, expression);
  }

  /**
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
    return this._frameManager._evaluateOnFrame(this, expression);
  }

  /**
   * @param {string} selector
   * @return {!Promise}
   */
  async hover(selector) {
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
    await this._frameManager._mouse.move(center.x, center.y);
  }

  /**
   * @param {string} selector
   * @param {!Object=} options
   * @return {!Promise}
   */
  async click(selector, options) {
    await this.hover(selector);
    await this._frameManager._mouse.press(options);
    // This is a hack for now, to make clicking less race-prone
    await this.evaluate(() => new Promise(f => requestAnimationFrame(f)));
  }

  /**
   * @param {?Object} framePayload
   */
  _adoptPayload(framePayload) {
    framePayload = framePayload || {
      name: '',
      url: '',
    };
    this._name = framePayload.name;
    this._url = framePayload.url;
    for (let waitTask of this._waitTasks)
      waitTask.run();
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
   * @param {!FrameManager} frameManager
   * @param {!Frame} frame
   * @param {string} pageScript
   * @param {number} timeout
   */
  constructor(frameManager, frame, pageScript, timeout) {
    this._frameManager = frameManager;
    this._frame = frame;
    this._pageScript = pageScript;
    this._runningTask = null;
    this.promise = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
    // Since page navigation requires us to re-install the pageScript, we should track
    // timeout on our end.
    this._timeoutTimer = setTimeout(() => this.terminate(new Error(`waiting failed: timeout ${timeout}ms exceeded`)), timeout);
    this.run();
  }

  /**
   * @param {!Error} error
   */
  terminate(error) {
    this._reject(error);
    this._cleanup();
  }

  run() {
    let runningTask = this._frameManager._evaluateOnFrame(this._frame, this._pageScript).then(finish.bind(this), finish.bind(this, false));
    this._runningTask = runningTask;

    /**
     * @param {boolean} success
     * @param {?Error=} error
     */
    function finish(success, error) {
      if (runningTask !== this._runningTask)
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
  }

  _cleanup() {
    clearTimeout(this._timeoutTimer);
    this._runningTask = null;
  }
}

/**
 * @param {string} selector
 * @param {boolean} waitForVisible
 * @param {number} timeout
 * @return {!Promise<boolean>}
 */
function waitForSelectorPageFunction(selector, visible, timeout) {
  const resultPromise = visible ? waitForVisible(selector) : waitInDOM(selector);
  const timeoutPromise = new Promise(fulfill => setTimeout(fulfill, timeout));
  return Promise.race([
    resultPromise.then(() => true),
    timeoutPromise.then(() => false)
  ]);

  /**
   * @param {string} selector
   * @return {!Promise<!Element>}
   */
  function waitInDOM(selector) {
    let node = document.querySelector(selector);
    if (node)
      return Promise.resolve(node);

    let fulfill;
    const result = new Promise(x => fulfill = x);
    const observer = new MutationObserver(mutations => {
      const node = document.querySelector(selector);
      if (node) {
        observer.disconnect();
        fulfill(node);
      }
    });
    observer.observe(document, {
      childList: true,
      subtree: true
    });
    return result;
  }

  /**
   * @param {string} selector
   * @return {!Promise<!Element>}
   */
  async function waitForVisible(selector) {
    let fulfill;
    const result = new Promise(x => fulfill = x);
    onRaf();
    return result;

    async function onRaf() {
      const node = await waitInDOM(selector);
      const style = window.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden') {
        requestAnimationFrame(onRaf);
        return;
      }
      fulfill(node);
    }
  }
}

module.exports = FrameManager;
