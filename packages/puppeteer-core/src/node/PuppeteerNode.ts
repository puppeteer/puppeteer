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

import {join} from 'path';
import {Browser} from '../api/Browser.js';
import {BrowserConnectOptions} from '../common/BrowserConnector.js';
import {Product} from '../common/Product.js';
import {
  CommonPuppeteerSettings,
  ConnectOptions,
  Puppeteer,
} from '../common/Puppeteer.js';
import {Configuration} from '../common/Configuration.js';
import {PUPPETEER_REVISIONS} from '../revisions.js';
import {BrowserFetcher, BrowserFetcherOptions} from './BrowserFetcher.js';
import {ChromeLauncher} from './ChromeLauncher.js';
import {FirefoxLauncher} from './FirefoxLauncher.js';
import {
  BrowserLaunchArgumentOptions,
  ChromeReleaseChannel,
  LaunchOptions,
} from './LaunchOptions.js';
import {ProductLauncher} from './ProductLauncher.js';

/**
 * @public
 */
export interface PuppeteerLaunchOptions
  extends LaunchOptions,
    BrowserLaunchArgumentOptions,
    BrowserConnectOptions {
  product?: Product;
  extraPrefsFirefox?: Record<string, unknown>;
}

/**
 * Extends the main {@link Puppeteer} class with Node specific behaviour for
 * fetching and downloading browsers.
 *
 * If you're using Puppeteer in a Node environment, this is the class you'll get
 * when you run `require('puppeteer')` (or the equivalent ES `import`).
 *
 * @remarks
 * The most common method to use is {@link PuppeteerNode.launch | launch}, which
 * is used to launch and connect to a new browser instance.
 *
 * See {@link Puppeteer | the main Puppeteer class} for methods common to all
 * environments, such as {@link Puppeteer.connect}.
 *
 * @example
 * The following is a typical example of using Puppeteer to drive automation:
 *
 * ```ts
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
export class PuppeteerNode extends Puppeteer {
  #_launcher?: ProductLauncher;
  #lastLaunchedProduct?: Product;

  /**
   * @internal
   */
  defaultBrowserRevision: string;

  /**
   * @internal
   */
  configuration: Configuration = {};

  /**
   * @internal
   */
  constructor(
    settings: {
      configuration?: Configuration;
    } & CommonPuppeteerSettings
  ) {
    const {configuration, ...commonSettings} = settings;
    super(commonSettings);
    if (configuration) {
      this.configuration = configuration;
    }
    switch (this.configuration.defaultProduct) {
      case 'firefox':
        this.defaultBrowserRevision = PUPPETEER_REVISIONS.firefox;
        break;
      default:
        this.configuration.defaultProduct = 'chrome';
        this.defaultBrowserRevision = PUPPETEER_REVISIONS.chromium;
        break;
    }

    this.connect = this.connect.bind(this);
    this.launch = this.launch.bind(this);
    this.executablePath = this.executablePath.bind(this);
    this.defaultArgs = this.defaultArgs.bind(this);
    this.createBrowserFetcher = this.createBrowserFetcher.bind(this);
  }

  /**
   * This method attaches Puppeteer to an existing browser instance.
   *
   * @param options - Set of configurable options to set on the browser.
   * @returns Promise which resolves to browser instance.
   *
   * @public
   */
  override connect(options: ConnectOptions): Promise<Browser> {
    return super.connect(options);
  }

  /**
   * Launches a browser instance with given arguments and options when
   * specified.
   *
   * When using with `puppeteer-core`,
   * {@link LaunchOptions.executablePath | options.executablePath} or
   * {@link LaunchOptions.channel | options.channel} must be provided.
   *
   * @example
   * You can use {@link LaunchOptions.ignoreDefaultArgs | options.ignoreDefaultArgs}
   * to filter out `--mute-audio` from default arguments:
   *
   * ```ts
   * const browser = await puppeteer.launch({
   *   ignoreDefaultArgs: ['--mute-audio'],
   * });
   * ```
   *
   * @remarks
   * Puppeteer can also be used to control the Chrome browser, but it works best
   * with the version of Chromium downloaded by default by Puppeteer. There is
   * no guarantee it will work with any other version. If Google Chrome (rather
   * than Chromium) is preferred, a
   * {@link https://www.google.com/chrome/browser/canary.html | Chrome Canary}
   * or
   * {@link https://www.chromium.org/getting-involved/dev-channel | Dev Channel}
   * build is suggested. See
   * {@link https://www.howtogeek.com/202825/what%E2%80%99s-the-difference-between-chromium-and-chrome/ | this article}
   * for a description of the differences between Chromium and Chrome.
   * {@link https://chromium.googlesource.com/chromium/src/+/lkgr/docs/chromium_browser_vs_google_chrome.md | This article}
   * describes some differences for Linux users.
   *
   * @param options - Options to configure launching behavior.
   *
   * @public
   */
  launch(options: PuppeteerLaunchOptions = {}): Promise<Browser> {
    const {product = this.defaultProduct} = options;
    this.#lastLaunchedProduct = product;
    return this.#launcher.launch(options);
  }

  /**
   * @internal
   */
  get #launcher(): ProductLauncher {
    if (
      this.#_launcher &&
      this.#_launcher.product === this.lastLaunchedProduct
    ) {
      return this.#_launcher;
    }
    switch (this.lastLaunchedProduct) {
      case 'chrome':
        this.defaultBrowserRevision = PUPPETEER_REVISIONS.chromium;
        this.#_launcher = new ChromeLauncher(this);
        break;
      case 'firefox':
        this.defaultBrowserRevision = PUPPETEER_REVISIONS.firefox;
        this.#_launcher = new FirefoxLauncher(this);
        break;
      default:
        throw new Error(`Unknown product: ${this.#lastLaunchedProduct}`);
    }
    return this.#_launcher;
  }

  /**
   * @returns The default executable path.
   *
   * @public
   */
  executablePath(channel?: ChromeReleaseChannel): string {
    return this.#launcher.executablePath(channel);
  }

  /**
   * @internal
   */
  get browserRevision(): string {
    return this.configuration.browserRevision ?? this.defaultBrowserRevision!;
  }

  /**
   * @returns The default download path for puppeteer. For puppeteer-core, this
   * code should never be called as it is never defined.
   *
   * @internal
   */
  get defaultDownloadPath(): string | undefined {
    return (
      this.configuration.downloadPath ??
      join(this.configuration.cacheDirectory!, this.product)
    );
  }

  /**
   * @returns The name of the browser that was last launched.
   *
   * @public
   */
  get lastLaunchedProduct(): Product {
    return this.#lastLaunchedProduct ?? this.defaultProduct;
  }

  /**
   * @returns The name of the browser that will be launched by default. For
   * `puppeteer`, this is influenced by your configuration. Otherwise, it's
   * `chrome`.
   *
   * @public
   */
  get defaultProduct(): Product {
    return this.configuration.defaultProduct ?? 'chrome';
  }

  /**
   * @deprecated Do not use as this field as it does not take into account
   * multiple browsers of different types. Use
   * {@link PuppeteerNode.defaultProduct | defaultProduct} or
   * {@link PuppeteerNode.lastLaunchedProduct | lastLaunchedProduct}.
   *
   * @returns The name of the browser that is under automation.
   *
   * @public
   */
  get product(): string {
    return this.#launcher.product;
  }

  /**
   * @param options - Set of configurable options to set on the browser.
   *
   * @returns The default flags that Chromium will be launched with.
   *
   * @public
   */
  defaultArgs(options: BrowserLaunchArgumentOptions = {}): string[] {
    return this.#launcher.defaultArgs(options);
  }

  /**
   * @deprecated If you are using `puppeteer-core`, do not use this method. Just
   * construct {@link BrowserFetcher} manually.
   *
   * @param options - Set of configurable options to specify the settings of the
   * BrowserFetcher.
   *
   * @returns A new BrowserFetcher instance.
   */
  createBrowserFetcher(
    options: Partial<BrowserFetcherOptions>
  ): BrowserFetcher {
    const downloadPath = this.defaultDownloadPath;
    if (downloadPath) {
      options.path = downloadPath;
    }
    if (!options.path) {
      throw new Error('A `path` must be specified for `puppeteer-core`.');
    }
    if (this.configuration.experiments?.macArmChromiumEnabled) {
      options.useMacOSARMBinary = true;
    }
    if (this.configuration.downloadHost) {
      options.host = this.configuration.downloadHost;
    }
    return new BrowserFetcher(options as BrowserFetcherOptions);
  }
}
