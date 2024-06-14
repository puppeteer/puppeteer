/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {ARIAQueryHandler} from '../cdp/AriaQueryHandler.js';

import {CSSQueryHandler} from './CSSQueryHandler.js';
import {customQueryHandlers} from './CustomQueryHandler.js';
import {PierceQueryHandler} from './PierceQueryHandler.js';
import {PQueryHandler} from './PQueryHandler.js';
import {parsePSelectors} from './PSelectorParser.js';
import type {QueryHandler} from './QueryHandler.js';
import {TextQueryHandler} from './TextQueryHandler.js';
import {XPathQueryHandler} from './XPathQueryHandler.js';

const BUILTIN_QUERY_HANDLERS = {
  aria: ARIAQueryHandler,
  pierce: PierceQueryHandler,
  xpath: XPathQueryHandler,
  text: TextQueryHandler,
} as const;

const QUERY_SEPARATORS = ['=', '/'];

/**
 * @internal
 */
export function getQueryHandlerAndSelector(selector: string): {
  updatedSelector: string;
  selectorHasPseudoClasses: boolean;
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
          return {
            updatedSelector: selector,
            selectorHasPseudoClasses: false,
            QueryHandler,
          };
        }
      }
    }
  }
  try {
    const [pSelector, isPureCSS, hasPseudoClasses] = parsePSelectors(selector);
    if (isPureCSS) {
      return {
        updatedSelector: selector,
        selectorHasPseudoClasses: hasPseudoClasses,
        QueryHandler: CSSQueryHandler,
      };
    }
    return {
      updatedSelector: JSON.stringify(pSelector),
      selectorHasPseudoClasses: hasPseudoClasses,
      QueryHandler: PQueryHandler,
    };
  } catch {
    return {
      updatedSelector: selector,
      selectorHasPseudoClasses: false,
      QueryHandler: CSSQueryHandler,
    };
  }
}
