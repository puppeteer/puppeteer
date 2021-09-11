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
  _defaultTimeout: number | null;
  _defaultNavigationTimeout: number | null;

  constructor() {
    this._defaultTimeout = null;
    this._defaultNavigationTimeout = null;
  }

  setDefaultTimeout(timeout: number): void {
    this._defaultTimeout = timeout;
  }

  setDefaultNavigationTimeout(timeout: number): void {
    this._defaultNavigationTimeout = timeout;
  }

  navigationTimeout(): number {
    if (this._defaultNavigationTimeout !== null)
      return this._defaultNavigationTimeout;
    if (this._defaultTimeout !== null) return this._defaultTimeout;
    return DEFAULT_TIMEOUT;
  }

  timeout(): number {
    if (this._defaultTimeout !== null) return this._defaultTimeout;
    return DEFAULT_TIMEOUT;
  }
}
