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
  type Observable,
  defer,
  filter,
  first,
  from,
  identity,
  ignoreElements,
  retry,
  throwIfEmpty,
} from '../../../third_party/rxjs/rxjs.js';
import {type HandleFor, type NodeFor} from '../../common/types.js';
import {type Frame} from '../Frame.js';
import {type Page} from '../Page.js';

import {type ActionOptions, Locator, RETRY_DELAY} from './locators.js';

/**
 * @internal
 */
export type Action<T, U> = (
  element: HandleFor<T>,
  signal?: AbortSignal
) => Observable<U>;

/**
 * @internal
 */
export class NodeLocator<T extends Node> extends Locator<T> {
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

  private constructor(pageOrFrame: Page | Frame, selector: string) {
    super();

    this.#pageOrFrame = pageOrFrame;
    this.#selector = selector;
  }

  /**
   * Waits for the element to become visible or hidden. visibility === 'visible'
   * means that the element has a computed style, the visibility property other
   * than 'hidden' or 'collapse' and non-empty bounding box. visibility ===
   * 'hidden' means the opposite of that.
   */
  #waitForVisibilityIfNeeded = (handle: HandleFor<T>): Observable<never> => {
    if (!this.visibility) {
      return EMPTY;
    }

    return (() => {
      switch (this.visibility) {
        case 'hidden':
          return defer(() => {
            return from(handle.isHidden());
          });
        case 'visible':
          return defer(() => {
            return from(handle.isVisible());
          });
      }
    })().pipe(first(identity), retry({delay: RETRY_DELAY}), ignoreElements());
  };

  override _clone(): NodeLocator<T> {
    return new NodeLocator<T>(this.#pageOrFrame, this.#selector).copyOptions(
      this
    );
  }

  override _wait(options?: Readonly<ActionOptions>): Observable<HandleFor<T>> {
    const signal = options?.signal;
    return defer(() => {
      return from(
        this.#pageOrFrame.waitForSelector(this.#selector, {
          visible: false,
          timeout: this._timeout,
          signal,
        }) as Promise<HandleFor<T> | null>
      );
    }).pipe(
      filter((value): value is NonNullable<typeof value> => {
        return value !== null;
      }),
      throwIfEmpty(),
      this.operators.conditions([this.#waitForVisibilityIfNeeded], signal)
    );
  }
}
