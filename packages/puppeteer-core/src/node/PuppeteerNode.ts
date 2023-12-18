/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Browser as SupportedBrowser,
  resolveBuildId,
  detectBrowserPlatform,
  getInstalledBrowsers,
  uninstall,
} from '@puppeteer/browsers';

import type {Browser} from '../api/Browser.js';
import type {Configuration} from '../common/Configuration.js';
import type {
  ConnectOptions,
  BrowserConnectOptions,
} from '../common/ConnectOptions.js';
import type {Product} from '../common/Product.js';
import {type CommonPuppeteerSettings, Puppeteer} from '../common/Puppeteer.js';
import {PUPPETEER_REVISIONS} from '../revisions.js';

import {ChromeLauncher} from './ChromeLauncher.js';
import {FirefoxLauncher} from './FirefoxLauncher.js';
import type {
  BrowserLaunchArgumentOptions,
  ChromeReleaseChannel,
  LaunchOptions,
} from './LaunchOptions.js';
import type {ProductLauncher} from './ProductLauncher.js';

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
 * import puppeteer from 'puppeteer';
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
        this.defaultBrowserRevision = PUPPETEER_REVISIONS.chrome;
        break;
    }

    this.connect = this.connect.bind(this);
    this.launch = this.launch.bind(this);
    this.executablePath = this.executablePath.bind(this);
    this.defaultArgs = this.defaultArgs.bind(this);
    this.trimCache = this.trimCache.bind(this);
  }

  /**
   * This method attaches Puppeteer to an existing browser instance.
   *
   * @param options - Set of configurable options to set on the browser.
   * @returns Promise which resolves to browser instance.
   */
  override connect(options: ConnectOptions): Promise<Browser> {
    return super.connect(options);
  }

  /**
   * Launches a browser instance with given arguments and options when
   * specified.
   *
   * When using with `puppeteer-core`,
   * {@link LaunchOptions | options.executablePath} or
   * {@link LaunchOptions | options.channel} must be provided.
   *
   * @example
   * You can use {@link LaunchOptions | options.ignoreDefaultArgs}
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
   * with the version of Chrome for Testing downloaded by default.
   * There is no guarantee it will work with any other version. If Google Chrome
   * (rather than Chrome for Testing) is preferred, a
   * {@link https://www.google.com/chrome/browser/canary.html | Chrome Canary}
   * or
   * {@link https://www.chromium.org/getting-involved/dev-channel | Dev Channel}
   * build is suggested. See
   * {@link https://www.howtogeek.com/202825/what%E2%80%99s-the-difference-between-chromium-and-chrome/ | this article}
   * for a description of the differences between Chromium and Chrome.
   * {@link https://chromium.googlesource.com/chromium/src/+/lkgr/docs/chromium_browser_vs_google_chrome.md | This article}
   * describes some differences for Linux users. See
   * {@link https://developer.chrome.com/blog/chrome-for-testing/ | this doc} for the description
   * of Chrome for Testing.
   *
   * @param options - Options to configure launching behavior.
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
        this.defaultBrowserRevision = PUPPETEER_REVISIONS.chrome;
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
   * The default executable path.
   */
  executablePath(channel?: ChromeReleaseChannel): string {
    return this.#launcher.executablePath(channel);
  }

  /**
   * @internal
   */
  get browserRevision(): string {
    return (
      this.#_launcher?.getActualBrowserRevision() ??
      this.configuration.browserRevision ??
      this.defaultBrowserRevision!
    );
  }

  /**
   * The default download path for puppeteer. For puppeteer-core, this
   * code should never be called as it is never defined.
   *
   * @internal
   */
  get defaultDownloadPath(): string | undefined {
    return this.configuration.downloadPath ?? this.configuration.cacheDirectory;
  }

  /**
   * The name of the browser that was last launched.
   */
  get lastLaunchedProduct(): Product {
    return this.#lastLaunchedProduct ?? this.defaultProduct;
  }

  /**
   * The name of the browser that will be launched by default. For
   * `puppeteer`, this is influenced by your configuration. Otherwise, it's
   * `chrome`.
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
   */
  get product(): string {
    return this.#launcher.product;
  }

  /**
   * @param options - Set of configurable options to set on the browser.
   *
   * @returns The default flags that Chromium will be launched with.
   */
  defaultArgs(options: BrowserLaunchArgumentOptions = {}): string[] {
    return this.#launcher.defaultArgs(options);
  }

  /**
   * Removes all non-current Firefox and Chrome binaries in the cache directory
   * identified by the provided Puppeteer configuration. The current browser
   * version is determined by resolving PUPPETEER_REVISIONS from Puppeteer
   * unless `configuration.browserRevision` is provided.
   *
   * @remarks
   *
   * Note that the method does not check if any other Puppeteer versions
   * installed on the host that use the same cache directory require the
   * non-current binaries.
   *
   * @public
   */
  async trimCache(): Promise<void> {
    const platform = detectBrowserPlatform();
    if (!platform) {
      throw new Error('The current platform is not supported.');
    }

    const cacheDir =
      this.configuration.downloadPath ?? this.configuration.cacheDirectory!;
    const installedBrowsers = await getInstalledBrowsers({
      cacheDir,
    });

    const product = this.configuration.defaultProduct!;

    const puppeteerBrowsers: Array<{
      product: Product;
      browser: SupportedBrowser;
      currentBuildId: string;
    }> = [
      {
        product: 'chrome',
        browser: SupportedBrowser.CHROME,
        currentBuildId: '',
      },
      {
        product: 'firefox',
        browser: SupportedBrowser.FIREFOX,
        currentBuildId: '',
      },
    ];

    // Resolve current buildIds.
    for (const item of puppeteerBrowsers) {
      item.currentBuildId = await resolveBuildId(
        item.browser,
        platform,
        (product === item.product
          ? this.configuration.browserRevision
          : null) || PUPPETEER_REVISIONS[item.product]
      );
    }

    const currentBrowserBuilds = new Set(
      puppeteerBrowsers.map(browser => {
        return `${browser.browser}_${browser.currentBuildId}`;
      })
    );

    const currentBrowsers = new Set(
      puppeteerBrowsers.map(browser => {
        return browser.browser;
      })
    );

    for (const installedBrowser of installedBrowsers) {
      // Don't uninstall browsers that are not managed by Puppeteer yet.
      if (!currentBrowsers.has(installedBrowser.browser)) {
        continue;
      }
      // Keep the browser build used by the current Puppeteer installation.
      if (
        currentBrowserBuilds.has(
          `${installedBrowser.browser}_${installedBrowser.buildId}`
        )
      ) {
        continue;
      }

      await uninstall({
        browser: installedBrowser.browser,
        platform,
        cacheDir,
        buildId: installedBrowser.buildId,
      });
    }
  }
}
