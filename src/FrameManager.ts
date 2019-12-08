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

import { EventEmitter } from 'events';
import { helper, assert, debugError } from './helper';
import { Events } from './Events';
import { ExecutionContext, EVALUATION_SCRIPT_URL } from './ExecutionContext';
import { LifecycleWatcher } from './LifecycleWatcher';
import { DOMWorld } from './DOMWorld';
import { NetworkManager, Response } from './NetworkManager';
import { CDPSession } from './Connection';
import { Page } from './Page';
import { TimeoutSettings } from './TimeoutSettings';
import { JSHandle, ElementHandle } from './JSHandle';
import { AnyFunction, Evalable, JSEvalable, EvaluateFn, SerializableOrJSHandle, EvaluateFnReturnType } from './types';
import { Protocol } from './protocol';

const UTILITY_WORLD_NAME = '__puppeteer_utility_world__';

export class FrameManager extends EventEmitter {
  /* @internal */
  public _client: CDPSession;
  private _page: Page;
  /* @internal */
  public _timeoutSettings: TimeoutSettings;
  private _frames = new Map<string, Frame>();
  private _networkManager: NetworkManager;
  private _contextIdToContext = new Map<number, ExecutionContext>();
  private _isolatedWorlds = new Set<string>();
  private _mainFrame: Frame | null = null;

  constructor(client: CDPSession, page: Page, ignoreHTTPSErrors: boolean, timeoutSettings: TimeoutSettings) {
    super();
    this._client = client;
    this._page = page;
    this._networkManager = new NetworkManager(client, ignoreHTTPSErrors, this);
    this._timeoutSettings = timeoutSettings;

    this._client.on('Page.frameAttached', event => this._onFrameAttached(event.frameId, event.parentFrameId));
    this._client.on('Page.frameNavigated', event => this._onFrameNavigated(event.frame));
    this._client.on('Page.navigatedWithinDocument', event =>
      this._onFrameNavigatedWithinDocument(event.frameId, event.url)
    );
    this._client.on('Page.frameDetached', event => this._onFrameDetached(event.frameId));
    this._client.on('Page.frameStoppedLoading', event => this._onFrameStoppedLoading(event.frameId));
    this._client.on('Runtime.executionContextCreated', event => this._onExecutionContextCreated(event.context));
    this._client.on('Runtime.executionContextDestroyed', event =>
      this._onExecutionContextDestroyed(event.executionContextId)
    );
    this._client.on('Runtime.executionContextsCleared', () => this._onExecutionContextsCleared());
    this._client.on('Page.lifecycleEvent', event => this._onLifecycleEvent(event));
  }

  public async initialize() {
    const [, { frameTree }] = await Promise.all([
      this._client.send('Page.enable'),
      this._client.send('Page.getFrameTree')
    ] as const);
    this._handleFrameTree(frameTree);
    await Promise.all([
      this._client.send('Page.setLifecycleEventsEnabled', { enabled: true }),
      this._client.send('Runtime.enable', {}).then(() => this._ensureIsolatedWorld(UTILITY_WORLD_NAME)),
      this._networkManager.initialize()
    ]);
  }

  public networkManager(): NetworkManager {
    return this._networkManager;
  }

  public async navigateFrame(
    frame: Frame,
    url: string,
    options: { referer?: string; timeout?: number; waitUntil?: string | string[] } = {}
  ): Promise<Response | null> {
    assertNoLegacyNavigationOptions(options);
    const {
      referer = this._networkManager.extraHTTPHeaders().referer,
      waitUntil = ['load'],
      timeout = this._timeoutSettings.navigationTimeout()
    } = options;

    const watcher = new LifecycleWatcher(this, frame, waitUntil, timeout);
    let ensureNewDocumentNavigation = false;
    let error = await Promise.race([
      navigate(this._client, url, referer, frame._id),
      watcher.timeoutOrTerminationPromise()
    ]);
    if (!error) {
      error = await Promise.race([
        watcher.timeoutOrTerminationPromise(),
        ensureNewDocumentNavigation ? watcher.newDocumentNavigationPromise() : watcher.sameDocumentNavigationPromise()
      ]);
    }
    watcher.dispose();
    if (error) throw error;
    return watcher.navigationResponse();

    async function navigate(client: CDPSession, url: string, referrer: string, frameId: string): Promise<Error | null> {
      try {
        const response = await client.send('Page.navigate', { url, referrer, frameId });
        ensureNewDocumentNavigation = !!response.loaderId;
        return response.errorText ? new Error(`${response.errorText} at ${url}`) : null;
      } catch (error) {
        return error;
      }
    }
  }

  public async waitForFrameNavigation(
    frame: Frame,
    options: { timeout?: number; waitUntil?: string | string[] } = {}
  ): Promise<Response | null> {
    assertNoLegacyNavigationOptions(options);
    const { waitUntil = ['load'], timeout = this._timeoutSettings.navigationTimeout() } = options;
    const watcher = new LifecycleWatcher(this, frame, waitUntil, timeout);
    const error = await Promise.race([
      watcher.timeoutOrTerminationPromise(),
      watcher.sameDocumentNavigationPromise(),
      watcher.newDocumentNavigationPromise()
    ]);
    watcher.dispose();
    if (error) throw error;
    return watcher.navigationResponse();
  }

  private _onLifecycleEvent(event: Protocol.Page.lifecycleEventPayload) {
    const frame = this._frames.get(event.frameId);
    if (!frame) return;
    frame._onLifecycleEvent(event.loaderId, event.name);
    this.emit(Events.FrameManager.LifecycleEvent, frame);
  }

  public page(): Page {
    return this._page;
  }

  public mainFrame(): Frame | null {
    return this._mainFrame;
  }

  public frames(): Frame[] {
    return Array.from(this._frames.values());
  }

  public frame(frameId: string): Frame | null {
    return this._frames.get(frameId) || null;
  }

  private _onFrameAttached(frameId: string, parentFrameId?: string) {
    if (this._frames.has(frameId)) return;
    assert(parentFrameId);
    const parentFrame = this._frames.get(parentFrameId);
    const frame = new Frame(this, this._client, parentFrame, frameId);
    this._frames.set(frame._id, frame);
    this.emit(Events.FrameManager.FrameAttached, frame);
  }

  private _onFrameNavigated(framePayload: Protocol.Page.Frame) {
    const isMainFrame = !framePayload.parentId;
    let frame = isMainFrame ? this._mainFrame : this._frames.get(framePayload.id);
    assert(isMainFrame || frame, 'We either navigate top level or have old version of the navigated frame');

    // Detach all child frames first.
    if (frame)
      for (const child of frame.childFrames()) this._removeFramesRecursively(child);

    // Update or create main frame.
    if (isMainFrame) {
      if (frame) {
        // Update frame id to retain frame identity on cross-process navigation.
        this._frames.delete(frame._id);
        frame._id = framePayload.id;
      } else {
        // Initial main frame navigation.
        frame = new Frame(this, this._client, null, framePayload.id);
      }
      this._frames.set(framePayload.id, frame);
      this._mainFrame = frame;
    }

    // Update frame payload.
    frame!._navigated(framePayload);

    this.emit(Events.FrameManager.FrameNavigated, frame);
  }

  public async _ensureIsolatedWorld(name: string) {
    if (this._isolatedWorlds.has(name)) return;
    this._isolatedWorlds.add(name);
    await this._client.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `//# sourceURL=${EVALUATION_SCRIPT_URL}`,
      worldName: name
    }),
    await Promise.all(
        this.frames().map(frame =>
          this._client
              .send('Page.createIsolatedWorld', {
                frameId: frame._id,
                grantUniveralAccess: true,
                worldName: name
              })
              .catch(debugError)
        )
    ); // frames might be removed before we send this
  }

  private _onFrameNavigatedWithinDocument(frameId: string, url: string) {
    const frame = this._frames.get(frameId);
    if (!frame) return;
    frame._navigatedWithinDocument(url);
    this.emit(Events.FrameManager.FrameNavigatedWithinDocument, frame);
    this.emit(Events.FrameManager.FrameNavigated, frame);
  }

  public executionContextById(contextId: number): ExecutionContext {
    const context = this._contextIdToContext.get(contextId);
    assert(context, 'INTERNAL ERROR: missing context with id = ' + contextId);
    return context;
  }

  private _removeFramesRecursively(frame: Frame) {
    for (const child of frame.childFrames()) this._removeFramesRecursively(child);
    frame._detach();
    this._frames.delete(frame._id);
    this.emit(Events.FrameManager.FrameDetached, frame);
  }

  private _onFrameStoppedLoading(frameId: string) {
    const frame = this._frames.get(frameId);
    if (!frame) return;
    frame._onLoadingStopped();
    this.emit(Events.FrameManager.LifecycleEvent, frame);
  }

  private _handleFrameTree(frameTree: Protocol.Page.FrameTree) {
    if (frameTree.frame.parentId) this._onFrameAttached(frameTree.frame.id, frameTree.frame.parentId);
    this._onFrameNavigated(frameTree.frame);
    if (!frameTree.childFrames) return;

    for (const child of frameTree.childFrames) this._handleFrameTree(child);
  }

  private _onFrameDetached(frameId: string) {
    const frame = this._frames.get(frameId);
    if (frame) this._removeFramesRecursively(frame);
  }

  private _onExecutionContextCreated(contextPayload: any /* Protocol.Runtime.ExecutionContextDescription ? */) {
    const frameId = contextPayload.auxData ? contextPayload.auxData.frameId : null;
    const frame = this._frames.get(frameId) || null;
    let world;
    if (frame) {
      if (contextPayload.auxData && !!contextPayload.auxData.isDefault) {
        world = frame._mainWorld;
      } else if (contextPayload.name === UTILITY_WORLD_NAME && !frame._secondaryWorld._hasContext()) {
        // In case of multiple sessions to the same target, there's a race between
        // connections so we might end up creating multiple isolated worlds.
        // We can use either.
        world = frame._secondaryWorld;
      }
    }
    if (contextPayload.auxData && contextPayload.auxData.type === 'isolated')
      this._isolatedWorlds.add(contextPayload.name);
    const context = new ExecutionContext(this._client, contextPayload, world);
    if (world) world._setContext(context);
    this._contextIdToContext.set(contextPayload.id, context);
  }

  private _onExecutionContextDestroyed(executionContextId: number) {
    const context = this._contextIdToContext.get(executionContextId);
    if (!context) return;
    this._contextIdToContext.delete(executionContextId);
    if (context.world) context.world._setContext(null);
  }

  private _onExecutionContextsCleared() {
    for (const context of this._contextIdToContext.values())
      if (context.world) context.world._setContext(null);

    this._contextIdToContext.clear();
  }
}

export class Frame implements Evalable, JSEvalable {
  /* @internal */
  public _frameManager: FrameManager;
  protected _client: CDPSession;
  private _parentFrame?: Frame | null;
  private _url: string;
  /* @internal */
  public _id: string;
  private _name?: string;
  protected _navigationURL?: string;
  private _detached: boolean;
  /* @internal */
  public _loaderId: string;
  /* @internal */
  public _lifecycleEvents = new Set<string>();
  /* @internal */
  public _mainWorld: DOMWorld;
  /* @internal */
  public _secondaryWorld: DOMWorld;
  private _childFrames = new Set<Frame>();

  constructor(frameManager: FrameManager, client: CDPSession, parentFrame: Frame | null | undefined, frameId: string) {
    this._frameManager = frameManager;
    this._client = client;
    this._parentFrame = parentFrame;
    this._url = '';
    this._id = frameId;
    this._detached = false;

    this._loaderId = '';
    this._mainWorld = new DOMWorld(frameManager, this, frameManager._timeoutSettings);
    this._secondaryWorld = new DOMWorld(frameManager, this, frameManager._timeoutSettings);

    if (this._parentFrame) this._parentFrame._childFrames.add(this);
  }

  public async goto(
    url: string,
    options?: { referer?: string; timeout?: number; waitUntil?: string | string[] }
  ): Promise<Response | null> {
    return this._frameManager.navigateFrame(this, url, options);
  }

  public async waitForNavigation(options?: { timeout?: number; waitUntil?: string | string[] }): Promise<Response | null> {
    return this._frameManager.waitForFrameNavigation(this, options);
  }

  public executionContext(): Promise<ExecutionContext> {
    return this._mainWorld.executionContext();
  }

  public async evaluateHandle<V extends EvaluateFn<any>>(
    pageFunction: V,
    ...args: SerializableOrJSHandle[]
  ): Promise<JSHandle<EvaluateFnReturnType<V>>> {
    return this._mainWorld.evaluateHandle(pageFunction, ...args);
  }

  public async evaluate<V extends EvaluateFn<any>>(
    pageFunction: V,
    ...args: SerializableOrJSHandle[]
  ): Promise<EvaluateFnReturnType<V>> {
    return this._mainWorld.evaluate(pageFunction, ...args);
  }

  public async $(selector: string): Promise<ElementHandle | null> {
    return this._mainWorld.$(selector);
  }

  public async $x(expression: string): Promise<ElementHandle[]> {
    return this._mainWorld.$x(expression);
  }

  public $eval: Evalable['$eval'] = async(...args: Parameters<Evalable['$eval']>) => this._mainWorld.$eval(...args);

  public $$eval: Evalable['$$eval'] = async(...args: Parameters<Evalable['$$eval']>) => this._mainWorld.$$eval(...args);

  public async $$(selector: string): Promise<ElementHandle[]> {
    return this._mainWorld.$$(selector);
  }

  public async content(): Promise<string> {
    return this._secondaryWorld.content();
  }

  public async setContent(html: string, options: { timeout?: number; waitUntil?: string | string[] } = {}) {
    return this._secondaryWorld.setContent(html, options);
  }

  public name(): string {
    return this._name || '';
  }

  public url(): string {
    return this._url;
  }

  public parentFrame(): Frame | null | undefined {
    return this._parentFrame;
  }

  public childFrames(): Frame[] {
    return Array.from(this._childFrames);
  }

  public isDetached(): boolean {
    return this._detached;
  }

  public async addScriptTag(options: {
    url?: string;
    path?: string;
    content?: string;
    type?: string;
  }): Promise<ElementHandle> {
    return this._mainWorld.addScriptTag(options);
  }

  public async addStyleTag(options: { url?: string; path?: string; content?: string }): Promise<ElementHandle> {
    return this._mainWorld.addStyleTag(options);
  }

  public async click(
    selector: string,
    options?: { delay?: number; button?: 'left' | 'right' | 'middle'; clickCount?: number }
  ) {
    return this._secondaryWorld.click(selector, options);
  }

  public async focus(selector: string) {
    return this._secondaryWorld.focus(selector);
  }

  public async hover(selector: string) {
    return this._secondaryWorld.hover(selector);
  }

  public select(selector: string, ...values: string[]): Promise<string[]> {
    return this._secondaryWorld.select(selector, ...values);
  }

  public async tap(selector: string) {
    return this._secondaryWorld.tap(selector);
  }

  public async type(selector: string, text: string, options?: { delay: number | undefined }) {
    return this._mainWorld.type(selector, text, options);
  }

  public waitFor(
    selectorOrFunctionOrTimeout: string | number | AnyFunction,
    options: { visible?: boolean; hidden?: boolean; timeout?: number } = {},
    ...args: any[]
  ): Promise<JSHandle | null> {
    const xPathPattern = '//';

    if (helper.isString(selectorOrFunctionOrTimeout)) {
      if (selectorOrFunctionOrTimeout.startsWith(xPathPattern))
        return this.waitForXPath(selectorOrFunctionOrTimeout, options);
      return this.waitForSelector(selectorOrFunctionOrTimeout, options);
    }
    if (helper.isNumber(selectorOrFunctionOrTimeout))
      return new Promise(fulfill => setTimeout(fulfill, selectorOrFunctionOrTimeout));
    if (typeof selectorOrFunctionOrTimeout === 'function')
      return this.waitForFunction(selectorOrFunctionOrTimeout, options, ...args);
    return Promise.reject(new Error('Unsupported target type: ' + typeof selectorOrFunctionOrTimeout));
  }

  public async waitForSelector(
    selector: string,
    options?: { visible?: boolean; hidden?: boolean; timeout?: number }
  ): Promise<ElementHandle | null> {
    const handle = await this._secondaryWorld.waitForSelector(selector, options);
    if (!handle) return null;
    const mainExecutionContext = await this._mainWorld.executionContext();
    const result = await mainExecutionContext._adoptElementHandle(handle);
    await handle.dispose();
    return result;
  }

  public async waitForXPath(
    xpath: string,
    options?: { visible?: boolean; hidden?: boolean; timeout?: number }
  ): Promise<ElementHandle | null> {
    const handle = await this._secondaryWorld.waitForXPath(xpath, options);
    if (!handle) return null;
    const mainExecutionContext = await this._mainWorld.executionContext();
    const result = await mainExecutionContext._adoptElementHandle(handle);
    await handle.dispose();
    return result;
  }

  public waitForFunction(
    pageFunction: AnyFunction | string,
    options: { polling?: string | number; timeout?: number } = {},
    ...args: any[]
  ): Promise<JSHandle> {
    return this._mainWorld.waitForFunction(pageFunction, options, ...args);
  }

  public async title(): Promise<string> {
    return this._secondaryWorld.title();
  }

  /* @internal */
  public _navigated(framePayload: Protocol.Page.Frame) {
    this._name = framePayload.name;
    // TODO(lushnikov): remove this once requestInterception has loaderId exposed.
    this._navigationURL = framePayload.url;
    this._url = framePayload.url;
  }

  /* @internal */
  public _navigatedWithinDocument(url: string) {
    this._url = url;
  }

  /* @internal */
  public _onLifecycleEvent(loaderId: string, name: string) {
    if (name === 'init') {
      this._loaderId = loaderId;
      this._lifecycleEvents.clear();
    }
    this._lifecycleEvents.add(name);
  }

  /* @internal */
  public _onLoadingStopped() {
    this._lifecycleEvents.add('DOMContentLoaded');
    this._lifecycleEvents.add('load');
  }

  /* @internal */
  public _detach() {
    this._detached = true;
    this._mainWorld._detach();
    this._secondaryWorld._detach();
    if (this._parentFrame) this._parentFrame._childFrames.delete(this);
    this._parentFrame = null;
  }
}

function assertNoLegacyNavigationOptions(options: any) {
  assert(options.networkIdleTimeout === undefined, 'ERROR: networkIdleTimeout option is no longer supported.');
  assert(options.networkIdleInflight === undefined, 'ERROR: networkIdleInflight option is no longer supported.');
  assert(
      options.waitUntil !== 'networkidle',
      'ERROR: "networkidle" option is no longer supported. Use "networkidle2" instead'
  );
}
