/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {ChildProcess} from 'child_process';

import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import type {BrowserEvents} from '../api/Browser.js';
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
import type {Connection as CdpConnection} from '../cdp/Connection.js';
import type {SupportedWebDriverCapabilities} from '../common/ConnectOptions.js';
import {EventEmitter} from '../common/EventEmitter.js';
import {debugError} from '../common/util.js';
import type {Viewport} from '../common/Viewport.js';
import {bubble} from '../util/decorators.js';

import {BidiBrowserContext} from './BrowserContext.js';
import type {BidiConnection} from './Connection.js';
import type {Browser as BrowserCore} from './core/Browser.js';
import {Session} from './core/Session.js';
import type {UserContext} from './core/UserContext.js';
import {BidiBrowserTarget} from './Target.js';

/**
 * @internal
 */
export interface BidiBrowserOptions {
  process?: ChildProcess;
  closeCallback?: BrowserCloseCallback;
  connection: BidiConnection;
  cdpConnection?: CdpConnection;
  defaultViewport: Viewport | null;
  acceptInsecureCerts?: boolean;
  capabilities?: SupportedWebDriverCapabilities;
}

/**
 * @internal
 */
export class BidiBrowser extends Browser {
  readonly protocol = 'webDriverBiDi';

  static readonly subscribeModules: [string, ...string[]] = [
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
      firstMatch: opts.capabilities?.firstMatch,
      alwaysMatch: {
        ...opts.capabilities?.alwaysMatch,
        // Capabilities that come from Puppeteer's API take precedence.
        acceptInsecureCerts: opts.acceptInsecureCerts,
        unhandledPromptBehavior: {
          default: Bidi.Session.UserPromptHandlerType.Ignore,
        },
        webSocketUrl: true,
        // Puppeteer with WebDriver BiDi does not support prerendering
        // yet because WebDriver BiDi behavior is not specified. See
        // https://github.com/w3c/webdriver-bidi/issues/321.
        'goog:prerenderingDisabled': true,
      },
    });

    await session.subscribe(
      session.capabilities.browserName.toLocaleLowerCase().includes('firefox')
        ? BidiBrowser.subscribeModules
        : [...BidiBrowser.subscribeModules, ...BidiBrowser.subscribeCdpEvents]
    );

    const browser = new BidiBrowser(session.browser, opts);
    browser.#initialize();
    return browser;
  }

  @bubble()
  accessor #trustedEmitter = new EventEmitter<BrowserEvents>();

  #process?: ChildProcess;
  #closeCallback?: BrowserCloseCallback;
  #browserCore: BrowserCore;
  #defaultViewport: Viewport | null;
  #browserContexts = new WeakMap<UserContext, BidiBrowserContext>();
  #target = new BidiBrowserTarget(this);
  #cdpConnection?: CdpConnection;

  private constructor(browserCore: BrowserCore, opts: BidiBrowserOptions) {
    super();
    this.#process = opts.process;
    this.#closeCallback = opts.closeCallback;
    this.#browserCore = browserCore;
    this.#defaultViewport = opts.defaultViewport;
    this.#cdpConnection = opts.cdpConnection;
  }

  #initialize() {
    // Initializing existing contexts.
    for (const userContext of this.#browserCore.userContexts) {
      this.#createBrowserContext(userContext);
    }

    this.#browserCore.once('disconnected', () => {
      this.#trustedEmitter.emit(BrowserEvent.Disconnected, undefined);
      this.#trustedEmitter.removeAllListeners();
    });
    this.#process?.once('close', () => {
      this.#browserCore.dispose('Browser process exited.', true);
      this.connection.dispose();
    });
  }

  get #browserName() {
    return this.#browserCore.session.capabilities.browserName;
  }
  get #browserVersion() {
    return this.#browserCore.session.capabilities.browserVersion;
  }

  get cdpSupported(): boolean {
    return this.#cdpConnection !== undefined;
  }

  get cdpConnection(): CdpConnection | undefined {
    return this.#cdpConnection;
  }

  override async userAgent(): Promise<string> {
    return this.#browserCore.session.capabilities.userAgent;
  }

  #createBrowserContext(userContext: UserContext) {
    const browserContext = BidiBrowserContext.from(this, userContext, {
      defaultViewport: this.#defaultViewport,
    });
    this.#browserContexts.set(userContext, browserContext);

    browserContext.trustedEmitter.on(
      BrowserContextEvent.TargetCreated,
      target => {
        this.#trustedEmitter.emit(BrowserEvent.TargetCreated, target);
      }
    );
    browserContext.trustedEmitter.on(
      BrowserContextEvent.TargetChanged,
      target => {
        this.#trustedEmitter.emit(BrowserEvent.TargetChanged, target);
      }
    );
    browserContext.trustedEmitter.on(
      BrowserContextEvent.TargetDestroyed,
      target => {
        this.#trustedEmitter.emit(BrowserEvent.TargetDestroyed, target);
      }
    );

    return browserContext;
  }

  get connection(): BidiConnection {
    // SAFETY: We only have one implementation.
    return this.#browserCore.session.connection as BidiConnection;
  }

  override wsEndpoint(): string {
    return this.connection.url;
  }

  override async close(): Promise<void> {
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
    return !this.#browserCore.disconnected;
  }

  override process(): ChildProcess | null {
    return this.#process ?? null;
  }

  override async createBrowserContext(
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
    return [
      this.#target,
      ...this.browserContexts().flatMap(context => {
        return context.targets();
      }),
    ];
  }

  override target(): BidiBrowserTarget {
    return this.#target;
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
