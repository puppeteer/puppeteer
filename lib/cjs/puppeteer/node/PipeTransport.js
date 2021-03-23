"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipeTransport = void 0;
/**
 * Copyright 2018 Google Inc. All rights reserved.
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
const helper_js_1 = require("../common/helper.js");
class PipeTransport {
    constructor(pipeWrite, pipeRead) {
        this._pipeWrite = pipeWrite;
        this._pendingMessage = '';
        this._eventListeners = [
            helper_js_1.helper.addEventListener(pipeRead, 'data', (buffer) => this._dispatch(buffer)),
            helper_js_1.helper.addEventListener(pipeRead, 'close', () => {
                if (this.onclose)
                    this.onclose.call(null);
            }),
            helper_js_1.helper.addEventListener(pipeRead, 'error', helper_js_1.debugError),
            helper_js_1.helper.addEventListener(pipeWrite, 'error', helper_js_1.debugError),
        ];
        this.onmessage = null;
        this.onclose = null;
    }
    send(message) {
        this._pipeWrite.write(message);
        this._pipeWrite.write('\0');
    }
    _dispatch(buffer) {
        let end = buffer.indexOf('\0');
        if (end === -1) {
            this._pendingMessage += buffer.toString();
            return;
        }
        const message = this._pendingMessage + buffer.toString(undefined, 0, end);
        if (this.onmessage)
            this.onmessage.call(null, message);
        let start = end + 1;
        end = buffer.indexOf('\0', start);
        while (end !== -1) {
            if (this.onmessage)
                this.onmessage.call(null, buffer.toString(undefined, start, end));
            start = end + 1;
            end = buffer.indexOf('\0', start);
        }
        this._pendingMessage = buffer.toString(undefined, start);
    }
    close() {
        this._pipeWrite = null;
        helper_js_1.helper.removeEventListeners(this._eventListeners);
    }
}
exports.PipeTransport = PipeTransport;
//# sourceMappingURL=PipeTransport.js.map