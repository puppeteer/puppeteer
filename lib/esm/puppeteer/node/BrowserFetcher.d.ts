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
import { Product } from '../common/Product.js';
/**
 * Supported platforms.
 * @public
 */
export declare type Platform = 'linux' | 'mac' | 'win32' | 'win64';
/**
 * @public
 */
export interface BrowserFetcherOptions {
    platform?: Platform;
    product?: string;
    path?: string;
    host?: string;
}
/**
 * @public
 */
export interface BrowserFetcherRevisionInfo {
    folderPath: string;
    executablePath: string;
    url: string;
    local: boolean;
    revision: string;
    product: string;
}
/**
 * BrowserFetcher can download and manage different versions of Chromium and Firefox.
 *
 * @remarks
 * BrowserFetcher operates on revision strings that specify a precise version of Chromium, e.g. `"533271"`. Revision strings can be obtained from {@link http://omahaproxy.appspot.com/ | omahaproxy.appspot.com}.
 * In the Firefox case, BrowserFetcher downloads Firefox Nightly and
 * operates on version numbers such as `"75"`.
 *
 * @example
 * An example of using BrowserFetcher to download a specific version of Chromium
 * and running Puppeteer against it:
 *
 * ```js
 * const browserFetcher = puppeteer.createBrowserFetcher();
 * const revisionInfo = await browserFetcher.download('533271');
 * const browser = await puppeteer.launch({executablePath: revisionInfo.executablePath})
 * ```
 *
 * **NOTE** BrowserFetcher is not designed to work concurrently with other
 * instances of BrowserFetcher that share the same downloads directory.
 *
 * @public
 */
export declare class BrowserFetcher {
    private _product;
    private _downloadsFolder;
    private _downloadHost;
    private _platform;
    /**
     * @internal
     */
    constructor(projectRoot: string, options?: BrowserFetcherOptions);
    private setPlatform;
    /**
     * @returns Returns the current `Platform`.
     */
    platform(): Platform;
    /**
     * @returns Returns the current `Product`.
     */
    product(): Product;
    /**
     * @returns The download host being used.
     */
    host(): string;
    /**
     * Initiates a HEAD request to check if the revision is available.
     * @remarks
     * This method is affected by the current `product`.
     * @param revision - The revision to check availability for.
     * @returns A promise that resolves to `true` if the revision could be downloaded
     * from the host.
     */
    canDownload(revision: string): Promise<boolean>;
    /**
     * Initiates a GET request to download the revision from the host.
     * @remarks
     * This method is affected by the current `product`.
     * @param revision - The revision to download.
     * @param progressCallback - A function that will be called with two arguments:
     * How many bytes have been downloaded and the total number of bytes of the download.
     * @returns A promise with revision information when the revision is downloaded
     * and extracted.
     */
    download(revision: string, progressCallback?: (x: number, y: number) => void): Promise<BrowserFetcherRevisionInfo>;
    /**
     * @remarks
     * This method is affected by the current `product`.
     * @returns A promise with a list of all revision strings (for the current `product`)
     * available locally on disk.
     */
    localRevisions(): Promise<string[]>;
    /**
     * @remarks
     * This method is affected by the current `product`.
     * @param revision - A revision to remove for the current `product`.
     * @returns A promise that resolves when the revision has been removes or
     * throws if the revision has not been downloaded.
     */
    remove(revision: string): Promise<void>;
    /**
     * @param revision - The revision to get info for.
     * @returns The revision info for the given revision.
     */
    revisionInfo(revision: string): BrowserFetcherRevisionInfo;
    /**
     * @internal
     */
    _getFolderPath(revision: string): string;
}
//# sourceMappingURL=BrowserFetcher.d.ts.map