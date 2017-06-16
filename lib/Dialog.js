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

class Dialog {
    /**
     * @param {!Connection} client
     * @param {!Dialog.Type} type
     * @param {string} message
     */
    constructor(client, type, message) {
        this._client = client;
        this.type = type;
        this._message = message;
        this._handled = false;
    }

    /**
     * @return {string}
     */
    message() {
        return this._message;
    }

    /**
     * @param {string=} promptText
     * @return {!Promise}
     */
    async accept(promptText) {
        console.assert(!this._handled, 'Cannot accept dialog which is already handled!');
        this._handled = true;
        await this._client.send('Page.handleJavaScriptDialog', {
            accept: true,
            promptText: promptText
        });
    }

    /**
     * @return {!Promise}
     */
    async dismiss() {
        console.assert(!this._handled, 'Cannot dismiss dialog which is already handled!');
        this._handled = true;
        await this._client.send('Page.handleJavaScriptDialog', {
            accept: false
        });
    }
}

Dialog.Type = {
    Alert: 'alert',
    BeforeUnload: 'beforeunload',
    Confirm: 'confirm',
    Prompt: 'prompt'
};

module.exports = Dialog;
