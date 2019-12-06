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

import { ChildProcess } from 'child_process';
import { helper, assert } from './helper';
import { Target } from './Target';
import { EventEmitter } from 'events';
import { TaskQueue } from './TaskQueue';
import { Events } from './Events';
import { Connection } from './Connection';
import { Viewport, AnyFunction } from './types';
import { Page } from './Page';

const noop = () => undefined

export class Browser extends EventEmitter {
  static async create(connection: Connection, contextIds: string[], ignoreHTTPSErrors: boolean, defaultViewport?: Viewport | null, process?: ChildProcess | null, closeCallback?: AnyFunction) {
    const browser = new Browser(connection, contextIds, ignoreHTTPSErrors, defaultViewport, process, closeCallback);
    await connection.send('Target.setDiscoverTargets', {discover: true});
    return browser;
  }
  
  private _screenshotTaskQueue = new TaskQueue();
  private _defaultContext: BrowserContext
  private _contexts = new Map<string, BrowserContext>();
  
  /*@internal*/
  public _targets = new Map<string, Target>();

  constructor(private connection: Connection, contextIds: string[], private ignoreHTTPSErrors: boolean, private defaultViewport?: Viewport | null, private _process?: ChildProcess | null, private closeCallback: AnyFunction = noop) {
    super();
    this._defaultContext = new BrowserContext(this.connection, this, undefined);
    for (const contextId of contextIds)
      this._contexts.set(contextId, new BrowserContext(this.connection, this, contextId));

    this.connection.on(Events.Connection.Disconnected, () => this.emit(Events.Browser.Disconnected));
    this.connection.on('Target.targetCreated', this._targetCreated);
    this.connection.on('Target.targetDestroyed', this._targetDestroyed);
    this.connection.on('Target.targetInfoChanged', this._targetInfoChanged);
  }

  process(): ChildProcess | undefined | null {
    return this._process;
  }

  async createIncognitoBrowserContext(): Promise<BrowserContext> {
    const {browserContextId} = await this.connection.send('Target.createBrowserContext');
    const context = new BrowserContext(this.connection, this, browserContextId);
    this._contexts.set(browserContextId, context);
    return context;
  }

  browserContexts(): Array<BrowserContext> {
    return [this._defaultContext, ...Array.from(this._contexts.values())];
  }

  defaultBrowserContext(): BrowserContext {
    return this._defaultContext;
  }

  /*@internal*/
  public async _disposeContext(contextId: string) {
    await this.connection.send('Target.disposeBrowserContext', {browserContextId: contextId});
    this._contexts.delete(contextId);
  }

  /*@internal*/
  private _targetCreated = async (event: Protocol.Target.targetCreatedPayload) => {
    const targetInfo = event.targetInfo;
    const {browserContextId} = targetInfo;
    const context = (browserContextId && this._contexts.has(browserContextId)) ? this._contexts.get(browserContextId)! : this._defaultContext;

    const target = new Target(targetInfo, context, () => this.connection.createSession(targetInfo), this.ignoreHTTPSErrors, this.defaultViewport, this._screenshotTaskQueue);
    assert(!this._targets.has(event.targetInfo.targetId), 'Target should not exist before targetCreated');
    this._targets.set(event.targetInfo.targetId, target);

    if (await target._initializedPromise) {
      this.emit(Events.Browser.TargetCreated, target);
      context.emit(Events.BrowserContext.TargetCreated, target);
    }
  }

  private _targetDestroyed = async (event: {targetId: string}) => {
    const target = this._targets.get(event.targetId)!;
    target._initializedCallback(false);
    this._targets.delete(event.targetId);
    target._closedCallback();
    if (await target._initializedPromise) {
      this.emit(Events.Browser.TargetDestroyed, target);
      target.browserContext().emit(Events.BrowserContext.TargetDestroyed, target);
    }
  }

  private _targetInfoChanged = (event: Protocol.Target.targetInfoChangedPayload) => {
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
    return this.connection.url();
  }

  async newPage(): Promise<Page> {
    return this._defaultContext.newPage();
  }

  /*@internal*/
  public async _createPageInContext(contextId?: string): Promise<Page> {
    const {targetId} = await this.connection.send('Target.createTarget', {url: 'about:blank', browserContextId: contextId || undefined});
    const target = await this._targets.get(targetId)!;
    assert(await target._initializedPromise, 'Failed to create target for page');
    const page = await target.page();
    return page;
  }

  targets(): Array<Target> {
    return Array.from(this._targets.values()).filter(target => target._isInitialized);
  }

  target(): Target | undefined {
    return this.targets().find(target => target.type() === 'browser');
  }

  async waitForTarget(predicate: (target: Target) => boolean, options: {timeout?: number} = {}): Promise<Target> {
    const {
      timeout = 30000
    } = options;
    const existingTarget = this.targets().find(predicate);
    if (existingTarget)
      return existingTarget;
    let resolve: (target: Target) => void;
    const targetPromise = new Promise<Target>(x => resolve = x);
    this.on(Events.Browser.TargetCreated, check);
    this.on(Events.Browser.TargetChanged, check);
    try {
      if (!timeout)
        return await targetPromise;
      return await helper.waitWithTimeout(targetPromise, 'target', timeout);
    } finally {
      this.removeListener(Events.Browser.TargetCreated, check);
      this.removeListener(Events.Browser.TargetChanged, check);
    }

    function check(target: Target) {
      if (predicate(target))
        resolve(target);
    }
  }

  async pages(): Promise<Array<Page>> {
    const contextPages = await Promise.all(this.browserContexts().map(context => context.pages()));
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

  async close() {
    await this.closeCallback.call(null);
    this.disconnect();
  }

  disconnect() {
    this.connection.dispose();
  }

  isConnected(): boolean {
    return !this.connection.closed;
  }

  private _getVersion(): Promise<any> {
    return this.connection.send('Browser.getVersion');
  }
}

const webPermissionToProtocol = new Map<string, Protocol.Browser.PermissionType>([
  ['geolocation', 'geolocation'],
  ['midi', 'midi'],
  ['notifications', 'notifications'],
  // ['push', 'push'],
  ['camera', 'videoCapture'],
  ['microphone', 'audioCapture'],
  ['background-sync', 'backgroundSync'],
  ['ambient-light-sensor', 'sensors'],
  ['accelerometer', 'sensors'],
  ['gyroscope', 'sensors'],
  ['magnetometer', 'sensors'],
  ['accessibility-events', 'accessibilityEvents'],
  ['clipboard-read', 'clipboardRead'],
  ['clipboard-write', 'clipboardWrite'],
  ['payment-handler', 'paymentHandler'],
  // chrome-specific permissions we have.
  ['midi-sysex', 'midiSysex'],
]);

export class BrowserContext extends EventEmitter {
  constructor(private connection: Connection, private _browser: Browser, private id?: string) {
    super();
  }

  targets(): Array<Target> {
    return this._browser.targets().filter(target => target.browserContext() === this);
  }

  waitForTarget(predicate: (target: Target) => boolean, options?: {timeout?: number}): Promise<Target> {
    return this._browser.waitForTarget(target => target.browserContext() === this && predicate(target), options);
  }

  async pages(): Promise<Array<Page>> {
    const pages = await Promise.all(
        this.targets()
            .filter(target => target.type() === 'page')
            .map(target => target.page())
    );
    return pages.filter(page => !!page) as Array<Page>;
  }

  isIncognito(): boolean {
    return !!this.id;
  }

  async overridePermissions(origin: string, permissions: string[]) {
    const protocolPermissions = permissions.map(permission => {
      const protocolPermission = webPermissionToProtocol.get(permission);
      if (!protocolPermission)
        throw new Error('Unknown permission: ' + permission);
      return protocolPermission;
    });
    await this.connection.send('Browser.grantPermissions', {origin, browserContextId: this.id || undefined, permissions: protocolPermissions});
  }

  async clearPermissionOverrides() {
    await this.connection.send('Browser.resetPermissions', {browserContextId: this.id || undefined});
  }

  newPage(): Promise<Page> {
    return this._browser._createPageInContext(this.id);
  }

  browser(): Browser {
    return this._browser;
  }

  async close(): Promise<void> {
    assert(this.id, 'Non-incognito profiles cannot be closed!');
    await this._browser._disposeContext(this.id);
  }
}
