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

import {DelegatedLocator} from './DelegatedLocator.js';
import {ActionOptions, Locator} from './locators.js';

/**
 * @public
 */
export type Predicate<From, To extends From = From> =
  | ((value: From) => value is To)
  | ((value: From) => Awaitable<boolean>);

/**
 * @internal
 */
export class FilteredLocator<From, To extends From> extends DelegatedLocator<
  From,
  To
> {
  #predicate: Predicate<From, To>;

  constructor(base: Locator<From>, predicate: Predicate<From, To>) {
    super(base);
    this.#predicate = predicate;
  }

  override _clone(): FilteredLocator<From, To> {
    return new FilteredLocator(
      this.delegate.clone(),
      this.#predicate
    ).copyOptions(this);
  }

  override _wait(options?: Readonly<ActionOptions>): Observable<HandleFor<To>> {
    return this.delegate._wait(options).pipe(
      mergeMap(handle => {
        return from(
          (handle as ElementHandle<Node>).frame.waitForFunction(
            this.#predicate,
            {signal: options?.signal, timeout: this._timeout},
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
