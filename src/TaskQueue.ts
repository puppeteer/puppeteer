/**
 * Copyright 2020 Google Inc. All rights reserved.
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

/* TODO(jacktfranklin@): once we are calling this from TS files we can
 * avoid the horrible void | any type and instead make use of generics
 * to make this into TaskQueue<T> and let the caller tell us what types
 * the promise in the queue should return.
 */
export class TaskQueue {
  _chain: Promise<void | any>;

  constructor() {
    this._chain = Promise.resolve();
  }

  public postTask(task: () => any): Promise<void | any> {
    const result = this._chain.then(task);
    this._chain = result.catch(() => {});
    return result;
  }
}
