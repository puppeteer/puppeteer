import type {AwaitableIterable} from '../common/types.js';
import {AsyncIterableUtil} from '../util/AsyncIterableUtil.js';
import {isErrorLike} from '../util/ErrorLike.js';

import {ariaQuerySelectorAll} from './ARIAQuerySelector.js';
import {customQuerySelectors} from './CustomQuerySelector.js';
import {parsePSelectors, PSelector} from './PSelectorParser.js';
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

  #deepShadowSelectors: PSelector[][][];
  #shadowSelectors: PSelector[][];
  #selectors: PSelector[];
  #selector: PSelector | undefined;

  elements: AwaitableIterable<Node>;

  constructor(element: Node, selector: string) {
    this.#input = selector.trim();

    if (this.#input.length === 0) {
      throw new SelectorError(this.#input, 'The provided selector is empty.');
    }

    try {
      this.#deepShadowSelectors = parsePSelectors(this.#input);
    } catch (error) {
      if (!isErrorLike(error)) {
        throw new SelectorError(this.#input, String(error));
      }
      throw new SelectorError(this.#input, error.message);
    }

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
      throw new SelectorError(
        this.#input,
        'Multiple deep combinators found in sequence.'
      );
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
      const input = this.#input;
      this.elements = AsyncIterableUtil.flatMap(
        this.elements,
        async function* (element) {
          if (typeof selector === 'string') {
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
            return;
          }

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

  #next() {
    if (this.#selectors.length === 0) {
      if (this.#shadowSelectors.length === 0) {
        if (this.#deepShadowSelectors.length === 0) {
          this.#selector = undefined;
          return;
        }
        this.elements = AsyncIterableUtil.flatMap(
          this.elements,
          function* (element) {
            yield* deepDescendents(element);
          }
        );
        this.#shadowSelectors =
          this.#deepShadowSelectors.shift() as PSelector[][];
      }
      this.elements = AsyncIterableUtil.flatMap(
        this.elements,
        function* (element) {
          yield* deepChildren(element);
        }
      );
      this.#selectors = this.#shadowSelectors.shift() as PSelector[];
    }
    this.#selector = this.#selectors.shift() as PSelector;
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
  const query = new PQueryEngine(root, selector);
  query.run();
  yield* query.elements;
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
