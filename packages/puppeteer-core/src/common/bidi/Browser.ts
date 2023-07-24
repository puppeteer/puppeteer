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

import {ChildProcess} from 'child_process';

import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {
  Browser as BrowserBase,
  BrowserCloseCallback,
  BrowserContextOptions,
  BrowserEmittedEvents,
} from '../../api/Browser.js';
import {BrowserContext as BrowserContextBase} from '../../api/BrowserContext.js';
import {Page} from '../../api/Page.js';
import {Target} from '../../api/Target.js';
import {Deferred} from '../../util/Deferred.js';
import {Viewport} from '../PuppeteerViewport.js';

import {BrowserContext} from './BrowserContext.js';
import {BrowsingContext} from './BrowsingContext.js';
import {Connection} from './Connection.js';
import {BiDiPageTarget, BiDiTarget} from './Target.js';
import {debugError} from './utils.js';

/**
 * @internal
 */
export class Browser extends BrowserBase {
  static readonly subscribeModules: Bidi.Session.SubscriptionRequestEvent[] = [
    'browsingContext',
    'network',
    'log',
  ];
  static readonly subscribeCdpEvents: Bidi.Cdp.EventNames[] = [
    // Coverage
    'cdp.Debugger.scriptParsed',
    'cdp.CSS.styleSheetAdded',
    'cdp.Runtime.executionContextsCleared',
    // Tracing
    'cdp.Tracing.tracingComplete',
    // TODO: subscribe to all CDP events in the future.
    'cdp.Network.requestWillBeSent',
    'cdp.Debugger.scriptParsed',
  ];

  static async create(opts: Options): Promise<Browser> {
    let browserName = '';
    let browserVersion = '';

    // TODO: await until the connection is established.
    try {
      const {result} = await opts.connection.send('session.new', {
        capabilities: {
          alwaysMatch: {
            acceptInsecureCerts: opts.ignoreHTTPSErrors,
          },
        },
      });
      browserName = result.capabilities.browserName ?? '';
      browserVersion = result.capabilities.browserVersion ?? '';
    } catch (err) {
      // Chrome does not support session.new.
      debugError(err);
    }

    await opts.connection.send('session.subscribe', {
      events: browserName.toLocaleLowerCase().includes('firefox')
        ? Browser.subscribeModules
        : [...Browser.subscribeModules, ...Browser.subscribeCdpEvents],
    });

    const browser = new Browser({
      ...opts,
      browserName,
      browserVersion,
    });

    await browser._init.valueOrThrow();

    return browser;
  }

  #browserName = '';
  #browserVersion = '';
  #process?: ChildProcess;
  #closeCallback?: BrowserCloseCallback;
  #connection: Connection;
  #defaultViewport: Viewport | null;
  #defaultContext: BrowserContext;
  #targets = new Map<string, BiDiTarget>();

  protected _init = Deferred.create<void>();

  constructor(
    opts: Options & {
      browserName: string;
      browserVersion: string;
    }
  ) {
    super();
    this.#process = opts.process;
    this.#closeCallback = opts.closeCallback;
    this.#connection = opts.connection;
    this.#defaultViewport = opts.defaultViewport;
    this.#browserName = opts.browserName;
    this.#browserVersion = opts.browserVersion;

    this.#process?.once('close', () => {
      this.#connection.dispose();
      this.emit(BrowserEmittedEvents.Disconnected);
    });
    this.#defaultContext = new BrowserContext(this, {
      defaultViewport: this.#defaultViewport,
      isDefault: true,
    });
    this.#connection.on(
      'browsingContext.contextCreated',
      this.#onContextCreated
    );
    this.#connection.on(
      'browsingContext.contextDestroyed',
      this.#onContextDestroyed
    );
    this.#getTree().catch(debugError);
  }

  #onContextCreated = (
    event: Bidi.BrowsingContext.ContextCreatedEvent['params']
  ) => {
    const context = new BrowsingContext(this.#connection, event);
    this.#connection.registerBrowsingContexts(context);
    const target = !context.parent
      ? new BiDiPageTarget(this.defaultBrowserContext(), context)
      : new BiDiTarget(this.defaultBrowserContext(), context);
    this.#targets.set(event.context, target);

    if (context.parent) {
      const topLevel = this.#connection.getTopLevelContext(context.parent);
      topLevel.emit('childContextAttached', context);
    }
  };

  async #getTree(): Promise<void> {
    const {result} = await this.#connection.send('browsingContext.getTree', {});
    for (const context of result.contexts) {
      this.#onContextCreated(context);
    }
    this._init.resolve();
  }

  #onContextDestroyed = async (
    event: Bidi.BrowsingContext.ContextDestroyedEvent['params']
  ) => {
    const target = this.#targets.get(event.context);
    const page = await target?.page();
    await page?.close().catch(debugError);
    this.#targets.delete(event.context);
  };

  get connection(): Connection {
    return this.#connection;
  }

  override wsEndpoint(): string {
    return this.#connection.url;
  }

  override async close(): Promise<void> {
    this.#connection.off(
      'browsingContext.contextDestroyed',
      this.#onContextDestroyed
    );
    this.#connection.off(
      'browsingContext.contextCreated',
      this.#onContextCreated
    );
    if (this.#connection.closed) {
      return;
    }
    // TODO: implement browser.close.
    // await this.#connection.send('browser.close', {});
    this.#connection.dispose();
    await this.#closeCallback?.call(null);
  }

  override isConnected(): boolean {
    return !this.#connection.closed;
  }

  override process(): ChildProcess | null {
    return this.#process ?? null;
  }

  override async createIncognitoBrowserContext(
    _options?: BrowserContextOptions
  ): Promise<BrowserContextBase> {
    // TODO: implement incognito context https://github.com/w3c/webdriver-bidi/issues/289.
    return new BrowserContext(this, {
      defaultViewport: this.#defaultViewport,
      isDefault: false,
    });
  }

  override async version(): Promise<string> {
    return `${this.#browserName}/${this.#browserVersion}`;
  }

  /**
   * Returns an array of all open browser contexts. In a newly created browser, this will
   * return a single instance of {@link BrowserContext}.
   */
  override browserContexts(): BrowserContext[] {
    // TODO: implement incognito context https://github.com/w3c/webdriver-bidi/issues/289.
    return [this.#defaultContext];
  }

  /**
   * Returns the default browser context. The default browser context cannot be closed.
   */
  override defaultBrowserContext(): BrowserContext {
    return this.#defaultContext;
  }

  override newPage(): Promise<Page> {
    return this.#defaultContext.newPage();
  }

  override targets(): Target[] {
    return Array.from(this.#targets.values());
  }

  _getTargetById(id: string): BiDiTarget {
    const target = this.#targets.get(id);
    if (!target) {
      throw new Error('Target not found');
    }
    return target;
  }
}

interface Options {
  process?: ChildProcess;
  closeCallback?: BrowserCloseCallback;
  connection: Connection;
  defaultViewport: Viewport | null;
  ignoreHTTPSErrors?: boolean;
}
