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

var fs = require('fs');
var EventEmitter = require('events');
var mime = require('mime');
var Request = require('./Request');
var Navigator = require('./Navigator');
var Dialog = require('./Dialog');
var FrameManager = require('./FrameManager');

class Page extends EventEmitter {
  /**
     * @param {!Connection} client
     * @return {!Promise<!Page>}
     */
  static async create(client) {
    await Promise.all([
      client.send('Network.enable', {}),
      client.send('Page.enable', {}),
      client.send('Runtime.enable', {}),
      client.send('Security.enable', {}),
    ]);
    var expression = Page._evaluationString(() => window.devicePixelRatio);
    var {result:{value: screenDPI}} = await client.send('Runtime.evaluate', { expression, returnByValue: true });
    var frameManager = await FrameManager.create(client);
    var page = new Page(client, frameManager, screenDPI);
    // Initialize default page size.
    await page.setViewportSize({width: 400, height: 300});
    return page;
  }

  /**
     * @param {!Connection} client
     * @param {!FrameManager} frameManager
     * @param {number} screenDPI
     */
  constructor(client, frameManager, screenDPI) {
    super();
    this._client = client;
    this._frameManager = frameManager;
    this._screenDPI = screenDPI;
    this._extraHeaders = {};
    /** @type {!Map<string, function>} */
    this._inPageCallbacks = new Map();
    /** @type {?function(!Request)} */
    this._requestInterceptor = null;

    this._screenshotTaskChain = Promise.resolve();

    this._frameManager.on(FrameManager.Events.FrameAttached, event => this.emit(Page.Events.FrameAttached, event));
    this._frameManager.on(FrameManager.Events.FrameDetached, event => this.emit(Page.Events.FrameDetached, event));
    this._frameManager.on(FrameManager.Events.FrameNavigated, event => this.emit(Page.Events.FrameNavigated, event));

    client.on('Network.responseReceived', event => this.emit(Page.Events.ResponseReceived, event.response));
    client.on('Network.loadingFailed', event => this.emit(Page.Events.ResourceLoadingFailed, event));

    client.on('Network.requestIntercepted', event => this._onRequestIntercepted(event));
    client.on('Runtime.consoleAPICalled', event => this._onConsoleAPI(event));
    client.on('Page.javascriptDialogOpening', event => this._onDialog(event));
    client.on('Runtime.exceptionThrown', exception => this._handleException(exception.exceptionDetails));
  }

  /**
     * @return {!Frame}
     */
  mainFrame() {
    return this._frameManager.mainFrame();
  }

  /**
     * @return {!Array<!Frame>}
     */
  frames() {
    return this._frameManager.frames();
  }

  /**
     * @param {?function(!Request)} interceptor
     */
  async setRequestInterceptor(interceptor) {
    this._requestInterceptor = interceptor;
    await this._client.send('Network.enableRequestInterception', {enabled: !!interceptor});
  }

  /**
     * @param {!Object} event
     */
  _onRequestIntercepted(event) {
    var request = new Request(this._client, event.InterceptionId, event.request);
    this._requestInterceptor(request);
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
      var script = document.createElement('script');
      script.src = url;
      var promise = new Promise(x => script.onload = x);
      document.head.appendChild(script);
      return promise;
    }
  }

  /**
     * @param {string} filePath
     * @return {!Promise}
     */
  async injectFile(filePath) {
    var callback;
    var promise = new Promise(fulfill => callback = fulfill);
    var expression = fs.readFile(filePath, 'utf8', (err, data) => callback({err, data}));
    await promise;
    return this._client.send('Runtime.evaluate', { expression, returnByValue: true });
  }

  /**
     * @param {string} name
     * @param {function(?)} callback
     */
  async setInPageCallback(name, callback) {
    if (this._inPageCallbacks[name])
      throw new Error(`Failed to set in-page callback with name ${name}: window['${name}'] already exists!`);
    this._inPageCallbacks[name] = callback;

    var expression = Page._evaluationString(inPageCallback, name);
    await this._client.send('Page.addScriptToEvaluateOnLoad', { scriptSource: expression });
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
     * @param {!Object} headers
     * @return {!Promise}
     */
  async setExtraHTTPHeaders(headers) {
    this._extraHeaders = {};
    // Note: header names are case-insensitive.
    for (var key of Object.keys(headers))
      this._extraHeaders[key.toLowerCase()] = headers[key];
    return this._client.send('Network.setExtraHTTPHeaders', { headers });
  }

  /**
     * @return {!Object}
     */
  extraHTTPHeaders() {
    return Object.assign({}, this._extraHeaders);
  }

  /**
     * @param {string} userAgent
     * @return {!Promise}
     */
  async setUserAgentOverride(userAgent) {
    this._userAgent = userAgent;
    return this._client.send('Network.setUserAgentOverride', { userAgent });
  }

  /**
     * @return {string}
     */
  userAgentOverride() {
    return this._userAgent;
  }

  /**
     * @param {!Object} exceptionDetails
     */
  async _handleException(exceptionDetails) {
    var message = await this._getExceptionMessage(exceptionDetails);
    this.emit(Page.Events.Error, new Error(message));
  }

  async _onConsoleAPI(event) {
    if (event.type === 'debug' && event.args.length && event.args[0].value === 'driver:InPageCallback') {
      var {name, seq, args} = JSON.parse(event.args[1].value);
      var result = await this._inPageCallbacks[name](...args);
      var expression = Page._evaluationString(deliverResult, name, seq, result);
      this._client.send('Runtime.evaluate', { expression });

      function deliverResult(name, seq, result) {
        window[name]['callbacks'].get(seq)(result);
        window[name]['callbacks'].delete(seq);
      }
      return;
    }
    var values = event.args.map(arg => arg.value || arg.description || '');
    this.emit(Page.Events.ConsoleMessage, values.join(' '));
  }

  _onDialog(event) {
    var dialogType = null;
    if (event.type === 'alert')
      dialogType = Dialog.Type.Alert;
    else if (event.type === 'confirm')
      dialogType = Dialog.Type.Confirm;
    else if (event.type === 'prompt')
      dialogType = Dialog.Type.Prompt;
    else if (event.type === 'beforeunload')
      dialogType = Dialog.Type.BeforeUnload;
    console.assert(dialogType, 'Unknown javascript dialog type: ' + event.type);
    var dialog = new Dialog(this._client, dialogType, event.message);
    this.emit(Page.Events.Dialog, dialog);
  }

  /**
     * @return {!Promise<string>}
     */
  async url() {
    return this.evaluate(() => window.location.href);
  }

  /**
     * @param {string} html
     * @return {!Promise}
     */
  async setContent(html) {
    this.evaluate(() => {
      document.open();
      document.write(html);
      document.close();
    }, html);
  }

  /**
     * @param {string} html
     * @param {!Object=} options
     * @return {!Promise<boolean>}
     */
  navigate(url, options) {
    return new Navigator(this._client, options).navigate(url, this._extraHeaders.referer);
  }

  /**
     * @param {!{width: number, height: number}} size
     * @return {!Promise}
     */
  async setViewportSize(size) {
    this._viewportSize = size;
    var width = size.width;
    var height = size.height;
    var zoom = this._screenDPI;
    return Promise.all([
      this._client.send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        scale: 1 / zoom,
        mobile: false,
        fitWindow: false
      }),
      this._client.send('Emulation.setVisibleSize', {
        width: width / zoom,
        height: height / zoom,
      })
    ]);
  }

  /**
     * @return {!{width: number, height: number}}
     */
  viewportSize() {
    return this._viewportSize;
  }

  /**
     * @param {function()} fun
     * @param {!Array<*>} args
     * @return {!Promise<(!Object|undefined)>}
     */
  async evaluate(fun, ...args) {
    var syncExpression = Page._evaluationString(fun, ...args);
    var expression = `Promise.resolve(${syncExpression})`;
    var { exceptionDetails, result: remoteObject }  = await this._client.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (exceptionDetails) {
      var message = await this._getExceptionMessage(exceptionDetails);
      throw new Error('Evaluation failed: ' + message);
    }
    return remoteObject.value;
  }

  /**
     * @param {!Object} exceptionDetails
     * @return {string}
     */
  async _getExceptionMessage(exceptionDetails) {
    var message = '';
    var exception = exceptionDetails.exception;
    if (exception) {
      var response = await this._client.send('Runtime.callFunctionOn', {
        objectId: exception.objectId,
        functionDeclaration: 'function() { return this.message; }',
        returnByValue: true,
      });
      message = response.result.value;
    } else {
      message = exceptionDetails.text;
    }

    if (exceptionDetails.stackTrace) {
      for (var callframe of exceptionDetails.stackTrace.callFrames) {
        var location = callframe.url + ':' + callframe.lineNumber + ':' + callframe.columnNumber;
        var functionName = callframe.functionName || '<anonymous>';
        message += `\n    at ${functionName} (${location})`;
      }
    }
    return message;
  }

  /**
     * @param {function()} fun
     * @param {!Array<*>} args
     * @return {!Promise}
     */
  async evaluateOnInitialized(fun, ...args) {
    var scriptSource = Page._evaluationString(fun, ...args);
    await this._client.send('Page.addScriptToEvaluateOnLoad', { scriptSource });
  }

  /**
     * @param {function()} fun
     * @param {!Array<*>} args
     * @return {string}
     */
  static _evaluationString(fun, ...args) {
    return `(${fun})(${args.map(x => JSON.stringify(x)).join(',')})`;
  }

  /**
     * @param {!Object=} options
     * @return {!Promise<!Buffer>}
     */
  async screenshot(options) {
    options = options || {};
    var screenshotType = null;
    if (options.path) {
      var mimeType = mime.lookup(options.path);
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
    this._screenshotTaskChain = this._screenshotTaskChain.then(this._screenshotTask.bind(this, screenshotType, options));
    return this._screenshotTaskChain;
  }

  /**
     * @param {string} screenshotType
     * @param {!Object=} options
     * @return {!Promise<!Buffer>}
     */
  async _screenshotTask(screenshotType, options) {
    if (options.clip) {
      await Promise.all([
        this._client.send('Emulation.setVisibleSize', {
          width: Math.ceil(options.clip.width / this._screenDPI),
          height: Math.ceil(options.clip.height / this._screenDPI),
        }),
        this._client.send('Emulation.forceViewport', {
          x: options.clip.x / this._screenDPI,
          y: options.clip.y / this._screenDPI,
          scale: 1,
        })
      ]);
    } else if (options.fullPage) {
      var response = await this._client.send('Page.getLayoutMetrics');
      await Promise.all([
        this._client.send('Emulation.setVisibleSize', {
          width: Math.ceil(response.contentSize.width / this._screenDPI),
          height: Math.ceil(response.contentSize.height / this._screenDPI),
        }),
        this._client.send('Emulation.forceViewport', {
          x: 0,
          y: 0,
          scale: 1,
        })
      ]);
    }
    var result = await this._client.send('Page.captureScreenshot', {
      fromSurface: true,
      format: screenshotType,
      quality: options.quality
    });
    if (options.clip || options.fullPage) {
      await Promise.all([
        this.setViewportSize(this.viewportSize()),
        this._client.send('Emulation.resetViewport')
      ]);
    }
    var buffer = new Buffer(result.data, 'base64');
    if (options.path)
      fs.writeFileSync(options.path, buffer);
    return buffer;
  }

  /**
     * @param {string} filePath
     * @param {!Object=} options
     * @return {!Promise}
     */
  async printToPDF(filePath, options) {
    options = options || {};

    var scale = options.scale || 1;
    var displayHeaderFooter = options.displayHeaderFooter || false;
    var printBackground = options.printBackground || true;
    var landscape = options.landscape || false;
    var pageRanges = options.pageRanges || '';

    var paperWidth = 8.5;
    var paperHeight = 11;
    if (options.format) {
      var format = Page.PaperFormats[options.format];
      console.assert(format, 'Unknown paper format: ' + options.format);
      paperWidth = format.width;
      paperHeight = format.height;
    } else {
      paperWidth = convertPrintParameterToInches(options.width) || paperWidth;
      paperHeight = convertPrintParameterToInches(options.height) || paperHeight;
    }

    var marginOptions = options.margin || {};
    var marginTop = convertPrintParameterToInches(marginOptions.top) || 0;
    var marginLeft = convertPrintParameterToInches(marginOptions.left) || 0;
    var marginBottom = convertPrintParameterToInches(marginOptions.bottom) || 0;
    var marginRight = convertPrintParameterToInches(marginOptions.right) || 0;

    var result = await this._client.send('Page.printToPDF', {
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
    var buffer = new Buffer(result.data, 'base64');
    fs.writeFileSync(filePath, buffer);
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
    return this.evaluate(() =>  document.title);
  }

  /**
     * @return {!Promise}
     */
  async close() {
    await this._client.dispose();
  }
}

/** @enum {string} */
Page.PaperFormats = {
  Letter: {width: 8.5, height: 11},
  Legal: {width: 8.5, height: 14},
  Tabloid: {width: 11, height: 17},
  Ledger: {width: 17, height: 11},
  A0: {width: 33.1, height: 46.8 },
  A1: {width: 23.4, height: 33.1 },
  A2: {width: 16.5, height: 23.4 },
  A3: {width: 11.7, height: 16.5 },
  A4: {width: 8.27, height: 11.7 },
  A5: {width: 5.83, height: 8.27 },
};

var unitToPixels = {
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
  if (typeof parameter === 'undefined')
    return undefined;
  var pixels;
  if (typeof parameter === 'number') {
    // Treat numbers as pixel values to be aligned with phantom's paperSize.
    pixels = /** @type {number} */ (parameter);
  } else if (typeof parameter === 'string') {
    var text = parameter;
    var unit = text.substring(text.length - 2).toLowerCase();
    var valueText = '';
    if (unitToPixels.hasOwnProperty(unit)) {
      valueText = text.substring(0, text.length - 2);
    } else {
      // In case of unknown unit try to parse the whole parameter as number of pixels.
      // This is consistent with phantom's paperSize behavior.
      unit = 'px';
      valueText = text;
    }
    var value = Number(valueText);
    console.assert(!isNaN(value), 'Failed to parse parameter value: ' + text);
    pixels = value * unitToPixels[unit];
  } else {
    throw new Error('printToPDF Cannot handle parameter type: ' + (typeof parameter));
  }
  return pixels / 96;
}

Page.Events = {
  ConsoleMessage: 'consolemessage',
  Dialog: 'dialog',
  Error: 'error',
  ResourceLoadingFailed: 'resourceloadingfailed',
  ResponseReceived: 'responsereceived',
  FrameAttached: 'frameattached',
  FrameDetached: 'framedetached',
  FrameNavigated: 'framenavigated',
};

module.exports = Page;
