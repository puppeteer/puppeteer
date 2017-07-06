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
let mime = require('mime');
let NetworkManager = require('./NetworkManager');
let Navigator = require('./Navigator');
let Dialog = require('./Dialog');
let FrameManager = require('./FrameManager');
let helper = require('./helper');

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
    let screenDPIExpression = helper.evaluationString(() => window.devicePixelRatio);
    let {result:{value: screenDPI}} = await client.send('Runtime.evaluate', { expression: screenDPIExpression, returnByValue: true });
    let userAgentExpression = helper.evaluationString(() => window.navigator.userAgent);
    let {result:{value: userAgent}} = await client.send('Runtime.evaluate', { expression: userAgentExpression, returnByValue: true });
    let frameManager = await FrameManager.create(client);
    let networkManager = new NetworkManager(client, userAgent);
    let page = new Page(client, frameManager, networkManager, screenDPI);
    // Initialize default page size.
    await page.setViewportSize({width: 400, height: 300});
    return page;
  }

  /**
   * @param {!Connection} client
   * @param {!FrameManager} frameManager
   * @param {!NetworkManager} networkManager
   * @param {number} screenDPI
   */
  constructor(client, frameManager, networkManager, screenDPI) {
    super();
    this._client = client;
    this._frameManager = frameManager;
    this._networkManager = networkManager;
    this._screenDPI = screenDPI;
    /** @type {!Map<string, function>} */
    this._inPageCallbacks = new Map();
    /** @type {?Promise<number>} */
    this._rootNodeIdPromise = null;

    this._screenshotTaskChain = Promise.resolve();

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
    client.on('DOM.documentUpdated', event => this._rootNodeIdPromise = null);
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
   * @param {?function(!InterceptedRequest)} interceptor
   */
  async setRequestInterceptor(interceptor) {
    return this._networkManager.setRequestInterceptor(interceptor);
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
   * @param {string} filePath
   * @return {!Promise}
   */
  async injectFile(filePath) {
    let callback;
    let promise = new Promise(fulfill => callback = fulfill);
    let expression = fs.readFile(filePath, 'utf8', (err, data) => callback({err, data}));
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

    let expression = helper.evaluationString(inPageCallback, name);
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
  async setHTTPHeaders(headers) {
    return this._networkManager.setHTTPHeaders(headers);
  }

  /**
   * @return {!Object}
   */
  httpHeaders() {
    return this._networkManager.httpHeaders();
  }

  /**
   * @param {string} userAgent
   * @return {!Promise}
   */
  async setUserAgent(userAgent) {
    return this._networkManager.setUserAgent(userAgent);
  }

  /**
   * @return {string}
   */
  userAgent() {
    return this._networkManager.userAgent();
  }

  /**
   * @param {!Object} exceptionDetails
   */
  async _handleException(exceptionDetails) {
    let message = await helper.getExceptionMessage(this._client, exceptionDetails);
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
    let values = event.args.map(arg => arg.value || arg.description || '');
    this.emit(Page.Events.ConsoleMessage, values.join(' '));
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
    this.evaluate(html => {
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
    return new Navigator(this._client, options).navigate(url, this._networkManager.httpHeaders().referer);
  }

  /**
   * @param {!{width: number, height: number}} size
   * @return {!Promise}
   */
  async setViewportSize(size) {
    this._viewportSize = size;
    let width = size.width;
    let height = size.height;
    let zoom = this._screenDPI;
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
    return this._frameManager.mainFrame().evaluate(fun, ...args);
  }

  /**
   * @param {function()} fun
   * @param {!Array<*>} args
   * @return {!Promise}
   */
  async evaluateOnInitialized(fun, ...args) {
    let scriptSource = helper.evaluationString(fun, ...args);
    await this._client.send('Page.addScriptToEvaluateOnLoad', { scriptSource });
  }

  /**
   * @param {!Object=} options
   * @return {!Promise<!Buffer>}
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
      let response = await this._client.send('Page.getLayoutMetrics');
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
    let result = await this._client.send('Page.captureScreenshot', {
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
    let buffer = new Buffer(result.data, 'base64');
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

    let scale = options.scale || 1;
    let displayHeaderFooter = options.displayHeaderFooter || false;
    let printBackground = options.printBackground || true;
    let landscape = options.landscape || false;
    let pageRanges = options.pageRanges || '';

    let paperWidth = 8.5;
    let paperHeight = 11;
    if (options.format) {
      let format = Page.PaperFormats[options.format];
      console.assert(format, 'Unknown paper format: ' + options.format);
      paperWidth = format.width;
      paperHeight = format.height;
    } else {
      paperWidth = convertPrintParameterToInches(options.width) || paperWidth;
      paperHeight = convertPrintParameterToInches(options.height) || paperHeight;
    }

    let marginOptions = options.margin || {};
    let marginTop = convertPrintParameterToInches(marginOptions.top) || 0;
    let marginLeft = convertPrintParameterToInches(marginOptions.left) || 0;
    let marginBottom = convertPrintParameterToInches(marginOptions.bottom) || 0;
    let marginRight = convertPrintParameterToInches(marginOptions.right) || 0;

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

  /**
   * @return {!Promise<number>}
   */
  _rootNodeId() {
    if (!this._rootNodeIdPromise) {
      this._rootNodeIdPromise = this._client.send('DOM.getDocument', {
        depth: 0
      }).then(obj => obj.root.nodeId);
    }
    return this._rootNodeIdPromise;
  }

  /**
   * @param {string} selector
   * @param {!Promise<number>}
   */
  async _querySelector(selector) {
    return (await this._client.send('DOM.querySelector', {
      nodeId: await this._rootNodeId(),
      selector
    })).nodeId;
  }

  /**
   * @param {string} selector
   * @param {!Promise}
   */
  async click(selector) {
    let boxModel = (await this._client.send('DOM.getBoxModel', {
      nodeId: await this._querySelector(selector)
    })).model.content;
    let x = Math.round((boxModel[0] + boxModel[4]) / (2 * this._screenDPI));
    let y = Math.round((boxModel[1] + boxModel[5]) / (2 * this._screenDPI));

    this._client.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x, y
    });
    this._client.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      button: 'left',
      x, y,
      clickCount: 1
    });
    await this._client.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      button: 'left',
      x, y,
      clickCount: 1
    });
  }

  /**
   * @param {string} selector
   * @param {!Promise}
   */
  async focus(selector) {
    await this._client.send('DOM.focus', {
      nodeId: await this._querySelector(selector)
    });
  }

  /**
   * @param {string} text
   * @param {!Promise}
   */
  async type(text) {
    for (let i = 0; i < text.length; i++) {
      let char = text.charAt(i);
      this._client.send('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key: char
      });
      this._client.send('Input.dispatchKeyEvent', {
        type: 'char',
        text: char,
        key: char,
        unmodifiedText: char
      });
      await this._client.send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key: char
      });
    }
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
  if (typeof parameter === 'undefined')
    return undefined;
  let pixels;
  if (typeof parameter === 'number') {
    // Treat numbers as pixel values to be aligned with phantom's paperSize.
    pixels = /** @type {number} */ (parameter);
  } else if (typeof parameter === 'string') {
    let text = parameter;
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
    throw new Error('printToPDF Cannot handle parameter type: ' + (typeof parameter));
  }
  return pixels / 96;
}

Page.Events = {
  ConsoleMessage: 'consolemessage',
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

module.exports = Page;
