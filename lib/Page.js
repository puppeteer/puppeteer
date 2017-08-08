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
const mime = require('mime');
const {NetworkManager} = require('./NetworkManager');
const NavigatorWatcher = require('./NavigatorWatcher');
const Dialog = require('./Dialog');
const EmulationManager = require('./EmulationManager');
const {FrameManager} = require('./FrameManager');
const {Keyboard, Mouse} = require('./Input');
const Tracing = require('./Tracing');
const helper = require('./helper');

class Page extends EventEmitter {
  /**
   * @param {Puppeteer.Connection} client
   * @param {boolean} ignoreHTTPSErrors
   * @param {Puppeteer.TaskQueue} screenshotTaskQueue
   * @return {!Promise<Page>}
   */
  static async create(client, ignoreHTTPSErrors, screenshotTaskQueue) {
    await Promise.all([
      client.send('Network.enable', {}),
      client.send('Page.enable', {}),
      client.send('Runtime.enable', {}),
      client.send('Security.enable', {}),
    ]);
    if (ignoreHTTPSErrors)
      await client.send('Security.setOverrideCertificateErrors', {override: true});
    const page = new Page(client, ignoreHTTPSErrors, screenshotTaskQueue);
    await page.navigate('about:blank');
    // Initialize default page size.
    await page.setViewport({width: 800, height: 600});
    return page;
  }

  /**
   * @param {Puppeteer.Connection} client
   * @param {boolean} ignoreHTTPSErrors
   * @param {Puppeteer.TaskQueue} screenshotTaskQueue
   */
  constructor(client, ignoreHTTPSErrors, screenshotTaskQueue) {
    super();
    this._client = client;
    this._keyboard = new Keyboard(client);
    this._mouse = new Mouse(client, this._keyboard);
    this._frameManager = new FrameManager(client, this._mouse);
    this._networkManager = new NetworkManager(client);
    this._emulationManager = new EmulationManager(client);
    this._tracing = new Tracing(client);
    /** @type {!Map<string, Function>} */
    this._inPageCallbacks = new Map();
    this._ignoreHTTPSErrors = ignoreHTTPSErrors;

    this._screenshotTaskQueue = screenshotTaskQueue;

    this._frameManager.on(FrameManager.Events.FrameAttached, event => this.emit(Page.Events.FrameAttached, event));
    this._frameManager.on(FrameManager.Events.FrameDetached, event => this.emit(Page.Events.FrameDetached, event));
    this._frameManager.on(FrameManager.Events.FrameNavigated, event => this.emit(Page.Events.FrameNavigated, event));

    this._networkManager.on(NetworkManager.Events.Request, event => this.emit(Page.Events.Request, event));
    this._networkManager.on(NetworkManager.Events.Response, event => this.emit(Page.Events.Response, event));
    this._networkManager.on(NetworkManager.Events.RequestFailed, event => this.emit(Page.Events.RequestFailed, event));
    this._networkManager.on(NetworkManager.Events.RequestFinished, event => this.emit(Page.Events.RequestFinished, event));

    client.on('Page.loadEventFired', event => this.emit(Page.Events.Load));

    client.on('Runtime.consoleAPICalled', event => this._onConsoleAPI(event));
    client.on('Page.javascriptDialogOpening', event => this._onDialog(event));
    client.on('Runtime.exceptionThrown', exception => this._handleException(exception.exceptionDetails));
    client.on('Security.certificateError', event => this._onCertificateError(event));
  }

  /**
   * @return {Puppeteer.Frame}
   */
  mainFrame() {
    return this._frameManager.mainFrame();
  }

  /**
   * @return {!Keyboard}
   */
  get keyboard() {
    return this._keyboard;
  }

  /**
   * @return {!Tracing}
   */
  get tracing() {
    return this._tracing;
  }

  /**
   * @return {!Array<Puppeteer.Frame>}
   */
  frames() {
    return this._frameManager.frames();
  }

  /**
   * @param {?function(Puppeteer.InterceptedRequest)} interceptor
   */
  async setRequestInterceptor(interceptor) {
    return this._networkManager.setRequestInterceptor(interceptor);
  }

  /**
   * @param {!Object} event
   */
  _onCertificateError(event) {
    if (!this._ignoreHTTPSErrors)
      return;
    this._client.send('Security.handleCertificateError', {
      eventId: event.eventId,
      action: 'continue'
    });
  }

  /**
   * @param {string} url
   * @return {!Promise}
   */
  async addScriptTag(url) {
    return this.mainFrame().addScriptTag(url);
  }

  /**
   * @param {string} filePath
   * @return {!Promise}
   */
  async injectFile(filePath) {
    return this.mainFrame().injectFile(filePath);
  }

  /**
   * @param {string} name
   * @param {Function} callback
   */
  async setInPageCallback(name, callback) {
    if (this._inPageCallbacks[name])
      throw new Error(`Failed to set in-page callback with name ${name}: window['${name}'] already exists!`);
    this._inPageCallbacks[name] = callback;

    let expression = helper.evaluationString(inPageCallback, name);
    await this._client.send('Page.addScriptToEvaluateOnNewDocument', { source: expression });
    await this._client.send('Runtime.evaluate', { expression, returnByValue: true });

    function inPageCallback(callbackName) {
      window[callbackName] = async(...args) => {
        const me = window[callbackName];
        let callbacks = me['callbacks'];
        if (!callbacks) {
          callbacks = new Map();
          me['callbacks'] = callbacks;
        }
        const seq = (me['lastSeq'] || 0) + 1;
        me['lastSeq'] = seq;
        const promise = new Promise(fulfill => callbacks.set(seq, fulfill));
        // eslint-disable-next-line no-console
        console.debug('driver:InPageCallback', JSON.stringify({name: callbackName, seq, args}));
        return promise;
      };
    }
  }

  /**
   * @param {!Map<string, string>} headers
   * @return {!Promise}
   */
  async setExtraHTTPHeaders(headers) {
    return this._networkManager.setExtraHTTPHeaders(headers);
  }

  /**
   * @param {string} userAgent
   * @return {!Promise}
   */
  async setUserAgent(userAgent) {
    return this._networkManager.setUserAgent(userAgent);
  }

  /**
   * @param {!Object} exceptionDetails
   */
  _handleException(exceptionDetails) {
    let message = helper.getExceptionMessage(exceptionDetails);
    this.emit(Page.Events.PageError, new Error(message));
  }

  async _onConsoleAPI(event) {
    if (event.type === 'debug' && event.args.length && event.args[0].value === 'driver:InPageCallback') {
      let {name, seq, args} = JSON.parse(event.args[1].value);
      let result = await this._inPageCallbacks[name](...args);
      let expression = helper.evaluationString(deliverResult, name, seq, result);
      this._client.send('Runtime.evaluate', { expression });

      function deliverResult(name, seq, result) {
        window[name]['callbacks'].get(seq)(result);
        window[name]['callbacks'].delete(seq);
      }
      return;
    }
    if (!this.listenerCount(Page.Events.Console)) {
      event.args.map(arg => helper.releaseObject(this._client, arg));
      return;
    }
    let values = await Promise.all(event.args.map(arg => helper.serializeRemoteObject(this._client, arg)));
    this.emit(Page.Events.Console, ...values);
  }

  _onDialog(event) {
    let dialogType = null;
    if (event.type === 'alert')
      dialogType = Dialog.Type.Alert;
    else if (event.type === 'confirm')
      dialogType = Dialog.Type.Confirm;
    else if (event.type === 'prompt')
      dialogType = Dialog.Type.Prompt;
    else if (event.type === 'beforeunload')
      dialogType = Dialog.Type.BeforeUnload;
    console.assert(dialogType, 'Unknown javascript dialog type: ' + event.type);
    let dialog = new Dialog(this._client, dialogType, event.message);
    this.emit(Page.Events.Dialog, dialog);
  }

  /**
   * @return {!string}
   */
  url() {
    return this.mainFrame().url();
  }

  /**
   * @param {string} html
   * @return {!Promise}
   */
  async setContent(html) {
    await this.evaluate(html => {
      document.open();
      document.write(html);
      document.close();
    }, html);
  }

  /**
   * @param {string} html
   * @param {Object=} options
   * @return {Promise<Response|null>}
   */
  async navigate(url, options) {
    const watcher = new NavigatorWatcher(this._client, this._ignoreHTTPSErrors, options);
    const responses = new Map();
    const listener = helper.addEventListener(this._networkManager, NetworkManager.Events.Response, response => responses.set(response.url, response));
    const result = watcher.waitForNavigation();

    const referrer = this._networkManager.extraHTTPHeaders().get('referer');
    try {
      // Await for the command to throw exception in case of illegal arguments.
      await this._client.send('Page.navigate', {url, referrer});
    } catch (e) {
      watcher.cancel();
      throw e;
    }
    await result;
    helper.removeEventListeners([listener]);
    if (url === 'about:blank')
      return null;
    let response = responses.get(this.mainFrame().url());
    if (!response)
      throw new Error('Failed to navigate: ' + url);
    return response;
  }

  /**
   * @param {Object=} options
   * @return {!Promise<Response|null>}
   */
  async reload(options) {
    this._client.send('Page.reload');
    return this.waitForNavigation(options);
  }

  /**
   * @param {!Object=} options
   * @return {!Promise<Response>}
   */
  async waitForNavigation(options) {
    const watcher = new NavigatorWatcher(this._client, this._ignoreHTTPSErrors, options);

    const responses = new Map();
    const listener = helper.addEventListener(this._networkManager, NetworkManager.Events.Response, response => responses.set(response.url, response));
    await watcher.waitForNavigation();
    helper.removeEventListeners([listener]);

    return responses.get(this.mainFrame().url()) || null;
  }

  /**
   * @param {!Object=} options
   * @return {!Promise<Response|null>}
   */
  async goBack(options) {
    return this._go(-1, options);
  }

  /**
   * @param {!Object=} options
   * @return {!Promise<Response|null>}
   */
  async goForward(options) {
    return this._go(+1, options);
  }

  /**
   * @param {!Object=} options
   * @return {!Promise<Response|null>}
   */
  async _go(delta, options) {
    const history = await this._client.send('Page.getNavigationHistory');
    const entry = history.entries[history.currentIndex + delta];
    if (!entry)
      return null;
    const result = this.waitForNavigation(options);
    this._client.send('Page.navigateToHistoryEntry', {entryId: entry.id});
    return result;
  }

  /**
   * @param {!Page.Viewport} viewport
   * @return {!Promise}
   */
  async setViewport(viewport) {
    const needsReload = await this._emulationManager.emulateViewport(this._client, viewport);
    this._viewport = viewport;
    if (needsReload)
      await this.reload();
  }

  /**
   * @return {!Page.Viewport}
   */
  viewport() {
    return this._viewport;
  }

  /**
   * @param {function()} pageFunction
   * @param {!Array<*>} args
   * @return {!Promise<(Object|undefined)>}
   */
  async evaluate(pageFunction, ...args) {
    return this._frameManager.mainFrame().evaluate(pageFunction, ...args);
  }

  /**
   * @param {function()|string} pageFunction
   * @param {!Array<*>} args
   * @return {!Promise}
   */
  async evaluateOnNewDocument(pageFunction, ...args) {
    let source = helper.evaluationString(pageFunction, ...args);
    await this._client.send('Page.addScriptToEvaluateOnNewDocument', { source });
  }

  /**
   * @param {!Object=} options
   * @return {!Promise<Buffer>}
   */
  async screenshot(options) {
    options = options || {};
    let screenshotType = null;
    if (options.path) {
      let mimeType = mime.lookup(options.path);
      if (mimeType === 'image/png')
        screenshotType = 'png';
      else if (mimeType === 'image/jpeg')
        screenshotType = 'jpeg';
      console.assert(screenshotType, 'Unsupported screenshot mime type: ' + mimeType);
    }
    if (options.type) {
      console.assert(!screenshotType || options.type === screenshotType, `Passed screenshot type '${options.type}' does not match the type inferred from the file path: '${screenshotType}'`);
      console.assert(options.type === 'png' || options.type === 'jpeg', 'Unknown options.type value: ' + options.type);
      screenshotType = options.type;
    }
    if (!screenshotType)
      screenshotType = 'png';

    if (options.quality) {
      console.assert(screenshotType === 'jpeg', 'options.quality is unsupported for the ' + screenshotType + ' screenshots');
      console.assert(typeof options.quality === 'number', 'Expected options.quality to be a number but found ' + (typeof options.quality));
      console.assert(Number.isInteger(options.quality), 'Expected options.quality to be an integer');
      console.assert(options.quality >= 0 && options.quality <= 100, 'Expected options.quality to be between 0 and 100 (inclusive), got ' + options.quality);
    }
    console.assert(!options.clip || !options.fullPage, 'options.clip and options.fullPage are exclusive');
    if (options.clip) {
      console.assert(typeof options.clip.x === 'number', 'Expected options.clip.x to be a number but found ' + (typeof options.clip.x));
      console.assert(typeof options.clip.y === 'number', 'Expected options.clip.y to be a number but found ' + (typeof options.clip.y));
      console.assert(typeof options.clip.width === 'number', 'Expected options.clip.width to be a number but found ' + (typeof options.clip.width));
      console.assert(typeof options.clip.height === 'number', 'Expected options.clip.height to be a number but found ' + (typeof options.clip.height));
    }
    return this._screenshotTaskQueue.postTask(this._screenshotTask.bind(this, screenshotType, options));
  }

  /**
   * @param {string} format
   * @param {!Object=} options
   * @return {!Promise<Buffer>}
   */
  async _screenshotTask(format, options) {
    await this._client.send('Target.activateTarget', {targetId: this._client.targetId()});
    let clip = options.clip ? Object.assign({}, options['clip']) : undefined;
    if (clip)
      clip.scale = 1;

    if (options.fullPage) {
      const metrics = await this._client.send('Page.getLayoutMetrics');
      const width = Math.ceil(metrics.contentSize.width);
      const height = Math.ceil(metrics.contentSize.height);
      // Overwrite clip for full page at all times.
      clip = { x: 0, y: 0, width, height, scale: 1 };
      const mobile = this._viewport.isMobile || false;
      const deviceScaleFactor = this._viewport.deviceScaleFactor || 1;
      const landscape = this._viewport.isLandscape || false;
      const screenOrientation = landscape ? { angle: 90, type: 'landscapePrimary' } : { angle: 0, type: 'portraitPrimary' };
      await this._client.send('Emulation.setDeviceMetricsOverride', { mobile, width, height, deviceScaleFactor, screenOrientation });
    }

    let result = await this._client.send('Page.captureScreenshot', { format, quality: options.quality, clip });

    if (options.fullPage)
      await this.setViewport(this._viewport);

    let buffer = new Buffer(result.data, 'base64');
    if (options.path)
      fs.writeFileSync(options.path, buffer);
    return buffer;
  }

  /**
   * @param {string} filePath
   * @param {!Object=} options
   * @return {!Promise<Buffer>}
   */
  async pdf({
    scale = 1,
    displayHeaderFooter = false,
    printBackground = true,
    landscape = false,
    pageRanges = '',
    format = '',
    width = 0,
    height = 0,
    margin: {top = 0, left = 0, bottom = 0, right = 0} = {},
    path = ''
  } = {}) {
    let paperWidth = 8.5;
    let paperHeight = 11;
    if (format) {
      let dimensions = Page.PaperFormats[format.toLowerCase()];
      console.assert(dimensions, 'Unknown paper format: ' + format);
      paperWidth = dimensions.width;
      paperHeight = dimensions.height;
    } else {
      paperWidth = convertPrintParameterToInches(width) || paperWidth;
      paperHeight = convertPrintParameterToInches(height) || paperHeight;
    }

    let marginTop = convertPrintParameterToInches(top);
    let marginLeft = convertPrintParameterToInches(left);
    let marginBottom = convertPrintParameterToInches(bottom);
    let marginRight = convertPrintParameterToInches(right);

    let result = await this._client.send('Page.printToPDF', {
      landscape: landscape,
      displayHeaderFooter: displayHeaderFooter,
      printBackground: printBackground,
      scale: scale,
      paperWidth: paperWidth,
      paperHeight: paperHeight,
      marginTop: marginTop,
      marginBottom: marginBottom,
      marginLeft: marginLeft,
      marginRight: marginRight,
      pageRanges: pageRanges
    });
    let buffer = new Buffer(result.data, 'base64');
    if (path)
      fs.writeFileSync(path, buffer);
    return buffer;
  }

  /**
   * @return {!Promise<string>}
   */
  async plainText() {
    return this.evaluate(() =>  document.body.innerText);
  }

  /**
   * @return {!Promise<string>}
   */
  async title() {
    return this.mainFrame().title();
  }

  /**
   * @return {!Promise}
   */
  async close() {
    await this._client.dispose();
  }

  /**
   * @return {!Mouse}
   */
  get mouse() {
    return this._mouse;
  }

  /**
   * @param {string} selector
   * @param {{button: ("left"|"right"|"middle"|undefined), clickCount: (number|undefined), delay: (number|undefined)}=} options
   * @return {!Promise}
   */
  async click(selector, options) {
    await this.mainFrame().click(selector, options);
  }

  /**
   * @param {string} selector
   * @return {!Promise}
   */
  async hover(selector) {
    await this.mainFrame().hover(selector);
  }

  /**
   * @param {string} selector
   * @return {!Promise}
   */
  async focus(selector) {
    return this.mainFrame().focus(selector);
  }

  /**
   * @param {string} text
   * @param {{delay: (number|undefined)}=} options
   * @return {!Promise}
   */
  async type(text, options) {
    let delay = 0;
    if (options && options.delay)
      delay = options.delay;
    let last;
    for (let char of text) {
      last = this.press(char, {text: char, delay});
      if (delay)
        await new Promise(f => setTimeout(f, delay));
    }
    await last;
  }

  /**
   * @param {string} text
   * @param {{text: (string|undefined), delay: (number|undefined)}=} options
   * @return {!Promise}
   */
  async press(key, options) {
    this._keyboard.down(key, options);
    if (options && options.delay)
      await new Promise(f => setTimeout(f, options.delay));
    await this._keyboard.up(key);
  }

  /**
   * @param {(string|number|function())} selectorOrTimeout
   * @param {Object=} options
   * @return {!Promise}
   */
  waitFor(selectorOrFunctionOrTimeout, options = {}) {
    return this.mainFrame().waitFor(selectorOrFunctionOrTimeout, options);
  }

  /**
   * @param {string} selector
   * @param {Object=} options
   * @return {!Promise}
   */
  waitForSelector(selector, options = {}) {
    return this.mainFrame().waitForSelector(selector, options);
  }

  /**
   * @param {function()} pageFunction
   * @param {Object=} options
   * @param {!Array<*>} args
   * @return {!Promise}
   */
  waitForFunction(pageFunction, options = {}, ...args) {
    return this.mainFrame().waitForFunction(pageFunction, options, ...args);
  }

  /**
   * @param {string} selector
   * @param {!Array<string>} filePaths
   * @return {!Promise}
   */
  async uploadFile(selector, ...filePaths) {
    return this.mainFrame().uploadFile(selector, ...filePaths);
  }
}

/** @enum {string} */
Page.PaperFormats = {
  letter: {width: 8.5, height: 11},
  legal: {width: 8.5, height: 14},
  tabloid: {width: 11, height: 17},
  ledger: {width: 17, height: 11},
  a0: {width: 33.1, height: 46.8 },
  a1: {width: 23.4, height: 33.1 },
  a2: {width: 16.5, height: 23.4 },
  a3: {width: 11.7, height: 16.5 },
  a4: {width: 8.27, height: 11.7 },
  a5: {width: 5.83, height: 8.27 },
};

let unitToPixels = {
  'px': 1,
  'in': 96,
  'cm': 37.8,
  'mm': 3.78
};

/**
 * @param {(string|number|undefined)} parameter
 * @return {(number|undefined)}
 */
function convertPrintParameterToInches(parameter) {
  let pixels;
  if (helper.isNumber(parameter)) {
    // Treat numbers as pixel values to be aligned with phantom's paperSize.
    pixels = Number(parameter);
  } else if (helper.isString(parameter)) {
    let text = String(parameter);
    let unit = text.substring(text.length - 2).toLowerCase();
    let valueText = '';
    if (unitToPixels.hasOwnProperty(unit)) {
      valueText = text.substring(0, text.length - 2);
    } else {
      // In case of unknown unit try to parse the whole parameter as number of pixels.
      // This is consistent with phantom's paperSize behavior.
      unit = 'px';
      valueText = text;
    }
    let value = Number(valueText);
    console.assert(!isNaN(value), 'Failed to parse parameter value: ' + text);
    pixels = value * unitToPixels[unit];
  } else {
    throw new Error('page.pdf() Cannot handle parameter type: ' + (typeof parameter));
  }
  return pixels / 96;
}

Page.Events = {
  Console: 'console',
  Dialog: 'dialog',
  // Can'e use just 'error' due to node.js special treatment of error events.
  // @see https://nodejs.org/api/events.html#events_error_events
  PageError: 'pageerror',
  Request: 'request',
  Response: 'response',
  RequestFailed: 'requestfailed',
  RequestFinished: 'requestfinished',
  FrameAttached: 'frameattached',
  FrameDetached: 'framedetached',
  FrameNavigated: 'framenavigated',
  Load: 'load',
};

/**
 * @typedef {Object} Page.Viewport
 * @property {number} width
 * @property {number} height
 * @property {number=} deviceScaleFactor
 * @property {boolean=} isMobile
 * @property {boolean=} isLandscape
 * @property {boolean=} hasTouch
 */

module.exports = Page;
helper.tracePublicAPI(Page);
