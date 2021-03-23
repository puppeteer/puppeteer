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
import { helper } from './helper.js';
/**
 * The Tracing class exposes the tracing audit interface.
 * @remarks
 * You can use `tracing.start` and `tracing.stop` to create a trace file
 * which can be opened in Chrome DevTools or {@link https://chromedevtools.github.io/timeline-viewer/ | timeline viewer}.
 *
 * @example
 * ```js
 * await page.tracing.start({path: 'trace.json'});
 * await page.goto('https://www.google.com');
 * await page.tracing.stop();
 * ```
 *
 * @public
 */
export class Tracing {
    /**
     * @internal
     */
    constructor(client) {
        this._recording = false;
        this._path = '';
        this._client = client;
    }
    /**
     * Starts a trace for the current page.
     * @remarks
     * Only one trace can be active at a time per browser.
     * @param options - Optional `TracingOptions`.
     */
    async start(options = {}) {
        assert(!this._recording, 'Cannot start recording trace while already recording trace.');
        const defaultCategories = [
            '-*',
            'devtools.timeline',
            'v8.execute',
            'disabled-by-default-devtools.timeline',
            'disabled-by-default-devtools.timeline.frame',
            'toplevel',
            'blink.console',
            'blink.user_timing',
            'latencyInfo',
            'disabled-by-default-devtools.timeline.stack',
            'disabled-by-default-v8.cpu_profiler',
            'disabled-by-default-v8.cpu_profiler.hires',
        ];
        const { path = null, screenshots = false, categories = defaultCategories, } = options;
        if (screenshots)
            categories.push('disabled-by-default-devtools.screenshot');
        this._path = path;
        this._recording = true;
        await this._client.send('Tracing.start', {
            transferMode: 'ReturnAsStream',
            categories: categories.join(','),
        });
    }
    /**
     * Stops a trace started with the `start` method.
     * @returns Promise which resolves to buffer with trace data.
     */
    async stop() {
        let fulfill;
        let reject;
        const contentPromise = new Promise((x, y) => {
            fulfill = x;
            reject = y;
        });
        this._client.once('Tracing.tracingComplete', (event) => {
            helper
                .readProtocolStream(this._client, event.stream, this._path)
                .then(fulfill, reject);
        });
        await this._client.send('Tracing.end');
        this._recording = false;
        return contentPromise;
    }
}
//# sourceMappingURL=Tracing.js.map