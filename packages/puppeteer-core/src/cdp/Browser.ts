/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {ChildProcess} from 'node:child_process';

import type {Protocol} from 'devtools-protocol';

import type {DebugInfo} from '../api/Browser.js';
import {
  Browser as BrowserBase,
  BrowserEvent,
  type BrowserCloseCallback,
  type BrowserContextOptions,
  type IsPageTargetCallback,
  type TargetFilterCallback,
} from '../api/Browser.js';
import {BrowserContextEvent} from '../api/BrowserContext.js';
import {CDPSessionEvent} from '../api/CDPSession.js';
import type {Page} from '../api/Page.js';
import type {Target} from '../api/Target.js';
import type {DownloadBehavior} from '../common/DownloadBehavior.js';
import type {Viewport} from '../common/Viewport.js';

import {CdpBrowserContext} from './BrowserContext.js';
import type {CdpCDPSession} from './CdpSession.js';
import type {Connection} from './Connection.js';
import {
  DevToolsTarget,
  InitializationStatus,
  OtherTarget,
  PageTarget,
  WorkerTarget,
  type CdpTarget,
} from './Target.js';
import {TargetManagerEvent} from './TargetManageEvents.js';
import {TargetManager} from './TargetManager.js';

/**
 * @internal
 */
export class CdpBrowser extends BrowserBase {
  readonly protocol = 'cdp';

  static async _create(
    connection: Connection,
    contextIds: string[],
    acceptInsecureCerts: boolean,
    defaultViewport?: Viewport | null,
    downloadBehavior?: DownloadBehavior,
    process?: ChildProcess,
    closeCallback?: BrowserCloseCallback,
    targetFilterCallback?: TargetFilterCallback,
    isPageTargetCallback?: IsPageTargetCallback,
    waitForInitiallyDiscoveredTargets = true,
  ): Promise<CdpBrowser> {
    const browser = new CdpBrowser(
      connection,
      contextIds,
      defaultViewport,
      process,
      closeCallback,
      targetFilterCallback,
      isPageTargetCallback,
      waitForInitiallyDiscoveredTargets,
    );
    if (acceptInsecureCerts) {
      await connection.send('Security.setIgnoreCertificateErrors', {
        ignore: true,
      });
    }
    await browser._attach(downloadBehavior);
    return browser;
  }
  #defaultViewport?: Viewport | null;
  #process?: ChildProcess;
  #connection: Connection;
  #closeCallback: BrowserCloseCallback;
  #targetFilterCallback: TargetFilterCallback;
  #isPageTargetCallback!: IsPageTargetCallback;
  #defaultContext: CdpBrowserContext;
  #contexts = new Map<string, CdpBrowserContext>();
  #targetManager: TargetManager;

  constructor(
    connection: Connection,
    contextIds: string[],
    defaultViewport?: Viewport | null,
    process?: ChildProcess,
    closeCallback?: BrowserCloseCallback,
    targetFilterCallback?: TargetFilterCallback,
    isPageTargetCallback?: IsPageTargetCallback,
    waitForInitiallyDiscoveredTargets = true,
  ) {
    super();
    this.#defaultViewport = defaultViewport;
    this.#process = process;
    this.#connection = connection;
    this.#closeCallback = closeCallback || (() => {});
    this.#targetFilterCallback =
      targetFilterCallback ||
      (() => {
        return true;
      });
    this.#setIsPageTargetCallback(isPageTargetCallback);
    this.#targetManager = new TargetManager(
      connection,
      this.#createTarget,
      this.#targetFilterCallback,
      waitForInitiallyDiscoveredTargets,
    );
    this.#defaultContext = new CdpBrowserContext(this.#connection, this);
    for (const contextId of contextIds) {
      this.#contexts.set(
        contextId,
        new CdpBrowserContext(this.#connection, this, contextId),
      );
    }
  }

  #emitDisconnected = () => {
    this.emit(BrowserEvent.Disconnected, undefined);
  };

  async _attach(downloadBehavior: DownloadBehavior | undefined): Promise<void> {
    this.#connection.on(CDPSessionEvent.Disconnected, this.#emitDisconnected);
    if (downloadBehavior) {
      await this.#defaultContext.setDownloadBehavior(downloadBehavior);
    }
    this.#targetManager.on(
      TargetManagerEvent.TargetAvailable,
      this.#onAttachedToTarget,
    );
    this.#targetManager.on(
      TargetManagerEvent.TargetGone,
      this.#onDetachedFromTarget,
    );
    this.#targetManager.on(
      TargetManagerEvent.TargetChanged,
      this.#onTargetChanged,
    );
    this.#targetManager.on(
      TargetManagerEvent.TargetDiscovered,
      this.#onTargetDiscovered,
    );
    await this.#targetManager.initialize();
  }

  _detach(): void {
    this.#connection.off(CDPSessionEvent.Disconnected, this.#emitDisconnected);
    this.#targetManager.off(
      TargetManagerEvent.TargetAvailable,
      this.#onAttachedToTarget,
    );
    this.#targetManager.off(
      TargetManagerEvent.TargetGone,
      this.#onDetachedFromTarget,
    );
    this.#targetManager.off(
      TargetManagerEvent.TargetChanged,
      this.#onTargetChanged,
    );
    this.#targetManager.off(
      TargetManagerEvent.TargetDiscovered,
      this.#onTargetDiscovered,
    );
  }

  override process(): ChildProcess | null {
    return this.#process ?? null;
  }

  _targetManager(): TargetManager {
    return this.#targetManager;
  }

  #setIsPageTargetCallback(isPageTargetCallback?: IsPageTargetCallback): void {
    this.#isPageTargetCallback =
      isPageTargetCallback ||
      ((target: Target): boolean => {
        return (
          target.type() === 'page' ||
          target.type() === 'background_page' ||
          target.type() === 'webview'
        );
      });
  }

  _getIsPageTargetCallback(): IsPageTargetCallback | undefined {
    return this.#isPageTargetCallback;
  }

  override async createBrowserContext(
    options: BrowserContextOptions = {},
  ): Promise<CdpBrowserContext> {
    const {proxyServer, proxyBypassList, downloadBehavior} = options;

    const {browserContextId} = await this.#connection.send(
      'Target.createBrowserContext',
      {
        proxyServer,
        proxyBypassList: proxyBypassList && proxyBypassList.join(','),
      },
    );
    const context = new CdpBrowserContext(
      this.#connection,
      this,
      browserContextId,
    );
    if (downloadBehavior) {
      await context.setDownloadBehavior(downloadBehavior);
    }
    this.#contexts.set(browserContextId, context);
    return context;
  }

  override browserContexts(): CdpBrowserContext[] {
    return [this.#defaultContext, ...Array.from(this.#contexts.values())];
  }

  override defaultBrowserContext(): CdpBrowserContext {
    return this.#defaultContext;
  }

  async _disposeContext(contextId?: string): Promise<void> {
    if (!contextId) {
      return;
    }
    await this.#connection.send('Target.disposeBrowserContext', {
      browserContextId: contextId,
    });
    this.#contexts.delete(contextId);
  }

  #createTarget = (
    targetInfo: Protocol.Target.TargetInfo,
    session?: CdpCDPSession,
  ) => {
    const {browserContextId} = targetInfo;
    const context =
      browserContextId && this.#contexts.has(browserContextId)
        ? this.#contexts.get(browserContextId)
        : this.#defaultContext;

    if (!context) {
      throw new Error('Missing browser context');
    }

    const createSession = (isAutoAttachEmulated: boolean) => {
      return this.#connection._createSession(targetInfo, isAutoAttachEmulated);
    };
    const otherTarget = new OtherTarget(
      targetInfo,
      session,
      context,
      this.#targetManager,
      createSession,
    );
    if (targetInfo.url?.startsWith('devtools://')) {
      return new DevToolsTarget(
        targetInfo,
        session,
        context,
        this.#targetManager,
        createSession,
        this.#defaultViewport ?? null,
      );
    }
    if (this.#isPageTargetCallback(otherTarget)) {
      return new PageTarget(
        targetInfo,
        session,
        context,
        this.#targetManager,
        createSession,
        this.#defaultViewport ?? null,
      );
    }
    if (
      targetInfo.type === 'service_worker' ||
      targetInfo.type === 'shared_worker'
    ) {
      return new WorkerTarget(
        targetInfo,
        session,
        context,
        this.#targetManager,
        createSession,
      );
    }
    return otherTarget;
  };

  #onAttachedToTarget = async (target: CdpTarget) => {
    if (
      target._isTargetExposed() &&
      (await target._initializedDeferred.valueOrThrow()) ===
        InitializationStatus.SUCCESS
    ) {
      this.emit(BrowserEvent.TargetCreated, target);
      target.browserContext().emit(BrowserContextEvent.TargetCreated, target);
    }
  };

  #onDetachedFromTarget = async (target: CdpTarget): Promise<void> => {
    target._initializedDeferred.resolve(InitializationStatus.ABORTED);
    target._isClosedDeferred.resolve();
    if (
      target._isTargetExposed() &&
      (await target._initializedDeferred.valueOrThrow()) ===
        InitializationStatus.SUCCESS
    ) {
      this.emit(BrowserEvent.TargetDestroyed, target);
      target.browserContext().emit(BrowserContextEvent.TargetDestroyed, target);
    }
  };

  #onTargetChanged = ({target}: {target: CdpTarget}): void => {
    this.emit(BrowserEvent.TargetChanged, target);
    target.browserContext().emit(BrowserContextEvent.TargetChanged, target);
  };

  #onTargetDiscovered = (targetInfo: Protocol.Target.TargetInfo): void => {
    this.emit(BrowserEvent.TargetDiscovered, targetInfo);
  };

  override wsEndpoint(): string {
    return this.#connection.url();
  }

  override async newPage(): Promise<Page> {
    return await this.#defaultContext.newPage();
  }

  async _createPageInContext(contextId?: string): Promise<Page> {
    const {targetId} = await this.#connection.send('Target.createTarget', {
      url: 'about:blank',
      browserContextId: contextId || undefined,
    });
    const target = (await this.waitForTarget(t => {
      return (t as CdpTarget)._targetId === targetId;
    })) as CdpTarget;
    if (!target) {
      throw new Error(`Missing target for page (id = ${targetId})`);
    }
    const initialized =
      (await target._initializedDeferred.valueOrThrow()) ===
      InitializationStatus.SUCCESS;
    if (!initialized) {
      throw new Error(`Failed to create target for page (id = ${targetId})`);
    }
    const page = await target.page();
    if (!page) {
      throw new Error(
        `Failed to create a page for context (id = ${contextId})`,
      );
    }
    return page;
  }

  override targets(): CdpTarget[] {
    return Array.from(
      this.#targetManager.getAvailableTargets().values(),
    ).filter(target => {
      return (
        target._isTargetExposed() &&
        target._initializedDeferred.value() === InitializationStatus.SUCCESS
      );
    });
  }

  override target(): CdpTarget {
    const browserTarget = this.targets().find(target => {
      return target.type() === 'browser';
    });
    if (!browserTarget) {
      throw new Error('Browser target is not found');
    }
    return browserTarget;
  }

  override async version(): Promise<string> {
    const version = await this.#getVersion();
    return version.product;
  }

  override async userAgent(): Promise<string> {
    const version = await this.#getVersion();
    return version.userAgent;
  }

  override async close(): Promise<void> {
    await this.#closeCallback.call(null);
    await this.disconnect();
  }

  override disconnect(): Promise<void> {
    this.#targetManager.dispose();
    this.#connection.dispose();
    this._detach();
    return Promise.resolve();
  }

  override get connected(): boolean {
    return !this.#connection._closed;
  }

  #getVersion(): Promise<Protocol.Browser.GetVersionResponse> {
    return this.#connection.send('Browser.getVersion');
  }

  override get debugInfo(): DebugInfo {
    return {
      pendingProtocolErrors: this.#connection.getPendingProtocolErrors(),
    };
  }
}
