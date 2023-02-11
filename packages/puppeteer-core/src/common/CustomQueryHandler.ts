/**
 * Copyright 2023 Google Inc. All rights reserved.
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

import {QueryHandler} from './QueryHandler.js';
import {getQueryHandlerByName} from './GetQueryHandler.js';

/**
 * @internal
 */
export const customQueryHandlers = new Map<string, typeof QueryHandler>();

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
  queryAll?: (node: Node, selector: string) => Iterable<Node>;
}

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
  if (getQueryHandlerByName(name)) {
    throw new Error(`A query handler named "${name}" already exists`);
  }

  const isValidName = /^[a-zA-Z]+$/.test(name);
  if (!isValidName) {
    throw new Error(`Custom query handler names may only contain [a-zA-Z]`);
  }

  customQueryHandlers.set(
    name,
    class extends QueryHandler {
      static override querySelector = handler.queryOne;
      static override querySelectorAll = handler.queryAll;
    }
  );
}

/**
 * @deprecated Import {@link Puppeteer} and use the static method
 * {@link Puppeteer.unregisterCustomQueryHandler}
 *
 * @public
 */
export function unregisterCustomQueryHandler(name: string): void {
  customQueryHandlers.delete(name);
}

/**
 * @deprecated Import {@link Puppeteer} and use the static method
 * {@link Puppeteer.customQueryHandlerNames}
 *
 * @public
 */
export function customQueryHandlerNames(): string[] {
  return [...customQueryHandlers.keys()];
}

/**
 * @deprecated Import {@link Puppeteer} and use the static method
 * {@link Puppeteer.clearCustomQueryHandlers}
 *
 * @public
 */
export function clearCustomQueryHandlers(): void {
  customQueryHandlers.clear();
}
