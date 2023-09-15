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

import {ariaQuerySelectorAll} from './ARIAQuerySelector.js';
import {customQuerySelectors} from './CustomQuerySelector.js';
import {
  type ComplexPSelector,
  type ComplexPSelectorList,
  type CompoundPSelector,
  type CSSSelector,
  parsePSelectors,
  PCombinator,
  type PPseudoSelector,
} from './PSelectorParser.js';
import {textQuerySelectorAll} from './TextQuerySelector.js';
import {pierce, pierceAll} from './util.js';
import {xpathQuerySelectorAll} from './XPathQuerySelector.js';

const IDENT_TOKEN_START = /[-\w\P{ASCII}*]/;

interface QueryableNode extends Node {
  querySelectorAll: typeof Document.prototype.querySelectorAll;
}

const isQueryableNode = (node: Node): node is QueryableNode => {
  return 'querySelectorAll' in node;
};

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
      }
    }

    for (; this.#selector !== undefined; this.#next()) {
      const selector = this.#selector;
      const input = this.#input;
      if (typeof selector === 'string') {
        // The regular expression tests if the selector is a type/universal
        // selector. Any other case means we want to apply the selector onto
        // the element itself (e.g. `element.class`, `element>div`,
        // `element:hover`, etc.).
        if (selector[0] && IDENT_TOKEN_START.test(selector[0])) {
          this.elements = AsyncIterableUtil.flatMap(
            this.elements,
            async function* (element) {
              if (isQueryableNode(element)) {
                yield* element.querySelectorAll(selector);
              }
            }
          );
        } else {
          this.elements = AsyncIterableUtil.flatMap(
            this.elements,
            async function* (element) {
              if (!element.parentElement) {
                if (!isQueryableNode(element)) {
                  return;
                }
                yield* element.querySelectorAll(selector);
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
                `:scope>:nth-child(${index})${selector}`
              );
            }
          );
        }
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
        this.elements = AsyncIterableUtil.flatMap(this.elements, pierce);
        this.#next();
        break;
      }
      case PCombinator.Descendent: {
        this.elements = AsyncIterableUtil.flatMap(this.elements, pierceAll);
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

class DepthCalculator {
  #cache = new WeakMap<Node, number[]>();

  calculate(node: Node | null, depth: number[] = []): number[] {
    if (node === null) {
      return depth;
    }
    if (node instanceof ShadowRoot) {
      node = node.host;
    }

    const cachedDepth = this.#cache.get(node);
    if (cachedDepth) {
      return [...cachedDepth, ...depth];
    }

    let index = 0;
    for (
      let prevSibling = node.previousSibling;
      prevSibling;
      prevSibling = prevSibling.previousSibling
    ) {
      ++index;
    }

    const value = this.calculate(node.parentNode, [index]);
    this.#cache.set(node, value);
    return [...value, ...depth];
  }
}

const compareDepths = (a: number[], b: number[]): -1 | 0 | 1 => {
  if (a.length + b.length === 0) {
    return 0;
  }
  const [i = -1, ...otherA] = a;
  const [j = -1, ...otherB] = b;
  if (i === j) {
    return compareDepths(otherA, otherB);
  }
  return i < j ? -1 : 1;
};

const domSort = async function* (elements: AwaitableIterable<Node>) {
  const results = new Set<Node>();
  for await (const element of elements) {
    results.add(element);
  }
  const calculator = new DepthCalculator();
  yield* [...results.values()]
    .map(result => {
      return [result, calculator.calculate(result)] as const;
    })
    .sort(([, a], [, b]) => {
      return compareDepths(a, b);
    })
    .map(([result]) => {
      return result;
    });
};

/**
 * Queries the given node for all nodes matching the given text selector.
 *
 * @internal
 */
export const pQuerySelectorAll = function (
  root: Node,
  selector: string
): AwaitableIterable<Node> {
  let selectors: ComplexPSelectorList;
  let isPureCSS: boolean;
  try {
    [selectors, isPureCSS] = parsePSelectors(selector);
  } catch (error) {
    return (root as unknown as QueryableNode).querySelectorAll(selector);
  }

  if (isPureCSS) {
    return (root as unknown as QueryableNode).querySelectorAll(selector);
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

  return domSort(
    AsyncIterableUtil.flatMap(selectors, selectorParts => {
      const query = new PQueryEngine(root, selector, selectorParts);
      void query.run();
      return query.elements;
    })
  );
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
