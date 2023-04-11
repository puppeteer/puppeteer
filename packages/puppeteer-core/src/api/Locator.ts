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

import {AbortError, TimeoutError} from '../common/Errors.js';
import {EventEmitter} from '../common/EventEmitter.js';
import type {MouseButton} from '../common/Input.js';
import {debugError} from '../common/util.js';
import {isErrorLike} from '../util/ErrorLike.js';

import {ElementHandle, BoundingBox} from './ElementHandle.js';
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
  /**
   * Timeout for individual operations inside the locator. On errors the
   * operation is retried as long as {@link LocatorOptions.timeout} is not
   * exceeded. This timeout should be generally much lower as locating an
   * element means multiple asynchronious operations.
   */
  operationTimeout: number;
}

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
      operationTimeout: 1000,
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
    timeout = this.#options.operationTimeout
  ): Promise<void> {
    let isActive = true;
    let isUserAborted = false;
    let iterationController: AbortController;
    // If the loop times out, we abort only the last iteration's controller.
    const timeoutId = setTimeout(() => {
      isActive = false;
      iterationController?.abort();
    }, timeout);
    // If the user's signal aborts, we abort the last iteration and the loop.
    signal?.addEventListener(
      'abort',
      () => {
        iterationController?.abort();
        isUserAborted = true;
      },
      {once: true}
    );
    while (isActive && !isUserAborted) {
      iterationController = new AbortController();
      try {
        const result = await fn(iterationController.signal);
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
          if (err instanceof AbortError) {
            continue;
          }
          // Ignore error if the user's signal aborted.
          if (signal?.aborted) {
            return;
          }
        }
        throw err;
      } finally {
        // We abort any operations that might have been started by `fn`, because
        // the iteration is now over.
        iterationController.abort();
      }
      await new Promise(resolve => {
        return setTimeout(resolve, 100);
      });
    }
    if (isUserAborted) {
      throw new AbortError(`waitForFunction was aborted.`);
    }
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
    function checkAbortSignal() {
      if (signal?.aborted) {
        throw new AbortError(`ensureElementIsInTheViewport was aborted.`);
      }
    }
    // Side-effect: this also checks if it is connected.
    const isIntersectingViewport = await element.isIntersectingViewport({
      threshold: 0,
    });
    checkAbortSignal();
    if (!isIntersectingViewport) {
      await element.scrollIntoView();
      checkAbortSignal();
      await this.#waitForFunction(async () => {
        return await element.isIntersectingViewport({
          threshold: 0,
        });
      }, signal);
      checkAbortSignal();
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
    await this.#waitForFunction(async () => {
      return this.#options.visibility === 'hidden'
        ? element.isHidden()
        : element.isVisible();
    }, signal);
  };

  /**
   * If the element is a button, textarea, input or select, wait till the
   * element becomes enabled.
   */
  #waitForEnabled = async (
    element: ElementHandle,
    _signal?: AbortSignal
  ): Promise<void> => {
    // TODO: use AbortSignal in waitForFunction.
    await this.#page.waitForFunction(
      el => {
        if (['button', 'textarea', 'input', 'select'].includes(el.tagName)) {
          return !(el as HTMLInputElement).disabled;
        }
        return true;
      },
      {
        timeout: this.#options.operationTimeout,
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

  async #performAction(
    payloadFn: (el: ElementHandle) => Promise<void>,
    actionOptions?: ActionOptions
  ) {
    function checkAbortSignal() {
      if (actionOptions?.signal?.aborted) {
        throw new Error(`Locator was aborted.`);
      }
    }
    await this.#waitForFunction(
      async iterationSignal => {
        // 1. Select the element without visibility checks.
        const element = await this.#page.waitForSelector(this.#selector, {
          visible: false,
          timeout: this.#options.operationTimeout,
          signal: iterationSignal,
        });
        // Retry if no element is found.
        if (!element) {
          return false;
        }
        try {
          checkAbortSignal();
          // 2. Perform action specific checks.
          await Promise.all(
            actionOptions?.conditions.map(check => {
              return check(element, iterationSignal);
            }) || []
          );
          checkAbortSignal();
          // 3. Perform the action
          this.emit(LocatorEmittedEvents.Action);
          await payloadFn(element);
          return true;
        } finally {
          void element.dispose().catch(debugError);
        }
      },
      actionOptions?.signal,
      this.#options.timeout
    );
  }

  async click(clickOptions?: {
    delay?: number;
    button?: MouseButton;
    signal?: AbortSignal;
  }): Promise<void> {
    await this.#performAction(
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
}
