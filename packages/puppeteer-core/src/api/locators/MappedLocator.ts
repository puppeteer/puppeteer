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

import {Observable, from, mergeMap} from '../../../third_party/rxjs/rxjs.js';
import {Awaitable, HandleFor} from '../../common/common.js';
import {JSHandle} from '../JSHandle.js';

import {ActionOptions, DelegatedLocator, Locator} from './locators.js';

/**
 * @public
 */
export type Mapper<From, To> = (value: From) => Awaitable<To>;

/**
 * @internal
 */
export class MappedLocator<From, To> extends DelegatedLocator<From, To> {
  #mapper: Mapper<From, To>;

  constructor(base: Locator<From>, mapper: Mapper<From, To>) {
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
        return from((handle as JSHandle<From>).evaluateHandle(this.#mapper));
      })
    );
  }
}
