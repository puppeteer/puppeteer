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
var Request = require('./Request');
var Dialog = require('./Dialog');

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
        var screenDPI = await helpers.evaluate(client, () => window.devicePixelRatio, []);
        var page = new Page(client, screenDPI.result.value);
        // Initialize default page size.
        await page.setViewportSize({width: 400, height: 300});
        return page;
    }

    /**
     * @param {!Connection} client
     * @param {number} screenDPI
     */
    constructor(client, screenDPI) {
        super();
        this._client = client;
        this._screenDPI = screenDPI;
        this._extraHeaders = {};
        /** @type {!Map<string, !InPageCallback>} */
        this._sourceURLToPageCallback = new Map();
        /** @type {!Map<string, !InPageCallback>} */
        this._scriptIdToPageCallback = new Map();
        /** @type {?function(!Request)} */
        this._requestInterceptor = null;

        this._screenshotTaskChain = Promise.resolve();

        client.on('Debugger.paused', event => this._onDebuggerPaused(event));
        client.on('Debugger.scriptParsed', event => this._onScriptParsed(event));
        client.on('Network.responseReceived', event => this.emit(Page.Events.ResponseReceived, event.response));
        client.on('Network.loadingFailed', event => this.emit(Page.Events.ResourceLoadingFailed, event));
        client.on('Network.requestIntercepted', event => this._onRequestIntercepted(event));
        client.on('Runtime.consoleAPICalled', event => this._onConsoleAPI(event));
        client.on('Page.javascriptDialogOpening', event => this._onDialog(event));
        client.on('Runtime.exceptionThrown', exception => this._handleException(exception.exceptionDetails));
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
        var text = helpers.evaluationString(inPageCallback, [name], false /* wrapInPromise */, sourceURL);
        await Promise.all([
            this._client.send('Debugger.enable', {}),
            this._client.send('Page.addScriptToEvaluateOnLoad', { scriptSource: text }),
            helpers.evaluateText(this._client, text, false /* awaitPromise */)
        ]);

        function inPageCallback(callbackName) {
            window[callbackName] = (...args) => {
                window[callbackName].__args = args;
                debugger;
                var result = window[callbackName].__result;
                delete window[callbackName].__result;
                delete window[callbackName].__args;
                return result;
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
        var result = await Promise.resolve(callback.apply(null, args));
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

    /**
     * @param {!Object} exceptionDetails
     */
    async _handleException(exceptionDetails) {
        var message = await this._getExceptionMessage(exceptionDetails);
        this.emit(Page.Events.Error, new Error(message));
    }

    _onConsoleAPI(event) {
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
        try {
            await this._client.send('Page.navigate', {url, referrer});
        } catch (e) {
            return false;
        }
        return await Promise.race([loadPromise, interstitialPromise]);
    }

    /**
     * @param {!{width: number, height: number}} size
     * @return {!Promise}
     */
    async setViewportSize(size) {
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
    viewportSize() {
        return this._size;
    }

    /**
     * @param {function()} fun
     * @param {!Array<*>} args
     * @return {!Promise<(!Object|undefined)>}
     */
    async evaluate(fun, ...args) {
        var code = helpers.evaluationString(fun, args, false /* wrapInPromise */);
        var response = await this._client.send('Runtime.evaluate', {
            expression: code
        });
        if (response.exceptionDetails) {
            var message = await this._getExceptionMessage(response.exceptionDetails);
            throw new Error('Evaluation failed: ' + message);
        }

        var remoteObject = response.result;
        if (remoteObject.type !== 'object')
            return remoteObject.value;
        var isPromise = remoteObject.type === 'object' && remoteObject.subtype === 'promise';
        var response = await this._client.send('Runtime.callFunctionOn', {
            objectId: remoteObject.objectId,
            functionDeclaration: 'function() { return this; }',
            returnByValue: true,
            awaitPromise: isPromise
        });
        await this._client.send('Runtime.releaseObject', {
            objectId: remoteObject.objectId
        });
        if (response.exceptionDetails) {
            var message = await this._getExceptionMessage(response.exceptionDetails);
            throw new Error('Evaluation failed with ' + message);
        }

        return response.result.value;
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
        var code = helpers.evaluationString(fun, args, false /* wrapInPromise */);
        await this._client.send('Page.addScriptToEvaluateOnLoad', {
            scriptSource: code
        });
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
            else
                throw new Error('Unsupported screenshot mime type: ' + mimeType);
        }
        if (options.type) {
            if (screenshotType && options.type !== screenshotType)
                throw new Error(`Passed screenshot type '${options.type}' does not match to the type inferred from the file path: '${screenshotType}'`);
            if (options.type !== 'png' && options.type !== 'jpeg')
                throw new Error('Unknown screenshot type: ' + options.type);
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
        }
        var result = await this._client.send('Page.captureScreenshot', {
            fromSurface: true,
            format: screenshotType,
            quality: options.quality
        });
        if (options.clip) {
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
        await this._client.dispose();
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
};

module.exports = Page;
