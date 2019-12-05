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

import EventEmitter from 'events';
import {helper, assert, debugError} from './helper';
import {Events} from './Events';
import {ExecutionContext, EVALUATION_SCRIPT_URL} from './ExecutionContext';
import {LifecycleWatcher} from './LifecycleWatcher';
import {DOMWorld} from './DOMWorld';
import {NetworkManager} from './NetworkManager';

const UTILITY_WORLD_NAME = '__puppeteer_utility_world__';

class FrameManager extends EventEmitter {
  _client: CDPSession
  _page: Page
  _timeoutSettings: TimeoutSettings
  /**
   * @param {!Puppeteer.CDPSession} client
   * @param {!Puppeteer.Page} page
   * @param {boolean} ignoreHTTPSErrors
   * @param {!Puppeteer.TimeoutSettings} timeoutSettings
   */
  constructor(client: CDPSession, page: Page, ignoreHTTPSErrors: boolean, timeoutSettings: TimeoutSettings) {
    super();
    this._client = client;
    this._page = page;
    this._networkManager = new NetworkManager(client, ignoreHTTPSErrors, this);
    this._timeoutSettings = timeoutSettings;
    /** @type {!Map<string, !Frame>} */
    this._frames = new Map();
    /** @type {!Map<number, !ExecutionContext>} */
    this._contextIdToContext = new Map();
    /** @type {!Set<string>} */
    this._isolatedWorlds = new Set();

    this._client.on('Page.frameAttached', event => this._onFrameAttached(event.frameId, event.parentFrameId));
    this._client.on('Page.frameNavigated', event => this._onFrameNavigated(event.frame));
    this._client.on('Page.navigatedWithinDocument', event => this._onFrameNavigatedWithinDocument(event.frameId, event.url));
    this._client.on('Page.frameDetached', event => this._onFrameDetached(event.frameId));
    this._client.on('Page.frameStoppedLoading', event => this._onFrameStoppedLoading(event.frameId));
    this._client.on('Runtime.executionContextCreated', event => this._onExecutionContextCreated(event.context));
    this._client.on('Runtime.executionContextDestroyed', event => this._onExecutionContextDestroyed(event.executionContextId));
    this._client.on('Runtime.executionContextsCleared', event => this._onExecutionContextsCleared());
    this._client.on('Page.lifecycleEvent', event => this._onLifecycleEvent(event));
  }

  async initialize() {
    const [,{frameTree}] = await Promise.all([
      this._client.send('Page.enable'),
      this._client.send('Page.getFrameTree'),
    ]);
    this._handleFrameTree(frameTree);
    await Promise.all([
      this._client.send('Page.setLifecycleEventsEnabled', { enabled: true }),
      this._client.send('Runtime.enable', {}).then(() => this._ensureIsolatedWorld(UTILITY_WORLD_NAME)),
      this._networkManager.initialize(),
    ]);
  }

  /**
   * @return {!NetworkManager}
   */
  networkManager(): NetworkManager {
    return this._networkManager;
  }

  /**
   * @param {!Puppeteer.Frame} frame
   * @param {string} url
   * @param {!{referer?: string, timeout?: number, waitUntil?: string|!Array<string>}=} options
   * @return {!Promise<?Puppeteer.Response>}
   */
  async navigateFrame(frame: Frame, url: string, options: {referer?: string, timeout?: number, waitUntil?: string|Array<string>} = {}): Promise<?Response> {
    assertNoLegacyNavigationOptions(options);
    const {
      referer = this._networkManager.extraHTTPHeaders()['referer'],
      waitUntil = ['load'],
      timeout = this._timeoutSettings.navigationTimeout(),
    } = options;

    const watcher = new LifecycleWatcher(this, frame, waitUntil, timeout);
    let ensureNewDocumentNavigation = false;
    let error = await Promise.race([
      navigate(this._client, url, referer, frame._id),
      watcher.timeoutOrTerminationPromise(),
    ]);
    if (!error) {
      error = await Promise.race([
        watcher.timeoutOrTerminationPromise(),
        ensureNewDocumentNavigation ? watcher.newDocumentNavigationPromise() : watcher.sameDocumentNavigationPromise(),
      ]);
    }
    watcher.dispose();
    if (error)
      throw error;
    return watcher.navigationResponse();

    /**
     * @param {!Puppeteer.CDPSession} client
     * @param {string} url
     * @param {string} referrer
     * @param {string} frameId
     * @return {!Promise<?Error>}
     */
    async function navigate(client: CDPSession, url: string, referrer: string, frameId: string): Promise<?Error> {
      try {
        const response = await client.send('Page.navigate', {url, referrer, frameId});
        ensureNewDocumentNavigation = !!response.loaderId;
        return response.errorText ? new Error(`${response.errorText} at ${url}`) : null;
      } catch (error) {
        return error;
      }
    }
  }

  /**
   * @param {!Puppeteer.Frame} frame
   * @param {!{timeout?: number, waitUntil?: string|!Array<string>}=} options
   * @return {!Promise<?Puppeteer.Response>}
   */
  async waitForFrameNavigation(frame: Frame, options: {timeout?: number, waitUntil?: string|Array<string>} = {}): Promise<?Response> {
    assertNoLegacyNavigationOptions(options);
    const {
      waitUntil = ['load'],
      timeout = this._timeoutSettings.navigationTimeout(),
    } = options;
    const watcher = new LifecycleWatcher(this, frame, waitUntil, timeout);
    const error = await Promise.race([
      watcher.timeoutOrTerminationPromise(),
      watcher.sameDocumentNavigationPromise(),
      watcher.newDocumentNavigationPromise()
    ]);
    watcher.dispose();
    if (error)
      throw error;
    return watcher.navigationResponse();
  }

  /**
   * @param {!Protocol.Page.lifecycleEventPayload} event
   */
  _onLifecycleEvent(event: Protocol.Page.lifecycleEventPayload) {
    const frame = this._frames.get(event.frameId);
    if (!frame)
      return;
    frame._onLifecycleEvent(event.loaderId, event.name);
    this.emit(Events.FrameManager.LifecycleEvent, frame);
  }

  /**
   * @param {string} frameId
   */
  _onFrameStoppedLoading(frameId: string) {
    const frame = this._frames.get(frameId);
    if (!frame)
      return;
    frame._onLoadingStopped();
    this.emit(Events.FrameManager.LifecycleEvent, frame);
  }

  /**
   * @param {!Protocol.Page.FrameTree} frameTree
   */
  _handleFrameTree(frameTree: Protocol.Page.FrameTree) {
    if (frameTree.frame.parentId)
      this._onFrameAttached(frameTree.frame.id, frameTree.frame.parentId);
    this._onFrameNavigated(frameTree.frame);
    if (!frameTree.childFrames)
      return;

    for (const child of frameTree.childFrames)
      this._handleFrameTree(child);
  }

  /**
   * @return {!Puppeteer.Page}
   */
  page(): Page {
    return this._page;
  }

  /**
   * @return {!Frame}
   */
  mainFrame(): Frame {
    return this._mainFrame;
  }

  /**
   * @return {!Array<!Frame>}
   */
  frames(): Array<Frame> {
    return Array.from(this._frames.values());
  }

  /**
   * @param {!string} frameId
   * @return {?Frame}
   */
  frame(frameId: string): Frame | undefined {
    return this._frames.get(frameId) || null;
  }

  /**
   * @param {string} frameId
   * @param {?string} parentFrameId
   */
  _onFrameAttached(frameId: string, parentFrameId?: string) {
    if (this._frames.has(frameId))
      return;
    assert(parentFrameId);
    const parentFrame = this._frames.get(parentFrameId);
    const frame = new Frame(this, this._client, parentFrame, frameId);
    this._frames.set(frame._id, frame);
    this.emit(Events.FrameManager.FrameAttached, frame);
  }

  /**
   * @param {!Protocol.Page.Frame} framePayload
   */
  _onFrameNavigated(framePayload: Protocol.Page.Frame) {
    const isMainFrame = !framePayload.parentId;
    let frame = isMainFrame ? this._mainFrame : this._frames.get(framePayload.id);
    assert(isMainFrame || frame, 'We either navigate top level or have old version of the navigated frame');

    // Detach all child frames first.
    if (frame) {
      for (const child of frame.childFrames())
        this._removeFramesRecursively(child);
    }

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
    frame._navigated(framePayload);

    this.emit(Events.FrameManager.FrameNavigated, frame);
  }

  /**
   * @param {string} name
   */
  async _ensureIsolatedWorld(name: string) {
    if (this._isolatedWorlds.has(name))
      return;
    this._isolatedWorlds.add(name);
    await this._client.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `//# sourceURL=${EVALUATION_SCRIPT_URL}`,
      worldName: name,
    }),
    await Promise.all(this.frames().map(frame => this._client.send('Page.createIsolatedWorld', {
      frameId: frame._id,
      grantUniveralAccess: true,
      worldName: name,
    }).catch(debugError))); // frames might be removed before we send this
  }

  /**
   * @param {string} frameId
   * @param {string} url
   */
  _onFrameNavigatedWithinDocument(frameId: string, url: string) {
    const frame = this._frames.get(frameId);
    if (!frame)
      return;
    frame._navigatedWithinDocument(url);
    this.emit(Events.FrameManager.FrameNavigatedWithinDocument, frame);
    this.emit(Events.FrameManager.FrameNavigated, frame);
  }

  /**
   * @param {string} frameId
   */
  _onFrameDetached(frameId: string) {
    const frame = this._frames.get(frameId);
    if (frame)
      this._removeFramesRecursively(frame);
  }

  _onExecutionContextCreated(contextPayload) {
    const frameId = contextPayload.auxData ? contextPayload.auxData.frameId : null;
    const frame = this._frames.get(frameId) || null;
    let world = null;
    if (frame) {
      if (contextPayload.auxData && !!contextPayload.auxData['isDefault']) {
        world = frame._mainWorld;
      } else if (contextPayload.name === UTILITY_WORLD_NAME && !frame._secondaryWorld._hasContext()) {
        // In case of multiple sessions to the same target, there's a race between
        // connections so we might end up creating multiple isolated worlds.
        // We can use either.
        world = frame._secondaryWorld;
      }
    }
    if (contextPayload.auxData && contextPayload.auxData['type'] === 'isolated')
      this._isolatedWorlds.add(contextPayload.name);
    /** @type {!ExecutionContext} */
    const context = new ExecutionContext(this._client, contextPayload, world);
    if (world)
      world._setContext(context);
    this._contextIdToContext.set(contextPayload.id, context);
  }

  /**
   * @param {number} executionContextId
   */
  _onExecutionContextDestroyed(executionContextId: number) {
    const context = this._contextIdToContext.get(executionContextId);
    if (!context)
      return;
    this._contextIdToContext.delete(executionContextId);
    if (context._world)
      context._world._setContext(null);
  }

  _onExecutionContextsCleared() {
    for (const context of this._contextIdToContext.values()) {
      if (context._world)
        context._world._setContext(null);
    }
    this._contextIdToContext.clear();
  }

  /**
   * @param {number} contextId
   * @return {!ExecutionContext}
   */
  executionContextById(contextId: number): ExecutionContext {
    const context = this._contextIdToContext.get(contextId);
    assert(context, 'INTERNAL ERROR: missing context with id = ' + contextId);
    return context;
  }

  /**
   * @param {!Frame} frame
   */
  _removeFramesRecursively(frame: Frame) {
    for (const child of frame.childFrames())
      this._removeFramesRecursively(child);
    frame._detach();
    this._frames.delete(frame._id);
    this.emit(Events.FrameManager.FrameDetached, frame);
  }
}

/**
 * @unrestricted
 */
class Frame {
  _frameManager: FrameManager
  _client: CDPSession
  _parentFrame: Frame
  _url: string
  _id: string
  _detached: boolean
  _loaderId: string
  /**
   * @param {!FrameManager} frameManager
   * @param {!Puppeteer.CDPSession} client
   * @param {?Frame} parentFrame
   * @param {string} frameId
   */
  constructor(frameManager: FrameManager, client: CDPSession, parentFrame?: Frame, frameId: string) {
    this._frameManager = frameManager;
    this._client = client;
    this._parentFrame = parentFrame;
    this._url = '';
    this._id = frameId;
    this._detached = false;

    this._loaderId = '';
    /** @type {!Set<string>} */
    this._lifecycleEvents = new Set();
    /** @type {!DOMWorld} */
    this._mainWorld = new DOMWorld(frameManager, this, frameManager._timeoutSettings);
    /** @type {!DOMWorld} */
    this._secondaryWorld = new DOMWorld(frameManager, this, frameManager._timeoutSettings);

    /** @type {!Set<!Frame>} */
    this._childFrames = new Set();
    if (this._parentFrame)
      this._parentFrame._childFrames.add(this);
  }

  /**
   * @param {string} url
   * @param {!{referer?: string, timeout?: number, waitUntil?: string|!Array<string>}=} options
   * @return {!Promise<?Puppeteer.Response>}
   */
  async goto(url: string, options?: {referer?: string, timeout?: number, waitUntil?: string|Array<string>}): Promise<?Response> {
    return await this._frameManager.navigateFrame(this, url, options);
  }

  /**
   * @param {!{timeout?: number, waitUntil?: string|!Array<string>}=} options
   * @return {!Promise<?Puppeteer.Response>}
   */
  async waitForNavigation(options?: {timeout?: number, waitUntil?: string|Array<string>}): Promise<?Response> {
    return await this._frameManager.waitForFrameNavigation(this, options);
  }

  /**
   * @return {!Promise<!ExecutionContext>}
   */
  executionContext(): Promise<ExecutionContext> {
    return this._mainWorld.executionContext();
  }

  /**
   * @param {Function|string} pageFunction
   * @param {!Array<*>} args
   * @return {!Promise<!Puppeteer.JSHandle>}
   */
  async evaluateHandle(pageFunction: Function|string, ...args: Array<any>): Promise<JSHandle> {
    return this._mainWorld.evaluateHandle(pageFunction, ...args);
  }

  /**
   * @param {Function|string} pageFunction
   * @param {!Array<*>} args
   * @return {!Promise<*>}
   */
  async evaluate(pageFunction: Function|string, ...args: Array<any>): Promise<any> {
    return this._mainWorld.evaluate(pageFunction, ...args);
  }

  /**
   * @param {string} selector
   * @return {!Promise<?Puppeteer.ElementHandle>}
   */
  async $(selector: string): Promise<?ElementHandle> {
    return this._mainWorld.$(selector);
  }

  /**
   * @param {string} expression
   * @return {!Promise<!Array<!Puppeteer.ElementHandle>>}
   */
  async $x(expression: string): Promise<Array<ElementHandle>> {
    return this._mainWorld.$x(expression);
  }

  /**
   * @param {string} selector
   * @param {Function|string} pageFunction
   * @param {!Array<*>} args
   * @return {!Promise<(!Object|undefined)>}
   */
  async $eval(selector: string, pageFunction: Function|string, ...args: Array<any>): Promise<(object|undefined)> {
    return this._mainWorld.$eval(selector, pageFunction, ...args);
  }

  /**
   * @param {string} selector
   * @param {Function|string} pageFunction
   * @param {!Array<*>} args
   * @return {!Promise<(!Object|undefined)>}
   */
  async $$eval(selector: string, pageFunction: Function|string, ...args: Array<any>): Promise<(object|undefined)> {
    return this._mainWorld.$$eval(selector, pageFunction, ...args);
  }

  /**
   * @param {string} selector
   * @return {!Promise<!Array<!Puppeteer.ElementHandle>>}
   */
  async $$(selector: string): Promise<Array<ElementHandle>> {
    return this._mainWorld.$$(selector);
  }

  /**
   * @return {!Promise<String>}
   */
  async content(): Promise<String> {
    return this._secondaryWorld.content();
  }

  /**
   * @param {string} html
   * @param {!{timeout?: number, waitUntil?: string|!Array<string>}=} options
   */
  async setContent(html: string, options: {timeout?: number, waitUntil?: string|Array<string>} = {}) {
    return this._secondaryWorld.setContent(html, options);
  }

  /**
   * @return {string}
   */
  name(): string {
    return this._name || '';
  }

  /**
   * @return {string}
   */
  url(): string {
    return this._url;
  }

  /**
   * @return {?Frame}
   */
  parentFrame(): Frame | undefined {
    return this._parentFrame;
  }

  /**
   * @return {!Array.<!Frame>}
   */
  childFrames(): Array.<Frame> {
    return Array.from(this._childFrames);
  }

  /**
   * @return {boolean}
   */
  isDetached(): boolean {
    return this._detached;
  }

  /**
   * @param {!{url?: string, path?: string, content?: string, type?: string}} options
   * @return {!Promise<!Puppeteer.ElementHandle>}
   */
  async addScriptTag(options: {url?: string, path?: string, content?: string, type?: string}): Promise<ElementHandle> {
    return this._mainWorld.addScriptTag(options);
  }

  /**
   * @param {!{url?: string, path?: string, content?: string}} options
   * @return {!Promise<!Puppeteer.ElementHandle>}
   */
  async addStyleTag(options: {url?: string, path?: string, content?: string}): Promise<ElementHandle> {
    return this._mainWorld.addStyleTag(options);
  }

  /**
   * @param {string} selector
   * @param {!{delay?: number, button?: "left"|"right"|"middle", clickCount?: number}=} options
   */
  async click(selector: string, options?: {delay?: number, button?: "left"|"right"|"middle", clickCount?: number}) {
    return this._secondaryWorld.click(selector, options);
  }

  /**
   * @param {string} selector
   */
  async focus(selector: string) {
    return this._secondaryWorld.focus(selector);
  }

  /**
   * @param {string} selector
   */
  async hover(selector: string) {
    return this._secondaryWorld.hover(selector);
  }

  /**
  * @param {string} selector
  * @param {!Array<string>} values
  * @return {!Promise<!Array<string>>}
  */
  select(selector: string, ...values: Array<string>): Promise<Array<string>>{
    return this._secondaryWorld.select(selector, ...values);
  }

  /**
   * @param {string} selector
   */
  async tap(selector: string) {
    return this._secondaryWorld.tap(selector);
  }

  /**
   * @param {string} selector
   * @param {string} text
   * @param {{delay: (number|undefined)}=} options
   */
  async type(selector: string, text: string, options?: {delay: (number|undefined)}) {
    return this._mainWorld.type(selector, text, options);
  }

  /**
   * @param {(string|number|Function)} selectorOrFunctionOrTimeout
   * @param {!Object=} options
   * @param {!Array<*>} args
   * @return {!Promise<?Puppeteer.JSHandle>}
   */
  waitFor(selectorOrFunctionOrTimeout: (string|number|Function), options: object = {}, ...args: Array<any>): Promise<?JSHandle> {
    const xPathPattern = '//';

    if (helper.isString(selectorOrFunctionOrTimeout)) {
      const string = /** @type {string} */ (selectorOrFunctionOrTimeout);
      if (string.startsWith(xPathPattern))
        return this.waitForXPath(string, options);
      return this.waitForSelector(string, options);
    }
    if (helper.isNumber(selectorOrFunctionOrTimeout))
      return new Promise(fulfill => setTimeout(fulfill, /** @type {number} */ (selectorOrFunctionOrTimeout)));
    if (typeof selectorOrFunctionOrTimeout === 'function')
      return this.waitForFunction(selectorOrFunctionOrTimeout, options, ...args);
    return Promise.reject(new Error('Unsupported target type: ' + (typeof selectorOrFunctionOrTimeout)));
  }

  /**
   * @param {string} selector
   * @param {!{visible?: boolean, hidden?: boolean, timeout?: number}=} options
   * @return {!Promise<?Puppeteer.ElementHandle>}
   */
  async waitForSelector(selector: string, options?: {visible?: boolean, hidden?: boolean, timeout?: number}): Promise<?ElementHandle> {
    const handle = await this._secondaryWorld.waitForSelector(selector, options);
    if (!handle)
      return null;
    const mainExecutionContext = await this._mainWorld.executionContext();
    const result = await mainExecutionContext._adoptElementHandle(handle);
    await handle.dispose();
    return result;
  }

  /**
   * @param {string} xpath
   * @param {!{visible?: boolean, hidden?: boolean, timeout?: number}=} options
   * @return {!Promise<?Puppeteer.ElementHandle>}
   */
  async waitForXPath(xpath: string, options?: {visible?: boolean, hidden?: boolean, timeout?: number}): Promise<?ElementHandle> {
    const handle = await this._secondaryWorld.waitForXPath(xpath, options);
    if (!handle)
      return null;
    const mainExecutionContext = await this._mainWorld.executionContext();
    const result = await mainExecutionContext._adoptElementHandle(handle);
    await handle.dispose();
    return result;
  }

  /**
   * @param {Function|string} pageFunction
   * @param {!{polling?: string|number, timeout?: number}=} options
   * @return {!Promise<!Puppeteer.JSHandle>}
   */
  waitForFunction(pageFunction: Function|string, options: {polling?: string|number, timeout?: number} = {}, ...args): Promise<JSHandle> {
    return this._mainWorld.waitForFunction(pageFunction, options, ...args);
  }

  /**
   * @return {!Promise<string>}
   */
  async title(): Promise<string> {
    return this._secondaryWorld.title();
  }

  /**
   * @param {!Protocol.Page.Frame} framePayload
   */
  _navigated(framePayload: Protocol.Page.Frame) {
    this._name = framePayload.name;
    // TODO(lushnikov): remove this once requestInterception has loaderId exposed.
    this._navigationURL = framePayload.url;
    this._url = framePayload.url;
  }

  /**
   * @param {string} url
   */
  _navigatedWithinDocument(url: string) {
    this._url = url;
  }

  /**
   * @param {string} loaderId
   * @param {string} name
   */
  _onLifecycleEvent(loaderId: string, name: string) {
    if (name === 'init') {
      this._loaderId = loaderId;
      this._lifecycleEvents.clear();
    }
    this._lifecycleEvents.add(name);
  }

  _onLoadingStopped() {
    this._lifecycleEvents.add('DOMContentLoaded');
    this._lifecycleEvents.add('load');
  }

  _detach() {
    this._detached = true;
    this._mainWorld._detach();
    this._secondaryWorld._detach();
    if (this._parentFrame)
      this._parentFrame._childFrames.delete(this);
    this._parentFrame = null;
  }
}

function assertNoLegacyNavigationOptions(options) {
  assert(options['networkIdleTimeout'] === undefined, 'ERROR: networkIdleTimeout option is no longer supported.');
  assert(options['networkIdleInflight'] === undefined, 'ERROR: networkIdleInflight option is no longer supported.');
  assert(options.waitUntil !== 'networkidle', 'ERROR: "networkidle" option is no longer supported. Use "networkidle2" instead');
}

export {FrameManager, Frame};
