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
import Launcher, { LaunchOptions, ChromeArgOptions, BrowserOptions, ProductLauncher } from './Launcher';
import BrowserFetcher, { BrowserFetcherOptions } from './BrowserFetcher';
import * as Errors from './Errors';
import DeviceDescriptors from './DeviceDescriptors';
import { ConnectionTransport } from './types';
import { Browser } from './api';

export default class {
  _productName?: string
  _lazyLauncher?: ProductLauncher
  constructor(private _projectRoot: string, private _preferredRevision: string, private _isPuppeteerCore: boolean) {
  }

  launch(options?: LaunchOptions & ChromeArgOptions & BrowserOptions & {product?: string, extraPrefsFirefox?: object}): Promise<Browser> {
    if (!this._productName && options)
      this._productName = options.product;
    return this._launcher.launch(options);
  }

  connect(options: (BrowserOptions & {browserWSEndpoint?: string, browserURL?: string, transport?: ConnectionTransport})): Promise<Browser> {
    return this._launcher.connect(options);
  }

  executablePath(): string {
    return this._launcher.executablePath();
  }

  get _launcher(): ProductLauncher {
    if (!this._lazyLauncher)
      this._lazyLauncher = Launcher(this._projectRoot, this._preferredRevision, this._isPuppeteerCore, this._productName);
    return this._lazyLauncher;

  }

  get product(): string {
    return this._launcher.product;
  }

  get devices(): object {
    return DeviceDescriptors;
  }

  get errors() {
    return Errors;
  }

  defaultArgs(options?: ChromeArgOptions): string[] {
    return this._launcher.defaultArgs(options);
  }

  createBrowserFetcher(options?: BrowserFetcherOptions): BrowserFetcher {
    return new BrowserFetcher(this._projectRoot, options);
  }
};

