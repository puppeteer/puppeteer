"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.assert = void 0;
/**
 * Asserts that the given value is truthy.
 * @param value
 * @param message - the error message to throw if the value is not truthy.
 */
const assert = (value, message) => {
    if (!value)
        throw new Error(message);
};
exports.assert = assert;
//# sourceMappingURL=assert.js.map