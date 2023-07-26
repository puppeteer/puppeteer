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

import {Observable} from '../../../third_party/rxjs/rxjs.js';
import {HandleFor} from '../../common/common.js';

import {Locator, VisibilityOption} from './locators.js';

/**
 * @internal
 */
export abstract class DelegatedLocator<T, U> extends Locator<U> {
  #delegate: Locator<T>;

  constructor(delegate: Locator<T>) {
    super();

    this.#delegate = delegate;
    this.copyOptions(this.#delegate);
  }

  protected get delegate(): Locator<T> {
    return this.#delegate;
  }

  override setTimeout(timeout: number): DelegatedLocator<T, U> {
    const locator = super.setTimeout(timeout) as DelegatedLocator<T, U>;
    locator.#delegate = this.#delegate.setTimeout(timeout);
    return locator;
  }

  override setVisibility<ValueType extends Node, NodeType extends Node>(
    this: DelegatedLocator<ValueType, NodeType>,
    visibility: VisibilityOption
  ): DelegatedLocator<ValueType, NodeType> {
    const locator = super.setVisibility<NodeType>(
      visibility
    ) as DelegatedLocator<ValueType, NodeType>;
    locator.#delegate = locator.#delegate.setVisibility<ValueType>(visibility);
    return locator;
  }

  override setWaitForEnabled<ValueType extends Node, NodeType extends Node>(
    this: DelegatedLocator<ValueType, NodeType>,
    value: boolean
  ): DelegatedLocator<ValueType, NodeType> {
    const locator = super.setWaitForEnabled<NodeType>(
      value
    ) as DelegatedLocator<ValueType, NodeType>;
    locator.#delegate = this.#delegate.setWaitForEnabled(value);
    return locator;
  }

  override setEnsureElementIsInTheViewport<
    ValueType extends Element,
    ElementType extends Element,
  >(
    this: DelegatedLocator<ValueType, ElementType>,
    value: boolean
  ): DelegatedLocator<ValueType, ElementType> {
    const locator = super.setEnsureElementIsInTheViewport<ElementType>(
      value
    ) as DelegatedLocator<ValueType, ElementType>;
    locator.#delegate = this.#delegate.setEnsureElementIsInTheViewport(value);
    return locator;
  }

  override setWaitForStableBoundingBox<
    ValueType extends Element,
    ElementType extends Element,
  >(
    this: DelegatedLocator<ValueType, ElementType>,
    value: boolean
  ): DelegatedLocator<ValueType, ElementType> {
    const locator = super.setWaitForStableBoundingBox<ElementType>(
      value
    ) as DelegatedLocator<ValueType, ElementType>;
    locator.#delegate = this.#delegate.setWaitForStableBoundingBox(value);
    return locator;
  }

  abstract override _clone(): DelegatedLocator<T, U>;
  abstract override _wait(): Observable<HandleFor<U>>;
}
