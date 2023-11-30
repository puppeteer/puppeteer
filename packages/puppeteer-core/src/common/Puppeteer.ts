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

import type {Browser} from '../api/Browser.js';

import {_connectToBrowser} from './BrowserConnector.js';
import type {ConnectOptions} from './ConnectOptions.js';
import {
  type CustomQueryHandler,
  customQueryHandlers,
} from './CustomQueryHandler.js';

/**
 * Settings that are common to the Puppeteer class, regardless of environment.
 *
 * @internal
 */
export interface CommonPuppeteerSettings {
  isPuppeteerCore: boolean;
}

/**
 * The main Puppeteer class.
 *
 * IMPORTANT: if you are using Puppeteer in a Node environment, you will get an
 * instance of {@link PuppeteerNode} when you import or require `puppeteer`.
 * That class extends `Puppeteer`, so has all the methods documented below as
 * well as all that are defined on {@link PuppeteerNode}.
 *
 * @public
 */
export class Puppeteer {
  /**
   * Operations for {@link CustomQueryHandler | custom query handlers}. See
   * {@link CustomQueryHandlerRegistry}.
   *
   * @internal
   */
  static customQueryHandlers = customQueryHandlers;

  /**
   * Registers a {@link CustomQueryHandler | custom query handler}.
   *
   * @remarks
   * After registration, the handler can be used everywhere where a selector is
   * expected by prepending the selection string with `<name>/`. The name is only
   * allowed to consist of lower- and upper case latin letters.
   *
   * @example
   *
   * ```
   * puppeteer.registerCustomQueryHandler('text', { … });
   * const aHandle = await page.$('text/…');
   * ```
   *
   * @param name - The name that the custom query handler will be registered
   * under.
   * @param queryHandler - The {@link CustomQueryHandler | custom query handler}
   * to register.
   *
   * @public
   */
  static registerCustomQueryHandler(
    name: string,
    queryHandler: CustomQueryHandler
  ): void {
    return this.customQueryHandlers.register(name, queryHandler);
  }

  /**
   * Unregisters a custom query handler for a given name.
   */
  static unregisterCustomQueryHandler(name: string): void {
    return this.customQueryHandlers.unregister(name);
  }

  /**
   * Gets the names of all custom query handlers.
   */
  static customQueryHandlerNames(): string[] {
    return this.customQueryHandlers.names();
  }

  /**
   * Unregisters all custom query handlers.
   */
  static clearCustomQueryHandlers(): void {
    return this.customQueryHandlers.clear();
  }

  /**
   * @internal
   */
  _isPuppeteerCore: boolean;
  /**
   * @internal
   */
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
}
