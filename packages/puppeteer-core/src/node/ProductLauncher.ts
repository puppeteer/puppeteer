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
import {existsSync} from 'fs';
import os, {tmpdir} from 'os';
import {join} from 'path';
import {Browser} from '../api/Browser.js';
import {Product} from '../common/Product.js';
import {BrowserFetcher} from './BrowserFetcher.js';
import {
  BrowserLaunchArgumentOptions,
  ChromeReleaseChannel,
  PuppeteerNodeLaunchOptions,
} from './LaunchOptions.js';
import {PuppeteerNode} from './PuppeteerNode.js';

/**
 * Describes a launcher - a class that is able to create and launch a browser instance.
 *
 * @public
 */
export class ProductLauncher {
  #product: Product;

  /**
   * @internal
   */
  puppeteer: PuppeteerNode;

  /**
   * @internal
   */
  constructor(puppeteer: PuppeteerNode, product: Product) {
    this.puppeteer = puppeteer;
    this.#product = product;
  }

  get product(): Product {
    return this.#product;
  }

  launch(object: PuppeteerNodeLaunchOptions): Promise<Browser>;
  launch(): Promise<Browser> {
    throw new Error('Not implemented');
  }

  executablePath(channel?: ChromeReleaseChannel): string;
  executablePath(): string {
    throw new Error('Not implemented');
  }

  defaultArgs(object: BrowserLaunchArgumentOptions): string[];
  defaultArgs(): string[] {
    throw new Error('Not implemented');
  }

  /**
   * @internal
   */
  protected getProfilePath(): string {
    return join(
      this.puppeteer.configuration.temporaryDirectory ?? tmpdir(),
      `puppeteer_dev_${this.product}_profile-`
    );
  }

  /**
   * @internal
   */
  protected resolveExecutablePath(): string {
    const executablePath = this.puppeteer.configuration.executablePath;
    if (executablePath) {
      if (!existsSync(executablePath)) {
        throw new Error(
          `Tried to find the browser at the configured path (${executablePath}), but no executable was found.`
        );
      }
      return executablePath;
    }

    const ubuntuChromiumPath = '/usr/bin/chromium-browser';
    if (
      this.product === 'chrome' &&
      os.platform() !== 'darwin' &&
      os.arch() === 'arm64' &&
      existsSync(ubuntuChromiumPath)
    ) {
      return ubuntuChromiumPath;
    }

    const browserFetcher = new BrowserFetcher({
      product: this.product,
      path: this.puppeteer.defaultDownloadPath!,
    });

    const revisionInfo = browserFetcher.revisionInfo(
      this.puppeteer.browserRevision
    );
    if (!revisionInfo.local) {
      if (this.puppeteer.configuration.browserRevision) {
        throw new Error(
          `Tried to find the browser at the configured path (${revisionInfo.executablePath}) for revision ${this.puppeteer.browserRevision}, but no executable was found.`
        );
      }
      switch (this.product) {
        case 'chrome':
          throw new Error(
            `Could not find Chromium (rev. ${this.puppeteer.browserRevision}). This can occur if either\n` +
              ' 1. you did not perform an installation before running the script (e.g. `npm install`) or\n' +
              ` 2. your cache path is incorrectly configured (which is: ${this.puppeteer.configuration.cacheDirectory}).\n` +
              'For (2), check out our guide on configuring puppeteer at https://pptr.dev/guides/configuration.'
          );
        case 'firefox':
          throw new Error(
            `Could not find Firefox (rev. ${this.puppeteer.browserRevision}). This can occur if either\n` +
              ' 1. you did not perform an installation for Firefox before running the script (e.g. `PUPPETEER_PRODUCT=firefox npm install`) or\n' +
              ` 2. your cache path is incorrectly configured (which is: ${this.puppeteer.configuration.cacheDirectory}).\n` +
              'For (2), check out our guide on configuring puppeteer at https://pptr.dev/guides/configuration.'
          );
      }
    }
    return revisionInfo.executablePath;
  }
}
