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

import {ARIAQueryHandler} from './AriaQueryHandler.js';
import {customQueryHandlers} from './CustomQueryHandler.js';
import {PierceQueryHandler} from './PierceQueryHandler.js';
import {PQueryHandler} from './PQueryHandler.js';
import type {QueryHandler} from './QueryHandler.js';
import {TextQueryHandler} from './TextQueryHandler.js';
import {XPathQueryHandler} from './XPathQueryHandler.js';

export const BUILTIN_QUERY_HANDLERS = Object.freeze({
  aria: ARIAQueryHandler,
  pierce: PierceQueryHandler,
  xpath: XPathQueryHandler,
  text: TextQueryHandler,
});

const QUERY_SEPARATORS = ['=', '/'];

/**
 * @internal
 */
export function getQueryHandlerByName(
  name: string
): typeof QueryHandler | undefined {
  if (name in BUILTIN_QUERY_HANDLERS) {
    return BUILTIN_QUERY_HANDLERS[name as 'aria'];
  }
  return customQueryHandlers.get(name);
}

/**
 * @internal
 */
export function getQueryHandlerAndSelector(selector: string): {
  updatedSelector: string;
  QueryHandler: typeof QueryHandler;
} {
  for (const handlerMap of [
    customQueryHandlers.names().map(name => {
      return [name, customQueryHandlers.get(name)!] as const;
    }),
    Object.entries(BUILTIN_QUERY_HANDLERS),
  ]) {
    for (const [name, QueryHandler] of handlerMap) {
      for (const separator of QUERY_SEPARATORS) {
        const prefix = `${name}${separator}`;
        if (selector.startsWith(prefix)) {
          selector = selector.slice(prefix.length);
          return {updatedSelector: selector, QueryHandler};
        }
      }
    }
  }
  return {updatedSelector: selector, QueryHandler: PQueryHandler};
}
