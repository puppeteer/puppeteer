"use strict";
/**
 * Copyright 2019 Google Inc. All rights reserved.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaitTask = exports.DOMWorld = void 0;
const assert_js_1 = require("./assert.js");
const helper_js_1 = require("./helper.js");
const LifecycleWatcher_js_1 = require("./LifecycleWatcher.js");
const Errors_js_1 = require("./Errors.js");
const QueryHandler_js_1 = require("./QueryHandler.js");
const environment_js_1 = require("../environment.js");
/**
 * @internal
 */
class DOMWorld {
    constructor(frameManager, frame, timeoutSettings) {
        this._documentPromise = null;
        this._contextPromise = null;
        this._contextResolveCallback = null;
        this._detached = false;
        /**
         * @internal
         */
        this._waitTasks = new Set();
        /**
         * @internal
         * Contains mapping from functions that should be bound to Puppeteer functions.
         */
        this._boundFunctions = new Map();
        // Set of bindings that have been registered in the current context.
        this._ctxBindings = new Set();
        // If multiple waitFor are set up asynchronously, we need to wait for the
        // first one to set up the binding in the page before running the others.
        this._settingUpBinding = null;
        this._frameManager = frameManager;
        this._frame = frame;
        this._timeoutSettings = timeoutSettings;
        this._setContext(null);
        frameManager._client.on('Runtime.bindingCalled', (event) => this._onBindingCalled(event));
    }
    frame() {
        return this._frame;
    }
    async _setContext(context) {
        if (context) {
            this._ctxBindings.clear();
            this._contextResolveCallback.call(null, context);
            this._contextResolveCallback = null;
            for (const waitTask of this._waitTasks)
                waitTask.rerun();
        }
        else {
            this._documentPromise = null;
            this._contextPromise = new Promise((fulfill) => {
                this._contextResolveCallback = fulfill;
            });
        }
    }
    _hasContext() {
        return !this._contextResolveCallback;
    }
    _detach() {
        this._detached = true;
        for (const waitTask of this._waitTasks)
            waitTask.terminate(new Error('waitForFunction failed: frame got detached.'));
    }
    executionContext() {
        if (this._detached)
            throw new Error(`Execution context is not available in detached frame "${this._frame.url()}" (are you trying to evaluate?)`);
        return this._contextPromise;
    }
    async evaluateHandle(pageFunction, ...args) {
        const context = await this.executionContext();
        return context.evaluateHandle(pageFunction, ...args);
    }
    async evaluate(pageFunction, ...args) {
        const context = await this.executionContext();
        return context.evaluate(pageFunction, ...args);
    }
    async $(selector) {
        const document = await this._document();
        const value = await document.$(selector);
        return value;
    }
    async _document() {
        if (this._documentPromise)
            return this._documentPromise;
        this._documentPromise = this.executionContext().then(async (context) => {
            const document = await context.evaluateHandle('document');
            return document.asElement();
        });
        return this._documentPromise;
    }
    async $x(expression) {
        const document = await this._document();
        const value = await document.$x(expression);
        return value;
    }
    async $eval(selector, pageFunction, ...args) {
        const document = await this._document();
        return document.$eval(selector, pageFunction, ...args);
    }
    async $$eval(selector, pageFunction, ...args) {
        const document = await this._document();
        const value = await document.$$eval(selector, pageFunction, ...args);
        return value;
    }
    async $$(selector) {
        const document = await this._document();
        const value = await document.$$(selector);
        return value;
    }
    async content() {
        return await this.evaluate(() => {
            let retVal = '';
            if (document.doctype)
                retVal = new XMLSerializer().serializeToString(document.doctype);
            if (document.documentElement)
                retVal += document.documentElement.outerHTML;
            return retVal;
        });
    }
    async setContent(html, options = {}) {
        const { waitUntil = ['load'], timeout = this._timeoutSettings.navigationTimeout(), } = options;
        // We rely upon the fact that document.open() will reset frame lifecycle with "init"
        // lifecycle event. @see https://crrev.com/608658
        await this.evaluate((html) => {
            document.open();
            document.write(html);
            document.close();
        }, html);
        const watcher = new LifecycleWatcher_js_1.LifecycleWatcher(this._frameManager, this._frame, waitUntil, timeout);
        const error = await Promise.race([
            watcher.timeoutOrTerminationPromise(),
            watcher.lifecyclePromise(),
        ]);
        watcher.dispose();
        if (error)
            throw error;
    }
    /**
     * Adds a script tag into the current context.
     *
     * @remarks
     *
     * You can pass a URL, filepath or string of contents. Note that when running Puppeteer
     * in a browser environment you cannot pass a filepath and should use either
     * `url` or `content`.
     */
    async addScriptTag(options) {
        const { url = null, path = null, content = null, type = '' } = options;
        if (url !== null) {
            try {
                const context = await this.executionContext();
                return (await context.evaluateHandle(addScriptUrl, url, type)).asElement();
            }
            catch (error) {
                throw new Error(`Loading script from ${url} failed`);
            }
        }
        if (path !== null) {
            if (!environment_js_1.isNode) {
                throw new Error('Cannot pass a filepath to addScriptTag in the browser environment.');
            }
            const fs = await helper_js_1.helper.importFSModule();
            let contents = await fs.promises.readFile(path, 'utf8');
            contents += '//# sourceURL=' + path.replace(/\n/g, '');
            const context = await this.executionContext();
            return (await context.evaluateHandle(addScriptContent, contents, type)).asElement();
        }
        if (content !== null) {
            const context = await this.executionContext();
            return (await context.evaluateHandle(addScriptContent, content, type)).asElement();
        }
        throw new Error('Provide an object with a `url`, `path` or `content` property');
        async function addScriptUrl(url, type) {
            const script = document.createElement('script');
            script.src = url;
            if (type)
                script.type = type;
            const promise = new Promise((res, rej) => {
                script.onload = res;
                script.onerror = rej;
            });
            document.head.appendChild(script);
            await promise;
            return script;
        }
        function addScriptContent(content, type = 'text/javascript') {
            const script = document.createElement('script');
            script.type = type;
            script.text = content;
            let error = null;
            script.onerror = (e) => (error = e);
            document.head.appendChild(script);
            if (error)
                throw error;
            return script;
        }
    }
    /**
     * Adds a style tag into the current context.
     *
     * @remarks
     *
     * You can pass a URL, filepath or string of contents. Note that when running Puppeteer
     * in a browser environment you cannot pass a filepath and should use either
     * `url` or `content`.
     *
     */
    async addStyleTag(options) {
        const { url = null, path = null, content = null } = options;
        if (url !== null) {
            try {
                const context = await this.executionContext();
                return (await context.evaluateHandle(addStyleUrl, url)).asElement();
            }
            catch (error) {
                throw new Error(`Loading style from ${url} failed`);
            }
        }
        if (path !== null) {
            if (!environment_js_1.isNode) {
                throw new Error('Cannot pass a filepath to addStyleTag in the browser environment.');
            }
            const fs = await helper_js_1.helper.importFSModule();
            let contents = await fs.promises.readFile(path, 'utf8');
            contents += '/*# sourceURL=' + path.replace(/\n/g, '') + '*/';
            const context = await this.executionContext();
            return (await context.evaluateHandle(addStyleContent, contents)).asElement();
        }
        if (content !== null) {
            const context = await this.executionContext();
            return (await context.evaluateHandle(addStyleContent, content)).asElement();
        }
        throw new Error('Provide an object with a `url`, `path` or `content` property');
        async function addStyleUrl(url) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            const promise = new Promise((res, rej) => {
                link.onload = res;
                link.onerror = rej;
            });
            document.head.appendChild(link);
            await promise;
            return link;
        }
        async function addStyleContent(content) {
            const style = document.createElement('style');
            style.type = 'text/css';
            style.appendChild(document.createTextNode(content));
            const promise = new Promise((res, rej) => {
                style.onload = res;
                style.onerror = rej;
            });
            document.head.appendChild(style);
            await promise;
            return style;
        }
    }
    async click(selector, options) {
        const handle = await this.$(selector);
        assert_js_1.assert(handle, 'No node found for selector: ' + selector);
        await handle.click(options);
        await handle.dispose();
    }
    async focus(selector) {
        const handle = await this.$(selector);
        assert_js_1.assert(handle, 'No node found for selector: ' + selector);
        await handle.focus();
        await handle.dispose();
    }
    async hover(selector) {
        const handle = await this.$(selector);
        assert_js_1.assert(handle, 'No node found for selector: ' + selector);
        await handle.hover();
        await handle.dispose();
    }
    async select(selector, ...values) {
        const handle = await this.$(selector);
        assert_js_1.assert(handle, 'No node found for selector: ' + selector);
        const result = await handle.select(...values);
        await handle.dispose();
        return result;
    }
    async tap(selector) {
        const handle = await this.$(selector);
        await handle.tap();
        await handle.dispose();
    }
    async type(selector, text, options) {
        const handle = await this.$(selector);
        assert_js_1.assert(handle, 'No node found for selector: ' + selector);
        await handle.type(text, options);
        await handle.dispose();
    }
    async waitForSelector(selector, options) {
        const { updatedSelector, queryHandler } = QueryHandler_js_1.getQueryHandlerAndSelector(selector);
        return queryHandler.waitFor(this, updatedSelector, options);
    }
    /**
     * @internal
     */
    async addBindingToContext(context, name) {
        // Previous operation added the binding so we are done.
        if (this._ctxBindings.has(DOMWorld.bindingIdentifier(name, context._contextId))) {
            return;
        }
        // Wait for other operation to finish
        if (this._settingUpBinding) {
            await this._settingUpBinding;
            return this.addBindingToContext(context, name);
        }
        const bind = async (name) => {
            const expression = helper_js_1.helper.pageBindingInitString('internal', name);
            try {
                // TODO: In theory, it would be enough to call this just once
                await context._client.send('Runtime.addBinding', {
                    name,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore The protocol definition is not up to date.
                    executionContextName: context._contextName,
                });
                await context.evaluate(expression);
            }
            catch (error) {
                // We could have tried to evaluate in a context which was already
                // destroyed. This happens, for example, if the page is navigated while
                // we are trying to add the binding
                const ctxDestroyed = error.message.includes('Execution context was destroyed');
                const ctxNotFound = error.message.includes('Cannot find context with specified id');
                if (ctxDestroyed || ctxNotFound) {
                    return;
                }
                else {
                    helper_js_1.debugError(error);
                    return;
                }
            }
            this._ctxBindings.add(DOMWorld.bindingIdentifier(name, context._contextId));
        };
        this._settingUpBinding = bind(name);
        await this._settingUpBinding;
        this._settingUpBinding = null;
    }
    async _onBindingCalled(event) {
        let payload;
        if (!this._hasContext())
            return;
        const context = await this.executionContext();
        try {
            payload = JSON.parse(event.payload);
        }
        catch {
            // The binding was either called by something in the page or it was
            // called before our wrapper was initialized.
            return;
        }
        const { type, name, seq, args } = payload;
        if (type !== 'internal' ||
            !this._ctxBindings.has(DOMWorld.bindingIdentifier(name, context._contextId)))
            return;
        if (context._contextId !== event.executionContextId)
            return;
        try {
            const result = await this._boundFunctions.get(name)(...args);
            await context.evaluate(deliverResult, name, seq, result);
        }
        catch (error) {
            // The WaitTask may already have been resolved by timing out, or the
            // exection context may have been destroyed.
            // In both caes, the promises above are rejected with a protocol error.
            // We can safely ignores these, as the WaitTask is re-installed in
            // the next execution context if needed.
            if (error.message.includes('Protocol error'))
                return;
            helper_js_1.debugError(error);
        }
        function deliverResult(name, seq, result) {
            globalThis[name].callbacks.get(seq).resolve(result);
            globalThis[name].callbacks.delete(seq);
        }
    }
    /**
     * @internal
     */
    async waitForSelectorInPage(queryOne, selector, options, binding) {
        const { visible: waitForVisible = false, hidden: waitForHidden = false, timeout = this._timeoutSettings.timeout(), } = options;
        const polling = waitForVisible || waitForHidden ? 'raf' : 'mutation';
        const title = `selector \`${selector}\`${waitForHidden ? ' to be hidden' : ''}`;
        async function predicate(selector, waitForVisible, waitForHidden) {
            const node = predicateQueryHandler
                ? (await predicateQueryHandler(document, selector))
                : document.querySelector(selector);
            return checkWaitForOptions(node, waitForVisible, waitForHidden);
        }
        const waitTaskOptions = {
            domWorld: this,
            predicateBody: helper_js_1.helper.makePredicateString(predicate, queryOne),
            title,
            polling,
            timeout,
            args: [selector, waitForVisible, waitForHidden],
            binding,
        };
        const waitTask = new WaitTask(waitTaskOptions);
        const jsHandle = await waitTask.promise;
        const elementHandle = jsHandle.asElement();
        if (!elementHandle) {
            await jsHandle.dispose();
            return null;
        }
        return elementHandle;
    }
    async waitForXPath(xpath, options) {
        const { visible: waitForVisible = false, hidden: waitForHidden = false, timeout = this._timeoutSettings.timeout(), } = options;
        const polling = waitForVisible || waitForHidden ? 'raf' : 'mutation';
        const title = `XPath \`${xpath}\`${waitForHidden ? ' to be hidden' : ''}`;
        function predicate(xpath, waitForVisible, waitForHidden) {
            const node = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            return checkWaitForOptions(node, waitForVisible, waitForHidden);
        }
        const waitTaskOptions = {
            domWorld: this,
            predicateBody: helper_js_1.helper.makePredicateString(predicate),
            title,
            polling,
            timeout,
            args: [xpath, waitForVisible, waitForHidden],
        };
        const waitTask = new WaitTask(waitTaskOptions);
        const jsHandle = await waitTask.promise;
        const elementHandle = jsHandle.asElement();
        if (!elementHandle) {
            await jsHandle.dispose();
            return null;
        }
        return elementHandle;
    }
    waitForFunction(pageFunction, options = {}, ...args) {
        const { polling = 'raf', timeout = this._timeoutSettings.timeout(), } = options;
        const waitTaskOptions = {
            domWorld: this,
            predicateBody: pageFunction,
            title: 'function',
            polling,
            timeout,
            args,
        };
        const waitTask = new WaitTask(waitTaskOptions);
        return waitTask.promise;
    }
    async title() {
        return this.evaluate(() => document.title);
    }
}
exports.DOMWorld = DOMWorld;
DOMWorld.bindingIdentifier = (name, contextId) => `${name}_${contextId}`;
/**
 * @internal
 */
class WaitTask {
    constructor(options) {
        this._runCount = 0;
        this._terminated = false;
        if (helper_js_1.helper.isString(options.polling))
            assert_js_1.assert(options.polling === 'raf' || options.polling === 'mutation', 'Unknown polling option: ' + options.polling);
        else if (helper_js_1.helper.isNumber(options.polling))
            assert_js_1.assert(options.polling > 0, 'Cannot poll with non-positive interval: ' + options.polling);
        else
            throw new Error('Unknown polling options: ' + options.polling);
        function getPredicateBody(predicateBody) {
            if (helper_js_1.helper.isString(predicateBody))
                return `return (${predicateBody});`;
            return `return (${predicateBody})(...args);`;
        }
        this._domWorld = options.domWorld;
        this._polling = options.polling;
        this._timeout = options.timeout;
        this._predicateBody = getPredicateBody(options.predicateBody);
        this._args = options.args;
        this._binding = options.binding;
        this._runCount = 0;
        this._domWorld._waitTasks.add(this);
        if (this._binding) {
            this._domWorld._boundFunctions.set(this._binding.name, this._binding.pptrFunction);
        }
        this.promise = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
        // Since page navigation requires us to re-install the pageScript, we should track
        // timeout on our end.
        if (options.timeout) {
            const timeoutError = new Errors_js_1.TimeoutError(`waiting for ${options.title} failed: timeout ${options.timeout}ms exceeded`);
            this._timeoutTimer = setTimeout(() => this.terminate(timeoutError), options.timeout);
        }
        this.rerun();
    }
    terminate(error) {
        this._terminated = true;
        this._reject(error);
        this._cleanup();
    }
    async rerun() {
        const runCount = ++this._runCount;
        let success = null;
        let error = null;
        const context = await this._domWorld.executionContext();
        if (this._terminated || runCount !== this._runCount)
            return;
        if (this._binding) {
            await this._domWorld.addBindingToContext(context, this._binding.name);
        }
        if (this._terminated || runCount !== this._runCount)
            return;
        try {
            success = await context.evaluateHandle(waitForPredicatePageFunction, this._predicateBody, this._polling, this._timeout, ...this._args);
        }
        catch (error_) {
            error = error_;
        }
        if (this._terminated || runCount !== this._runCount) {
            if (success)
                await success.dispose();
            return;
        }
        // Ignore timeouts in pageScript - we track timeouts ourselves.
        // If the frame's execution context has already changed, `frame.evaluate` will
        // throw an error - ignore this predicate run altogether.
        if (!error &&
            (await this._domWorld.evaluate((s) => !s, success).catch(() => true))) {
            await success.dispose();
            return;
        }
        if (error) {
            if (error.message.includes('TypeError: binding is not a function')) {
                return this.rerun();
            }
            // When frame is detached the task should have been terminated by the DOMWorld.
            // This can fail if we were adding this task while the frame was detached,
            // so we terminate here instead.
            if (error.message.includes('Execution context is not available in detached frame')) {
                this.terminate(new Error('waitForFunction failed: frame got detached.'));
                return;
            }
            // When the page is navigated, the promise is rejected.
            // We will try again in the new execution context.
            if (error.message.includes('Execution context was destroyed'))
                return;
            // We could have tried to evaluate in a context which was already
            // destroyed.
            if (error.message.includes('Cannot find context with specified id'))
                return;
            this._reject(error);
        }
        else {
            this._resolve(success);
        }
        this._cleanup();
    }
    _cleanup() {
        clearTimeout(this._timeoutTimer);
        this._domWorld._waitTasks.delete(this);
    }
}
exports.WaitTask = WaitTask;
async function waitForPredicatePageFunction(predicateBody, polling, timeout, ...args) {
    const predicate = new Function('...args', predicateBody);
    let timedOut = false;
    if (timeout)
        setTimeout(() => (timedOut = true), timeout);
    if (polling === 'raf')
        return await pollRaf();
    if (polling === 'mutation')
        return await pollMutation();
    if (typeof polling === 'number')
        return await pollInterval(polling);
    /**
     * @returns {!Promise<*>}
     */
    async function pollMutation() {
        const success = await predicate(...args);
        if (success)
            return Promise.resolve(success);
        let fulfill;
        const result = new Promise((x) => (fulfill = x));
        const observer = new MutationObserver(async () => {
            if (timedOut) {
                observer.disconnect();
                fulfill();
            }
            const success = await predicate(...args);
            if (success) {
                observer.disconnect();
                fulfill(success);
            }
        });
        observer.observe(document, {
            childList: true,
            subtree: true,
            attributes: true,
        });
        return result;
    }
    async function pollRaf() {
        let fulfill;
        const result = new Promise((x) => (fulfill = x));
        await onRaf();
        return result;
        async function onRaf() {
            if (timedOut) {
                fulfill();
                return;
            }
            const success = await predicate(...args);
            if (success)
                fulfill(success);
            else
                requestAnimationFrame(onRaf);
        }
    }
    async function pollInterval(pollInterval) {
        let fulfill;
        const result = new Promise((x) => (fulfill = x));
        await onTimeout();
        return result;
        async function onTimeout() {
            if (timedOut) {
                fulfill();
                return;
            }
            const success = await predicate(...args);
            if (success)
                fulfill(success);
            else
                setTimeout(onTimeout, pollInterval);
        }
    }
}
//# sourceMappingURL=DOMWorld.js.map