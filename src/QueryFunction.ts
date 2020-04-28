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

export interface QueryFunction {
  (element: Element, selector: string): (ElementHandle | null) | ElementHandle[];
}

const _customQueryFunctions = new Map<string, QueryFunction>();

export function registerCustomQueryFunction(name: string, queryFunction: Function): void {
  if (_customQueryFunctions.get(name))
    throw new Error(`A custom query function named "${name}" already exists`);

  const isValidName = /^[a-zA-Z]+$/.test(name);
  if (!isValidName)
    throw new Error(`Custom query function names may only contain [a-zA-Z]`);

  _customQueryFunctions.set(name, queryFunction as QueryFunction);
}

/**
 * @param {string} name
 */
export function unregisterCustomQueryFunction(name: string): void {
  _customQueryFunctions.delete(name);
}

export function customQueryFunctions(): Map<string, QueryFunction> {
  return _customQueryFunctions;
}

module.exports = {
  registerCustomQueryFunction,
  unregisterCustomQueryFunction,
  customQueryFunctions
};
