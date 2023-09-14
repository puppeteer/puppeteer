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
  type Observable,
  from,
  mergeMap,
} from '../../../third_party/rxjs/rxjs.js';
import {type Awaitable, type HandleFor} from '../../common/types.js';

import {
  type ActionOptions,
  DelegatedLocator,
  type Locator,
} from './locators.js';

/**
 * @public
 */
export type Mapper<From, To> = (value: From) => Awaitable<To>;

/**
 * @internal
 */
export type HandleMapper<From, To> = (
  value: HandleFor<From>,
  signal?: AbortSignal
) => Awaitable<HandleFor<To>>;

/**
 * @internal
 */
export class MappedLocator<From, To> extends DelegatedLocator<From, To> {
  #mapper: HandleMapper<From, To>;

  constructor(base: Locator<From>, mapper: HandleMapper<From, To>) {
    super(base);
    this.#mapper = mapper;
  }

  override _clone(): MappedLocator<From, To> {
    return new MappedLocator(this.delegate.clone(), this.#mapper).copyOptions(
      this
    );
  }

  override _wait(options?: Readonly<ActionOptions>): Observable<HandleFor<To>> {
    return this.delegate._wait(options).pipe(
      mergeMap(handle => {
        return from(Promise.resolve(this.#mapper(handle, options?.signal)));
      })
    );
  }
}
