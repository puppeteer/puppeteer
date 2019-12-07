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
import { BrowserFetcher, BrowserFetcherOptions } from './BrowserFetcher';
import { LaunchOptions, ConnectOptions, ChromeArgOptions } from './types';
import { Browser } from './Browser';

export class Puppeteer {
  private _productName?: string
  private _lazyLauncher?: ProductLauncher

  constructor(private _projectRoot: string, private _preferredRevision: string, private _isPuppeteerCore: boolean) {
  }

  public launch(options?: LaunchOptions & {product?: string, extraPrefsFirefox?: object}): Promise<Browser> {
    if (!this._productName && options)
      this._productName = options.product;
    return this._launcher.launch(options);
  }

  public connect(options?: ConnectOptions): Promise<Browser> {
    return this._launcher.connect(options);
  }

  public executablePath(): string {
    return this._launcher.executablePath();
  }

  /* @internal */
  private get _launcher(): ProductLauncher {
    if (!this._lazyLauncher)
      this._lazyLauncher = Launcher(this._projectRoot, this._preferredRevision, this._isPuppeteerCore, this._productName);
    return this._lazyLauncher;

  }

  public get product(): string {
    return this._launcher.product;
  }

  public defaultArgs(options?: ChromeArgOptions): string[] {
    return this._launcher.defaultArgs(options);
  }

  public createBrowserFetcher(options?: BrowserFetcherOptions): BrowserFetcher {
    return new BrowserFetcher(this._projectRoot, options);
  }
};

