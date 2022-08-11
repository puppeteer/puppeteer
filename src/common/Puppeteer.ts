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
import {Browser} from './Browser.js';
import {BrowserConnectOptions, _connectToBrowser} from './BrowserConnector.js';
import {ConnectionTransport} from './ConnectionTransport.js';
import {devices} from './DeviceDescriptors.js';
import {errors} from './Errors.js';
import {networkConditions} from './NetworkConditions.js';
import {
  clearCustomQueryHandlers,
  CustomQueryHandler,
  customQueryHandlerNames,
  registerCustomQueryHandler,
  unregisterCustomQueryHandler,
} from './QueryHandler.js';

/**
 * Settings that are common to the Puppeteer class, regardless of environment.
 *
 * @internal
 */
export interface CommonPuppeteerSettings {
  isPuppeteerCore: boolean;
}
/**
 * @public
 */
export interface ConnectOptions extends BrowserConnectOptions {
  browserWSEndpoint?: string;
  browserURL?: string;
  transport?: ConnectionTransport;
}

/**
 * The main Puppeteer class.
 *
 * IMPORTANT: if you are using Puppeteer in a Node environment, you will get an
 * instance of {@link PuppeteerNode} when you import or require `puppeteer`.
 * That class extends `Puppeteer`, so has all the methods documented below as
 * well as all that are defined on {@link PuppeteerNode}.
 * @public
 */
export class Puppeteer {
  protected _isPuppeteerCore: boolean;
  protected _changedProduct = false;

  /**
   * @internal
   */
  constructor(settings: CommonPuppeteerSettings) {
    this._isPuppeteerCore = settings.isPuppeteerCore;

    this.connect = this.connect.bind(this);
  }

  /**
   * This method attaches Puppeteer to an existing browser instance.
   *
   * @remarks
   *
   * @param options - Set of configurable options to set on the browser.
   * @returns Promise which resolves to browser instance.
   */
  connect(options: ConnectOptions): Promise<Browser> {
    return _connectToBrowser(options);
  }

  /**
   * @deprecated Import directly puppeteer.
   * @example
   *
   * ```ts
   * import {devices} from 'puppeteer';
   * ```
   */
  get devices(): typeof devices {
    return devices;
  }

  /**
   * @deprecated Import directly puppeteer.
   * @example
   *
   * ```ts
   * import {errors} from 'puppeteer';
   * ```
   */
  get errors(): typeof errors {
    return errors;
  }

  /**
   * @deprecated Import directly puppeteer.
   * @example
   *
   * ```ts
   * import {networkConditions} from 'puppeteer';
   * ```
   */
  get networkConditions(): typeof networkConditions {
    return networkConditions;
  }

  /**
   * @deprecated Import directly puppeteer.
   * @example
   *
   * ```ts
   * import {registerCustomQueryHandler} from 'puppeteer';
   * ```
   */
  registerCustomQueryHandler(
    name: string,
    queryHandler: CustomQueryHandler
  ): void {
    return registerCustomQueryHandler(name, queryHandler);
  }

  /**
   * @deprecated Import directly puppeteer.
   * @example
   *
   * ```ts
   * import {unregisterCustomQueryHandler} from 'puppeteer';
   * ```
   */
  unregisterCustomQueryHandler(name: string): void {
    return unregisterCustomQueryHandler(name);
  }

  /**
   * @deprecated Import directly puppeteer.
   * @example
   *
   * ```ts
   * import {customQueryHandlerNames} from 'puppeteer';
   * ```
   */
  customQueryHandlerNames(): string[] {
    return customQueryHandlerNames();
  }

  /**
   * @deprecated Import directly puppeteer.
   * @example
   *
   * ```ts
   * import {clearCustomQueryHandlers} from 'puppeteer';
   * ```
   */
  clearCustomQueryHandlers(): void {
    return clearCustomQueryHandlers();
  }
}
