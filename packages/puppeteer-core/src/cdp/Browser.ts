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

import type {ChildProcess} from 'child_process';

import type {Protocol} from 'devtools-protocol';

import {
  Browser as BrowserBase,
  BrowserEvent,
  WEB_PERMISSION_TO_PROTOCOL_PERMISSION,
  type BrowserCloseCallback,
  type BrowserContextOptions,
  type IsPageTargetCallback,
  type Permission,
  type TargetFilterCallback,
  type WaitForTargetOptions,
} from '../api/Browser.js';
import {BrowserContext, BrowserContextEvent} from '../api/BrowserContext.js';
import {CDPSessionEvent, type CDPSession} from '../api/CDPSession.js';
import type {Page} from '../api/Page.js';
import type {Target} from '../api/Target.js';
import type {Viewport} from '../common/Viewport.js';
import {assert} from '../util/assert.js';

import {ChromeTargetManager} from './ChromeTargetManager.js';
import type {Connection} from './Connection.js';
import {FirefoxTargetManager} from './FirefoxTargetManager.js';
import {
  DevToolsTarget,
  InitializationStatus,
  OtherTarget,
  PageTarget,
  WorkerTarget,
  type CdpTarget,
} from './Target.js';
import {TargetManagerEvent, type TargetManager} from './TargetManager.js';

/**
 * @internal
 */
export class CdpBrowser extends BrowserBase {
  static async _create(
    product: 'firefox' | 'chrome' | undefined,
    connection: Connection,
    contextIds: string[],
    ignoreHTTPSErrors: boolean,
    defaultViewport?: Viewport | null,
    process?: ChildProcess,
    closeCallback?: BrowserCloseCallback,
    targetFilterCallback?: TargetFilterCallback,
    isPageTargetCallback?: IsPageTargetCallback,
    waitForInitiallyDiscoveredTargets = true
  ): Promise<CdpBrowser> {
    const browser = new CdpBrowser(
      product,
      connection,
      contextIds,
      ignoreHTTPSErrors,
      defaultViewport,
      process,
      closeCallback,
      targetFilterCallback,
      isPageTargetCallback,
      waitForInitiallyDiscoveredTargets
    );
    await browser._attach();
    return browser;
  }
  #ignoreHTTPSErrors: boolean;
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
    product: 'chrome' | 'firefox' | undefined,
    connection: Connection,
    contextIds: string[],
    ignoreHTTPSErrors: boolean,
    defaultViewport?: Viewport | null,
    process?: ChildProcess,
    closeCallback?: BrowserCloseCallback,
    targetFilterCallback?: TargetFilterCallback,
    isPageTargetCallback?: IsPageTargetCallback,
    waitForInitiallyDiscoveredTargets = true
  ) {
    super();
    product = product || 'chrome';
    this.#ignoreHTTPSErrors = ignoreHTTPSErrors;
    this.#defaultViewport = defaultViewport;
    this.#process = process;
    this.#connection = connection;
    this.#closeCallback = closeCallback || function (): void {};
    this.#targetFilterCallback =
      targetFilterCallback ||
      ((): boolean => {
        return true;
      });
    this.#setIsPageTargetCallback(isPageTargetCallback);
    if (product === 'firefox') {
      this.#targetManager = new FirefoxTargetManager(
        connection,
        this.#createTarget,
        this.#targetFilterCallback
      );
    } else {
      this.#targetManager = new ChromeTargetManager(
        connection,
        this.#createTarget,
        this.#targetFilterCallback,
        waitForInitiallyDiscoveredTargets
      );
    }
    this.#defaultContext = new CdpBrowserContext(this.#connection, this);
    for (const contextId of contextIds) {
      this.#contexts.set(
        contextId,
        new CdpBrowserContext(this.#connection, this, contextId)
      );
    }
  }

  #emitDisconnected = () => {
    this.emit(BrowserEvent.Disconnected, undefined);
  };

  override async _attach(): Promise<void> {
    this.#connection.on(CDPSessionEvent.Disconnected, this.#emitDisconnected);
    this.#targetManager.on(
      TargetManagerEvent.TargetAvailable,
      this.#onAttachedToTarget
    );
    this.#targetManager.on(
      TargetManagerEvent.TargetGone,
      this.#onDetachedFromTarget
    );
    this.#targetManager.on(
      TargetManagerEvent.TargetChanged,
      this.#onTargetChanged
    );
    this.#targetManager.on(
      TargetManagerEvent.TargetDiscovered,
      this.#onTargetDiscovered
    );
    await this.#targetManager.initialize();
  }

  override _detach(): void {
    this.#connection.off(CDPSessionEvent.Disconnected, this.#emitDisconnected);
    this.#targetManager.off(
      TargetManagerEvent.TargetAvailable,
      this.#onAttachedToTarget
    );
    this.#targetManager.off(
      TargetManagerEvent.TargetGone,
      this.#onDetachedFromTarget
    );
    this.#targetManager.off(
      TargetManagerEvent.TargetChanged,
      this.#onTargetChanged
    );
    this.#targetManager.off(
      TargetManagerEvent.TargetDiscovered,
      this.#onTargetDiscovered
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

  override _getIsPageTargetCallback(): IsPageTargetCallback | undefined {
    return this.#isPageTargetCallback;
  }

  override async createIncognitoBrowserContext(
    options: BrowserContextOptions = {}
  ): Promise<CdpBrowserContext> {
    const {proxyServer, proxyBypassList} = options;

    const {browserContextId} = await this.#connection.send(
      'Target.createBrowserContext',
      {
        proxyServer,
        proxyBypassList: proxyBypassList && proxyBypassList.join(','),
      }
    );
    const context = new CdpBrowserContext(
      this.#connection,
      this,
      browserContextId
    );
    this.#contexts.set(browserContextId, context);
    return context;
  }

  override browserContexts(): CdpBrowserContext[] {
    return [this.#defaultContext, ...Array.from(this.#contexts.values())];
  }

  override defaultBrowserContext(): CdpBrowserContext {
    return this.#defaultContext;
  }

  override async _disposeContext(contextId?: string): Promise<void> {
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
    session?: CDPSession
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
      createSession
    );
    if (targetInfo.url?.startsWith('devtools://')) {
      return new DevToolsTarget(
        targetInfo,
        session,
        context,
        this.#targetManager,
        createSession,
        this.#ignoreHTTPSErrors,
        this.#defaultViewport ?? null
      );
    }
    if (this.#isPageTargetCallback(otherTarget)) {
      return new PageTarget(
        targetInfo,
        session,
        context,
        this.#targetManager,
        createSession,
        this.#ignoreHTTPSErrors,
        this.#defaultViewport ?? null
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
        createSession
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

  override async _createPageInContext(contextId?: string): Promise<Page> {
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
        `Failed to create a page for context (id = ${contextId})`
      );
    }
    return page;
  }

  override targets(): CdpTarget[] {
    return Array.from(
      this.#targetManager.getAvailableTargets().values()
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
    this.disconnect();
  }

  override disconnect(): void {
    this.#targetManager.dispose();
    this.#connection.dispose();
    this._detach();
  }

  override get connected(): boolean {
    return !this.#connection._closed;
  }

  #getVersion(): Promise<Protocol.Browser.GetVersionResponse> {
    return this.#connection.send('Browser.getVersion');
  }
}

/**
 * @internal
 */
export class CdpBrowserContext extends BrowserContext {
  #connection: Connection;
  #browser: CdpBrowser;
  #id?: string;

  constructor(connection: Connection, browser: CdpBrowser, contextId?: string) {
    super();
    this.#connection = connection;
    this.#browser = browser;
    this.#id = contextId;
  }

  override get id(): string | undefined {
    return this.#id;
  }

  override targets(): CdpTarget[] {
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

  override async pages(): Promise<Page[]> {
    const pages = await Promise.all(
      this.targets()
        .filter(target => {
          return (
            target.type() === 'page' ||
            (target.type() === 'other' &&
              this.#browser._getIsPageTargetCallback()?.(target))
          );
        })
        .map(target => {
          return target.page();
        })
    );
    return pages.filter((page): page is Page => {
      return !!page;
    });
  }

  override isIncognito(): boolean {
    return !!this.#id;
  }

  override async overridePermissions(
    origin: string,
    permissions: Permission[]
  ): Promise<void> {
    const protocolPermissions = permissions.map(permission => {
      const protocolPermission =
        WEB_PERMISSION_TO_PROTOCOL_PERMISSION.get(permission);
      if (!protocolPermission) {
        throw new Error('Unknown permission: ' + permission);
      }
      return protocolPermission;
    });
    await this.#connection.send('Browser.grantPermissions', {
      origin,
      browserContextId: this.#id || undefined,
      permissions: protocolPermissions,
    });
  }

  override async clearPermissionOverrides(): Promise<void> {
    await this.#connection.send('Browser.resetPermissions', {
      browserContextId: this.#id || undefined,
    });
  }

  override newPage(): Promise<Page> {
    return this.#browser._createPageInContext(this.#id);
  }

  override browser(): CdpBrowser {
    return this.#browser;
  }

  override async close(): Promise<void> {
    assert(this.#id, 'Non-incognito profiles cannot be closed!');
    await this.#browser._disposeContext(this.#id);
  }
}
