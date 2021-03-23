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
import { ConnectionTransport } from './ConnectionTransport.js';
import { Browser } from './Browser.js';
import { Viewport } from './PuppeteerViewport.js';
/**
 * Generic browser options that can be passed when launching any browser or when
 * connecting to an existing browser instance.
 * @public
 */
export interface BrowserConnectOptions {
    /**
     * Whether to ignore HTTPS errors during navigation.
     * @defaultValue false
     */
    ignoreHTTPSErrors?: boolean;
    /**
     * Sets the viewport for each page.
     */
    defaultViewport?: Viewport;
    /**
     * Slows down Puppeteer operations by the specified amount of milliseconds to
     * aid debugging.
     */
    slowMo?: number;
}
/**
 * Users should never call this directly; it's called when calling
 * `puppeteer.connect`.
 * @internal
 */
export declare const connectToBrowser: (options: BrowserConnectOptions & {
    browserWSEndpoint?: string;
    browserURL?: string;
    transport?: ConnectionTransport;
}) => Promise<Browser>;
//# sourceMappingURL=BrowserConnector.d.ts.map