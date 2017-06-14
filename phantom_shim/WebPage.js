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

var await = require('./utilities').await;
var EventEmitter = require('events');
var fs = require('fs');
var path = require('path');
var PageEvents = require('../lib/Page').Events;

var noop = function() { };

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
            await(this._page.setViewportSize(options.viewportSize));

        await(this._page.setInPageCallback('callPhantom', (...args) => this.onCallback.apply(null, args)));

        this.clipRect = options.clipRect || {left: 0, top: 0, width: 0, height: 0};
        this.onCallback = null;
        this.onConsoleMessage = null;
        this.onLoadFinished = null;
        this.onResourceError = null;
        this.onResourceReceived = null;
        this.onInitialized = null;
        this._deferEvaluate = false;

        this.libraryPath = path.dirname(scriptPath);

        this._onConfirmCallback = undefined;
        this._onAlertCallback = undefined;
        this._onError = noop;

        this._pageEvents = new AsyncEmitter(this._page);
        this._pageEvents.on(PageEvents.ResponseReceived, response => this._onResponseReceived(response));
        this._pageEvents.on(PageEvents.ResourceLoadingFailed, event => (this.onResourceError || noop).call(null, event));
        this._pageEvents.on(PageEvents.ConsoleMessage, msg => (this.onConsoleMessage || noop).call(null, msg));
        this._pageEvents.on(PageEvents.Confirm, message => this._onConfirm(message));
        this._pageEvents.on(PageEvents.Alert, message => this._onAlert(message));
        this._pageEvents.on(PageEvents.Exception, (exception, stack) => (this._onError || noop).call(null, exception, stack));
    }

    _onResponseReceived(response) {
        if (!this.onResourceReceived)
            return;
        var headers = [];
        for (var key in response.headers) {
            headers.push({
                name: key,
                value: response.headers[key]
            });
        }
        response.headers = headers;
        this.onResourceReceived.call(null, response);
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
        return this._page.viewportSize();
    }

    /**
     * @return {!Object}
     */
    get customHeaders() {
        return this._page.extraHTTPHeaders();
    }

    /**
     * @param {!Object} value
     */
    set customHeaders(value) {
        await(this._page.setExtraHTTPHeaders(value));
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
     * @param {string} message
     */
    _onConfirm(message) {
        if (!this._onConfirmCallback)
            return;
        var accept = this._onConfirmCallback.call(null, message);
        await(this._page.handleDialog(accept));
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
     * @param {string} message
     */
    _onAlert(message) {
        if (!this._onAlertCallback)
            return;
        this._onAlertCallback.call(null, message);
        await(this._page.handleDialog(true));
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
     * @param {string} html
     * @param {function()=} callback
     */
    open(url, callback) {
        console.assert(arguments.length <= 2, 'WebPage.open does not support METHOD and DATA arguments');
        this._deferEvaluate = true;
        if (typeof this.onInitialized === 'function')
            this.onInitialized();
        this._deferEvaluate = false;
        this._page.navigate(url).then(result => {
            var status = result ? 'success' : 'fail';
            if (!result) {
                this.onResourceError.call(null, {
                    url,
                    errorString: 'SSL handshake failed'
                });
            }
            if (this.onLoadFinished)
                this.onLoadFinished.call(null, status);
            if (callback)
                callback.call(null, status);
        });
    }

    /**
     * @param {!{width: number, height: number}} options
     */
    set viewportSize(options) {
        await(this._page.setViewportSize(options));
    }

    /**
     * @param {function()} fun
     * @param {!Array<!Object>} args
     */
    evaluate(fun, ...args) {
        if (this._deferEvaluate)
            return await(this._page.evaluateOnInitialized(fun, ...args));
        return await(this._page.evaluate(fun, ...args));
    }

    /**
     * {string} fileName
     */
    render(fileName) {
        var clipRect = null;
        if (this.clipRect && (this.clipRect.left || this.clipRect.top || this.clipRect.width || this.clipRect.height)) {
            clipRect = {
                x: this.clipRect.left,
                y: this.clipRect.top,
                width: this.clipRect.width,
                height: this.clipRect.height
            };
        }
        if (fileName.endsWith('pdf')) {
            var options = {};
            var paperSize = this.paperSize || {};
            options.margin = paperSize.margin;
            options.format = paperSize.format;
            options.landscape = paperSize.orientation === 'landscape';
            options.width = paperSize.width;
            options.height = paperSize.height;
            await(this._page.printToPDF(fileName, options));
        } else {
            await(this._page.saveScreenshot(fileName, clipRect));
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
        await(this._page.setUserAgentOverride(value));
    }

    /**
     * @return {string}
     */
    get userAgent() {
        return this._page.userAgentOverride();
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
        var asyncListener = (...args) => {
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
