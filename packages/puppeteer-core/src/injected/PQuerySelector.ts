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

import type {AwaitableIterable} from '../common/types.js';
import {AsyncIterableUtil} from '../util/AsyncIterableUtil.js';
import {isErrorLike} from '../util/ErrorLike.js';

import {ariaQuerySelectorAll} from './ARIAQuerySelector.js';
import {customQuerySelectors} from './CustomQuerySelector.js';
import {
  ComplexPSelector,
  ComplexPSelectorList,
  CompoundPSelector,
  CSSSelector,
  parsePSelectors,
  PCombinator,
  PPseudoSelector,
} from './PSelectorParser.js';
import {textQuerySelectorAll} from './TextQuerySelector.js';
import {deepChildren, deepDescendents} from './util.js';
import {xpathQuerySelectorAll} from './XPathQuerySelector.js';

class SelectorError extends Error {
  constructor(selector: string, message: string) {
    super(`${selector} is not a valid selector: ${message}`);
  }
}

class PQueryEngine {
  #input: string;

  #complexSelector: ComplexPSelector;
  #compoundSelector: CompoundPSelector = [];
  #selector: CSSSelector | PPseudoSelector | undefined = undefined;

  elements: AwaitableIterable<Node>;

  constructor(element: Node, input: string, complexSelector: ComplexPSelector) {
    this.elements = [element];
    this.#input = input;
    this.#complexSelector = complexSelector;
    this.#next();
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
      const input = this.#input;
      if (typeof selector === 'string') {
        this.elements = AsyncIterableUtil.flatMap(
          this.elements,
          async function* (element) {
            if (!element.parentElement) {
              yield* (element as Element).querySelectorAll(selector);
              return;
            }

            let index = 0;
            for (const child of element.parentElement.children) {
              ++index;
              if (child === element) {
                break;
              }
            }
            yield* element.parentElement.querySelectorAll(
              `:scope > :nth-child(${index})${selector}`
            );
          }
        );
      } else {
        this.elements = AsyncIterableUtil.flatMap(
          this.elements,
          async function* (element) {
            switch (selector.name) {
              case 'text':
                yield* textQuerySelectorAll(element, selector.value);
                break;
              case 'xpath':
                yield* xpathQuerySelectorAll(element, selector.value);
                break;
              case 'aria':
                yield* ariaQuerySelectorAll(element, selector.value);
                break;
              default:
                const querySelector = customQuerySelectors.get(selector.name);
                if (!querySelector) {
                  throw new SelectorError(
                    input,
                    `Unknown selector type: ${selector.name}`
                  );
                }
                yield* querySelector.querySelectorAll(element, selector.value);
            }
          }
        );
      }
    }
  }

  #next() {
    if (this.#compoundSelector.length !== 0) {
      this.#selector = this.#compoundSelector.shift();
      return;
    }
    if (this.#complexSelector.length === 0) {
      this.#selector = undefined;
      return;
    }
    const selector = this.#complexSelector.shift();
    switch (selector) {
      case PCombinator.Child: {
        this.elements = AsyncIterableUtil.flatMap(
          this.elements,
          function* (element) {
            yield* deepChildren(element);
          }
        );
        this.#next();
        break;
      }
      case PCombinator.Descendent: {
        this.elements = AsyncIterableUtil.flatMap(
          this.elements,
          function* (element) {
            yield* deepDescendents(element);
          }
        );
        this.#next();
        break;
      }
      default:
        this.#compoundSelector = selector as CompoundPSelector;
        this.#next();
        break;
    }
  }
}

/**
 * Queries the given node for all nodes matching the given text selector.
 *
 * @internal
 */
export const pQuerySelectorAll = async function* (
  root: Node,
  selector: string
): AwaitableIterable<Node> {
  let selectors: ComplexPSelectorList;
  try {
    selectors = parsePSelectors(selector);
  } catch (error) {
    if (!isErrorLike(error)) {
      throw new SelectorError(selector, String(error));
    }
    throw new SelectorError(selector, error.message);
  }

  // If there are any empty elements, then this implies the selector has
  // contiguous combinators (e.g. `>>> >>>>`) or starts/ends with one which we
  // treat as illegal, similar to existing behavior.
  if (
    selectors.some(parts => {
      let i = 0;
      return parts.some(parts => {
        if (typeof parts === 'string') {
          ++i;
        } else {
          i = 0;
        }
        return i > 1;
      });
    })
  ) {
    throw new SelectorError(
      selector,
      'Multiple deep combinators found in sequence.'
    );
  }

  for (const selectorParts of selectors) {
    const query = new PQueryEngine(root, selector, selectorParts);
    query.run();
    yield* query.elements;
  }
};

/**
 * Queries the given node for all nodes matching the given text selector.
 *
 * @internal
 */
export const pQuerySelector = async function (
  root: Node,
  selector: string
): Promise<Node | null> {
  for await (const element of pQuerySelectorAll(root, selector)) {
    return element;
  }
  return null;
};
