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
import Launcher from './Launcher';
import type {
  LaunchOptions,
  ChromeArgOptions,
  BrowserOptions,
} from './launcher/LaunchOptions';
import type { ProductLauncher } from './Launcher';
import { BrowserFetcher, BrowserFetcherOptions } from './BrowserFetcher';
import { puppeteerErrors, PuppeteerErrors } from './Errors';
import type { ConnectionTransport } from './ConnectionTransport';

import { devicesMap } from './DeviceDescriptors';
import type { DevicesMap } from './/DeviceDescriptors';
import { Browser } from './Browser';
import * as QueryHandler from './QueryHandler';

export class Puppeteer {
  _projectRoot: string;
  _preferredRevision: string;
  _isPuppeteerCore: boolean;
  _changedProduct = false;
  __productName: string;
  _lazyLauncher: ProductLauncher;

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

  launch(
    options: LaunchOptions &
      ChromeArgOptions &
      BrowserOptions & { product?: string; extraPrefsFirefox?: {} } = {}
  ): Promise<Browser> {
    if (options.product) this._productName = options.product;
    return this._launcher.launch(options);
  }

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

  set _productName(name: string) {
    if (this.__productName !== name) this._changedProduct = true;
    this.__productName = name;
  }

  get _productName(): string {
    return this.__productName;
  }

  executablePath(): string {
    return this._launcher.executablePath();
  }

  get _launcher(): ProductLauncher {
    if (
      !this._lazyLauncher ||
      this._lazyLauncher.product !== this._productName ||
      this._changedProduct
    ) {
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const packageJson = require('../package.json');
      switch (this._productName) {
        case 'firefox':
          this._preferredRevision = packageJson.puppeteer.firefox_revision;
          break;
        case 'chrome':
        default:
          this._preferredRevision = packageJson.puppeteer.chromium_revision;
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

  get product(): string {
    return this._launcher.product;
  }

  get devices(): DevicesMap {
    return devicesMap;
  }

  get errors(): PuppeteerErrors {
    return puppeteerErrors;
  }

  defaultArgs(options: ChromeArgOptions): string[] {
    return this._launcher.defaultArgs(options);
  }

  createBrowserFetcher(options: BrowserFetcherOptions): BrowserFetcher {
    return new BrowserFetcher(this._projectRoot, options);
  }

  // eslint-disable-next-line @typescript-eslint/camelcase
  __experimental_registerCustomQueryHandler(
    name: string,
    queryHandler: QueryHandler.QueryHandler
  ): void {
    QueryHandler.registerCustomQueryHandler(name, queryHandler);
  }

  // eslint-disable-next-line @typescript-eslint/camelcase
  __experimental_unregisterCustomQueryHandler(name: string): void {
    QueryHandler.unregisterCustomQueryHandler(name);
  }

  // eslint-disable-next-line @typescript-eslint/camelcase
  __experimental_customQueryHandlers(): Map<string, QueryHandler.QueryHandler> {
    return QueryHandler.customQueryHandlers();
  }

  // eslint-disable-next-line @typescript-eslint/camelcase
  __experimental_clearQueryHandlers(): void {
    QueryHandler.clearQueryHandlers();
  }
}
