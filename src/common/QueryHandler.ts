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

import {ariaHandler} from './AriaQueryHandler.js';
import {IsolatedWorld, WaitForSelectorOptions} from './IsolatedWorld.js';
import {ElementHandle} from './ElementHandle.js';
import {JSHandle} from './JSHandle.js';

/**
 * @public
 */
export interface CustomQueryHandler {
  /**
   * @returns A {@link Node} matching the given `selector` from {@link node}.
   */
  queryOne?: (node: Node, selector: string) => Node | null;
  /**
   * @returns Some {@link Node}s matching the given `selector` from {@link node}.
   */
  queryAll?: (node: Node, selector: string) => Node[];
}

/**
 * @internal
 */
export interface InternalQueryHandler {
  /**
   * Queries for a single node given a selector and {@link ElementHandle}.
   *
   * Akin to {@link Window.prototype.querySelector}.
   */
  queryOne?: (
    element: ElementHandle<Node>,
    selector: string
  ) => Promise<ElementHandle<Node> | null>;
  /**
   * Queries for multiple nodes given a selector and {@link ElementHandle}.
   *
   * Akin to {@link Window.prototype.querySelectorAll}.
   */
  queryAll?: (
    element: ElementHandle<Node>,
    selector: string
  ) => Promise<Array<ElementHandle<Node>>>;
  /**
   * Queries for multiple nodes given a selector and {@link ElementHandle}.
   * Unlike {@link queryAll}, this returns a handle to a node array.
   *
   * Akin to {@link Window.prototype.querySelectorAll}.
   */
  queryAllArray?: (
    element: ElementHandle<Node>,
    selector: string
  ) => Promise<JSHandle<Node[]>>;

  /**
   * Waits until a single node appears for a given selector and
   * {@link ElementHandle}.
   *
   * Akin to {@link Window.prototype.querySelectorAll}.
   */
  waitFor?: (
    isolatedWorld: IsolatedWorld,
    selector: string,
    options: WaitForSelectorOptions
  ) => Promise<ElementHandle<Node> | null>;
}

function internalizeCustomQueryHandler(
  handler: CustomQueryHandler
): InternalQueryHandler {
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
      domWorld: IsolatedWorld,
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

const defaultHandler = internalizeCustomQueryHandler({
  queryOne: (element, selector) => {
    if (!('querySelector' in element)) {
      throw new Error(
        `Could not invoke \`querySelector\` on node of type ${element.nodeName}.`
      );
    }
    return (
      element as unknown as {querySelector(selector: string): Element}
    ).querySelector(selector);
  },
  queryAll: (element, selector) => {
    if (!('querySelectorAll' in element)) {
      throw new Error(
        `Could not invoke \`querySelectorAll\` on node of type ${element.nodeName}.`
      );
    }
    return [
      ...(
        element as unknown as {
          querySelectorAll(selector: string): NodeList;
        }
      ).querySelectorAll(selector),
    ];
  },
});

const pierceHandler = internalizeCustomQueryHandler({
  queryOne: (element, selector) => {
    let found: Node | null = null;
    const search = (root: Node) => {
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
    const result: Node[] = [];
    const collect = (root: Node) => {
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

const xpathHandler = internalizeCustomQueryHandler({
  queryOne: (element, selector) => {
    const doc = element.ownerDocument || document;
    const result = doc.evaluate(
      selector,
      element,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE
    );
    return result.singleNodeValue;
  },

  queryAll: (element, selector) => {
    const doc = element.ownerDocument || document;
    const iterator = doc.evaluate(
      selector,
      element,
      null,
      XPathResult.ORDERED_NODE_ITERATOR_TYPE
    );
    const array: Node[] = [];
    let item;
    while ((item = iterator.iterateNext())) {
      array.push(item);
    }
    return array;
  },
});

interface RegisteredQueryHandler {
  handler: InternalQueryHandler;
  transformSelector?: (selector: string) => string;
}

const INTERNAL_QUERY_HANDLERS = new Map<string, RegisteredQueryHandler>([
  ['aria', {handler: ariaHandler}],
  ['pierce', {handler: pierceHandler}],
  ['xpath', {handler: xpathHandler}],
]);
const QUERY_HANDLERS = new Map<string, RegisteredQueryHandler>();

/**
 * Registers a {@link CustomQueryHandler | custom query handler}.
 *
 * @remarks
 * After registration, the handler can be used everywhere where a selector is
 * expected by prepending the selection string with `<name>/`. The name is only
 * allowed to consist of lower- and upper case latin letters.
 *
 * @example
 *
 * ```
 * puppeteer.registerCustomQueryHandler('text', { … });
 * const aHandle = await page.$('text/…');
 * ```
 *
 * @param name - The name that the custom query handler will be registered
 * under.
 * @param queryHandler - The {@link CustomQueryHandler | custom query handler}
 * to register.
 *
 * @public
 */
export function registerCustomQueryHandler(
  name: string,
  handler: CustomQueryHandler
): void {
  if (INTERNAL_QUERY_HANDLERS.has(name)) {
    throw new Error(`A query handler named "${name}" already exists`);
  }
  if (QUERY_HANDLERS.has(name)) {
    throw new Error(`A custom query handler named "${name}" already exists`);
  }

  const isValidName = /^[a-zA-Z]+$/.test(name);
  if (!isValidName) {
    throw new Error(`Custom query handler names may only contain [a-zA-Z]`);
  }

  QUERY_HANDLERS.set(name, {handler: internalizeCustomQueryHandler(handler)});
}

/**
 * @param name - The name of the query handler to unregistered.
 *
 * @public
 */
export function unregisterCustomQueryHandler(name: string): void {
  QUERY_HANDLERS.delete(name);
}

/**
 * @returns a list with the names of all registered custom query handlers.
 *
 * @public
 */
export function customQueryHandlerNames(): string[] {
  return [...QUERY_HANDLERS.keys()];
}

/**
 * Clears all registered handlers.
 *
 * @public
 */
export function clearCustomQueryHandlers(): void {
  QUERY_HANDLERS.clear();
}

const CUSTOM_QUERY_SEPARATORS = ['=', '/'];

/**
 * @internal
 */
export function getQueryHandlerAndSelector(selector: string): {
  updatedSelector: string;
  queryHandler: InternalQueryHandler;
} {
  for (const handlerMap of [QUERY_HANDLERS, INTERNAL_QUERY_HANDLERS]) {
    for (const [
      name,
      {handler: queryHandler, transformSelector},
    ] of handlerMap) {
      for (const separator of CUSTOM_QUERY_SEPARATORS) {
        const prefix = `${name}${separator}`;
        if (selector.startsWith(prefix)) {
          selector = selector.slice(prefix.length);
          if (transformSelector) {
            selector = transformSelector(selector);
          }
          return {updatedSelector: selector, queryHandler};
        }
      }
    }
  }
  return {updatedSelector: selector, queryHandler: defaultHandler};
}
