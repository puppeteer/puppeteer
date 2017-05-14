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
var helpers = require('./helpers');
var mime = require('mime');

class Page extends EventEmitter {
    /**
     * @param {!Browser} browser
     * @param {!CDP} client
     * @return {!Promise<!Page>}
     */
    static async create(browser, client) {
        await Promise.all([
            client.send('Network.enable', {}),
            client.send('Page.enable', {}),
            client.send('Runtime.enable', {}),
            client.send('Security.enable', {}),
        ]);
        var screenDPI = await helpers.evaluate(client, () => window.devicePixelRatio, []);
        var page = new Page(browser, client, screenDPI.result.value);
        // Initialize default page size.
        await page.setSize({width: 400, height: 300});
        return page;
    }

    /**
     * @param {!Browser} browser
     * @param {!CDP} client
     * @param {number} screenDPI
     */
    constructor(browser, client, screenDPI) {
        super();
        this._browser = browser;
        this._client = client;
        this._screenDPI = screenDPI;
        this._extraHeaders = {};
        /** @type {!Map<string, !InPageCallback>} */
        this._sourceURLToPageCallback = new Map();
        /** @type {!Map<string, !InPageCallback>} */
        this._scriptIdToPageCallback = new Map();

        client.on('Debugger.paused', event => this._onDebuggerPaused(event));
        client.on('Debugger.scriptParsed', event => this._onScriptParsed(event));
        client.on('Network.responseReceived', event => this.emit(Page.Events.ResponseReceived, event.response));
        client.on('Network.loadingFailed', event => this.emit(Page.Events.ResourceLoadingFailed, event));
        client.on('Runtime.consoleAPICalled', event => this._onConsoleAPI(event));
        client.on('Page.javascriptDialogOpening', event => this._onDialog(event));
        client.on('Runtime.exceptionThrown', exception => this._handleException(exception.exceptionDetails));
    }

    /**
     * @param {string} url
     * @return {!Promise}
     */
    async addScriptTag(url) {
        return this.evaluateAsync(addScriptTag, url);

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
        var code = fs.readFileSync(filePath, 'utf8');
        await helpers.evaluateText(this._client, code, false /* awaitPromise */);
    }

    /**
     * @param {string} name
     * @param {function(?)} callback
     */
    async setInPageCallback(name, callback) {
        var hasCallback = await this.evaluate(function(name) {
            return !!window[name];
        }, name);
        if (hasCallback)
            throw new Error(`Failed to set in-page callback with name ${name}: window['${name}'] already exists!`);

        var sourceURL = '__in_page_callback__' + name;
        this._sourceURLToPageCallback.set(sourceURL, new InPageCallback(name, callback));
        var text = helpers.evaluationString(inPageCallback, [name], false /* awaitPromise */, sourceURL);
        await Promise.all([
            this._client.send('Debugger.enable', {}),
            this._client.send('Page.addScriptToEvaluateOnLoad', { scriptSource: text }),
            helpers.evaluateText(this._client, text, false /* awaitPromise */)
        ]);

        function inPageCallback(callbackName) {
            window[callbackName] = (...args) => {
                window[callbackName].__args = args;
                window[callbackName].__result = undefined;
                debugger;
                return window[callbackName].__result;
            };
        }
    }

    /**
     * @param {!InPageCallback} inPageCallback
     */
    async _handleInPageCallback(inPageCallback) {
        var name = inPageCallback.name;
        var callback = inPageCallback.callback;
        var args = await this.evaluate(callbackName => window[callbackName].__args, name);
        var result = callback.apply(null, args);
        await this.evaluate(assignResult, name, result);
        this._client.send('Debugger.resume');

        /**
         * @param {string} callbackName
         * @param {string} callbackResult
         */
        function assignResult(callbackName, callbackResult) {
            window[callbackName].__result = callbackResult;
        }
    }

    _onDebuggerPaused(event) {
        var location = event.callFrames[0] ? event.callFrames[0].location : null;
        var inPageCallback = location ? this._scriptIdToPageCallback.get(location.scriptId) : null;
        if (inPageCallback) {
            this._handleInPageCallback(inPageCallback);
            return;
        }
        this._client.send('Debugger.resume');
    }

    _onScriptParsed(event) {
        var inPageCallback = this._sourceURLToPageCallback.get(event.url);
        if (inPageCallback)
            this._scriptIdToPageCallback.set(event.scriptId, inPageCallback);
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

    _handleException(exceptionDetails) {
        var stack = [];
        if (exceptionDetails.stackTrace) {
            stack = exceptionDetails.stackTrace.callFrames.map(cf => cf.url);
        }
        var stackTrace = exceptionDetails.stackTrace;
        this.emit(Page.Events.Exception, exceptionDetails.exception.description, stack);
    }

    _onConsoleAPI(event) {
        var values = event.args.map(arg => arg.value || arg.description || '');
        this.emit(Page.Events.ConsoleMessage, values.join(' '));
    }

    _onDialog(event) {
        var eventType = null;
        if (event.type === 'alert')
            eventType = Page.Events.Alert;
        else if (event.type === 'confirm')
            eventType = Page.Events.Confirm;
        else if (event.type === 'prompt')
            eventType = Page.Events.Prompt;
        else if (event.type === 'beforeunload')
            eventType = Page.Events.BeforeUnload;
        if (eventType)
            this.emit(eventType, event.message);
    }

    /**
     * @param {boolean} accept
     * @param {string} promptText
     * @return {!Promise}
     */
    async handleDialog(accept, promptText) {
        return this._client.send('Page.handleJavaScriptDialog', {accept, promptText});
    }

    /**
     * @return {!Promise<string>}
     */
    async url() {
        return this.evaluate(function() {
            return window.location.href;
        });
    }

    /**
     * @param {string} html
     * @return {!Promise}
     */
    async setContent(html) {
        var resourceTree = await this._client.send('Page.getResourceTree', {});
        await this._client.send('Page.setDocumentContent', {
            frameId: resourceTree.frameTree.frame.id,
            html: html
        });
    }

    /**
     * @param {string} html
     * @return {!Promise<boolean>}
     */
    async navigate(url) {
        var loadPromise = new Promise(fulfill => this._client.once('Page.loadEventFired', fulfill)).then(() => true);
        var interstitialPromise = new Promise(fulfill => this._client.once('Security.certificateError', fulfill)).then(() => false);
        var referrer = this._extraHeaders.referer;
        // Await for the command to throw exception in case of illegal arguments.
        await this._client.send('Page.navigate', {url, referrer});
        return await Promise.race([loadPromise, interstitialPromise]);
    }

    /**
     * @param {!{width: number, height: number}} size
     * @return {!Promise}
     */
    async setSize(size) {
        this._size = size;
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
    size() {
        return this._size;
    }

    /**
     * @param {function()} fun
     * @param {!Array<*>} args
     * @return {!Promise<(!Object|udndefined)>}
     */
    async evaluate(fun, ...args) {
        var response = await helpers.evaluate(this._client, fun, args, false /* awaitPromise */);
        if (response.exceptionDetails) {
            this._handleException(response.exceptionDetails);
            return;
        }
        return response.result.value;
    }

    /**
     * @param {function()} fun
     * @param {!Array<*>} args
     * @return {!Promise<(!Object|udndefined)>}
     */
    async evaluateAsync(fun, ...args) {
        var response = await helpers.evaluate(this._client, fun, args, true /* awaitPromise */);
        if (response.exceptionDetails) {
            this._handleException(response.exceptionDetails);
            return;
        }
        return response.result.value;
    }

    /**
     * @param {function()} fun
     * @param {!Array<*>} args
     * @return {!Promise}
     */
    async evaluateOnInitialized(fun, ...args) {
        var code = helpers.evaluationString(fun, args, false);
        await this._client.send('Page.addScriptToEvaluateOnLoad', {
            scriptSource: code
        });
    }

    /**
     * @param {!Page.ScreenshotType} screenshotType
     * @param {?{x: number, y: number, width: number, height: number}} clipRect
     * @return {!Promise<!Buffer>}
     */
    async screenshot(screenshotType, clipRect) {
        if (clipRect) {
            await Promise.all([
                this._client.send('Emulation.setVisibleSize', {
                    width: clipRect.width / this._screenDPI,
                    height: clipRect.height / this._screenDPI,
                }),
                this._client.send('Emulation.forceViewport', {
                    x: clipRect.x / this._screenDPI,
                    y: clipRect.y / this._screenDPI,
                    scale: 1,
                })
            ]);
        }
        var result = await this._client.send('Page.captureScreenshot', {
            fromSurface: true,
            format: screenshotType,
        });
        if (clipRect) {
            await Promise.all([
                this.setSize(this.size()),
                this._client.send('Emulation.resetViewport')
            ]);
        }
        return new Buffer(result.data, 'base64');
    }

    /**
     * @param {string} filePath
     * @param {?{x: number, y: number, width: number, height: number}} clipRect
     * @return {!Promise}
     */
    async saveScreenshot(filePath, clipRect) {
        var mimeType = mime.lookup(filePath);
        var screenshotType = null;
        if (mimeType === 'image/png')
            screenshotType = Page.ScreenshotTypes.PNG;
        else if (mimeType === 'image/jpeg')
            screenshotType = Page.ScreenshotTypes.JPG;
        if (!screenshotType)
            throw new Error(`Cannot render to file ${fileName} - unsupported mimeType ${mimeType}`);
        var buffer = await this.screenshot(screenshotType, clipRect);
        fs.writeFileSync(filePath, buffer);
    }

    /**
     * @param {string} filePath
     * @param {!Object=} options
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
        return this.evaluate(function() {
            return document.body.innerText;
        });
    }

    /**
     * @return {!Promise<string>}
     */
    async title() {
        return this.evaluate(function() {
            return document.title;
        });
    }

    /**
     * @return {!Promise}
     */
    async close() {
        return this._browser.closePage(this);
    }
}

class InPageCallback {
    /**
     * @param {string} name
     * @param {function(?):?} callback
     */
    constructor(name, callback) {
        this.name = name;
        this.callback = callback;
    }
}

/** @enum {string} */
Page.ScreenshotTypes = {
    PNG: "png",
    JPG: "jpeg",
};

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
        var pixels = value * unitToPixels[unit];
    } else {
        throw new Error('printToPDF Cannot handle parameter type: ' + (typeof parameter));
    }
    return pixels / 96;
};

Page.Events = {
    Alert: 'alert',
    BeforeUnload: 'beforeunload',
    Confirm: 'confirm',
    ConsoleMessage: 'consolemessage',
    Exception: 'exception',
    Prompt: 'prompt',
    ResourceLoadingFailed: 'resourceloadingfailed',
    ResponseReceived: 'responsereceived',
};

module.exports = Page;
