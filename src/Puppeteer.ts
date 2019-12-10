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

import { Launcher, ProductLauncher } from './Launcher';
import { BrowserFetcher, FetcherOptions } from './BrowserFetcher';
import { LaunchOptions, ConnectOptions, ChromeArgOptions } from './types';
import { Browser } from './Browser';
import { devices, Device } from './DeviceDescriptors';
import * as Errors from './Errors';

export class Puppeteer {
  private _productName?: string;
  private _lazyLauncher?: ProductLauncher;

  constructor(private _projectRoot: string, private _preferredRevision: string, private _isPuppeteerCore: boolean) {}

  public launch = (options?: LaunchOptions & { product?: string; extraPrefsFirefox?: object }): Promise<Browser> => {
    if (!this._productName && options) this._productName = options.product;
    return this._launcher.launch(options);
  }

  public connect = (options?: ConnectOptions): Promise<Browser> => this._launcher.connect(options);

  /**
   * @returns A path where Puppeteer expects to find bundled Chromium. Chromium might not exist
   * there if the download was skipped with `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD`.
   */
  public executablePath = (): string => this._launcher.executablePath();

  /* @internal */
  private get _launcher(): ProductLauncher {
    if (!this._lazyLauncher) {
      this._lazyLauncher = Launcher(
          this._projectRoot,
          this._preferredRevision,
          this._isPuppeteerCore,
          this._productName
      );
    }
    return this._lazyLauncher;
  }

  public get product(): string {
    return this._launcher.product;
  }

  /**
   * Returns a list of devices to be used with page.emulate(options).
   * Actual list of devices can be found in `src/DeviceDescriptors.ts`.
   *
   * @example
   * const puppeteer = require('puppeteer');
   * const iPhone = puppeteer.devices['iPhone 6'];
   * puppeteer.launch().then(async browser => {
   *   const page = await browser.newPage();
   *   await page.emulate(iPhone);
   *   await page.goto('https://www.google.com');
   *   // other actions...
   *   await browser.close();
   * });
   */
  public get devices(): Record<string, Device> {
    return devices;
  }

  /**
   * Puppeteer methods might throw errors if they are unable to fulfill a request.
   * For example, `page.waitForSelector(selector[, options])` might fail if the selector doesn't match
   * any nodes during the given timeframe.
   *
   * For certain types of errors Puppeteer uses specific error classes.
   *
   * @example
   * try {
   *   await page.waitForSelector('.foo');
   * } catch (e) {
   *   if (e instanceof puppeteer.errors.TimeoutError) {
   *     // Do something if this is a timeout.
   *   }
   * }
   */
  public get Errors(): typeof Errors {
    return Errors;
  }

  /**
   * The default flags that Chromium will be launched with.
   */
  public defaultArgs = (options?: ChromeArgOptions): string[] => this._launcher.defaultArgs(options);

  public createBrowserFetcher = (options?: FetcherOptions): BrowserFetcher =>
    new BrowserFetcher(this._projectRoot, options);
}
