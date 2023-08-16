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

import {
  EMPTY,
  Observable,
  OperatorFunction,
  catchError,
  defaultIfEmpty,
  defer,
  filter,
  first,
  firstValueFrom,
  from,
  fromEvent,
  identity,
  ignoreElements,
  map,
  merge,
  mergeMap,
  noop,
  pipe,
  raceWith,
  retry,
  tap,
  timer,
} from '../../../third_party/rxjs/rxjs.js';
import {TimeoutError} from '../../common/Errors.js';
import {EventEmitter} from '../../common/EventEmitter.js';
import {HandleFor} from '../../common/types.js';
import {debugError} from '../../common/util.js';
import {BoundingBox, ClickOptions, ElementHandle} from '../ElementHandle.js';

import {
  Action,
  AwaitedLocator,
  FilteredLocator,
  HandleMapper,
  MappedLocator,
  Mapper,
  Predicate,
  RaceLocator,
} from './locators.js';

/**
 * For observables coming from promises, a delay is needed, otherwise RxJS will
 * never yield in a permanent failure for a promise.
 *
 * We also don't want RxJS to do promise operations to often, so we bump the
 * delay up to 100ms.
 *
 * @internal
 */
export const RETRY_DELAY = 100;

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

/**
 * Locators describe a strategy of locating objects and performing an action on
 * them. If the action fails because the object is not ready for the action, the
 * whole operation is retried. Various preconditions for a successful action are
 * checked automatically.
 *
 * @public
 */
export abstract class Locator<T> extends EventEmitter {
  /**
   * Creates a race between multiple locators but ensures that only a single one
   * acts.
   *
   * @public
   */
  static race<Locators extends readonly unknown[] | []>(
    locators: Locators
  ): Locator<AwaitedLocator<Locators[number]>> {
    return RaceLocator.create(locators);
  }

  /**
   * Used for nominally typing {@link Locator}.
   */
  declare _?: T;

  /**
   * @internal
   */
  protected visibility: VisibilityOption = null;
  /**
   * @internal
   */
  protected _timeout = 30_000;
  #ensureElementIsInTheViewport = true;
  #waitForEnabled = true;
  #waitForStableBoundingBox = true;

  /**
   * @internal
   */
  protected operators = {
    conditions: (
      conditions: Array<Action<T, never>>,
      signal?: AbortSignal
    ): OperatorFunction<HandleFor<T>, HandleFor<T>> => {
      return mergeMap((handle: HandleFor<T>) => {
        return merge(
          ...conditions.map(condition => {
            return condition(handle, signal);
          })
        ).pipe(defaultIfEmpty(handle));
      });
    },
    retryAndRaceWithSignalAndTimer: <T>(
      signal?: AbortSignal
    ): OperatorFunction<T, T> => {
      const candidates = [];
      if (signal) {
        candidates.push(
          fromEvent(signal, 'abort').pipe(
            map(() => {
              throw signal.reason;
            })
          )
        );
      }
      if (this._timeout > 0) {
        candidates.push(
          timer(this._timeout).pipe(
            map(() => {
              throw new TimeoutError(
                `Timed out after waiting ${this._timeout}ms`
              );
            })
          )
        );
      }
      return pipe(
        retry({delay: RETRY_DELAY}),
        raceWith<T, never[]>(...candidates)
      );
    },
  };

  // Determines when the locator will timeout for actions.
  get timeout(): number {
    return this._timeout;
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

  setTimeout(timeout: number): Locator<T> {
    const locator = this._clone();
    locator._timeout = timeout;
    return locator;
  }

  setVisibility<NodeType extends Node>(
    this: Locator<NodeType>,
    visibility: VisibilityOption
  ): Locator<NodeType> {
    const locator = this._clone();
    locator.visibility = visibility;
    return locator;
  }

  setWaitForEnabled<NodeType extends Node>(
    this: Locator<NodeType>,
    value: boolean
  ): Locator<NodeType> {
    const locator = this._clone();
    locator.#waitForEnabled = value;
    return locator;
  }

  setEnsureElementIsInTheViewport<ElementType extends Element>(
    this: Locator<ElementType>,
    value: boolean
  ): Locator<ElementType> {
    const locator = this._clone();
    locator.#ensureElementIsInTheViewport = value;
    return locator;
  }

  setWaitForStableBoundingBox<ElementType extends Element>(
    this: Locator<ElementType>,
    value: boolean
  ): Locator<ElementType> {
    const locator = this._clone();
    locator.#waitForStableBoundingBox = value;
    return locator;
  }

  /**
   * @internal
   */
  copyOptions<T>(locator: Locator<T>): this {
    this._timeout = locator._timeout;
    this.visibility = locator.visibility;
    this.#waitForEnabled = locator.#waitForEnabled;
    this.#ensureElementIsInTheViewport = locator.#ensureElementIsInTheViewport;
    this.#waitForStableBoundingBox = locator.#waitForStableBoundingBox;
    return this;
  }

  /**
   * If the element has a "disabled" property, wait for the element to be
   * enabled.
   */
  #waitForEnabledIfNeeded = <ElementType extends Node>(
    handle: HandleFor<ElementType>,
    signal?: AbortSignal
  ): Observable<never> => {
    if (!this.#waitForEnabled) {
      return EMPTY;
    }
    return from(
      handle.frame.waitForFunction(
        element => {
          if (!(element instanceof HTMLElement)) {
            return true;
          }
          const isNativeFormControl = [
            'BUTTON',
            'INPUT',
            'SELECT',
            'TEXTAREA',
            'OPTION',
            'OPTGROUP',
          ].includes(element.nodeName);
          return !isNativeFormControl || !element.hasAttribute('disabled');
        },
        {
          timeout: this._timeout,
          signal,
        },
        handle
      )
    ).pipe(ignoreElements());
  };

  /**
   * Compares the bounding box of the element for two consecutive animation
   * frames and waits till they are the same.
   */
  #waitForStableBoundingBoxIfNeeded = <ElementType extends Element>(
    handle: HandleFor<ElementType>
  ): Observable<never> => {
    if (!this.#waitForStableBoundingBox) {
      return EMPTY;
    }
    return defer(() => {
      // Note we don't use waitForFunction because that relies on RAF.
      return from(
        handle.evaluate(element => {
          return new Promise<[BoundingBox, BoundingBox]>(resolve => {
            window.requestAnimationFrame(() => {
              const rect1 = element.getBoundingClientRect();
              window.requestAnimationFrame(() => {
                const rect2 = element.getBoundingClientRect();
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
        })
      );
    }).pipe(
      first(([rect1, rect2]) => {
        return (
          rect1.x === rect2.x &&
          rect1.y === rect2.y &&
          rect1.width === rect2.width &&
          rect1.height === rect2.height
        );
      }),
      retry({delay: RETRY_DELAY}),
      ignoreElements()
    );
  };

  /**
   * Checks if the element is in the viewport and auto-scrolls it if it is not.
   */
  #ensureElementIsInTheViewportIfNeeded = <ElementType extends Element>(
    handle: HandleFor<ElementType>
  ): Observable<never> => {
    if (!this.#ensureElementIsInTheViewport) {
      return EMPTY;
    }
    return from(handle.isIntersectingViewport({threshold: 0})).pipe(
      filter(isIntersectingViewport => {
        return !isIntersectingViewport;
      }),
      mergeMap(() => {
        return from(handle.scrollIntoView());
      }),
      mergeMap(() => {
        return defer(() => {
          return from(handle.isIntersectingViewport({threshold: 0}));
        }).pipe(first(identity), retry({delay: RETRY_DELAY}), ignoreElements());
      })
    );
  };

  #click<ElementType extends Element>(
    this: Locator<ElementType>,
    options?: Readonly<LocatorClickOptions>
  ): Observable<void> {
    const signal = options?.signal;
    return this._wait(options).pipe(
      this.operators.conditions(
        [
          this.#ensureElementIsInTheViewportIfNeeded,
          this.#waitForStableBoundingBoxIfNeeded,
          this.#waitForEnabledIfNeeded,
        ],
        signal
      ),
      tap(() => {
        return this.emit(LocatorEmittedEvents.Action);
      }),
      mergeMap(handle => {
        return from(handle.click(options)).pipe(
          catchError((_, caught) => {
            void handle.dispose().catch(debugError);
            return caught;
          })
        );
      }),
      this.operators.retryAndRaceWithSignalAndTimer(signal)
    );
  }

  #fill<ElementType extends Element>(
    this: Locator<ElementType>,
    value: string,
    options?: Readonly<ActionOptions>
  ): Observable<void> {
    const signal = options?.signal;
    return this._wait(options).pipe(
      this.operators.conditions(
        [
          this.#ensureElementIsInTheViewportIfNeeded,
          this.#waitForStableBoundingBoxIfNeeded,
          this.#waitForEnabledIfNeeded,
        ],
        signal
      ),
      tap(() => {
        return this.emit(LocatorEmittedEvents.Action);
      }),
      mergeMap(handle => {
        return from(
          (handle as unknown as ElementHandle<HTMLElement>).evaluate(el => {
            if (el instanceof HTMLSelectElement) {
              return 'select';
            }
            if (el instanceof HTMLTextAreaElement) {
              return 'typeable-input';
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
          })
        )
          .pipe(
            mergeMap(inputType => {
              switch (inputType) {
                case 'select':
                  return from(handle.select(value).then(noop));
                case 'contenteditable':
                case 'typeable-input':
                  return from(
                    (
                      handle as unknown as ElementHandle<HTMLInputElement>
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
                    }, value)
                  ).pipe(
                    mergeMap(textToType => {
                      return from(handle.type(textToType));
                    })
                  );
                case 'other-input':
                  return from(handle.focus()).pipe(
                    mergeMap(() => {
                      return from(
                        handle.evaluate((input, value) => {
                          (input as HTMLInputElement).value = value;
                          input.dispatchEvent(
                            new Event('input', {bubbles: true})
                          );
                          input.dispatchEvent(
                            new Event('change', {bubbles: true})
                          );
                        }, value)
                      );
                    })
                  );
                case 'unknown':
                  throw new Error(`Element cannot be filled out.`);
              }
            })
          )
          .pipe(
            catchError((_, caught) => {
              void handle.dispose().catch(debugError);
              return caught;
            })
          );
      }),
      this.operators.retryAndRaceWithSignalAndTimer(signal)
    );
  }

  #hover<ElementType extends Element>(
    this: Locator<ElementType>,
    options?: Readonly<ActionOptions>
  ): Observable<void> {
    const signal = options?.signal;
    return this._wait(options).pipe(
      this.operators.conditions(
        [
          this.#ensureElementIsInTheViewportIfNeeded,
          this.#waitForStableBoundingBoxIfNeeded,
        ],
        signal
      ),
      tap(() => {
        return this.emit(LocatorEmittedEvents.Action);
      }),
      mergeMap(handle => {
        return from(handle.hover()).pipe(
          catchError((_, caught) => {
            void handle.dispose().catch(debugError);
            return caught;
          })
        );
      }),
      this.operators.retryAndRaceWithSignalAndTimer(signal)
    );
  }

  #scroll<ElementType extends Element>(
    this: Locator<ElementType>,
    options?: Readonly<LocatorScrollOptions>
  ): Observable<void> {
    const signal = options?.signal;
    return this._wait(options).pipe(
      this.operators.conditions(
        [
          this.#ensureElementIsInTheViewportIfNeeded,
          this.#waitForStableBoundingBoxIfNeeded,
        ],
        signal
      ),
      tap(() => {
        return this.emit(LocatorEmittedEvents.Action);
      }),
      mergeMap(handle => {
        return from(
          handle.evaluate(
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
          )
        ).pipe(
          catchError((_, caught) => {
            void handle.dispose().catch(debugError);
            return caught;
          })
        );
      }),
      this.operators.retryAndRaceWithSignalAndTimer(signal)
    );
  }

  /**
   * @internal
   */
  abstract _clone(): Locator<T>;

  /**
   * @internal
   */
  abstract _wait(options?: Readonly<ActionOptions>): Observable<HandleFor<T>>;

  /**
   * Clones the locator.
   */
  clone(): Locator<T> {
    return this._clone();
  }

  /**
   * Waits for the locator to get a handle from the page.
   *
   * @public
   */
  async waitHandle(options?: Readonly<ActionOptions>): Promise<HandleFor<T>> {
    return await firstValueFrom(
      this._wait(options).pipe(
        this.operators.retryAndRaceWithSignalAndTimer(options?.signal)
      )
    );
  }

  /**
   * Waits for the locator to get the serialized value from the page.
   *
   * Note this requires the value to be JSON-serializable.
   *
   * @public
   */
  async wait(options?: Readonly<ActionOptions>): Promise<T> {
    const handle = await this.waitHandle(options);
    try {
      return await handle.jsonValue();
    } finally {
      void handle.dispose().catch(debugError);
    }
  }

  /**
   * Maps the locator using the provided mapper.
   *
   * @public
   */
  map<To>(mapper: Mapper<T, To>): Locator<To> {
    return new MappedLocator(this._clone(), handle => {
      // SAFETY: TypeScript cannot deduce the type.
      return (handle as any).evaluateHandle(mapper);
    });
  }

  /**
   * Creates an expectation that is evaluated against located values.
   *
   * If the expectations do not match, then the locator will retry.
   *
   * @public
   */
  filter<S extends T>(predicate: Predicate<T, S>): Locator<S> {
    return new FilteredLocator(this._clone(), async (handle, signal) => {
      await (handle as ElementHandle<Node>).frame.waitForFunction(
        predicate,
        {signal, timeout: this._timeout},
        handle
      );
      return true;
    });
  }

  /**
   * Creates an expectation that is evaluated against located handles.
   *
   * If the expectations do not match, then the locator will retry.
   *
   * @internal
   */
  filterHandle<S extends T>(
    predicate: Predicate<HandleFor<T>, HandleFor<S>>
  ): Locator<S> {
    return new FilteredLocator(this._clone(), predicate);
  }

  /**
   * Maps the locator using the provided mapper.
   *
   * @internal
   */
  mapHandle<To>(mapper: HandleMapper<T, To>): Locator<To> {
    return new MappedLocator(this._clone(), mapper);
  }

  click<ElementType extends Element>(
    this: Locator<ElementType>,
    options?: Readonly<LocatorClickOptions>
  ): Promise<void> {
    return firstValueFrom(this.#click(options));
  }

  /**
   * Fills out the input identified by the locator using the provided value. The
   * type of the input is determined at runtime and the appropriate fill-out
   * method is chosen based on the type. contenteditable, selector, inputs are
   * supported.
   */
  fill<ElementType extends Element>(
    this: Locator<ElementType>,
    value: string,
    options?: Readonly<ActionOptions>
  ): Promise<void> {
    return firstValueFrom(this.#fill(value, options));
  }

  hover<ElementType extends Element>(
    this: Locator<ElementType>,
    options?: Readonly<ActionOptions>
  ): Promise<void> {
    return firstValueFrom(this.#hover(options));
  }

  scroll<ElementType extends Element>(
    this: Locator<ElementType>,
    options?: Readonly<LocatorScrollOptions>
  ): Promise<void> {
    return firstValueFrom(this.#scroll(options));
  }
}
