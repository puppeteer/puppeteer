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

import {type Observable, race} from '../../../third_party/rxjs/rxjs.js';
import {type HandleFor} from '../../common/types.js';

import {type ActionOptions, Locator} from './locators.js';

/**
 * @public
 */
export type AwaitedLocator<T> = T extends Locator<infer S> ? S : never;

function checkLocatorArray<T extends readonly unknown[] | []>(
  locators: T
): ReadonlyArray<Locator<AwaitedLocator<T[number]>>> {
  for (const locator of locators) {
    if (!(locator instanceof Locator)) {
      throw new Error('Unknown locator for race candidate');
    }
  }
  return locators as ReadonlyArray<Locator<AwaitedLocator<T[number]>>>;
}

/**
 * @internal
 */
export class RaceLocator<T> extends Locator<T> {
  static create<T extends readonly unknown[]>(
    locators: T
  ): Locator<AwaitedLocator<T[number]>> {
    const array = checkLocatorArray(locators);
    return new RaceLocator(array);
  }

  #locators: ReadonlyArray<Locator<T>>;

  constructor(locators: ReadonlyArray<Locator<T>>) {
    super();
    this.#locators = locators;
  }

  override _clone(): RaceLocator<T> {
    return new RaceLocator<T>(
      this.#locators.map(locator => {
        return locator.clone();
      })
    ).copyOptions(this);
  }

  override _wait(options?: Readonly<ActionOptions>): Observable<HandleFor<T>> {
    return race(
      ...this.#locators.map(locator => {
        return locator._wait(options);
      })
    );
  }
}
