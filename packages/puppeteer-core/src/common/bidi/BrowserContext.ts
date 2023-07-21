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

import {BrowserContext as BrowserContextBase} from '../../api/BrowserContext.js';
import {Page as PageBase} from '../../api/Page.js';
import {Target} from '../../api/Target.js';
import {Deferred} from '../../util/Deferred.js';
import {Viewport} from '../PuppeteerViewport.js';

import {Browser} from './Browser.js';
import {Connection} from './Connection.js';
import {Page} from './Page.js';
import {BiDiTarget} from './Target.js';
import {debugError} from './utils.js';

interface BrowserContextOptions {
  defaultViewport: Viewport | null;
  isDefault: boolean;
}

/**
 * @internal
 */
export class BrowserContext extends BrowserContextBase {
  #browser: Browser;
  #connection: Connection;
  #defaultViewport: Viewport | null;
  #targets = new Map<string, BiDiTarget>();
  #onContextDestroyedBind = this.#onContextDestroyed.bind(this);
  #init = Deferred.create<void>();
  #isDefault = false;

  constructor(browser: Browser, options: BrowserContextOptions) {
    super();
    this.#browser = browser;
    this.#connection = this.#browser.connection;
    this.#defaultViewport = options.defaultViewport;
    this.#connection.on(
      'browsingContext.contextDestroyed',
      this.#onContextDestroyedBind
    );
    this.#isDefault = options.isDefault;
    this.#getTree().catch(debugError);
  }

  override targets(): Target[] {
    return this.#browser.targets().filter(target => {
      return target.browserContext() === this;
    });
  }

  override waitForTarget(
    predicate: (x: Target) => boolean | Promise<boolean>,
    options: {timeout?: number} = {}
  ): Promise<Target> {
    return this.#browser.waitForTarget(target => {
      return target.browserContext() === this && predicate(target);
    }, options);
  }

  get connection(): Connection {
    return this.#connection;
  }

  async #getTree(): Promise<void> {
    if (!this.#isDefault) {
      this.#init.resolve();
      return;
    }
    try {
      const {result} = await this.#connection.send(
        'browsingContext.getTree',
        {}
      );
      for (const context of result.contexts) {
        const page = new Page(this, context);
        const target = new BiDiTarget(page.mainFrame().context(), page);
        this.#targets.set(context.context, target);
      }
      this.#init.resolve();
    } catch (err) {
      this.#init.reject(err as Error);
    }
  }

  async #onContextDestroyed(
    event: Bidi.BrowsingContext.ContextDestroyedEvent['params']
  ) {
    const target = this.#targets.get(event.context);
    const page = await target?.page();
    await page?.close().catch(error => {
      debugError(error);
    });
    this.#targets.delete(event.context);
  }

  override async newPage(): Promise<PageBase> {
    await this.#init.valueOrThrow();

    const {result} = await this.#connection.send('browsingContext.create', {
      type: 'tab',
    });
    const page = new Page(this, {
      context: result.context,
      children: [],
    });
    const target = new BiDiTarget(page.mainFrame().context(), page);
    if (this.#defaultViewport) {
      try {
        await page.setViewport(this.#defaultViewport);
      } catch {
        // No support for setViewport in Firefox.
      }
    }

    this.#targets.set(result.context, target);

    return page;
  }

  override async close(): Promise<void> {
    await this.#init.valueOrThrow();

    if (this.#isDefault) {
      throw new Error('Default context cannot be closed!');
    }

    for (const target of this.#targets.values()) {
      const page = await target?.page();
      await page?.close().catch(error => {
        debugError(error);
      });
    }
    this.#targets.clear();
  }

  override browser(): Browser {
    return this.#browser;
  }

  override async pages(): Promise<PageBase[]> {
    await this.#init.valueOrThrow();
    const results = await Promise.all(
      [...this.#targets.values()].map(t => {
        return t.page();
      })
    );
    return results.filter((p): p is Page => {
      return p !== null;
    });
  }

  override isIncognito(): boolean {
    return false;
  }
}
