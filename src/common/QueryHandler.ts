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

import { WaitForSelectorOptions, DOMWorld } from './DOMWorld.js';
import { ElementHandle, JSHandle } from './JSHandle.js';
import { ariaHandler } from './AriaQueryHandler.js';

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
  ) => Promise<JSHandle>;
}

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
    internalHandler.queryOne = async (element, selector) => {
      const jsHandle = await element.evaluateHandle(handler.queryOne, selector);
      const elementHandle = jsHandle.asElement();
      if (elementHandle) return elementHandle;
      await jsHandle.dispose();
      return null;
    };
    internalHandler.waitFor = (
      domWorld: DOMWorld,
      selector: string,
      options: WaitForSelectorOptions
    ) => domWorld.waitForSelectorInPage(handler.queryOne, selector, options);
  }

  if (handler.queryAll) {
    internalHandler.queryAll = async (element, selector) => {
      const jsHandle = await element.evaluateHandle(handler.queryAll, selector);
      const properties = await jsHandle.getProperties();
      await jsHandle.dispose();
      const result = [];
      for (const property of properties.values()) {
        const elementHandle = property.asElement();
        if (elementHandle) result.push(elementHandle);
      }
      return result;
    };
    internalHandler.queryAllArray = async (element, selector) => {
      const resultHandle = await element.evaluateHandle(
        handler.queryAll,
        selector
      );
      const arrayHandle = await resultHandle.evaluateHandle(
        (res: Element[] | NodeListOf<Element>) => Array.from(res)
      );
      return arrayHandle;
    };
  }

  return internalHandler;
}

const _defaultHandler = makeQueryHandler({
  queryOne: (element: Element, selector: string) =>
    element.querySelector(selector),
  queryAll: (element: Element, selector: string) =>
    element.querySelectorAll(selector),
});

const _builtInHandlers: Array<[string, InternalQueryHandler]> = [
  ['aria', ariaHandler],
];

const _queryHandlers = new Map<string, InternalQueryHandler>(_builtInHandlers);

export function registerCustomQueryHandler(
  name: string,
  handler: CustomQueryHandler
): void {
  if (_queryHandlers.get(name))
    throw new Error(`A custom query handler named "${name}" already exists`);

  const isValidName = /^[a-zA-Z]+$/.test(name);
  if (!isValidName)
    throw new Error(`Custom query handler names may only contain [a-zA-Z]`);

  const internalHandler = makeQueryHandler(handler);

  _queryHandlers.set(name, internalHandler);
}

/**
 * @param {string} name
 */
export function unregisterCustomQueryHandler(name: string): void {
  if (_queryHandlers.has(name)) {
    _queryHandlers.delete(name);
  }
}

export function customQueryHandlerNames(): string[] {
  return [..._queryHandlers.keys()];
}

export function clearCustomQueryHandlers(): void {
  _queryHandlers.clear();
}

export function getQueryHandlerAndSelector(
  selector: string
): { updatedSelector: string; queryHandler: InternalQueryHandler } {
  const hasCustomQueryHandler = /^[a-zA-Z]+\//.test(selector);
  if (!hasCustomQueryHandler)
    return { updatedSelector: selector, queryHandler: _defaultHandler };

  const index = selector.indexOf('/');
  const name = selector.slice(0, index);
  const updatedSelector = selector.slice(index + 1);
  const queryHandler = _queryHandlers.get(name);
  if (!queryHandler)
    throw new Error(
      `Query set to use "${name}", but no query handler of that name was found`
    );

  return {
    updatedSelector,
    queryHandler,
  };
}
