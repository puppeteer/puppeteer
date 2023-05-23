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
import {debugError} from '../common/util.js';
import {isErrorLike} from '../util/ErrorLike.js';

import {ElementHandle, BoundingBox, ClickOptions} from './ElementHandle.js';
import type {Page} from './Page.js';

/**
 * @internal
 */
export interface LocatorOptions {
  /**
   * Whether to wait for the element to be `visible` or `hidden`.
   */
  visibility: 'hidden' | 'visible';
  /**
   * Total timeout for the entire locator operation.
   */
  timeout: number;
}

/**
 * Timeout for individual operations inside the locator. On errors the
 * operation is retried as long as {@link LocatorOptions.timeout} is not
 * exceeded. This timeout should be generally much lower as locating an
 * element means multiple asynchronious operations.
 */
const CONDITION_TIMEOUT = 1_000;
const WAIT_FOR_FUNCTION_DELAY = 100;

/**
 * @internal
 */
type ActionCondition = (
  element: ElementHandle,
  signal: AbortSignal
) => Promise<void>;

/**
 * @internal
 */
export interface ActionOptions {
  signal?: AbortSignal;
  conditions: ActionCondition[];
}

/**
 * All the events that a locator instance may emit.
 *
 * @internal
 */
export enum LocatorEmittedEvents {
  /**
   * Emitted every time before the locator performs an action on the located element(s).
   */
  Action = 'action',
}

/**
 * @internal
 */
export interface LocatorEventObject {
  [LocatorEmittedEvents.Action]: never;
}

/**
 * Locators describe a strategy of locating elements and performing an action on
 * them. If the action fails because the element are not ready for the action,
 * the whole operation is retried.
 *
 * @internal
 */
export class Locator extends EventEmitter {
  #page: Page;
  #selector: string;
  #options: LocatorOptions;

  constructor(
    page: Page,
    selector: string,
    options: LocatorOptions = {
      visibility: 'visible',
      timeout: page.getDefaultTimeout(),
    }
  ) {
    super();
    this.#page = page;
    this.#selector = selector;
    this.#options = options;
  }

  override on<K extends keyof LocatorEventObject>(
    eventName: K,
    handler: (event: LocatorEventObject[K]) => void
  ): Locator {
    return super.on(eventName, handler) as Locator;
  }

  override once<K extends keyof LocatorEventObject>(
    eventName: K,
    handler: (event: LocatorEventObject[K]) => void
  ): Locator {
    return super.once(eventName, handler) as Locator;
  }

  override off<K extends keyof LocatorEventObject>(
    eventName: K,
    handler: (event: LocatorEventObject[K]) => void
  ): Locator {
    return super.off(eventName, handler) as Locator;
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
    const timeoutId = setTimeout(() => {
      isActive = false;
      controller?.abort();
    }, timeout);
    // If the user's signal aborts, we abort the last iteration and the loop.
    signal?.addEventListener(
      'abort',
      () => {
        controller?.abort();
        isActive = false;
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
  #ensureElementIsInTheViewport = async (
    element: ElementHandle,
    signal?: AbortSignal
  ): Promise<void> => {
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
  #waitForVisibility = async (
    element: ElementHandle,
    signal?: AbortSignal
  ): Promise<void> => {
    if (this.#options.visibility === 'hidden') {
      await this.#waitForFunction(async () => {
        return element.isHidden();
      }, signal);
    }
    await this.#waitForFunction(async () => {
      return element.isVisible();
    }, signal);
  };

  /**
   * If the element is a button, textarea, input or select, wait till the
   * element becomes enabled.
   */
  #waitForEnabled = async (
    element: ElementHandle,
    signal?: AbortSignal
  ): Promise<void> => {
    await this.#page.waitForFunction(
      el => {
        if (['button', 'textarea', 'input', 'select'].includes(el.tagName)) {
          return !(el as HTMLInputElement).disabled;
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
  #waitForStableBoundingBox = async (
    element: ElementHandle,
    signal?: AbortSignal
  ): Promise<void> => {
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

  async #run(
    action: (el: ElementHandle) => Promise<void>,
    options?: ActionOptions
  ) {
    await this.#waitForFunction(
      async signal => {
        // 1. Select the element without visibility checks.
        const element = await this.#page.waitForSelector(this.#selector, {
          visible: false,
          timeout: this.#options.timeout,
          signal,
        });
        // Retry if no element is found.
        if (!element) {
          return false;
        }
        try {
          signal?.throwIfAborted();
          // 2. Perform action specific checks.
          await Promise.all(
            options?.conditions.map(check => {
              return check(element, signal);
            }) || []
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
      options?.signal,
      this.#options.timeout
    );
  }

  async click(
    clickOptions?: ClickOptions & {
      signal?: AbortSignal;
    }
  ): Promise<void> {
    return await this.#run(
      async element => {
        await element.click(clickOptions);
      },
      {
        signal: clickOptions?.signal,
        conditions: [
          this.#ensureElementIsInTheViewport,
          this.#waitForVisibility,
          this.#waitForEnabled,
          this.#waitForStableBoundingBox,
        ],
      }
    );
  }

  /**
   * Fills out the input identified by the locator using the provided value. The
   * type of the input is determined at runtime and the appropriate fill-out
   * method is chosen based on the type. contenteditable, selector, inputs are
   * supported.
   */
  async fill(
    value: string,
    fillOptions?: {signal?: AbortSignal}
  ): Promise<void> {
    return await this.#run(
      async element => {
        const input = element as ElementHandle<HTMLElement>;
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
      {
        signal: fillOptions?.signal,
        conditions: [
          this.#ensureElementIsInTheViewport,
          this.#waitForVisibility,
          this.#waitForEnabled,
          this.#waitForStableBoundingBox,
        ],
      }
    );
  }

  async hover(hoverOptions?: {signal?: AbortSignal}): Promise<void> {
    return await this.#run(
      async element => {
        await element.hover();
      },
      {
        signal: hoverOptions?.signal,
        conditions: [
          this.#ensureElementIsInTheViewport,
          this.#waitForVisibility,
          this.#waitForStableBoundingBox,
        ],
      }
    );
  }

  async scroll(scrollOptions?: {
    scrollTop?: number;
    scrollLeft?: number;
    signal?: AbortSignal;
  }): Promise<void> {
    return await this.#run(
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
          scrollOptions?.scrollTop,
          scrollOptions?.scrollLeft
        );
      },
      {
        signal: scrollOptions?.signal,
        conditions: [
          this.#ensureElementIsInTheViewport,
          this.#waitForVisibility,
          this.#waitForStableBoundingBox,
        ],
      }
    );
  }
}
