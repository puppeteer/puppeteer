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

import type {ChildProcess} from 'child_process';

import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {
  Browser,
  BrowserEvent,
  type BrowserCloseCallback,
  type BrowserContextOptions,
} from '../api/Browser.js';
import {BrowserContextEvent} from '../api/BrowserContext.js';
import type {Page} from '../api/Page.js';
import type {Target} from '../api/Target.js';
import {UnsupportedOperation} from '../common/Errors.js';
import type {Handler} from '../common/EventEmitter.js';
import {debugError} from '../common/util.js';
import type {Viewport} from '../common/Viewport.js';

import {BidiBrowserContext} from './BrowserContext.js';
import {BrowsingContext, BrowsingContextEvent} from './BrowsingContext.js';
import type {BidiConnection} from './Connection.js';
import {
  BiDiBrowserTarget,
  BiDiBrowsingContextTarget,
  BiDiPageTarget,
  type BidiTarget,
} from './Target.js';

/**
 * @internal
 */
export interface BidiBrowserOptions {
  process?: ChildProcess;
  closeCallback?: BrowserCloseCallback;
  connection: BidiConnection;
  defaultViewport: Viewport | null;
  ignoreHTTPSErrors?: boolean;
}

/**
 * @internal
 */
export class BidiBrowser extends Browser {
  readonly protocol = 'webDriverBiDi';

  // TODO: Update generator to include fully module
  static readonly subscribeModules: string[] = [
    'browsingContext',
    'network',
    'log',
    'script',
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
    'cdp.Page.screencastFrame',
  ];

  static async create(opts: BidiBrowserOptions): Promise<BidiBrowser> {
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
        ? BidiBrowser.subscribeModules
        : [...BidiBrowser.subscribeModules, ...BidiBrowser.subscribeCdpEvents],
    });

    const browser = new BidiBrowser({
      ...opts,
      browserName,
      browserVersion,
    });

    await browser.#getTree();

    return browser;
  }

  #browserName = '';
  #browserVersion = '';
  #process?: ChildProcess;
  #closeCallback?: BrowserCloseCallback;
  #connection: BidiConnection;
  #defaultViewport: Viewport | null;
  #defaultContext: BidiBrowserContext;
  #targets = new Map<string, BidiTarget>();
  #contexts: BidiBrowserContext[] = [];
  #browserTarget: BiDiBrowserTarget;

  #connectionEventHandlers = new Map<
    Bidi.BrowsingContextEvent['method'],
    Handler<any>
  >([
    ['browsingContext.contextCreated', this.#onContextCreated.bind(this)],
    ['browsingContext.contextDestroyed', this.#onContextDestroyed.bind(this)],
    ['browsingContext.domContentLoaded', this.#onContextDomLoaded.bind(this)],
    ['browsingContext.fragmentNavigated', this.#onContextNavigation.bind(this)],
    ['browsingContext.navigationStarted', this.#onContextNavigation.bind(this)],
  ]);

  constructor(
    opts: BidiBrowserOptions & {
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
      this.emit(BrowserEvent.Disconnected, undefined);
    });
    this.#defaultContext = new BidiBrowserContext(this, {
      defaultViewport: this.#defaultViewport,
      isDefault: true,
    });
    this.#browserTarget = new BiDiBrowserTarget(this.#defaultContext);
    this.#contexts.push(this.#defaultContext);

    for (const [eventName, handler] of this.#connectionEventHandlers) {
      this.#connection.on(eventName, handler);
    }
  }

  override userAgent(): never {
    throw new UnsupportedOperation();
  }

  #onContextDomLoaded(event: Bidi.BrowsingContext.Info) {
    const target = this.#targets.get(event.context);
    if (target) {
      this.emit(BrowserEvent.TargetChanged, target);
    }
  }

  #onContextNavigation(event: Bidi.BrowsingContext.NavigationInfo) {
    const target = this.#targets.get(event.context);
    if (target) {
      this.emit(BrowserEvent.TargetChanged, target);
      target.browserContext().emit(BrowserContextEvent.TargetChanged, target);
    }
  }

  #onContextCreated(event: Bidi.BrowsingContext.ContextCreated['params']) {
    const context = new BrowsingContext(
      this.#connection,
      event,
      this.#browserName
    );
    this.#connection.registerBrowsingContexts(context);
    // TODO: once more browsing context types are supported, this should be
    // updated to support those. Currently, all top-level contexts are treated
    // as pages.
    const browserContext = this.browserContexts().at(-1);
    if (!browserContext) {
      throw new Error('Missing browser contexts');
    }
    const target = !context.parent
      ? new BiDiPageTarget(browserContext, context)
      : new BiDiBrowsingContextTarget(browserContext, context);
    this.#targets.set(event.context, target);

    this.emit(BrowserEvent.TargetCreated, target);
    target.browserContext().emit(BrowserContextEvent.TargetCreated, target);

    if (context.parent) {
      const topLevel = this.#connection.getTopLevelContext(context.parent);
      topLevel.emit(BrowsingContextEvent.Created, context);
    }
  }

  async #getTree(): Promise<void> {
    const {result} = await this.#connection.send('browsingContext.getTree', {});
    for (const context of result.contexts) {
      this.#onContextCreated(context);
    }
  }

  async #onContextDestroyed(
    event: Bidi.BrowsingContext.ContextDestroyed['params']
  ) {
    const context = this.#connection.getBrowsingContext(event.context);
    const topLevelContext = this.#connection.getTopLevelContext(event.context);
    topLevelContext.emit(BrowsingContextEvent.Destroyed, context);
    const target = this.#targets.get(event.context);
    const page = await target?.page();
    await page?.close().catch(debugError);
    this.#targets.delete(event.context);
    if (target) {
      this.emit(BrowserEvent.TargetDestroyed, target);
      target.browserContext().emit(BrowserContextEvent.TargetDestroyed, target);
    }
  }

  get connection(): BidiConnection {
    return this.#connection;
  }

  override wsEndpoint(): string {
    return this.#connection.url;
  }

  override async close(): Promise<void> {
    for (const [eventName, handler] of this.#connectionEventHandlers) {
      this.#connection.off(eventName, handler);
    }
    if (this.#connection.closed) {
      return;
    }

    // `browser.close` can close connection before the response is received.
    await this.#connection.send('browser.close', {}).catch(debugError);
    await this.#closeCallback?.call(null);
    this.#connection.dispose();
  }

  override get connected(): boolean {
    return !this.#connection.closed;
  }

  override process(): ChildProcess | null {
    return this.#process ?? null;
  }

  override async createIncognitoBrowserContext(
    _options?: BrowserContextOptions
  ): Promise<BidiBrowserContext> {
    // TODO: implement incognito context https://github.com/w3c/webdriver-bidi/issues/289.
    const context = new BidiBrowserContext(this, {
      defaultViewport: this.#defaultViewport,
      isDefault: false,
    });
    this.#contexts.push(context);
    return context;
  }

  override async version(): Promise<string> {
    return `${this.#browserName}/${this.#browserVersion}`;
  }

  override browserContexts(): BidiBrowserContext[] {
    // TODO: implement incognito context https://github.com/w3c/webdriver-bidi/issues/289.
    return this.#contexts;
  }

  async _closeContext(browserContext: BidiBrowserContext): Promise<void> {
    this.#contexts = this.#contexts.filter(c => {
      return c !== browserContext;
    });
    for (const target of browserContext.targets()) {
      const page = await target?.page();
      await page?.close().catch(error => {
        debugError(error);
      });
    }
  }

  override defaultBrowserContext(): BidiBrowserContext {
    return this.#defaultContext;
  }

  override newPage(): Promise<Page> {
    return this.#defaultContext.newPage();
  }

  override targets(): Target[] {
    return [this.#browserTarget, ...Array.from(this.#targets.values())];
  }

  _getTargetById(id: string): BidiTarget {
    const target = this.#targets.get(id);
    if (!target) {
      throw new Error('Target not found');
    }
    return target;
  }

  override target(): Target {
    return this.#browserTarget;
  }

  override async disconnect(): Promise<void> {
    try {
      // Fail silently if the session cannot be ended.
      await this.#connection.send('session.end', {});
    } catch (e) {
      debugError(e);
    }
    this.#connection.dispose();
  }
}
