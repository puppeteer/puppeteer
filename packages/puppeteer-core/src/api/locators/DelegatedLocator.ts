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
export class DelegatedLocator<T, U> extends Locator<U> {
  #delegate: Locator<T>;

  constructor(delegate: Locator<T>) {
    super();

    this.#delegate = delegate;
    this.copyOptions(this.#delegate);
  }

  protected get delegate(): Locator<T> {
    return this.#delegate;
  }

  override setTimeout(timeout: number): this {
    super.setTimeout(timeout);
    this.#delegate.setTimeout(timeout);
    return this;
  }

  override setVisibility<T extends Node, U extends T>(
    this: DelegatedLocator<T, U>,
    visibility: VisibilityOption
  ): Locator<U> {
    super.setVisibility(visibility);
    this.#delegate.setVisibility(visibility);
    return this;
  }

  override setWaitForEnabled<T extends Node, U extends T>(
    this: DelegatedLocator<T, U>,
    value: boolean
  ): Locator<U> {
    super.setWaitForEnabled(value);
    this.#delegate.setWaitForEnabled(value);
    return this;
  }

  override setEnsureElementIsInTheViewport<T extends Element, U extends T>(
    this: DelegatedLocator<T, U>,
    value: boolean
  ): Locator<U> {
    super.setEnsureElementIsInTheViewport(value);
    this.#delegate.setEnsureElementIsInTheViewport(value);
    return this;
  }

  override setWaitForStableBoundingBox<T extends Element, U extends T>(
    this: DelegatedLocator<T, U>,
    value: boolean
  ): Locator<U> {
    super.setWaitForStableBoundingBox(value);
    this.#delegate.setWaitForStableBoundingBox(value);
    return this;
  }

  override _wait(): Observable<HandleFor<U>> {
    throw new Error('Not implemented');
  }
}
