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

import {WaitForSelectorOptions, DOMWorld} from './DOMWorld.js';
import {ElementHandle, JSHandle} from './JSHandle.js';
import {ariaHandler} from './AriaQueryHandler.js';

/**
 * @internal
 */
export interface InternalQueryHandler {
  queryOne?: (
    element: ElementHandle,
    selector: string
  ) => Promise<ElementHandle | null>;
  waitFor?: (
    domWorld: DOMWorld,
    selector: string,
    options: WaitForSelectorOptions
  ) => Promise<ElementHandle | null>;
  queryAll?: (
    element: ElementHandle,
    selector: string
  ) => Promise<ElementHandle[]>;
  queryAllArray?: (
    element: ElementHandle,
    selector: string
  ) => Promise<JSHandle<Element[]>>;
}

/**
 * Contains two functions `queryOne` and `queryAll` that can
 * be {@link Puppeteer.registerCustomQueryHandler | registered}
 * as alternative querying strategies. The functions `queryOne` and `queryAll`
 * are executed in the page context.  `queryOne` should take an `Element` and a
 * selector string as argument and return a single `Element` or `null` if no
 * element is found. `queryAll` takes the same arguments but should instead
 * return a `NodeListOf<Element>` or `Array<Element>` with all the elements
 * that match the given query selector.
 * @public
 */
export interface CustomQueryHandler {
  queryOne?: (element: Element | Document, selector: string) => Element | null;
  queryAll?: (
    element: Element | Document,
    selector: string
  ) => Element[] | NodeListOf<Element>;
}

function makeQueryHandler(handler: CustomQueryHandler): InternalQueryHandler {
  const internalHandler: InternalQueryHandler = {};

  if (handler.queryOne) {
    const queryOne = handler.queryOne;
    internalHandler.queryOne = async (element, selector) => {
      const jsHandle = await element.evaluateHandle(queryOne, selector);
      const elementHandle = jsHandle.asElement();
      if (elementHandle) {
        return elementHandle;
      }
      await jsHandle.dispose();
      return null;
    };
    internalHandler.waitFor = (
      domWorld: DOMWorld,
      selector: string,
      options: WaitForSelectorOptions
    ) => {
      return domWorld._waitForSelectorInPage(queryOne, selector, options);
    };
  }

  if (handler.queryAll) {
    const queryAll = handler.queryAll;
    internalHandler.queryAll = async (element, selector) => {
      const jsHandle = await element.evaluateHandle(queryAll, selector);
      const properties = await jsHandle.getProperties();
      await jsHandle.dispose();
      const result = [];
      for (const property of properties.values()) {
        const elementHandle = property.asElement();
        if (elementHandle) {
          result.push(elementHandle);
        }
      }
      return result;
    };
    internalHandler.queryAllArray = async (element, selector) => {
      const resultHandle = (await element.evaluateHandle(
        queryAll,
        selector
      )) as JSHandle<Element[] | NodeListOf<Element>>;
      const arrayHandle = await resultHandle.evaluateHandle(res => {
        return Array.from(res);
      });
      return arrayHandle;
    };
  }

  return internalHandler;
}

const _defaultHandler = makeQueryHandler({
  queryOne: (element: Element | Document, selector: string) => {
    return element.querySelector(selector);
  },
  queryAll: (element: Element | Document, selector: string) => {
    return element.querySelectorAll(selector);
  },
});

const pierceHandler = makeQueryHandler({
  queryOne: (element, selector) => {
    let found: Element | null = null;
    const search = (root: Element | ShadowRoot) => {
      const iter = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
      do {
        const currentNode = iter.currentNode as HTMLElement;
        if (currentNode.shadowRoot) {
          search(currentNode.shadowRoot);
        }
        if (currentNode instanceof ShadowRoot) {
          continue;
        }
        if (currentNode !== root && !found && currentNode.matches(selector)) {
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
    const result: Element[] = [];
    const collect = (root: Element | ShadowRoot) => {
      const iter = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
      do {
        const currentNode = iter.currentNode as HTMLElement;
        if (currentNode.shadowRoot) {
          collect(currentNode.shadowRoot);
        }
        if (currentNode instanceof ShadowRoot) {
          continue;
        }
        if (currentNode !== root && currentNode.matches(selector)) {
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

const builtInHandlers = new Map([
  ['aria', ariaHandler],
  ['pierce', pierceHandler],
]);
const queryHandlers = new Map(builtInHandlers);

/**
 * @internal
 */
export function _registerCustomQueryHandler(
  name: string,
  handler: CustomQueryHandler
): void {
  if (queryHandlers.get(name)) {
    throw new Error(`A custom query handler named "${name}" already exists`);
  }

  const isValidName = /^[a-zA-Z]+$/.test(name);
  if (!isValidName) {
    throw new Error(`Custom query handler names may only contain [a-zA-Z]`);
  }

  const internalHandler = makeQueryHandler(handler);

  queryHandlers.set(name, internalHandler);
}

/**
 * @internal
 */
export function _unregisterCustomQueryHandler(name: string): void {
  if (queryHandlers.has(name) && !builtInHandlers.has(name)) {
    queryHandlers.delete(name);
  }
}

/**
 * @internal
 */
export function _customQueryHandlerNames(): string[] {
  return [...queryHandlers.keys()].filter(name => {
    return !builtInHandlers.has(name);
  });
}

/**
 * @internal
 */
export function _clearCustomQueryHandlers(): void {
  _customQueryHandlerNames().forEach(_unregisterCustomQueryHandler);
}

/**
 * @internal
 */
export function _getQueryHandlerAndSelector(selector: string): {
  updatedSelector: string;
  queryHandler: InternalQueryHandler;
} {
  const hasCustomQueryHandler = /^[a-zA-Z]+\//.test(selector);
  if (!hasCustomQueryHandler) {
    return {updatedSelector: selector, queryHandler: _defaultHandler};
  }

  const index = selector.indexOf('/');
  const name = selector.slice(0, index);
  const updatedSelector = selector.slice(index + 1);
  const queryHandler = queryHandlers.get(name);
  if (!queryHandler) {
    throw new Error(
      `Query set to use "${name}", but no query handler of that name was found`
    );
  }

  return {
    updatedSelector,
    queryHandler,
  };
}
