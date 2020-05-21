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

import { helper, assert } from './helper';
import { Target } from './Target';
import * as EventEmitter from 'events';
import { Events } from './Events';
import Protocol from './protocol';
import { Connection } from './Connection';
import { Page } from './Page';
import { ChildProcess } from 'child_process';
import type { Viewport } from './PuppeteerViewport';

type BrowserCloseCallback = () => Promise<void> | void;

export class Browser extends EventEmitter {
  static async create(
    connection: Connection,
    contextIds: string[],
    ignoreHTTPSErrors: boolean,
    defaultViewport?: Viewport,
    process?: ChildProcess,
    closeCallback?: BrowserCloseCallback
  ): Promise<Browser> {
    const browser = new Browser(
      connection,
      contextIds,
      ignoreHTTPSErrors,
      defaultViewport,
      process,
      closeCallback
    );
    await connection.send('Target.setDiscoverTargets', { discover: true });
    return browser;
  }
  _ignoreHTTPSErrors: boolean;
  _defaultViewport?: Viewport;
  _process?: ChildProcess;
  _connection: Connection;
  _closeCallback: BrowserCloseCallback;
  _defaultContext: BrowserContext;
  _contexts: Map<string, BrowserContext>;
  // TODO: once Target is in TypeScript we can type this properly.
  _targets: Map<string, Target>;

  constructor(
    connection: Connection,
    contextIds: string[],
    ignoreHTTPSErrors: boolean,
    defaultViewport?: Viewport,
    process?: ChildProcess,
    closeCallback?: BrowserCloseCallback
  ) {
    super();
    this._ignoreHTTPSErrors = ignoreHTTPSErrors;
    this._defaultViewport = defaultViewport;
    this._process = process;
    this._connection = connection;
    this._closeCallback = closeCallback || function (): void {};

    this._defaultContext = new BrowserContext(this._connection, this, null);
    this._contexts = new Map();
    for (const contextId of contextIds)
      this._contexts.set(
        contextId,
        new BrowserContext(this._connection, this, contextId)
      );

    this._targets = new Map();
    this._connection.on(Events.Connection.Disconnected, () =>
      this.emit(Events.Browser.Disconnected)
    );
    this._connection.on('Target.targetCreated', this._targetCreated.bind(this));
    this._connection.on(
      'Target.targetDestroyed',
      this._targetDestroyed.bind(this)
    );
    this._connection.on(
      'Target.targetInfoChanged',
      this._targetInfoChanged.bind(this)
    );
  }

  process(): ChildProcess | null {
    return this._process;
  }

  async createIncognitoBrowserContext(): Promise<BrowserContext> {
    const { browserContextId } = await this._connection.send(
      'Target.createBrowserContext'
    );
    const context = new BrowserContext(
      this._connection,
      this,
      browserContextId
    );
    this._contexts.set(browserContextId, context);
    return context;
  }

  browserContexts(): BrowserContext[] {
    return [this._defaultContext, ...Array.from(this._contexts.values())];
  }

  defaultBrowserContext(): BrowserContext {
    return this._defaultContext;
  }

  /**
   * @param {?string} contextId
   */
  async _disposeContext(contextId?: string): Promise<void> {
    await this._connection.send('Target.disposeBrowserContext', {
      browserContextId: contextId || undefined,
    });
    this._contexts.delete(contextId);
  }

  async _targetCreated(
    event: Protocol.Target.targetCreatedPayload
  ): Promise<void> {
    const targetInfo = event.targetInfo;
    const { browserContextId } = targetInfo;
    const context =
      browserContextId && this._contexts.has(browserContextId)
        ? this._contexts.get(browserContextId)
        : this._defaultContext;

    const target = new Target(
      targetInfo,
      context,
      () => this._connection.createSession(targetInfo),
      this._ignoreHTTPSErrors,
      this._defaultViewport
    );
    assert(
      !this._targets.has(event.targetInfo.targetId),
      'Target should not exist before targetCreated'
    );
    this._targets.set(event.targetInfo.targetId, target);

    if (await target._initializedPromise) {
      this.emit(Events.Browser.TargetCreated, target);
      context.emit(Events.BrowserContext.TargetCreated, target);
    }
  }

  /**
   * @param {{targetId: string}} event
   */
  async _targetDestroyed(event: { targetId: string }): Promise<void> {
    const target = this._targets.get(event.targetId);
    target._initializedCallback(false);
    this._targets.delete(event.targetId);
    target._closedCallback();
    if (await target._initializedPromise) {
      this.emit(Events.Browser.TargetDestroyed, target);
      target
        .browserContext()
        .emit(Events.BrowserContext.TargetDestroyed, target);
    }
  }

  /**
   * @param {!Protocol.Target.targetInfoChangedPayload} event
   */
  _targetInfoChanged(event: Protocol.Target.targetInfoChangedPayload): void {
    const target = this._targets.get(event.targetInfo.targetId);
    assert(target, 'target should exist before targetInfoChanged');
    const previousURL = target.url();
    const wasInitialized = target._isInitialized;
    target._targetInfoChanged(event.targetInfo);
    if (wasInitialized && previousURL !== target.url()) {
      this.emit(Events.Browser.TargetChanged, target);
      target.browserContext().emit(Events.BrowserContext.TargetChanged, target);
    }
  }

  wsEndpoint(): string {
    return this._connection.url();
  }

  async newPage(): Promise<Page> {
    return this._defaultContext.newPage();
  }

  async _createPageInContext(contextId?: string): Promise<Page> {
    const { targetId } = await this._connection.send('Target.createTarget', {
      url: 'about:blank',
      browserContextId: contextId || undefined,
    });
    const target = await this._targets.get(targetId);
    assert(
      await target._initializedPromise,
      'Failed to create target for page'
    );
    const page = await target.page();
    return page;
  }

  targets(): Target[] {
    return Array.from(this._targets.values()).filter(
      (target) => target._isInitialized
    );
  }

  target(): Target {
    return this.targets().find((target) => target.type() === 'browser');
  }

  /**
   * @param {function(!Target):boolean} predicate
   * @param {{timeout?: number}=} options
   * @return {!Promise<!Target>}
   */
  async waitForTarget(
    predicate: (x: Target) => boolean,
    options: { timeout?: number } = {}
  ): Promise<Target> {
    const { timeout = 30000 } = options;
    const existingTarget = this.targets().find(predicate);
    if (existingTarget) return existingTarget;
    let resolve;
    const targetPromise = new Promise<Target>((x) => (resolve = x));
    this.on(Events.Browser.TargetCreated, check);
    this.on(Events.Browser.TargetChanged, check);
    try {
      if (!timeout) return await targetPromise;
      return await helper.waitWithTimeout<Target>(
        targetPromise,
        'target',
        timeout
      );
    } finally {
      this.removeListener(Events.Browser.TargetCreated, check);
      this.removeListener(Events.Browser.TargetChanged, check);
    }

    function check(target: Target): void {
      if (predicate(target)) resolve(target);
    }
  }

  async pages(): Promise<Page[]> {
    const contextPages = await Promise.all(
      this.browserContexts().map((context) => context.pages())
    );
    // Flatten array.
    return contextPages.reduce((acc, x) => acc.concat(x), []);
  }

  async version(): Promise<string> {
    const version = await this._getVersion();
    return version.product;
  }

  async userAgent(): Promise<string> {
    const version = await this._getVersion();
    return version.userAgent;
  }

  async close(): Promise<void> {
    await this._closeCallback.call(null);
    this.disconnect();
  }

  disconnect(): void {
    this._connection.dispose();
  }

  isConnected(): boolean {
    return !this._connection._closed;
  }

  _getVersion(): Promise<Protocol.Browser.getVersionReturnValue> {
    return this._connection.send('Browser.getVersion');
  }
}

export class BrowserContext extends EventEmitter {
  _connection: Connection;
  _browser: Browser;
  _id?: string;

  constructor(connection: Connection, browser: Browser, contextId?: string) {
    super();
    this._connection = connection;
    this._browser = browser;
    this._id = contextId;
  }

  targets(): Target[] {
    return this._browser
      .targets()
      .filter((target) => target.browserContext() === this);
  }

  waitForTarget(
    predicate: (x: Target) => boolean,
    options: { timeout?: number }
  ): Promise<Target> {
    return this._browser.waitForTarget(
      (target) => target.browserContext() === this && predicate(target),
      options
    );
  }

  async pages(): Promise<Page[]> {
    const pages = await Promise.all(
      this.targets()
        .filter((target) => target.type() === 'page')
        .map((target) => target.page())
    );
    return pages.filter((page) => !!page);
  }

  isIncognito(): boolean {
    return !!this._id;
  }

  async overridePermissions(
    origin: string,
    permissions: Protocol.Browser.PermissionType[]
  ): Promise<void> {
    const webPermissionToProtocol = new Map<
      string,
      Protocol.Browser.PermissionType
    >([
      ['geolocation', 'geolocation'],
      ['midi', 'midi'],
      ['notifications', 'notifications'],
      // TODO: push isn't a valid type?
      // ['push', 'push'],
      ['camera', 'videoCapture'],
      ['microphone', 'audioCapture'],
      ['background-sync', 'backgroundSync'],
      ['ambient-light-sensor', 'sensors'],
      ['accelerometer', 'sensors'],
      ['gyroscope', 'sensors'],
      ['magnetometer', 'sensors'],
      ['accessibility-events', 'accessibilityEvents'],
      ['clipboard-read', 'clipboardReadWrite'],
      ['clipboard-write', 'clipboardReadWrite'],
      ['payment-handler', 'paymentHandler'],
      // chrome-specific permissions we have.
      ['midi-sysex', 'midiSysex'],
    ]);
    permissions = permissions.map((permission) => {
      const protocolPermission = webPermissionToProtocol.get(permission);
      if (!protocolPermission)
        throw new Error('Unknown permission: ' + permission);
      return protocolPermission;
    });
    await this._connection.send('Browser.grantPermissions', {
      origin,
      browserContextId: this._id || undefined,
      permissions,
    });
  }

  async clearPermissionOverrides(): Promise<void> {
    await this._connection.send('Browser.resetPermissions', {
      browserContextId: this._id || undefined,
    });
  }

  newPage(): Promise<Page> {
    return this._browser._createPageInContext(this._id);
  }

  browser(): Browser {
    return this._browser;
  }

  async close(): Promise<void> {
    assert(this._id, 'Non-incognito profiles cannot be closed!');
    await this._browser._disposeContext(this._id);
  }
}
