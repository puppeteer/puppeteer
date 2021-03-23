"use strict";
/**
 * Copyright 2020 Google Inc. All rights reserved.
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
exports.getQueryHandlerAndSelector = exports.clearCustomQueryHandlers = exports.customQueryHandlerNames = exports.unregisterCustomQueryHandler = exports.registerCustomQueryHandler = void 0;
const AriaQueryHandler_js_1 = require("./AriaQueryHandler.js");
function makeQueryHandler(handler) {
    const internalHandler = {};
    if (handler.queryOne) {
        internalHandler.queryOne = async (element, selector) => {
            const jsHandle = await element.evaluateHandle(handler.queryOne, selector);
            const elementHandle = jsHandle.asElement();
            if (elementHandle)
                return elementHandle;
            await jsHandle.dispose();
            return null;
        };
        internalHandler.waitFor = (domWorld, selector, options) => domWorld.waitForSelectorInPage(handler.queryOne, selector, options);
    }
    if (handler.queryAll) {
        internalHandler.queryAll = async (element, selector) => {
            const jsHandle = await element.evaluateHandle(handler.queryAll, selector);
            const properties = await jsHandle.getProperties();
            await jsHandle.dispose();
            const result = [];
            for (const property of properties.values()) {
                const elementHandle = property.asElement();
                if (elementHandle)
                    result.push(elementHandle);
            }
            return result;
        };
        internalHandler.queryAllArray = async (element, selector) => {
            const resultHandle = await element.evaluateHandle(handler.queryAll, selector);
            const arrayHandle = await resultHandle.evaluateHandle((res) => Array.from(res));
            return arrayHandle;
        };
    }
    return internalHandler;
}
const _defaultHandler = makeQueryHandler({
    queryOne: (element, selector) => element.querySelector(selector),
    queryAll: (element, selector) => element.querySelectorAll(selector),
});
const pierceHandler = makeQueryHandler({
    queryOne: (element, selector) => {
        let found = null;
        const search = (root) => {
            const iter = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
            do {
                const currentNode = iter.currentNode;
                if (currentNode.shadowRoot) {
                    search(currentNode.shadowRoot);
                }
                if (currentNode instanceof ShadowRoot) {
                    continue;
                }
                if (!found && currentNode.matches(selector)) {
                    found = currentNode;
                }
            } while (!found && iter.nextNode());
        };
        if (element instanceof Document) {
            element = element.documentElement;
        }
        search(element);
        return found;
    },
    queryAll: (element, selector) => {
        const result = [];
        const collect = (root) => {
            const iter = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
            do {
                const currentNode = iter.currentNode;
                if (currentNode.shadowRoot) {
                    collect(currentNode.shadowRoot);
                }
                if (currentNode instanceof ShadowRoot) {
                    continue;
                }
                if (currentNode.matches(selector)) {
                    result.push(currentNode);
                }
            } while (iter.nextNode());
        };
        if (element instanceof Document) {
            element = element.documentElement;
        }
        collect(element);
        return result;
    },
});
const _builtInHandlers = new Map([
    ['aria', AriaQueryHandler_js_1.ariaHandler],
    ['pierce', pierceHandler],
]);
const _queryHandlers = new Map(_builtInHandlers);
/**
 * @internal
 */
function registerCustomQueryHandler(name, handler) {
    if (_queryHandlers.get(name))
        throw new Error(`A custom query handler named "${name}" already exists`);
    const isValidName = /^[a-zA-Z]+$/.test(name);
    if (!isValidName)
        throw new Error(`Custom query handler names may only contain [a-zA-Z]`);
    const internalHandler = makeQueryHandler(handler);
    _queryHandlers.set(name, internalHandler);
}
exports.registerCustomQueryHandler = registerCustomQueryHandler;
/**
 * @internal
 */
function unregisterCustomQueryHandler(name) {
    if (_queryHandlers.has(name) && !_builtInHandlers.has(name)) {
        _queryHandlers.delete(name);
    }
}
exports.unregisterCustomQueryHandler = unregisterCustomQueryHandler;
/**
 * @internal
 */
function customQueryHandlerNames() {
    return [..._queryHandlers.keys()].filter((name) => !_builtInHandlers.has(name));
}
exports.customQueryHandlerNames = customQueryHandlerNames;
/**
 * @internal
 */
function clearCustomQueryHandlers() {
    customQueryHandlerNames().forEach(unregisterCustomQueryHandler);
}
exports.clearCustomQueryHandlers = clearCustomQueryHandlers;
/**
 * @internal
 */
function getQueryHandlerAndSelector(selector) {
    const hasCustomQueryHandler = /^[a-zA-Z]+\//.test(selector);
    if (!hasCustomQueryHandler)
        return { updatedSelector: selector, queryHandler: _defaultHandler };
    const index = selector.indexOf('/');
    const name = selector.slice(0, index);
    const updatedSelector = selector.slice(index + 1);
    const queryHandler = _queryHandlers.get(name);
    if (!queryHandler)
        throw new Error(`Query set to use "${name}", but no query handler of that name was found`);
    return {
        updatedSelector,
        queryHandler,
    };
}
exports.getQueryHandlerAndSelector = getQueryHandlerAndSelector;
//# sourceMappingURL=QueryHandler.js.map