import {TimeoutError} from '../../common/Errors.js';
import {HandleFor, NodeFor} from '../../common/types.js';
import {debugError} from '../../common/util.js';
import {isErrorLike} from '../../util/ErrorLike.js';
import {BoundingBox, ElementHandle} from '../ElementHandle.js';
import type {Frame} from '../Frame.js';
import type {Page} from '../Page.js';

import {
  ActionOptions,
  LOCATOR_CONTEXTS,
  Locator,
  LocatorClickOptions,
  LocatorEmittedEvents,
  LocatorScrollOptions,
  VisibilityOption,
} from './locators.js';

/**
 * Timeout for individual operations inside the locator. On errors the
 * operation is retried as long as {@link Locator.setTimeout} is not
 * exceeded. This timeout should be generally much lower as locating an
 * element means multiple asynchronious operations.
 */
const CONDITION_TIMEOUT = 1000;
const WAIT_FOR_FUNCTION_DELAY = 100;

/**
 * @internal
 */
export type ActionCondition<T> = (
  element: HandleFor<T>,
  signal: AbortSignal
) => Promise<void>;

/**
 * @internal
 */
export class NodeLocator<T extends Node> extends Locator<T> {
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

  #pageOrFrame: Page | Frame;
  #selector: string;
  #visibility: VisibilityOption = 'visible';
  #timeout = 30000;
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
