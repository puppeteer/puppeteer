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
import { assert } from './assert.js';
/**
 * Dialog instances are dispatched by the {@link Page} via the `dialog` event.
 *
 * @remarks
 *
 * @example
 * ```js
 * const puppeteer = require('puppeteer');
 *
 * (async () => {
 *   const browser = await puppeteer.launch();
 *   const page = await browser.newPage();
 *   page.on('dialog', async dialog => {
 *     console.log(dialog.message());
 *     await dialog.dismiss();
 *     await browser.close();
 *   });
 *   page.evaluate(() => alert('1'));
 * })();
 * ```
 */
export class Dialog {
    /**
     * @internal
     */
    constructor(client, type, message, defaultValue = '') {
        this._handled = false;
        this._client = client;
        this._type = type;
        this._message = message;
        this._defaultValue = defaultValue;
    }
    /**
     * @returns The type of the dialog.
     */
    type() {
        return this._type;
    }
    /**
     * @returns The message displayed in the dialog.
     */
    message() {
        return this._message;
    }
    /**
     * @returns The default value of the prompt, or an empty string if the dialog
     * is not a `prompt`.
     */
    defaultValue() {
        return this._defaultValue;
    }
    /**
     * @param promptText - optional text that will be entered in the dialog
     * prompt. Has no effect if the dialog's type is not `prompt`.
     *
     * @returns A promise that resolves when the dialog has been accepted.
     */
    async accept(promptText) {
        assert(!this._handled, 'Cannot accept dialog which is already handled!');
        this._handled = true;
        await this._client.send('Page.handleJavaScriptDialog', {
            accept: true,
            promptText: promptText,
        });
    }
    /**
     * @returns A promise which will resolve once the dialog has been dismissed
     */
    async dismiss() {
        assert(!this._handled, 'Cannot dismiss dialog which is already handled!');
        this._handled = true;
        await this._client.send('Page.handleJavaScriptDialog', {
            accept: false,
        });
    }
}
//# sourceMappingURL=Dialog.js.map