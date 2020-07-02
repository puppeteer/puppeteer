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
import Launcher from '../node/Launcher';
import {
  LaunchOptions,
  ChromeArgOptions,
  BrowserOptions,
} from '../node/LaunchOptions';
import { ProductLauncher } from '../node/Launcher';
import { BrowserFetcher, BrowserFetcherOptions } from '../node/BrowserFetcher';
import { puppeteerErrors, PuppeteerErrors } from './Errors';
import { ConnectionTransport } from './ConnectionTransport';
import { devicesMap, DevicesMap } from './DeviceDescriptors';
import { Browser } from './Browser';
import {
  registerCustomQueryHandler,
  unregisterCustomQueryHandler,
  customQueryHandlers,
  clearQueryHandlers,
  QueryHandler,
} from './QueryHandler';
import { PUPPETEER_REVISIONS } from '../revisions';

/**
 * The main Puppeteer class
 * Puppeteer module provides a method to launch a browser instance.
 *
 * @remarks
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
 * @public
 */
export class Puppeteer {
  private _projectRoot: string;
  _preferredRevision: string;
  _isPuppeteerCore: boolean;
  _changedProduct = false;
  __productName: string;
  _lazyLauncher: ProductLauncher;

  /**
   * @internal
   */
  constructor(
    projectRoot: string,
    preferredRevision: string,
    isPuppeteerCore: boolean,
    productName: string
  ) {
    this._projectRoot = projectRoot;
    this._preferredRevision = preferredRevision;
    this._isPuppeteerCore = isPuppeteerCore;
    // track changes to Launcher configuration via options or environment variables
    this.__productName = productName;
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
  launch(
    options: LaunchOptions &
      ChromeArgOptions &
      BrowserOptions & { product?: string; extraPrefsFirefox?: {} } = {}
  ): Promise<Browser> {
    if (options.product) this._productName = options.product;
    return this._launcher.launch(options);
  }

  /**
   * This method attaches Puppeteer to an existing browser instance.
   *
   * @remarks
   *
   * @param options - Set of configurable options to set on the browser.
   * @returns Promise which resolves to browser instance.
   */
  connect(
    options: BrowserOptions & {
      browserWSEndpoint?: string;
      browserURL?: string;
      transport?: ConnectionTransport;
      product?: string;
    }
  ): Promise<Browser> {
    if (options.product) this._productName = options.product;
    return this._launcher.connect(options);
  }

  /**
   * @internal
   */
  get _productName(): string {
    return this.__productName;
  }

  // don't need any TSDoc here - because the getter is internal the setter is too.
  set _productName(name: string) {
    if (this.__productName !== name) this._changedProduct = true;
    this.__productName = name;
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
  executablePath(): string {
    return this._launcher.executablePath();
  }

  /**
   * @internal
   */
  get _launcher(): ProductLauncher {
    if (
      !this._lazyLauncher ||
      this._lazyLauncher.product !== this._productName ||
      this._changedProduct
    ) {
      switch (this._productName) {
        case 'firefox':
          this._preferredRevision = PUPPETEER_REVISIONS.firefox;
          break;
        case 'chrome':
        default:
          this._preferredRevision = PUPPETEER_REVISIONS.chromium;
      }
      this._changedProduct = false;
      this._lazyLauncher = Launcher(
        this._projectRoot,
        this._preferredRevision,
        this._isPuppeteerCore,
        this._productName
      );
    }
    return this._lazyLauncher;
  }

  /**
   * @returns The name of the browser that is under automation (`"chrome"` or `"firefox"`)
   *
   * @remarks
   * The product is set by the `PUPPETEER_PRODUCT` environment variable or the `product`
   * option in `puppeteer.launch([options])` and defaults to `chrome`.
   * Firefox support is experimental.
   */
  get product(): string {
    return this._launcher.product;
  }

  /**
   * @remarks
   * @example
   *
   * ```js
   * const puppeteer = require('puppeteer');
   * const iPhone = puppeteer.devices['iPhone 6'];
   *
   * (async () => {
   *   const browser = await puppeteer.launch();
   *   const page = await browser.newPage();
   *   await page.emulate(iPhone);
   *   await page.goto('https://www.google.com');
   *   // other actions...
   *   await browser.close();
   * })();
   * ```
   *
   * @returns a list of devices to be used with `page.emulate(options)`. Actual list of devices can be found in {@link https://github.com/puppeteer/puppeteer/blob/main/src/DeviceDescriptors.ts | src/DeviceDescriptors.ts}.
   */
  get devices(): DevicesMap {
    return devicesMap;
  }

  /**
   * @remarks
   *
   * Puppeteer methods might throw errors if they are unable to fulfill a request.
   * For example, `page.waitForSelector(selector[, options])` might fail if
   * the selector doesn't match any nodes during the given timeframe.
   *
   * For certain types of errors Puppeteer uses specific error classes.
   * These classes are available via `puppeteer.errors`
   * @example
   * An example of handling a timeout error:
   * ```js
   * try {
   *   await page.waitForSelector('.foo');
   * } catch (e) {
   *   if (e instanceof puppeteer.errors.TimeoutError) {
   *     // Do something if this is a timeout.
   *   }
   * }
   * ```
   */
  get errors(): PuppeteerErrors {
    return puppeteerErrors;
  }

  /**
   *
   * @param options - Set of configurable options to set on the browser.
   * @returns The default flags that Chromium will be launched with.
   */
  defaultArgs(options: ChromeArgOptions = {}): string[] {
    return this._launcher.defaultArgs(options);
  }

  /**
   *
   * @param options - Set of configurable options to specify the settings
   * of the BrowserFetcher.
   * @returns A new BrowserFetcher instance.
   */
  createBrowserFetcher(options: BrowserFetcherOptions): BrowserFetcher {
    return new BrowserFetcher(this._projectRoot, options);
  }

  /**
   * @internal
   */
  // eslint-disable-next-line @typescript-eslint/camelcase
  __experimental_registerCustomQueryHandler(
    name: string,
    queryHandler: QueryHandler
  ): void {
    registerCustomQueryHandler(name, queryHandler);
  }

  /**
   * @internal
   */
  // eslint-disable-next-line @typescript-eslint/camelcase
  __experimental_unregisterCustomQueryHandler(name: string): void {
    unregisterCustomQueryHandler(name);
  }

  /**
   * @internal
   */
  // eslint-disable-next-line @typescript-eslint/camelcase
  __experimental_customQueryHandlers(): Map<string, QueryHandler> {
    return customQueryHandlers();
  }

  /**
   * @internal
   */
  // eslint-disable-next-line @typescript-eslint/camelcase
  __experimental_clearQueryHandlers(): void {
    clearQueryHandlers();
  }
}
