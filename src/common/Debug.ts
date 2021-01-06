/**
 * Copyright 2017 Google Inc. All rights reserved.
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

import Config from './Config.js';

const _debugs = new Map();

export const debug = (prefix: string): ((...args: unknown[]) => void) => {
  return (...args: unknown[]): void => {
    let _debug: (...args: unknown[]) => void = _debugs.get(prefix);
    if (!_debug) {
      _debug = Config.debug(prefix);
      _debugs.set(prefix, _debug);
    }
    _debug(...args);
  };
};
