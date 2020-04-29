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

import {ElementHandle} from './JSHandle';

export interface QueryHandler {
  (element: Element, selector: string): (ElementHandle | null) | ElementHandle[];
}

const _customQueryHandlers = new Map<string, QueryHandler>();

export function registerCustomQueryHandler(name: string, queryFunction: Function): void {
  if (_customQueryHandlers.get(name))
    throw new Error(`A custom query function named "${name}" already exists`);

  const isValidName = /^[a-zA-Z\-]+$/.test(name);
  if (!isValidName)
    throw new Error(`Custom query function names may only contain a-z, A-Z, and -`);

  _customQueryHandlers.set(name, queryFunction as QueryHandler);
}

/**
 * @param {string} name
 */
export function unregisterCustomQueryHandler(name: string): void {
  _customQueryHandlers.delete(name);
}

export function customQueryHandlers(): Map<string, QueryHandler> {
  return _customQueryHandlers;
}

module.exports = {
  registerCustomQueryHandler,
  unregisterCustomQueryHandler,
  customQueryHandlers
};
