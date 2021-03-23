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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PuppeteerNode = void 0;
const Puppeteer_js_1 = require("../common/Puppeteer.js");
const BrowserFetcher_js_1 = require("./BrowserFetcher.js");
const Launcher_js_1 = __importDefault(require("./Launcher.js"));
const revisions_js_1 = require("../revisions.js");
/**
 * Extends the main {@link Puppeteer} class with Node specific behaviour for fetching and
 * downloading browsers.
 *
 * If you're using Puppeteer in a Node environment, this is the class you'll get
 * when you run `require('puppeteer')` (or the equivalent ES `import`).
 *
 * @remarks
 *
 * The most common method to use is {@link PuppeteerNode.launch | launch}, which
 * is used to launch and connect to a new browser instance.
 *
 * See {@link Puppeteer | the main Puppeteer class} for methods common to all
 * environments, such as {@link Puppeteer.connect}.
 *
 * @example
 * The following is a typical example of using Puppeteer to drive automation:
 * ```js
 * const puppeteer = require('puppeteer');
 *
 * (async () => {
 *   const browser = await puppeteer.launch();
 *   const page = await browser.newPage();
 *   await page.goto('https://www.google.com');
 *   // other actions...
 *   await browser.close();
 * })();
 * ```
 *
 * Once you have created a `page` you have access to a large API to interact
 * with the page, navigate, or find certain elements in that page.
 * The {@link Page | `page` documentation} lists all the available methods.
 *
 * @public
 */
class PuppeteerNode extends Puppeteer_js_1.Puppeteer {
    /**
     * @internal
     */
    constructor(settings) {
        const { projectRoot, preferredRevision, productName, ...commonSettings } = settings;
        super(commonSettings);
        this._projectRoot = projectRoot;
        this.__productName = productName;
        this._preferredRevision = preferredRevision;
    }
    /**
     * This method attaches Puppeteer to an existing browser instance.
     *
     * @remarks
     *
     * @param options - Set of configurable options to set on the browser.
     * @returns Promise which resolves to browser instance.
     */
    connect(options) {
        if (options.product)
            this._productName = options.product;
        return super.connect(options);
    }
    /**
     * @internal
     */
    get _productName() {
        return this.__productName;
    }
    // don't need any TSDoc here - because the getter is internal the setter is too.
    set _productName(name) {
        if (this.__productName !== name)
            this._changedProduct = true;
        this.__productName = name;
    }
    /**
     * Launches puppeteer and launches a browser instance with given arguments
     * and options when specified.
     *
     * @remarks
     *
     * @example
     * You can use `ignoreDefaultArgs` to filter out `--mute-audio` from default arguments:
     * ```js
     * const browser = await puppeteer.launch({
     *   ignoreDefaultArgs: ['--mute-audio']
     * });
     * ```
     *
     * **NOTE** Puppeteer can also be used to control the Chrome browser,
     * but it works best with the version of Chromium it is bundled with.
     * There is no guarantee it will work with any other version.
     * Use `executablePath` option with extreme caution.
     * If Google Chrome (rather than Chromium) is preferred, a {@link https://www.google.com/chrome/browser/canary.html | Chrome Canary} or {@link https://www.chromium.org/getting-involved/dev-channel | Dev Channel} build is suggested.
     * In `puppeteer.launch([options])`, any mention of Chromium also applies to Chrome.
     * See {@link https://www.howtogeek.com/202825/what%E2%80%99s-the-difference-between-chromium-and-chrome/ | this article} for a description of the differences between Chromium and Chrome. {@link https://chromium.googlesource.com/chromium/src/+/lkgr/docs/chromium_browser_vs_google_chrome.md | This article} describes some differences for Linux users.
     *
     * @param options - Set of configurable options to set on the browser.
     * @returns Promise which resolves to browser instance.
     */
    launch(options = {}) {
        if (options.product)
            this._productName = options.product;
        return this._launcher.launch(options);
    }
    /**
     * @remarks
     *
     * **NOTE** `puppeteer.executablePath()` is affected by the `PUPPETEER_EXECUTABLE_PATH`
     * and `PUPPETEER_CHROMIUM_REVISION` environment variables.
     *
     * @returns A path where Puppeteer expects to find the bundled browser.
     * The browser binary might not be there if the download was skipped with
     * the `PUPPETEER_SKIP_DOWNLOAD` environment variable.
     */
    executablePath() {
        return this._launcher.executablePath();
    }
    /**
     * @internal
     */
    get _launcher() {
        if (!this._lazyLauncher ||
            this._lazyLauncher.product !== this._productName ||
            this._changedProduct) {
            switch (this._productName) {
                case 'firefox':
                    this._preferredRevision = revisions_js_1.PUPPETEER_REVISIONS.firefox;
                    break;
                case 'chrome':
                default:
                    this._preferredRevision = revisions_js_1.PUPPETEER_REVISIONS.chromium;
            }
            this._changedProduct = false;
            this._lazyLauncher = Launcher_js_1.default(this._projectRoot, this._preferredRevision, this._isPuppeteerCore, this._productName);
        }
        return this._lazyLauncher;
    }
    /**
     * The name of the browser that is under automation (`"chrome"` or `"firefox"`)
     *
     * @remarks
     * The product is set by the `PUPPETEER_PRODUCT` environment variable or the `product`
     * option in `puppeteer.launch([options])` and defaults to `chrome`.
     * Firefox support is experimental.
     */
    get product() {
        return this._launcher.product;
    }
    /**
     *
     * @param options - Set of configurable options to set on the browser.
     * @returns The default flags that Chromium will be launched with.
     */
    defaultArgs(options = {}) {
        return this._launcher.defaultArgs(options);
    }
    /**
     * @param options - Set of configurable options to specify the settings
     * of the BrowserFetcher.
     * @returns A new BrowserFetcher instance.
     */
    createBrowserFetcher(options) {
        return new BrowserFetcher_js_1.BrowserFetcher(this._projectRoot, options);
    }
}
exports.PuppeteerNode = PuppeteerNode;
//# sourceMappingURL=Puppeteer.js.map