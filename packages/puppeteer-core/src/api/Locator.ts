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

import {TimeoutError} from '../common/Errors.js';
import {EventEmitter} from '../common/EventEmitter.js';
import {Awaitable, HandleFor, NodeFor} from '../common/types.js';
import {debugError} from '../common/util.js';
import {isErrorLike} from '../util/ErrorLike.js';

import {BoundingBox, ClickOptions, ElementHandle} from './ElementHandle.js';
import type {Frame} from './Frame.js';
import type {Page} from './Page.js';

interface LocatorContext<T> {
  conditions?: Set<ActionCondition<T>>;
}

const LOCATOR_CONTEXTS = new WeakMap<Locator<unknown>, LocatorContext<never>>();

/**
 * @public
 */
export type VisibilityOption = 'hidden' | 'visible' | null;

/**
 * @public
 */
export interface LocatorOptions {
  /**
   * Whether to wait for the element to be `visible` or `hidden`. `null` to
   * disable visibility checks.
   */
  visibility: VisibilityOption;
  /**
   * Total timeout for the entire locator operation.
   *
   * Pass `0` to disable timeout.
   *
   * @defaultValue `Page.getDefaultTimeout()`
   */
  timeout: number;
  /**
   * Whether to scroll the element into viewport if not in the viewprot already.
   * @defaultValue `true`
   */
  ensureElementIsInTheViewport: boolean;
  /**
   * Whether to wait for input elements to become enabled before the action.
   * Applicable to `click` and `fill` actions.
   * @defaultValue `true`
   */
  waitForEnabled: boolean;
  /**
   * Whether to wait for the element's bounding box to be same between two
   * animation frames.
   * @defaultValue `true`
   */
  waitForStableBoundingBox: boolean;
}

/**
 * Timeout for individual operations inside the locator. On errors the
 * operation is retried as long as {@link Locator.setTimeout} is not
 * exceeded. This timeout should be generally much lower as locating an
 * element means multiple asynchronious operations.
 */
const CONDITION_TIMEOUT = 1_000;
const WAIT_FOR_FUNCTION_DELAY = 100;

/**
 * @internal
 */
export type ActionCondition<T> = (
  element: HandleFor<T>,
  signal: AbortSignal
) => Promise<void>;

/**
 * @public
 */
export type Predicate<From, To extends From = From> =
  | ((value: From) => value is To)
  | ((value: From) => Awaitable<boolean>);

/**
 * @public
 */
export interface ActionOptions {
  signal?: AbortSignal;
}

/**
 * @public
 */
export type LocatorClickOptions = ClickOptions & ActionOptions;

/**
 * @public
 */
export interface LocatorScrollOptions extends ActionOptions {
  scrollTop?: number;
  scrollLeft?: number;
}

/**
 * All the events that a locator instance may emit.
 *
 * @public
 */
export enum LocatorEmittedEvents {
  /**
   * Emitted every time before the locator performs an action on the located element(s).
   */
  Action = 'action',
}

/**
 * @public
 */
export interface LocatorEventObject {
  [LocatorEmittedEvents.Action]: never;
}

type UnionLocatorOf<T> = T extends Array<Locator<infer S>> ? S : never;

/**
 * Locators describe a strategy of locating elements and performing an action on
 * them. If the action fails because the element is not ready for the action,
 * the whole operation is retried. Various preconditions for a successful action
 * are checked automatically.
 *
 * @public
 */
export abstract class Locator<T> extends EventEmitter {
  /**
   * Used for nominally typing {@link Locator}.
   */
  declare _?: T;

  /**
   * @internal
   */
  static create<Selector extends string>(
    pageOrFrame: Page | Frame,
    selector: Selector
  ): Locator<NodeFor<Selector>> {
    return new NodeLocator<NodeFor<Selector>>(pageOrFrame, selector).setTimeout(
      'getDefaultTimeout' in pageOrFrame
        ? pageOrFrame.getDefaultTimeout()
        : pageOrFrame.page().getDefaultTimeout()
    );
  }

  /**
   * Creates a race between multiple locators but ensures that only a single one
   * acts.
   */
  static race<Locators extends Array<Locator<unknown>>>(
    locators: Locators
  ): Locator<UnionLocatorOf<Locators>> {
    return new RaceLocator(
      locators as Array<Locator<UnionLocatorOf<Locators>>>
    );
  }

  /**
   * Creates an expectation that is evaluated against located values.
   *
   * If the expectations do not match, then the locator will retry.
   *
   * @internal
   */
  expect<S extends T>(predicate: Predicate<T, S>): Locator<S> {
    return new ExpectedLocator(this, predicate);
  }

  override on<K extends keyof LocatorEventObject>(
    eventName: K,
    handler: (event: LocatorEventObject[K]) => void
  ): this {
    return super.on(eventName, handler);
  }

  override once<K extends keyof LocatorEventObject>(
    eventName: K,
    handler: (event: LocatorEventObject[K]) => void
  ): this {
    return super.once(eventName, handler);
  }

  override off<K extends keyof LocatorEventObject>(
    eventName: K,
    handler: (event: LocatorEventObject[K]) => void
  ): this {
    return super.off(eventName, handler);
  }

  abstract setVisibility(visibility: VisibilityOption): this;

  abstract setTimeout(timeout: number): this;

  abstract setEnsureElementIsInTheViewport(value: boolean): this;

  abstract setWaitForEnabled(value: boolean): this;

  abstract setWaitForStableBoundingBox(value: boolean): this;

  abstract click<ElementType extends Element>(
    this: Locator<ElementType>,
    options?: Readonly<LocatorClickOptions>
  ): Promise<void>;

  /**
   * Fills out the input identified by the locator using the provided value. The
   * type of the input is determined at runtime and the appropriate fill-out
   * method is chosen based on the type. contenteditable, selector, inputs are
   * supported.
   */
  abstract fill<ElementType extends Element>(
    this: Locator<ElementType>,
    value: string,
    options?: Readonly<ActionOptions>
  ): Promise<void>;

  abstract hover<ElementType extends Element>(
    this: Locator<ElementType>,
    options?: Readonly<ActionOptions>
  ): Promise<void>;

  abstract scroll<ElementType extends Element>(
    this: Locator<ElementType>,
    options?: Readonly<LocatorScrollOptions>
  ): Promise<void>;
}

/**
 * @internal
 */
export class NodeLocator<T extends Node> extends Locator<T> {
  #pageOrFrame: Page | Frame;
  #selector: string;
  #visibility: VisibilityOption = 'visible';
  #timeout = 30_000;
  #ensureElementIsInTheViewport = true;
  #waitForEnabled = true;
  #waitForStableBoundingBox = true;

  constructor(pageOrFrame: Page | Frame, selector: string) {
    super();
    this.#pageOrFrame = pageOrFrame;
    this.#selector = selector;
  }

  setVisibility(visibility: VisibilityOption): this {
    this.#visibility = visibility;
    return this;
  }

  setTimeout(timeout: number): this {
    this.#timeout = timeout;
    return this;
  }

  setEnsureElementIsInTheViewport(value: boolean): this {
    this.#ensureElementIsInTheViewport = value;
    return this;
  }

  setWaitForEnabled(value: boolean): this {
    this.#waitForEnabled = value;
    return this;
  }

  setWaitForStableBoundingBox(value: boolean): this {
    this.#waitForStableBoundingBox = value;
    return this;
  }

  /**
   * Retries the `fn` until a truthy result is returned.
   */
  async #waitForFunction(
    fn: (signal: AbortSignal) => unknown,
    signal?: AbortSignal,
    timeout = CONDITION_TIMEOUT
  ): Promise<void> {
    let isActive = true;
    let controller: AbortController;
    // If the loop times out, we abort only the last iteration's controller.
    const timeoutId = timeout
      ? setTimeout(() => {
          isActive = false;
          controller?.abort();
        }, timeout)
      : 0;
    // If the user's signal aborts, we abort the last iteration and the loop.
    signal?.addEventListener(
      'abort',
      () => {
        controller?.abort();
        isActive = false;
        clearTimeout(timeoutId);
      },
      {once: true}
    );
    while (isActive) {
      controller = new AbortController();
      try {
        const result = await fn(controller.signal);
        if (result) {
          clearTimeout(timeoutId);
          return;
        }
      } catch (err) {
        if (isErrorLike(err)) {
          debugError(err);
          // Retry on all timeouts.
          if (err instanceof TimeoutError) {
            continue;
          }
          // Abort error are ignored as they only affect one iteration.
          if (err.name === 'AbortError') {
            continue;
          }
        }
        throw err;
      } finally {
        // We abort any operations that might have been started by `fn`, because
        // the iteration is now over.
        controller.abort();
      }
      await new Promise(resolve => {
        return setTimeout(resolve, WAIT_FOR_FUNCTION_DELAY);
      });
    }
    signal?.throwIfAborted();
    throw new TimeoutError(
      `waitForFunction timed out. The timeout is ${timeout}ms.`
    );
  }

  /**
   * Checks if the element is in the viewport and auto-scrolls it if it is not.
   */
  #ensureElementIsInTheViewportIfNeeded = async <ElementType extends Element>(
    element: HandleFor<ElementType>,
    signal?: AbortSignal
  ): Promise<void> => {
    if (!this.#ensureElementIsInTheViewport) {
      return;
    }
    // Side-effect: this also checks if it is connected.
    const isIntersectingViewport = await element.isIntersectingViewport({
      threshold: 0,
    });
    signal?.throwIfAborted();
    if (!isIntersectingViewport) {
      await element.scrollIntoView();
      signal?.throwIfAborted();
      await this.#waitForFunction(async () => {
        return await element.isIntersectingViewport({
          threshold: 0,
        });
      }, signal);
      signal?.throwIfAborted();
    }
  };

  /**
   * Waits for the element to become visible or hidden. visibility === 'visible'
   * means that the element has a computed style, the visibility property other
   * than 'hidden' or 'collapse' and non-empty bounding box. visibility ===
   * 'hidden' means the opposite of that.
   */
  #waitForVisibilityIfNeeded = async <ElementType extends Element>(
    element: HandleFor<ElementType>,
    signal?: AbortSignal
  ): Promise<void> => {
    if (this.#visibility === null) {
      return;
    }
    if (this.#visibility === 'hidden') {
      await this.#waitForFunction(async () => {
        return element.isHidden();
      }, signal);
    }
    await this.#waitForFunction(async () => {
      return element.isVisible();
    }, signal);
  };

  /**
   * If the element has a "disabled" property, wait for the element to be
   * enabled.
   */
  #waitForEnabledIfNeeded = async <ElementType extends Element>(
    element: HandleFor<ElementType>,
    signal?: AbortSignal
  ): Promise<void> => {
    if (!this.#waitForEnabled) {
      return;
    }
    await this.#pageOrFrame.waitForFunction(
      el => {
        if ('disabled' in el && typeof el.disabled === 'boolean') {
          return !el.disabled;
        }
        return true;
      },
      {
        timeout: CONDITION_TIMEOUT,
        signal,
      },
      element
    );
  };

  /**
   * Compares the bounding box of the element for two consecutive animation
   * frames and waits till they are the same.
   */
  #waitForStableBoundingBoxIfNeeded = async <ElementType extends Element>(
    element: HandleFor<ElementType>,
    signal?: AbortSignal
  ): Promise<void> => {
    if (!this.#waitForStableBoundingBox) {
      return;
    }
    function getClientRect() {
      return element.evaluate(el => {
        return new Promise<[BoundingBox, BoundingBox]>(resolve => {
          window.requestAnimationFrame(() => {
            const rect1 = el.getBoundingClientRect();
            window.requestAnimationFrame(() => {
              const rect2 = el.getBoundingClientRect();
              resolve([
                {
                  x: rect1.x,
                  y: rect1.y,
                  width: rect1.width,
                  height: rect1.height,
                },
                {
                  x: rect2.x,
                  y: rect2.y,
                  width: rect2.width,
                  height: rect2.height,
                },
              ]);
            });
          });
        });
      });
    }
    await this.#waitForFunction(async () => {
      const [rect1, rect2] = await getClientRect();
      return (
        rect1.x === rect2.x &&
        rect1.y === rect2.y &&
        rect1.width === rect2.width &&
        rect1.height === rect2.height
      );
    }, signal);
  };

  #run(
    action: (el: HandleFor<T>) => Promise<void>,
    signal?: AbortSignal,
    conditions: Array<ActionCondition<T>> = []
  ) {
    const globalConditions = [
      ...(LOCATOR_CONTEXTS.get(this)?.conditions?.values() ?? []),
    ] as Array<ActionCondition<T>>;
    const allConditions = conditions.concat(globalConditions);
    return this.#waitForFunction(
      async signal => {
        // 1. Select the element without visibility checks.
        const element = (await this.#pageOrFrame.waitForSelector(
          this.#selector,
          {
            visible: false,
            timeout: this.#timeout,
            signal,
          }
        )) as HandleFor<T> | null;
        // Retry if no element is found.
        if (!element) {
          return false;
        }
        try {
          signal?.throwIfAborted();
          // 2. Perform action specific checks.
          await Promise.all(
            allConditions.map(check => {
              return check(element, signal);
            })
          );
          signal?.throwIfAborted();
          // 3. Perform the action
          this.emit(LocatorEmittedEvents.Action);
          await action(element);
          return true;
        } finally {
          void element.dispose().catch(debugError);
        }
      },
      signal,
      this.#timeout
    );
  }

  async click<ElementType extends Element>(
    this: NodeLocator<ElementType>,
    options?: Readonly<LocatorClickOptions>
  ): Promise<void> {
    return await this.#run(
      async element => {
        await element.click(options);
      },
      options?.signal,
      [
        this.#ensureElementIsInTheViewportIfNeeded,
        this.#waitForVisibilityIfNeeded,
        this.#waitForEnabledIfNeeded,
        this.#waitForStableBoundingBoxIfNeeded,
      ]
    );
  }

  /**
   * Fills out the input identified by the locator using the provided value. The
   * type of the input is determined at runtime and the appropriate fill-out
   * method is chosen based on the type. contenteditable, selector, inputs are
   * supported.
   */
  fill<ElementType extends Element>(
    this: NodeLocator<ElementType>,
    value: string,
    options?: Readonly<ActionOptions>
  ): Promise<void> {
    return this.#run(
      async element => {
        const input = element as unknown as ElementHandle<HTMLElement>;
        const inputType = await input.evaluate(el => {
          if (el instanceof HTMLSelectElement) {
            return 'select';
          }
          if (el instanceof HTMLInputElement) {
            if (
              new Set([
                'textarea',
                'text',
                'url',
                'tel',
                'search',
                'password',
                'number',
                'email',
              ]).has(el.type)
            ) {
              return 'typeable-input';
            } else {
              return 'other-input';
            }
          }

          if (el.isContentEditable) {
            return 'contenteditable';
          }

          return 'unknown';
        });

        switch (inputType) {
          case 'select':
            await input.select(value);
            break;
          case 'contenteditable':
          case 'typeable-input':
            const textToType = await (
              input as ElementHandle<HTMLInputElement>
            ).evaluate((input, newValue) => {
              const currentValue = input.isContentEditable
                ? input.innerText
                : input.value;

              // Clear the input if the current value does not match the filled
              // out value.
              if (
                newValue.length <= currentValue.length ||
                !newValue.startsWith(input.value)
              ) {
                if (input.isContentEditable) {
                  input.innerText = '';
                } else {
                  input.value = '';
                }
                return newValue;
              }
              const originalValue = input.isContentEditable
                ? input.innerText
                : input.value;

              // If the value is partially filled out, only type the rest. Move
              // cursor to the end of the common prefix.
              if (input.isContentEditable) {
                input.innerText = '';
                input.innerText = originalValue;
              } else {
                input.value = '';
                input.value = originalValue;
              }
              return newValue.substring(originalValue.length);
            }, value);
            await input.type(textToType);
            break;
          case 'other-input':
            await input.focus();
            await input.evaluate((input, value) => {
              (input as HTMLInputElement).value = value;
              input.dispatchEvent(new Event('input', {bubbles: true}));
              input.dispatchEvent(new Event('change', {bubbles: true}));
            }, value);
            break;
          case 'unknown':
            throw new Error(`Element cannot be filled out.`);
        }
      },
      options?.signal,
      [
        this.#ensureElementIsInTheViewportIfNeeded,
        this.#waitForVisibilityIfNeeded,
        this.#waitForEnabledIfNeeded,
        this.#waitForStableBoundingBoxIfNeeded,
      ]
    );
  }

  hover<ElementType extends Element>(
    this: NodeLocator<ElementType>,
    options?: Readonly<ActionOptions>
  ): Promise<void> {
    return this.#run(
      async element => {
        await element.hover();
      },
      options?.signal,
      [
        this.#ensureElementIsInTheViewportIfNeeded,
        this.#waitForVisibilityIfNeeded,
        this.#waitForStableBoundingBoxIfNeeded,
      ]
    );
  }

  scroll<ElementType extends Element>(
    this: NodeLocator<ElementType>,
    options?: Readonly<LocatorScrollOptions>
  ): Promise<void> {
    return this.#run(
      async element => {
        await element.evaluate(
          (el, scrollTop, scrollLeft) => {
            if (scrollTop !== undefined) {
              el.scrollTop = scrollTop;
            }
            if (scrollLeft !== undefined) {
              el.scrollLeft = scrollLeft;
            }
          },
          options?.scrollTop,
          options?.scrollLeft
        );
      },
      options?.signal,
      [
        this.#ensureElementIsInTheViewportIfNeeded,
        this.#waitForVisibilityIfNeeded,
        this.#waitForStableBoundingBoxIfNeeded,
      ]
    );
  }
}

class ExpectedLocator<From, To extends From> extends Locator<To> {
  #base: Locator<From>;
  #predicate: Predicate<From, To>;

  constructor(base: Locator<From>, predicate: Predicate<From, To>) {
    super();

    this.#base = base;
    this.#predicate = predicate;
  }

  override setVisibility(visibility: VisibilityOption): this {
    this.#base.setVisibility(visibility);
    return this;
  }
  override setTimeout(timeout: number): this {
    this.#base.setTimeout(timeout);
    return this;
  }
  override setEnsureElementIsInTheViewport(value: boolean): this {
    this.#base.setEnsureElementIsInTheViewport(value);
    return this;
  }
  override setWaitForEnabled(value: boolean): this {
    this.#base.setWaitForEnabled(value);
    return this;
  }
  override setWaitForStableBoundingBox(value: boolean): this {
    this.#base.setWaitForStableBoundingBox(value);
    return this;
  }

  #condition: ActionCondition<From> = async (handle, signal) => {
    // TODO(jrandolf): We should remove this once JSHandle has waitForFunction.
    await (handle as ElementHandle<Node>).frame.waitForFunction(
      this.#predicate,
      {signal},
      handle
    );
  };

  #insertFilterCondition<
    FromElement extends Node,
    ToElement extends FromElement,
  >(this: ExpectedLocator<FromElement, ToElement>): void {
    const context = (LOCATOR_CONTEXTS.get(this.#base) ??
      {}) as LocatorContext<FromElement>;
    context.conditions ??= new Set();
    context.conditions.add(this.#condition);
    LOCATOR_CONTEXTS.set(this.#base, context);
  }

  override click<FromElement extends Element, ToElement extends FromElement>(
    this: ExpectedLocator<FromElement, ToElement>,
    options?: Readonly<LocatorClickOptions>
  ): Promise<void> {
    this.#insertFilterCondition();
    return this.#base.click(options);
  }
  override fill<FromElement extends Element, ToElement extends FromElement>(
    this: ExpectedLocator<FromElement, ToElement>,
    value: string,
    options?: Readonly<ActionOptions>
  ): Promise<void> {
    this.#insertFilterCondition();
    return this.#base.fill(value, options);
  }
  override hover<FromElement extends Element, ToElement extends FromElement>(
    this: ExpectedLocator<FromElement, ToElement>,
    options?: Readonly<ActionOptions>
  ): Promise<void> {
    this.#insertFilterCondition();
    return this.#base.hover(options);
  }
  override scroll<FromElement extends Element, ToElement extends FromElement>(
    this: ExpectedLocator<FromElement, ToElement>,
    options?: Readonly<LocatorScrollOptions>
  ): Promise<void> {
    this.#insertFilterCondition();
    return this.#base.scroll(options);
  }
}

/**
 * @internal
 */
class RaceLocator<T> extends Locator<T> {
  #locators: Array<Locator<T>>;

  constructor(locators: Array<Locator<T>>) {
    super();
    this.#locators = locators;
  }

  override setVisibility(visibility: VisibilityOption): this {
    for (const locator of this.#locators) {
      locator.setVisibility(visibility);
    }
    return this;
  }

  override setTimeout(timeout: number): this {
    for (const locator of this.#locators) {
      locator.setTimeout(timeout);
    }
    return this;
  }

  override setEnsureElementIsInTheViewport(value: boolean): this {
    for (const locator of this.#locators) {
      locator.setEnsureElementIsInTheViewport(value);
    }
    return this;
  }

  override setWaitForEnabled(value: boolean): this {
    for (const locator of this.#locators) {
      locator.setWaitForEnabled(value);
    }
    return this;
  }

  override setWaitForStableBoundingBox(value: boolean): this {
    for (const locator of this.#locators) {
      locator.setWaitForStableBoundingBox(value);
    }
    return this;
  }

  async #run(
    action: (locator: Locator<T>, signal: AbortSignal) => Promise<void>,
    signal?: AbortSignal
  ) {
    const abortControllers = new WeakMap<Locator<T>, AbortController>();

    // Abort all locators if the user-provided signal aborts.
    signal?.addEventListener('abort', () => {
      for (const locator of this.#locators) {
        abortControllers.get(locator)?.abort();
      }
    });

    const handleLocatorAction = (locator: Locator<T>): (() => void) => {
      return () => {
        // When one locator is ready to act, we will abort other locators.
        for (const other of this.#locators) {
          if (other !== locator) {
            abortControllers.get(other)?.abort();
          }
        }
        this.emit(LocatorEmittedEvents.Action);
      };
    };

    const createAbortController = (locator: Locator<T>): AbortController => {
      const abortController = new AbortController();
      abortControllers.set(locator, abortController);
      return abortController;
    };

    const results = await Promise.allSettled(
      this.#locators.map(locator => {
        return action(
          locator.on(LocatorEmittedEvents.Action, handleLocatorAction(locator)),
          createAbortController(locator).signal
        );
      })
    );

    signal?.throwIfAborted();

    const rejected = results.filter(
      (result): result is PromiseRejectedResult => {
        return result.status === 'rejected';
      }
    );

    // If some locators are fulfilled, do not throw.
    if (rejected.length !== results.length) {
      return;
    }

    for (const result of rejected) {
      const reason = result.reason;
      // AbortError is be an expected result of a race.
      if (isErrorLike(reason) && reason.name === 'AbortError') {
        continue;
      }
      throw reason;
    }
  }

  async click<ElementType extends Element>(
    this: RaceLocator<ElementType>,
    options?: Readonly<LocatorClickOptions>
  ): Promise<void> {
    return await this.#run(
      (locator, signal) => {
        return locator.click({...options, signal});
      },
      options?.signal
    );
  }

  async fill<ElementType extends Element>(
    this: RaceLocator<ElementType>,
    value: string,
    options?: Readonly<ActionOptions>
  ): Promise<void> {
    return await this.#run(
      (locator, signal) => {
        return locator.fill(value, {...options, signal});
      },
      options?.signal
    );
  }

  async hover<ElementType extends Element>(
    this: RaceLocator<ElementType>,
    options?: Readonly<ActionOptions>
  ): Promise<void> {
    return await this.#run(
      (locator, signal) => {
        return locator.hover({...options, signal});
      },
      options?.signal
    );
  }

  async scroll<ElementType extends Element>(
    this: RaceLocator<ElementType>,
    options?: Readonly<LocatorScrollOptions>
  ): Promise<void> {
    return await this.#run(
      (locator, signal) => {
        return locator.scroll({...options, signal});
      },
      options?.signal
    );
  }
}
