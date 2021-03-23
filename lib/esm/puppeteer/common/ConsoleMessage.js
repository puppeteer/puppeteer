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
/**
 * ConsoleMessage objects are dispatched by page via the 'console' event.
 * @public
 */
export class ConsoleMessage {
    /**
     * @public
     */
    constructor(type, text, args, stackTraceLocations) {
        this._type = type;
        this._text = text;
        this._args = args;
        this._stackTraceLocations = stackTraceLocations;
    }
    /**
     * @returns The type of the console message.
     */
    type() {
        return this._type;
    }
    /**
     * @returns The text of the console message.
     */
    text() {
        return this._text;
    }
    /**
     * @returns An array of arguments passed to the console.
     */
    args() {
        return this._args;
    }
    /**
     * @returns The location of the console message.
     */
    location() {
        return this._stackTraceLocations.length ? this._stackTraceLocations[0] : {};
    }
    /**
     * @returns The array of locations on the stack of the console message.
     */
    stackTrace() {
        return this._stackTraceLocations;
    }
}
//# sourceMappingURL=ConsoleMessage.js.map