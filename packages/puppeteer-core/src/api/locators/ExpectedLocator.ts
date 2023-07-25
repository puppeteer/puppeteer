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
  Observable,
  from,
  map,
  mergeMap,
  throwIfEmpty,
} from '../../../third_party/rxjs/rxjs.js';
import {Awaitable, HandleFor} from '../../common/common.js';
import {ElementHandle} from '../ElementHandle.js';

import {ActionOptions, Locator, VisibilityOption} from './locators.js';

/**
 * @public
 */
export type Predicate<From, To extends From = From> =
  | ((value: From) => value is To)
  | ((value: From) => Awaitable<boolean>);

/**
 * @internal
 */
export class ExpectedLocator<From, To extends From> extends Locator<To> {
  #base: Locator<From>;
  #predicate: Predicate<From, To>;

  constructor(base: Locator<From>, predicate: Predicate<From, To>) {
    super();

    this.#base = base;
    this.#predicate = predicate;

    this.copyOptions(this.#base);
  }

  override setTimeout(timeout: number): this {
    super.setTimeout(timeout);
    this.#base.setTimeout(timeout);
    return this;
  }

  override setVisibility<FromNode extends Node, ToNode extends FromNode>(
    this: ExpectedLocator<FromNode, ToNode>,
    visibility: VisibilityOption
  ): Locator<ToNode> {
    super.setVisibility(visibility);
    this.#base.setVisibility(visibility);
    return this;
  }

  override setWaitForEnabled<FromNode extends Node, ToNode extends FromNode>(
    this: ExpectedLocator<FromNode, ToNode>,
    value: boolean
  ): Locator<ToNode> {
    super.setWaitForEnabled(value);
    this.#base.setWaitForEnabled(value);
    return this;
  }

  override setEnsureElementIsInTheViewport<
    FromElement extends Element,
    ToElement extends FromElement,
  >(
    this: ExpectedLocator<FromElement, ToElement>,
    value: boolean
  ): Locator<ToElement> {
    super.setEnsureElementIsInTheViewport(value);
    this.#base.setEnsureElementIsInTheViewport(value);
    return this;
  }

  override setWaitForStableBoundingBox<
    FromElement extends Element,
    ToElement extends FromElement,
  >(
    this: ExpectedLocator<FromElement, ToElement>,
    value: boolean
  ): Locator<ToElement> {
    super.setWaitForStableBoundingBox(value);
    this.#base.setWaitForStableBoundingBox(value);
    return this;
  }

  override _wait(options?: Readonly<ActionOptions>): Observable<HandleFor<To>> {
    return this.#base._wait(options).pipe(
      mergeMap(handle => {
        return from(
          (handle as ElementHandle<Node>).frame.waitForFunction(
            this.#predicate,
            {signal: options?.signal, timeout: this.timeout},
            handle
          )
        ).pipe(
          map(() => {
            // SAFETY: It passed the predicate, so this is correct.
            return handle as HandleFor<To>;
          })
        );
      }),
      throwIfEmpty()
    );
  }
}
