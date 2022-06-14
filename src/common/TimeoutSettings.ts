/**
 * Copyright 2019 Google Inc. All rights reserved.
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

const DEFAULT_TIMEOUT = 30000;

/**
 * @internal
 */
export class TimeoutSettings {
  #defaultTimeout: number | null;
  #defaultNavigationTimeout: number | null;

  constructor() {
    this.#defaultTimeout = null;
    this.#defaultNavigationTimeout = null;
  }

  setDefaultTimeout(timeout: number): void {
    this.#defaultTimeout = timeout;
  }

  setDefaultNavigationTimeout(timeout: number): void {
    this.#defaultNavigationTimeout = timeout;
  }

  navigationTimeout(): number {
    if (this.#defaultNavigationTimeout !== null) {
      return this.#defaultNavigationTimeout;
    }
    if (this.#defaultTimeout !== null) {
      return this.#defaultTimeout;
    }
    return DEFAULT_TIMEOUT;
  }

  timeout(): number {
    if (this.#defaultTimeout !== null) {
      return this.#defaultTimeout;
    }
    return DEFAULT_TIMEOUT;
  }
}
