/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {ChildProcess} from 'child_process';

import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {
  Browser,
  BrowserEvent,
  type BrowserCloseCallback,
  type BrowserContextOptions,
  type DebugInfo,
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
import type {Browser as BrowserCore} from './core/Browser.js';
import {Session} from './core/Session.js';
import type {UserContext} from './core/UserContext.js';
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
    const session = await Session.from(opts.connection, {
      alwaysMatch: {
        acceptInsecureCerts: opts.ignoreHTTPSErrors,
        webSocketUrl: true,
      },
    });

    await session.subscribe(
      session.capabilities.browserName.toLocaleLowerCase().includes('firefox')
        ? BidiBrowser.subscribeModules
        : [...BidiBrowser.subscribeModules, ...BidiBrowser.subscribeCdpEvents]
    );

    const browser = new BidiBrowser(session.browser, opts);
    browser.#initialize();
    await browser.#getTree();
    return browser;
  }

  #process?: ChildProcess;
  #closeCallback?: BrowserCloseCallback;
  #browserCore: BrowserCore;
  #defaultViewport: Viewport | null;
  #targets = new Map<string, BidiTarget>();
  #browserContexts = new WeakMap<UserContext, BidiBrowserContext>();
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

  private constructor(browserCore: BrowserCore, opts: BidiBrowserOptions) {
    super();
    this.#process = opts.process;
    this.#closeCallback = opts.closeCallback;
    this.#browserCore = browserCore;
    this.#defaultViewport = opts.defaultViewport;
    this.#browserTarget = new BiDiBrowserTarget(this);
    for (const context of this.#browserCore.userContexts) {
      this.#createBrowserContext(context);
    }
  }

  #initialize() {
    this.#browserCore.once('disconnected', () => {
      this.emit(BrowserEvent.Disconnected, undefined);
    });
    this.#process?.once('close', () => {
      this.#browserCore.dispose('Browser process exited.', true);
      this.connection.dispose();
    });

    for (const [eventName, handler] of this.#connectionEventHandlers) {
      this.connection.on(eventName, handler);
    }
  }

  get #browserName() {
    return this.#browserCore.session.capabilities.browserName;
  }
  get #browserVersion() {
    return this.#browserCore.session.capabilities.browserVersion;
  }

  override userAgent(): never {
    throw new UnsupportedOperation();
  }

  #createBrowserContext(userContext: UserContext) {
    const browserContext = new BidiBrowserContext(this, userContext, {
      defaultViewport: this.#defaultViewport,
    });
    this.#browserContexts.set(userContext, browserContext);
    return browserContext;
  }

  #onContextDomLoaded(event: Bidi.BrowsingContext.Info) {
    const target = this.#targets.get(event.context);
    if (target) {
      this.emit(BrowserEvent.TargetChanged, target);
      target.browserContext().emit(BrowserContextEvent.TargetChanged, target);
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
      this.connection,
      event,
      this.#browserName
    );
    this.connection.registerBrowsingContexts(context);
    const browserContext =
      event.userContext === 'default'
        ? this.defaultBrowserContext()
        : this.browserContexts().find(browserContext => {
            return browserContext.id === event.userContext;
          });
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
      const topLevel = this.connection.getTopLevelContext(context.parent);
      topLevel.emit(BrowsingContextEvent.Created, context);
    }
  }

  async #getTree(): Promise<void> {
    const {result} = await this.connection.send('browsingContext.getTree', {});
    for (const context of result.contexts) {
      this.#onContextCreated(context);
    }
  }

  async #onContextDestroyed(
    event: Bidi.BrowsingContext.ContextDestroyed['params']
  ) {
    const context = this.connection.getBrowsingContext(event.context);
    const topLevelContext = this.connection.getTopLevelContext(event.context);
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
    // SAFETY: We only have one implementation.
    return this.#browserCore.session.connection as BidiConnection;
  }

  override wsEndpoint(): string {
    return this.connection.url;
  }

  override async close(): Promise<void> {
    for (const [eventName, handler] of this.#connectionEventHandlers) {
      this.connection.off(eventName, handler);
    }
    if (this.connection.closed) {
      return;
    }

    try {
      await this.#browserCore.close();
      await this.#closeCallback?.call(null);
    } catch (error) {
      // Fail silently.
      debugError(error);
    } finally {
      this.connection.dispose();
    }
  }

  override get connected(): boolean {
    return !this.#browserCore.disposed;
  }

  override process(): ChildProcess | null {
    return this.#process ?? null;
  }

  override async createIncognitoBrowserContext(
    _options?: BrowserContextOptions
  ): Promise<BidiBrowserContext> {
    const userContext = await this.#browserCore.createUserContext();
    return this.#createBrowserContext(userContext);
  }

  override async version(): Promise<string> {
    return `${this.#browserName}/${this.#browserVersion}`;
  }

  override browserContexts(): BidiBrowserContext[] {
    return [...this.#browserCore.userContexts].map(context => {
      return this.#browserContexts.get(context)!;
    });
  }

  override defaultBrowserContext(): BidiBrowserContext {
    return this.#browserContexts.get(this.#browserCore.defaultUserContext)!;
  }

  override newPage(): Promise<Page> {
    return this.defaultBrowserContext().newPage();
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
      await this.#browserCore.session.end();
    } catch (error) {
      // Fail silently.
      debugError(error);
    } finally {
      this.connection.dispose();
    }
  }

  override get debugInfo(): DebugInfo {
    return {
      pendingProtocolErrors: this.connection.getPendingProtocolErrors(),
    };
  }
}
