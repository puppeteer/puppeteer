/**
 * Copyright 2022 Google Inc. All rights reserved.
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

import {ElementHandle} from '../api/ElementHandle.js';
import {getQueryHandlerByName} from './GetQueryHandler.js';
import {IterableUtil} from './IterableUtil.js';
import {parsePSelectors, PSelector} from './PSelectorParser.js';
import {AwaitableIterable} from './types.js';
import {
  deepChildren,
  deepDescendents,
  transposeIterableHandle,
} from './util.js';

/**
 * Common state for {@link PQueryAllEngine}.
 */
export class PQueryEngine {
  #deepShadowSelectors: PSelector[][][];
  #shadowSelectors: PSelector[][];
  #selectors: PSelector[];
  #selector: PSelector | undefined;

  elements: AwaitableIterable<ElementHandle<Node>>;

  constructor(element: ElementHandle<Node>, selector: string) {
    selector = selector.trim();
    if (selector.length === 0) {
      throw new Error('The provided selector is empty.');
    }
    this.#deepShadowSelectors = parsePSelectors(selector);

    // If there are any empty elements, then this implies the selector has
    // contiguous combinators (e.g. `>>> >>>>`) or starts/ends with one which we
    // treat as illegal, similar to existing behavior.
    if (
      this.#deepShadowSelectors.some(shadowSelectors => {
        return shadowSelectors.some(selectors => {
          return selectors.length === 0;
        });
      })
    ) {
      throw new Error(`${selector} is not a valid selector.`);
    }

    this.#shadowSelectors = this.#deepShadowSelectors.shift() as PSelector[][];
    this.#selectors = this.#shadowSelectors.shift() as PSelector[];
    this.#selector = this.#selectors.shift();
    this.elements = [element];
  }

  async run(): Promise<void> {
    if (typeof this.#selector === 'string') {
      switch (this.#selector.trimStart()) {
        case ':scope':
          // `:scope` has some special behavior depending on the node. It always
          // represents the current node within a compound selector, but by
          // itself, it depends on the node. For example, Document is
          // represented by `<html>`, but any HTMLElement is not represented by
          // itself (i.e. `null`). This can be troublesome if our combinators
          // are used right after so we treat this selector specially.
          this.#next();
          break;
        default:
          /**
           * We add the space since `.foo` will interpolate incorrectly (see
           * {@link PQueryAllEngine.query}). This is always equivalent.
           */
          this.#selector = ` ${this.#selector}`;
          break;
      }
    }

    for (; this.#selector !== undefined; this.#next()) {
      const selector = this.#selector;
      this.elements = IterableUtil.flatMap(
        this.elements,
        async function* (element) {
          if (typeof selector === 'string') {
            const matches = await element.evaluateHandle(
              (element, selector) => {
                if (!element.parentElement) {
                  return (element as Element).querySelectorAll(selector);
                }
                let index = 0;
                for (const child of element.parentElement.children) {
                  ++index;
                  if (child === element) {
                    break;
                  }
                }
                return element.parentElement.querySelectorAll(
                  `:scope > :nth-child(${index})${selector}`
                );
              },
              selector
            );
            yield* transposeIterableHandle(matches);
          } else {
            const handler = getQueryHandlerByName(selector.name);
            if (!handler) {
              throw new Error(`${selector} is not a valid selector.`);
            }
            yield* handler.queryAll(element, selector.value);
          }
        }
      );
    }
  }

  #next() {
    if (this.#selectors.length === 0) {
      if (this.#shadowSelectors.length === 0) {
        if (this.#deepShadowSelectors.length === 0) {
          this.#selector = undefined;
          return;
        }
        this.elements = IterableUtil.flatMap(
          this.elements,
          async function* (element) {
            try {
              yield* deepDescendents(element);
            } finally {
              await element.dispose();
            }
          }
        );
        this.#shadowSelectors =
          this.#deepShadowSelectors.shift() as PSelector[][];
      }
      this.elements = IterableUtil.flatMap(
        this.elements,
        async function* (element) {
          try {
            yield* deepChildren(element);
          } finally {
            await element.dispose();
          }
        }
      );
      this.#selectors = this.#shadowSelectors.shift() as PSelector[];
    }
    this.#selector = this.#selectors.shift() as PSelector;
  }
}
