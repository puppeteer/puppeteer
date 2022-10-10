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

import PuppeteerUtil from '../injected/injected.js';
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
   * @returns A {@link Node} matching the given `selector` from {@link node}.
   */
  queryOne?: (
    node: Node,
    selector: string,
    PuppeteerUtil: PuppeteerUtil
  ) => Node | null;
  /**
   * @returns Some {@link Node}s matching the given `selector` from {@link node}.
   */
  queryAll?: (
    node: Node,
    selector: string,
    PuppeteerUtil: PuppeteerUtil
  ) => Node[];
}

/**
 * @internal
 */
export interface PuppeteerQueryHandler {
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

function createPuppeteerQueryHandler(
  handler: InternalQueryHandler
): PuppeteerQueryHandler {
  const internalHandler: PuppeteerQueryHandler = {};

  if (handler.queryOne) {
    const queryOne = handler.queryOne;
    internalHandler.queryOne = async (element, selector) => {
      const jsHandle = await element.evaluateHandle(
        queryOne,
        selector,
        await element.executionContext()._world!.puppeteerUtil
      );
      const elementHandle = jsHandle.asElement();
      if (elementHandle) {
        return elementHandle;
      }
      await jsHandle.dispose();
      return null;
    };
    internalHandler.waitFor = async (elementOrFrame, selector, options) => {
      let frame: Frame;
      let element: ElementHandle<Node> | undefined;
      if (elementOrFrame instanceof Frame) {
        frame = elementOrFrame;
      } else {
        frame = elementOrFrame.frame;
        element = await frame.worlds[PUPPETEER_WORLD].adoptHandle(
          elementOrFrame
        );
      }
      const result = await frame.worlds[PUPPETEER_WORLD]._waitForSelectorInPage(
        queryOne,
        element,
        selector,
        options
      );
      if (element) {
        await element.dispose();
      }
      if (!result) {
        return null;
      }
      if (!(result instanceof ElementHandle)) {
        await result.dispose();
        return null;
      }
      return frame.worlds[MAIN_WORLD].transferHandle(result);
    };
  }

  if (handler.queryAll) {
    const queryAll = handler.queryAll;
    internalHandler.queryAll = async (element, selector) => {
      const jsHandle = await element.evaluateHandle(
        queryAll,
        selector,
        await element.executionContext()._world!.puppeteerUtil
      );
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
  }

  return internalHandler;
}

const defaultHandler = createPuppeteerQueryHandler({
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

const pierceHandler = createPuppeteerQueryHandler({
  queryOne: (element, selector, {pierceQuerySelector}) => {
    return pierceQuerySelector(element, selector);
  },
  queryAll: (element, selector, {pierceQuerySelectorAll}) => {
    return pierceQuerySelectorAll(element, selector);
  },
});

const xpathHandler = createPuppeteerQueryHandler({
  queryOne: (element, selector, {xpathQuerySelector}) => {
    return xpathQuerySelector(element, selector);
  },
  queryAll: (element, selector, {xpathQuerySelectorAll}) => {
    return xpathQuerySelectorAll(element, selector);
  },
});

const textQueryHandler = createPuppeteerQueryHandler({
  queryOne: (element, selector, {textQuerySelector}) => {
    return textQuerySelector(element, selector);
  },
  queryAll: (element, selector, {textQuerySelectorAll}) => {
    return textQuerySelectorAll(element, selector);
  },
});

interface RegisteredQueryHandler {
  handler: PuppeteerQueryHandler;
  transformSelector?: (selector: string) => string;
}

const INTERNAL_QUERY_HANDLERS = new Map<string, RegisteredQueryHandler>([
  ['aria', {handler: ariaHandler}],
  ['pierce', {handler: pierceHandler}],
  ['xpath', {handler: xpathHandler}],
  ['text', {handler: textQueryHandler}],
]);
const QUERY_HANDLERS = new Map<string, RegisteredQueryHandler>();

/**
 * @deprecated Import {@link Puppeteer} and use the static method
 * {@link Puppeteer.registerCustomQueryHandler}
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

  QUERY_HANDLERS.set(name, {handler: createPuppeteerQueryHandler(handler)});
}

/**
 * @deprecated Import {@link Puppeteer} and use the static method
 * {@link Puppeteer.unregisterCustomQueryHandler}
 *
 * @public
 */
export function unregisterCustomQueryHandler(name: string): void {
  QUERY_HANDLERS.delete(name);
}

/**
 * @deprecated Import {@link Puppeteer} and use the static method
 * {@link Puppeteer.customQueryHandlerNames}
 *
 * @public
 */
export function customQueryHandlerNames(): string[] {
  return [...QUERY_HANDLERS.keys()];
}

/**
 * @deprecated Import {@link Puppeteer} and use the static method
 * {@link Puppeteer.clearCustomQueryHandlers}
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
  queryHandler: PuppeteerQueryHandler;
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
