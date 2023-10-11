/**
 * Copyright 2022 Google Inc. All rights reserved.
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

import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import type {WaitForTargetOptions} from '../api/Browser.js';
import {BrowserContext} from '../api/BrowserContext.js';
import type {Page} from '../api/Page.js';
import type {Target} from '../api/Target.js';
import type {Viewport} from '../common/Viewport.js';

import type {BidiBrowser} from './Browser.js';
import type {BidiConnection} from './Connection.js';
import type {BidiPage} from './Page.js';

/**
 * @internal
 */
export interface BidiBrowserContextOptions {
  defaultViewport: Viewport | null;
  isDefault: boolean;
}

/**
 * @internal
 */
export class BidiBrowserContext extends BrowserContext {
  #browser: BidiBrowser;
  #connection: BidiConnection;
  #defaultViewport: Viewport | null;
  #isDefault = false;

  constructor(browser: BidiBrowser, options: BidiBrowserContextOptions) {
    super();
    this.#browser = browser;
    this.#connection = this.#browser.connection;
    this.#defaultViewport = options.defaultViewport;
    this.#isDefault = options.isDefault;
  }

  override targets(): Target[] {
    return this.#browser.targets().filter(target => {
      return target.browserContext() === this;
    });
  }

  override waitForTarget(
    predicate: (x: Target) => boolean | Promise<boolean>,
    options: WaitForTargetOptions = {}
  ): Promise<Target> {
    return this.#browser.waitForTarget(target => {
      return target.browserContext() === this && predicate(target);
    }, options);
  }

  get connection(): BidiConnection {
    return this.#connection;
  }

  override async newPage(): Promise<Page> {
    const {result} = await this.#connection.send('browsingContext.create', {
      type: Bidi.BrowsingContext.CreateType.Tab,
    });
    const target = this.#browser._getTargetById(result.context);

    // TODO: once BiDi has some concept matching BrowserContext, the newly
    // created contexts should get automatically assigned to the right
    // BrowserContext. For now, we assume that only explicitly created pages go
    // to the current BrowserContext. Otherwise, the contexts get assigned to
    // the default BrowserContext by the Browser.
    target._setBrowserContext(this);

    const page = await target.page();
    if (!page) {
      throw new Error('Page is not found');
    }
    if (this.#defaultViewport) {
      try {
        await page.setViewport(this.#defaultViewport);
      } catch {
        // No support for setViewport in Firefox.
      }
    }

    return page;
  }

  override async close(): Promise<void> {
    if (this.#isDefault) {
      throw new Error('Default context cannot be closed!');
    }

    await this.#browser._closeContext(this);
  }

  override browser(): BidiBrowser {
    return this.#browser;
  }

  override async pages(): Promise<BidiPage[]> {
    const results = await Promise.all(
      [...this.targets()].map(t => {
        return t.page();
      })
    );
    return results.filter((p): p is BidiPage => {
      return p !== null;
    });
  }

  override isIncognito(): boolean {
    return !this.#isDefault;
  }
}
