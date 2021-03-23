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
import { TimeoutError } from './Errors.js';
import { debug } from './Debug.js';
import { assert } from './assert.js';
import { isNode } from '../environment.js';
export const debugError = debug('puppeteer:error');
function getExceptionMessage(exceptionDetails) {
    if (exceptionDetails.exception)
        return (exceptionDetails.exception.description || exceptionDetails.exception.value);
    let message = exceptionDetails.text;
    if (exceptionDetails.stackTrace) {
        for (const callframe of exceptionDetails.stackTrace.callFrames) {
            const location = callframe.url +
                ':' +
                callframe.lineNumber +
                ':' +
                callframe.columnNumber;
            const functionName = callframe.functionName || '<anonymous>';
            message += `\n    at ${functionName} (${location})`;
        }
    }
    return message;
}
function valueFromRemoteObject(remoteObject) {
    assert(!remoteObject.objectId, 'Cannot extract value when objectId is given');
    if (remoteObject.unserializableValue) {
        if (remoteObject.type === 'bigint' && typeof BigInt !== 'undefined')
            return BigInt(remoteObject.unserializableValue.replace('n', ''));
        switch (remoteObject.unserializableValue) {
            case '-0':
                return -0;
            case 'NaN':
                return NaN;
            case 'Infinity':
                return Infinity;
            case '-Infinity':
                return -Infinity;
            default:
                throw new Error('Unsupported unserializable value: ' +
                    remoteObject.unserializableValue);
        }
    }
    return remoteObject.value;
}
async function releaseObject(client, remoteObject) {
    if (!remoteObject.objectId)
        return;
    await client
        .send('Runtime.releaseObject', { objectId: remoteObject.objectId })
        .catch((error) => {
        // Exceptions might happen in case of a page been navigated or closed.
        // Swallow these since they are harmless and we don't leak anything in this case.
        debugError(error);
    });
}
function addEventListener(emitter, eventName, handler) {
    emitter.on(eventName, handler);
    return { emitter, eventName, handler };
}
function removeEventListeners(listeners) {
    for (const listener of listeners)
        listener.emitter.removeListener(listener.eventName, listener.handler);
    listeners.length = 0;
}
function isString(obj) {
    return typeof obj === 'string' || obj instanceof String;
}
function isNumber(obj) {
    return typeof obj === 'number' || obj instanceof Number;
}
async function waitForEvent(emitter, eventName, predicate, timeout, abortPromise) {
    let eventTimeout, resolveCallback, rejectCallback;
    const promise = new Promise((resolve, reject) => {
        resolveCallback = resolve;
        rejectCallback = reject;
    });
    const listener = addEventListener(emitter, eventName, async (event) => {
        if (!(await predicate(event)))
            return;
        resolveCallback(event);
    });
    if (timeout) {
        eventTimeout = setTimeout(() => {
            rejectCallback(new TimeoutError('Timeout exceeded while waiting for event'));
        }, timeout);
    }
    function cleanup() {
        removeEventListeners([listener]);
        clearTimeout(eventTimeout);
    }
    const result = await Promise.race([promise, abortPromise]).then((r) => {
        cleanup();
        return r;
    }, (error) => {
        cleanup();
        throw error;
    });
    if (result instanceof Error)
        throw result;
    return result;
}
function evaluationString(fun, ...args) {
    if (isString(fun)) {
        assert(args.length === 0, 'Cannot evaluate a string with arguments');
        return fun;
    }
    function serializeArgument(arg) {
        if (Object.is(arg, undefined))
            return 'undefined';
        return JSON.stringify(arg);
    }
    return `(${fun})(${args.map(serializeArgument).join(',')})`;
}
function pageBindingInitString(type, name) {
    function addPageBinding(type, bindingName) {
        /* Cast window to any here as we're about to add properties to it
         * via win[bindingName] which TypeScript doesn't like.
         */
        const win = window;
        const binding = win[bindingName];
        win[bindingName] = (...args) => {
            const me = window[bindingName];
            let callbacks = me.callbacks;
            if (!callbacks) {
                callbacks = new Map();
                me.callbacks = callbacks;
            }
            const seq = (me.lastSeq || 0) + 1;
            me.lastSeq = seq;
            const promise = new Promise((resolve, reject) => callbacks.set(seq, { resolve, reject }));
            binding(JSON.stringify({ type, name: bindingName, seq, args }));
            return promise;
        };
    }
    return evaluationString(addPageBinding, type, name);
}
function pageBindingDeliverResultString(name, seq, result) {
    function deliverResult(name, seq, result) {
        window[name].callbacks.get(seq).resolve(result);
        window[name].callbacks.delete(seq);
    }
    return evaluationString(deliverResult, name, seq, result);
}
function pageBindingDeliverErrorString(name, seq, message, stack) {
    function deliverError(name, seq, message, stack) {
        const error = new Error(message);
        error.stack = stack;
        window[name].callbacks.get(seq).reject(error);
        window[name].callbacks.delete(seq);
    }
    return evaluationString(deliverError, name, seq, message, stack);
}
function pageBindingDeliverErrorValueString(name, seq, value) {
    function deliverErrorValue(name, seq, value) {
        window[name].callbacks.get(seq).reject(value);
        window[name].callbacks.delete(seq);
    }
    return evaluationString(deliverErrorValue, name, seq, value);
}
function makePredicateString(predicate, predicateQueryHandler) {
    function checkWaitForOptions(node, waitForVisible, waitForHidden) {
        if (!node)
            return waitForHidden;
        if (!waitForVisible && !waitForHidden)
            return node;
        const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
        const style = window.getComputedStyle(element);
        const isVisible = style && style.visibility !== 'hidden' && hasVisibleBoundingBox();
        const success = waitForVisible === isVisible || waitForHidden === !isVisible;
        return success ? node : null;
        function hasVisibleBoundingBox() {
            const rect = element.getBoundingClientRect();
            return !!(rect.top || rect.bottom || rect.width || rect.height);
        }
    }
    const predicateQueryHandlerDef = predicateQueryHandler
        ? `const predicateQueryHandler = ${predicateQueryHandler};`
        : '';
    return `
    (() => {
      ${predicateQueryHandlerDef}
      const checkWaitForOptions = ${checkWaitForOptions};
      return (${predicate})(...args)
    })() `;
}
async function waitWithTimeout(promise, taskName, timeout) {
    let reject;
    const timeoutError = new TimeoutError(`waiting for ${taskName} failed: timeout ${timeout}ms exceeded`);
    const timeoutPromise = new Promise((resolve, x) => (reject = x));
    let timeoutTimer = null;
    if (timeout)
        timeoutTimer = setTimeout(() => reject(timeoutError), timeout);
    try {
        return await Promise.race([promise, timeoutPromise]);
    }
    finally {
        if (timeoutTimer)
            clearTimeout(timeoutTimer);
    }
}
async function readProtocolStream(client, handle, path) {
    if (!isNode && path) {
        throw new Error('Cannot write to a path outside of Node.js environment.');
    }
    const fs = isNode ? await importFSModule() : null;
    let eof = false;
    let fileHandle;
    if (path && fs) {
        fileHandle = await fs.promises.open(path, 'w');
    }
    const bufs = [];
    while (!eof) {
        const response = await client.send('IO.read', { handle });
        eof = response.eof;
        const buf = Buffer.from(response.data, response.base64Encoded ? 'base64' : undefined);
        bufs.push(buf);
        if (path && fs) {
            await fs.promises.writeFile(fileHandle, buf);
        }
    }
    if (path)
        await fileHandle.close();
    await client.send('IO.close', { handle });
    let resultBuffer = null;
    try {
        resultBuffer = Buffer.concat(bufs);
    }
    finally {
        return resultBuffer;
    }
}
/**
 * Loads the Node fs promises API. Needed because on Node 10.17 and below,
 * fs.promises is experimental, and therefore not marked as enumerable. That
 * means when TypeScript compiles an `import('fs')`, its helper doesn't spot the
 * promises declaration and therefore on Node <10.17 you get an error as
 * fs.promises is undefined in compiled TypeScript land.
 *
 * See https://github.com/puppeteer/puppeteer/issues/6548 for more details.
 *
 * Once Node 10 is no longer supported (April 2021) we can remove this and use
 * `(await import('fs')).promises`.
 */
async function importFSModule() {
    if (!isNode) {
        throw new Error('Cannot load the fs module API outside of Node.');
    }
    const fs = await import('fs');
    if (fs.promises) {
        return fs;
    }
    return fs.default;
}
export const helper = {
    evaluationString,
    pageBindingInitString,
    pageBindingDeliverResultString,
    pageBindingDeliverErrorString,
    pageBindingDeliverErrorValueString,
    makePredicateString,
    readProtocolStream,
    waitWithTimeout,
    waitForEvent,
    isString,
    isNumber,
    importFSModule,
    addEventListener,
    removeEventListeners,
    valueFromRemoteObject,
    getExceptionMessage,
    releaseObject,
};
//# sourceMappingURL=helper.js.map