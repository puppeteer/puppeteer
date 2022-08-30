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
import {ElementHandle} from './ElementHandle.js';
import {Frame} from './Frame.js';
import {
  MAIN_WORLD,
  PUPPETEER_WORLD,
  WaitForSelectorOptions,
} from './IsolatedWorld.js';

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
   * Waits until a single node appears for a given selector and
   * {@link ElementHandle}.
   */
  waitFor?: (
    elementOrFrame: ElementHandle<Node> | Frame,
    selector: string,
    options: WaitForSelectorOptions
  ) => Promise<ElementHandle<Node> | null>;
}

/**
 * Gets the frame and element handle from the provided argument.
 *
 * @returns The frame and **adopted** element handle (if provided).
 *
 * @internal
 */
export async function getFrameAndElement(
  elementOrFrame: ElementHandle<Node>
): Promise<[frame: Frame, handle: ElementHandle<Node>]>;
export async function getFrameAndElement(
  elementOrFrame: ElementHandle<Node> | Frame
): Promise<[frame: Frame, handle?: ElementHandle<Node>]>;
export async function getFrameAndElement(
  elementOrFrame: ElementHandle<Node> | Frame
): Promise<[frame: Frame, handle?: ElementHandle<Node>]> {
  if (elementOrFrame instanceof Frame) {
    return [elementOrFrame];
  } else {
    elementOrFrame = await elementOrFrame.frame.worlds[
      PUPPETEER_WORLD
    ].adoptHandle(elementOrFrame);
    return [elementOrFrame.frame, elementOrFrame];
  }
}

function internalizeCustomQueryHandler(
  handler: CustomQueryHandler
): InternalQueryHandler {
  const internalHandler: InternalQueryHandler = {};

  if (handler.queryOne) {
    const queryOne = handler.queryOne;
    internalHandler.queryOne = async (elementOrFrame, selector) => {
      const [frame, element] = await getFrameAndElement(elementOrFrame);
      const result = await frame.worlds[PUPPETEER_WORLD].evaluateHandle(
        queryOne,
        element,
        selector
      );
      await element.dispose();
      if (!(result instanceof ElementHandle)) {
        await result.dispose();
        return null;
      }
      return frame.worlds[MAIN_WORLD].transferHandle(result);
    };
    internalHandler.waitFor = async (elementOrFrame, selector, options) => {
      const [frame, element] = await getFrameAndElement(elementOrFrame);
      const result = await frame.worlds[PUPPETEER_WORLD]._waitForSelectorInPage(
        queryOne,
        element,
        selector,
        options
      );
      await element?.dispose();
      if (!(result instanceof ElementHandle)) {
        await result?.dispose();
        return null;
      }
      return frame.worlds[MAIN_WORLD].transferHandle(result);
    };
  }

  if (handler.queryAll) {
    const queryAll = handler.queryAll;
    internalHandler.queryAll = async (elementOrFrame, selector) => {
      const [frame, element] = await getFrameAndElement(elementOrFrame);
      let result = await frame.worlds[PUPPETEER_WORLD].evaluateHandle(
        queryAll,
        element,
        selector
      );
      await element.dispose();
      result = await frame.worlds[MAIN_WORLD].transferHandle(result);
      const properties = await result.getProperties();
      await result.dispose();
      return [...properties.values()] as Array<ElementHandle<Node>>;
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
