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

const await = require('./utilities').await;
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const PageEvents = require('../lib/Page').Events;

const noop = function() { };

class WebPage {
  /**
   * @param {!Browser} browser
   * @param {string} scriptPath
   * @param {!Object=} options
   */
  constructor(browser, scriptPath, options) {
    this._page = await(browser.newPage());
    this.settings = new WebPageSettings(this._page);

    options = options || {};
    options.settings = options.settings || {};
    if (options.settings.userAgent)
      this.settings.userAgent = options.settings.userAgent;
    if (options.viewportSize)
      await(this._page.setViewport(options.viewportSize));
    else
      await(this._page.setViewport({width: 400, height: 300}));

    this.loading = false;
    this.loadingProgress = 0;
    this.clipRect = options.clipRect || {left: 0, top: 0, width: 0, height: 0};
    this.onConsoleMessage = null;
    this.onLoadFinished = null;
    this.onResourceError = null;
    this.onResourceReceived = null;
    this._onInitialized = undefined;
    this._deferEvaluate = false;
    this._customHeaders = {};

    this._currentFrame = this._page.mainFrame();

    this.libraryPath = path.dirname(scriptPath);

    this._onResourceRequestedCallback = undefined;
    this._onConfirmCallback = undefined;
    this._onPromptCallback = undefined;
    this._onAlertCallback = undefined;
    this._onError = noop;

    this._pageEvents = new AsyncEmitter(this._page);
    this._pageEvents.on(PageEvents.Request, request => this._onRequest(request));
    this._pageEvents.on(PageEvents.Response, response => this._onResponseReceived(response));
    this._pageEvents.on(PageEvents.RequestFinished, request => this._onRequestFinished(request));
    this._pageEvents.on(PageEvents.RequestFailed, event => (this.onResourceError || noop).call(null, event));
    this._pageEvents.on(PageEvents.Console, (...args) => this._onConsole(...args));
    this._pageEvents.on(PageEvents.Confirm, message => this._onConfirm(message));
    this._pageEvents.on(PageEvents.Alert, message => this._onAlert(message));
    this._pageEvents.on(PageEvents.Dialog, dialog => this._onDialog(dialog));
    this._pageEvents.on(PageEvents.PageError, error => (this._onError || noop).call(null, error.message, error.stack));
    this.event = {
      key: {
        A: 65,
        B: 66,
        C: 67,
        Home: ['Home'],
        Delete: ['Delete'],
        Backspace: ['Backspace'],
        Cut: ['Cut'],
        Paste: ['Paste']
      },
      modifier: {
        shift: 'Shift'
      }
    };
  }

  /**
   * @param {!Array<!Object>} args
   */
  _onConsole(...args) {
    if (!this.onConsoleMessage)
      return;
    const text = args.join(' ');
    this.onConsoleMessage(text);
  }

  /**
   * @return {string}
   */
  currentFrameName() {
    return this.frameName;
  }

  /**
   * @return {number}
   */
  childFramesCount() {
    return this.framesCount;
  }

  /**
   * @return {!Array<string>}
   */
  childFramesName() {
    return this.framesName;
  }

  /**
   * @param {(string|number)} frameName
   * @return {boolean}
   */
  switchToChildFrame(frame) {
    return this.switchToFrame(frame);
  }

  /**
   * @return {string}
   */
  get frameName() {
    return this._currentFrame.name();
  }

  /**
   * @return {number}
   */
  get framesCount() {
    return this._currentFrame.childFrames().length;
  }

  /**
   * @return {!Array<string>}
   */
  get framesName() {
    return this._currentFrame.childFrames().map(frame => frame.name());
  }

  /**
   * @return {string}
   */
  get focusedFrameName() {
    const focusedFrame = this._focusedFrame();
    return focusedFrame ? focusedFrame.name() : '';
  }

  /**
   * @return {?Frame}
   */
  _focusedFrame() {
    const frames = this._currentFrame.childFrames().slice();
    frames.push(this._currentFrame);
    const promises = frames.map(frame => frame.evaluate(() => document.hasFocus()));
    const result = await(Promise.all(promises));
    for (let i = 0; i < result.length; ++i) {
      if (result[i])
        return frames[i];
    }
    return null;
  }

  switchToFocusedFrame() {
    const frame = this._focusedFrame();
    this._currentFrame = frame;
  }

  /**
   * @param {(string|number)} frameName
   * @return {boolean}
   */
  switchToFrame(frameName) {
    let frame = null;
    if (typeof frameName === 'string')
      frame = this._currentFrame.childFrames().find(frame => frame.name() === frameName);
    else if (typeof frameName === 'number')
      frame = this._currentFrame.childFrames()[frameName];
    if (!frame)
      return false;
    this._currentFrame = frame;
    return true;
  }

  /**
   * @return {boolean}
   */
  switchToParentFrame() {
    const frame = this._currentFrame.parentFrame();
    if (!frame)
      return false;
    this._currentFrame = frame;
    return true;
  }

  switchToMainFrame() {
    this._currentFrame = this._page.mainFrame();
  }

  get onInitialized() {
    return this._onInitialized;
  }

  set onInitialized(value) {
    if (typeof value !== 'function')
      this._onInitialized = undefined;
    else
      this._onInitialized = value;
  }

  /**
   * @return {?function(!Object, !Request)}
   */
  get onResourceRequested() {
    return this._onResourceRequestedCallback;
  }

  /**
   * @return {?function(!Object, !Request)} callback
   */
  set onResourceRequested(callback) {
    await(this._page.setRequestInterceptionEnabled(!!callback));
    this._onResourceRequestedCallback = callback;
  }

  _onRequest(request) {
    if (!this._onResourceRequestedCallback)
      return;
    const requestData = new RequestData(request);
    const phantomRequest = new PhantomRequest();
    this._onResourceRequestedCallback.call(null, requestData, phantomRequest);
    if (phantomRequest._aborted) {
      request.abort();
    } else {
      request.continue({
        url: phantomRequest._url,
        headers: phantomRequest._headers,
      });
    }
  }

  _onResponseReceived(response) {
    if (!this.onResourceReceived)
      return;
    const phantomResponse = new PhantomResponse(response, false /* isResponseFinished */);
    this.onResourceReceived.call(null, phantomResponse);
  }

  _onRequestFinished(request) {
    if (!this.onResourceReceived)
      return;
    const phantomResponse = new PhantomResponse(request.response(), true /* isResponseFinished */);
    this.onResourceReceived.call(null, phantomResponse);
  }

  /**
   * @param {string} url
   * @param {function()} callback
   */
  includeJs(url, callback) {
    this._page.addScriptTag(url).then(callback);
  }

  /**
   * @return {!{width: number, height: number}}
   */
  get viewportSize() {
    return this._page.viewport();
  }

  /**
   * @return {!Object}
   */
  get customHeaders() {
    return this._customHeaders;
  }

  /**
   * @param {!Object} value
   */
  set customHeaders(value) {
    this._customHeaders = value;
    await(this._page.setExtraHTTPHeaders(new Map(Object.entries(value))));
  }

  /**
   * @param {string} filePath
   */
  injectJs(filePath) {
    if (!fs.existsSync(filePath))
      filePath = path.resolve(this.libraryPath, filePath);
    if (!fs.existsSync(filePath))
      return false;
    await(this._page.injectFile(filePath));
    return true;
  }

  /**
   * @return {string}
   */
  get plainText() {
    return await(this._page.plainText());
  }

  /**
   * @return {string}
   */
  get title() {
    return await(this._page.title());
  }

  /**
   * @return {(function()|undefined)}
   */
  get onError() {
    return this._onError;
  }

  /**
   * @param {(function()|undefined)} handler
   */
  set onError(handler) {
    if (typeof handler !== 'function')
      handler = undefined;
    this._onError = handler;
  }

  /**
   * @return {(function()|undefined)}
   */
  get onConfirm() {
    return this._onConfirmCallback;
  }

  /**
   * @param {function()} handler
   */
  set onConfirm(handler) {
    if (typeof handler !== 'function')
      handler = undefined;
    this._onConfirmCallback = handler;
  }

  /**
   * @return {(function()|undefined)}
   */
  get onPrompt() {
    return this._onPromptCallback;
  }

  /**
   * @param {function()} handler
   */
  set onPrompt(handler) {
    if (typeof handler !== 'function')
      handler = undefined;
    this._onPromptCallback = handler;
  }

  /**
   * @return {(function()|undefined)}
   */
  get onAlert() {
    return this._onAlertCallback;
  }

  /**
   * @param {function()} handler
   */
  set onAlert(handler) {
    if (typeof handler !== 'function')
      handler = undefined;
    this._onAlertCallback = handler;
  }

  /**
   * @param {!Dialog} dialog
   */
  _onDialog(dialog) {
    if (dialog.type === 'alert' && this._onAlertCallback) {
      this._onAlertCallback.call(null, dialog.message());
      await(dialog.accept());
    } else if (dialog.type === 'confirm' && this._onConfirmCallback) {
      const result = this._onConfirmCallback.call(null, dialog.message());
      await(result ? dialog.accept() : dialog.dismiss());
    } else if (dialog.type === 'prompt' && this._onPromptCallback) {
      const result = this._onPromptCallback.call(null, dialog.message(), dialog.defaultValue());
      await(result ? dialog.accept(result) : dialog.dismiss());
    }
  }

  /**
   * @return {string}
   */
  get url() {
    return await(this._page.url());
  }

  /**
   * @param {string} html
   */
  set content(html) {
    await(this._page.setContent(html));
  }

  /**
   * @param {string} selector
   * @param {(string|!Array<string>)} files
   */
  uploadFile(selector, files) {
    if (typeof files === 'string')
      await(await(this._page.$(selector)).uploadFile(files));
    else
      await(await(this._page.$(selector)).uploadFile(...files));
  }

  /**
   * @param {string} eventType
   * @param {!Array<*>} args
   */
  sendEvent(eventType, ...args) {
    if (eventType.startsWith('key'))
      this._sendKeyboardEvent.apply(this, arguments);
    else
      this._sendMouseEvent.apply(this, arguments);
  }

  /**
   * @param {string} eventType
   * @param {string} keyOrKeys
   * @param {null} nop1
   * @param {null} nop2
   * @param {number} modifier
   */
  _sendKeyboardEvent(eventType, keyOrKeys, nop1, nop2, modifier) {
    switch (eventType) {
      case 'keyup':
        if (typeof keyOrKeys === 'number') {
          await(this._page.keyboard.up(String.fromCharCode(keyOrKeys)));
          break;
        }
        for (const key of keyOrKeys)
          await(this._page.keyboard.up(key));
        break;
      case 'keypress':
        if (modifier & 0x04000000)
          this._page.keyboard.down('Control');
        if (modifier & 0x02000000)
          this._page.keyboard.down('Shift');
        if (keyOrKeys instanceof Array) {
          this._page.keyboard.down(keyOrKeys[0]);
          await(this._page.keyboard.up(keyOrKeys[0]));
        } else if (typeof keyOrKeys === 'number') {
          await(this._page.type(String.fromCharCode(keyOrKeys)));
        } else {
          await(this._page.type(keyOrKeys));
        }
        if (modifier & 0x02000000)
          this._page.keyboard.up('Shift');
        if (modifier & 0x04000000)
          this._page.keyboard.up('Control');
        break;
      case 'keydown':
        if (typeof keyOrKeys === 'number') {
          await(this._page.keyboard.down(String.fromCharCode(keyOrKeys)));
          break;
        }
        for (const key of keyOrKeys)
          await(this._page.keyboard.down(key));
        break;
    }
  }

  /**
   * @param {string} eventType
   * @param {number} x
   * @param {number} y
   * @param {string|undefined} button
   * @param {number|undefined} modifier
   */
  _sendMouseEvent(eventType, x, y, button, modifier) {
    if (modifier)
      await(this._page.keyboard.down(modifier));
    switch (eventType) {
      case 'mousemove':
        await(this._page.mouse.move(x, y));
        break;
      case 'mousedown':
        await(this._page.mouse.move(x, y));
        await(this._page.mouse.down({button}));
        break;
      case 'mouseup':
        await(this._page.mouse.move(x, y));
        await(this._page.mouse.up({button}));
        break;
      case 'doubleclick':
        await(this._page.mouse.click(x, y, {button}));
        await(this._page.mouse.click(x, y, {button, clickCount: 2}));
        break;
      case 'click':
        await(this._page.mouse.click(x, y, {button}));
        break;
      case 'contextmenu':
        await(this._page.mouse.click(x, y, {button: 'right'}));
        break;
    }
    if (modifier)
      await(this._page.keyboard.up(modifier));
  }
  /**
   * @param {string} html
   * @param {function()=} callback
   */
  open(url, callback) {
    console.assert(arguments.length <= 2, 'WebPage.open does not support METHOD and DATA arguments');
    this._deferEvaluate = true;
    if (typeof this._onInitialized === 'function')
      this._onInitialized();
    this._deferEvaluate = false;
    this.loading = true;
    this.loadingProgress = 50;

    const handleNavigation = (error, response) => {
      this.loadingProgress = 100;
      this.loading = false;
      if (error) {
        this.onResourceError.call(null, {
          url,
          errorString: 'SSL handshake failed'
        });
      }
      const status = error ? 'fail' : 'success';
      if (this.onLoadFinished)
        this.onLoadFinished.call(null, status);
      if (callback)
        callback.call(null, status);
      this.loadingProgress = 0;
    };
    this._page.goto(url).then(response => handleNavigation(null, response))
        .catch(e => handleNavigation(e, null));
  }

  /**
   * @param {!{width: number, height: number}} options
   */
  set viewportSize(options) {
    await(this._page.setViewport(options));
  }

  /**
   * @param {function()|string} fun
   * @param {!Array<!Object>} args
   */
  evaluate(fun, ...args) {
    if (typeof fun === 'string')
      fun = `(${fun})()`;
    if (this._deferEvaluate)
      return await(this._page.evaluateOnNewDocument(fun, ...args));
    return await(this._currentFrame.evaluate(fun, ...args));
  }

  /**
   * {string} fileName
   */
  render(fileName) {
    if (fileName.endsWith('pdf')) {
      const options = {};
      const paperSize = this.paperSize || {};
      options.margin = paperSize.margin;
      options.format = paperSize.format;
      options.landscape = paperSize.orientation === 'landscape';
      options.width = paperSize.width;
      options.height = paperSize.height;
      options.path = fileName;
      await(this._page.pdf(options));
    } else {
      const options = {};
      if (this.clipRect && (this.clipRect.left || this.clipRect.top || this.clipRect.width || this.clipRect.height)) {
        options.clip = {
          x: this.clipRect.left,
          y: this.clipRect.top,
          width: this.clipRect.width,
          height: this.clipRect.height
        };
      }
      options.path = fileName;
      await(this._page.screenshot(options));
    }
  }

  release() {
    this._page.close();
  }

  close() {
    this._page.close();
  }
}

class WebPageSettings {
  /**
   * @param {!Page} page
   */
  constructor(page) {
    this._page = page;
  }

  /**
   * @param {string} value
   */
  set userAgent(value) {
    await(this._page.setUserAgent(value));
  }

  /**
   * @return {string}
   */
  get userAgent() {
    return await(this._page.evaluate(() => window.navigator.userAgent));
  }
}

class PhantomRequest {
  constructor() {
    this._url = undefined;
    this._headers = undefined;
  }

  /**
   * @param {string} key
   * @param {string} value
   */
  setHeader(key, value) {
    if (!this._headers)
      this._headers = new Map();
    this._headers.set(key, value);
  }

  abort() {
    this._aborted = true;
  }

  /**
   * @param {string} url
   */
  changeUrl(newUrl) {
    this._url = newUrl;
  }
}

class PhantomResponse {
  /**
   * @param {!Response} response
   * @param {boolean} isResponseFinished
   */
  constructor(response, isResponseFinished) {
    this.url = response.url;
    this.status = response.status;
    this.statusText = response.statusText;
    this.stage = isResponseFinished ? 'end' : 'start';
    this.headers = [];
    for (const entry of response.headers.entries()) {
      this.headers.push({
        name: entry[0],
        value: entry[1]
      });
    }
  }
}

class RequestData {
  /**
   * @param {!InterceptedRequest} request
   */
  constructor(request) {
    this.url = request.url,
    this.headers = {};
    for (const entry of request.headers.entries())
      this.headers[entry[0]] = entry[1];
  }
}

// To prevent reenterability, eventemitters should emit events
// only being in a consistent state.
// This is not the case for 'ws' npm module: https://goo.gl/sy3dJY
//
// Since out phantomjs environment uses nested event loops, we
// exploit this condition in 'ws', which probably never happens
// in case of regular I/O.
//
// This class is a wrapper around EventEmitter which re-emits events asynchronously,
// helping to overcome the issue.
class AsyncEmitter extends EventEmitter {
  /**
   * @param {!Page} page
   */
  constructor(page) {
    super();
    this._page = page;
    this._symbol = Symbol('AsyncEmitter');
    this.on('newListener', this._onListenerAdded);
    this.on('removeListener', this._onListenerRemoved);
  }

  _onListenerAdded(event, listener) {
    // Async listener calls original listener on next tick.
    const asyncListener = (...args) => {
      process.nextTick(() => listener.apply(null, args));
    };
    listener[this._symbol] = asyncListener;
    this._page.on(event, asyncListener);
  }

  _onListenerRemoved(event, listener) {
    this._page.removeListener(event, listener[this._symbol]);
  }
}

module.exports = WebPage;
