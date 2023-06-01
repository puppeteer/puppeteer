/**
 * Copyright 2022 Google Inc. All rights reserved.
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

import {JSHandle} from '../api/JSHandle.js';
import PuppeteerUtil from '../injected/injected.js';

/**
 * @internal
 */
export interface PuppeteerUtilWrapper {
  puppeteerUtil: Promise<JSHandle<PuppeteerUtil>>;
}

/**
 * @internal
 */
export class LazyArg<T, Context = PuppeteerUtilWrapper> {
  static create = <T>(
    get: (context: PuppeteerUtilWrapper) => Promise<T> | T
  ): T => {
    // We don't want to introduce LazyArg to the type system, otherwise we would
    // have to make it public.
    return new LazyArg(get) as unknown as T;
  };

  #get: (context: Context) => Promise<T> | T;
  private constructor(get: (context: Context) => Promise<T> | T) {
    this.#get = get;
  }

  async get(context: Context): Promise<T> {
    return this.#get(context);
  }
}
