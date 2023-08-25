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

import {Protocol} from 'devtools-protocol';

import {ElementHandle} from '../api/ElementHandle.js';
import {Frame as BaseFrame} from '../api/Frame.js';
import {HTTPResponse} from '../api/HTTPResponse.js';
import {Page, WaitTimeoutOptions} from '../api/Page.js';
import {assert} from '../util/assert.js';
import {Deferred} from '../util/Deferred.js';
import {isErrorLike} from '../util/ErrorLike.js';

import {CDPSession} from './Connection.js';
import {
  DeviceRequestPrompt,
  DeviceRequestPromptManager,
} from './DeviceRequestPrompt.js';
import {ExecutionContext} from './ExecutionContext.js';
import {FrameManager} from './FrameManager.js';
import {IsolatedWorld} from './IsolatedWorld.js';
import {MAIN_WORLD, PUPPETEER_WORLD} from './IsolatedWorlds.js';
import {LifecycleWatcher, PuppeteerLifeCycleEvent} from './LifecycleWatcher.js';
import {EvaluateFunc, EvaluateFuncWith, HandleFor, NodeFor} from './types.js';
import {withSourcePuppeteerURLIfNone} from './util.js';

/**
 * We use symbols to prevent external parties listening to these events.
 * They are internal to Puppeteer.
 *
 * @internal
 */
export const FrameEmittedEvents = {
  FrameNavigated: Symbol('Frame.FrameNavigated'),
  FrameSwapped: Symbol('Frame.FrameSwapped'),
  LifecycleEvent: Symbol('Frame.LifecycleEvent'),
  FrameNavigatedWithinDocument: Symbol('Frame.FrameNavigatedWithinDocument'),
  FrameDetached: Symbol('Frame.FrameDetached'),
  FrameSwappedByActivation: Symbol('Frame.FrameSwappedByActivation'),
};

/**
 * @internal
 */
export class Frame extends BaseFrame {
  #url = '';
  #detached = false;
  #client!: CDPSession;

  _frameManager: FrameManager;
  override _id: string;
  _loaderId = '';
  override _hasStartedLoading = false;
  _lifecycleEvents = new Set<string>();
  override _parentId?: string;

  constructor(
    frameManager: FrameManager,
    frameId: string,
    parentFrameId: string | undefined,
    client: CDPSession
  ) {
    super();
    this._frameManager = frameManager;
    this.#url = '';
    this._id = frameId;
    this._parentId = parentFrameId;
    this.#detached = false;

    this._loaderId = '';

    this.updateClient(client);

    this.on(FrameEmittedEvents.FrameSwappedByActivation, () => {
      // Emulate loading process for swapped frames.
      this._onLoadingStarted();
      this._onLoadingStopped();
    });
  }

  /**
   * Updates the frame ID with the new ID. This happens when the main frame is
   * replaced by a different frame.
   */
  updateId(id: string): void {
    this._id = id;
  }

  updateClient(client: CDPSession, keepWorlds = false): void {
    this.#client = client;
    if (!keepWorlds) {
      this.worlds = {
        [MAIN_WORLD]: new IsolatedWorld(this),
        [PUPPETEER_WORLD]: new IsolatedWorld(this),
      };
    } else {
      this.worlds[MAIN_WORLD].frameUpdated();
      this.worlds[PUPPETEER_WORLD].frameUpdated();
    }
  }

  override page(): Page {
    return this._frameManager.page();
  }

  override isOOPFrame(): boolean {
    return this.#client !== this._frameManager.client;
  }

  override async goto(
    url: string,
    options: {
      referer?: string;
      referrerPolicy?: string;
      timeout?: number;
      waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
    } = {}
  ): Promise<HTTPResponse | null> {
    const {
      referer = this._frameManager.networkManager.extraHTTPHeaders()['referer'],
      referrerPolicy = this._frameManager.networkManager.extraHTTPHeaders()[
        'referer-policy'
      ],
      waitUntil = ['load'],
      timeout = this._frameManager.timeoutSettings.navigationTimeout(),
    } = options;

    let ensureNewDocumentNavigation = false;
    const watcher = new LifecycleWatcher(
      this._frameManager.networkManager,
      this,
      waitUntil,
      timeout
    );
    let error = await Deferred.race([
      navigate(
        this.#client,
        url,
        referer,
        referrerPolicy as Protocol.Page.ReferrerPolicy,
        this._id
      ),
      watcher.terminationPromise(),
    ]);
    if (!error) {
      error = await Deferred.race([
        watcher.terminationPromise(),
        ensureNewDocumentNavigation
          ? watcher.newDocumentNavigationPromise()
          : watcher.sameDocumentNavigationPromise(),
      ]);
    }

    try {
      if (error) {
        throw error;
      }
      return await watcher.navigationResponse();
    } finally {
      watcher.dispose();
    }

    async function navigate(
      client: CDPSession,
      url: string,
      referrer: string | undefined,
      referrerPolicy: Protocol.Page.ReferrerPolicy | undefined,
      frameId: string
    ): Promise<Error | null> {
      try {
        const response = await client.send('Page.navigate', {
          url,
          referrer,
          frameId,
          referrerPolicy,
        });
        ensureNewDocumentNavigation = !!response.loaderId;
        if (response.errorText === 'net::ERR_HTTP_RESPONSE_CODE_FAILURE') {
          return null;
        }
        return response.errorText
          ? new Error(`${response.errorText} at ${url}`)
          : null;
      } catch (error) {
        if (isErrorLike(error)) {
          return error;
        }
        throw error;
      }
    }
  }

  override async waitForNavigation(
    options: {
      timeout?: number;
      waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
    } = {}
  ): Promise<HTTPResponse | null> {
    const {
      waitUntil = ['load'],
      timeout = this._frameManager.timeoutSettings.navigationTimeout(),
    } = options;
    const watcher = new LifecycleWatcher(
      this._frameManager.networkManager,
      this,
      waitUntil,
      timeout
    );
    const error = await Deferred.race([
      watcher.terminationPromise(),
      watcher.sameDocumentNavigationPromise(),
      watcher.newDocumentNavigationPromise(),
    ]);
    try {
      if (error) {
        throw error;
      }
      return await watcher.navigationResponse();
    } finally {
      watcher.dispose();
    }
  }

  override _client(): CDPSession {
    return this.#client;
  }

  override executionContext(): Promise<ExecutionContext> {
    return this.worlds[MAIN_WORLD].executionContext();
  }

  /**
   * @internal
   */
  override mainRealm(): IsolatedWorld {
    return this.worlds[MAIN_WORLD];
  }

  /**
   * @internal
   */
  override isolatedRealm(): IsolatedWorld {
    return this.worlds[PUPPETEER_WORLD];
  }

  override async evaluateHandle<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>,
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>> {
    pageFunction = withSourcePuppeteerURLIfNone(
      this.evaluateHandle.name,
      pageFunction
    );
    return this.mainRealm().evaluateHandle(pageFunction, ...args);
  }

  override async evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>,
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>> {
    pageFunction = withSourcePuppeteerURLIfNone(
      this.evaluate.name,
      pageFunction
    );
    return this.mainRealm().evaluate(pageFunction, ...args);
  }

  override async $<Selector extends string>(
    selector: Selector
  ): Promise<ElementHandle<NodeFor<Selector>> | null> {
    return this.mainRealm().$(selector);
  }

  override async $$<Selector extends string>(
    selector: Selector
  ): Promise<Array<ElementHandle<NodeFor<Selector>>>> {
    return this.mainRealm().$$(selector);
  }

  override async $eval<
    Selector extends string,
    Params extends unknown[],
    Func extends EvaluateFuncWith<NodeFor<Selector>, Params> = EvaluateFuncWith<
      NodeFor<Selector>,
      Params
    >,
  >(
    selector: Selector,
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>> {
    pageFunction = withSourcePuppeteerURLIfNone(this.$eval.name, pageFunction);
    return this.mainRealm().$eval(selector, pageFunction, ...args);
  }

  override async $$eval<
    Selector extends string,
    Params extends unknown[],
    Func extends EvaluateFuncWith<
      Array<NodeFor<Selector>>,
      Params
    > = EvaluateFuncWith<Array<NodeFor<Selector>>, Params>,
  >(
    selector: Selector,
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>> {
    pageFunction = withSourcePuppeteerURLIfNone(this.$$eval.name, pageFunction);
    return this.mainRealm().$$eval(selector, pageFunction, ...args);
  }

  override async $x(expression: string): Promise<Array<ElementHandle<Node>>> {
    return this.mainRealm().$x(expression);
  }

  override async content(): Promise<string> {
    return this.isolatedRealm().content();
  }

  override async setContent(
    html: string,
    options: {
      timeout?: number;
      waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
    } = {}
  ): Promise<void> {
    return this.isolatedRealm().setContent(html, options);
  }

  override name(): string {
    return this._name || '';
  }

  override url(): string {
    return this.#url;
  }

  override parentFrame(): Frame | null {
    return this._frameManager._frameTree.parentFrame(this._id) || null;
  }

  override childFrames(): Frame[] {
    return this._frameManager._frameTree.childFrames(this._id);
  }

  override isDetached(): boolean {
    return this.#detached;
  }

  override async title(): Promise<string> {
    return this.isolatedRealm().title();
  }

  _deviceRequestPromptManager(): DeviceRequestPromptManager {
    if (this.isOOPFrame()) {
      return this._frameManager._deviceRequestPromptManager(this.#client);
    }
    const parentFrame = this.parentFrame();
    assert(parentFrame !== null);
    return parentFrame._deviceRequestPromptManager();
  }

  override waitForDevicePrompt(
    options: WaitTimeoutOptions = {}
  ): Promise<DeviceRequestPrompt> {
    return this._deviceRequestPromptManager().waitForDevicePrompt(options);
  }

  _navigated(framePayload: Protocol.Page.Frame): void {
    this._name = framePayload.name;
    this.#url = `${framePayload.url}${framePayload.urlFragment || ''}`;
  }

  _navigatedWithinDocument(url: string): void {
    this.#url = url;
  }

  _onLifecycleEvent(loaderId: string, name: string): void {
    if (name === 'init') {
      this._loaderId = loaderId;
      this._lifecycleEvents.clear();
    }
    this._lifecycleEvents.add(name);
  }

  _onLoadingStopped(): void {
    this._lifecycleEvents.add('DOMContentLoaded');
    this._lifecycleEvents.add('load');
  }

  _onLoadingStarted(): void {
    this._hasStartedLoading = true;
  }

  _detach(): void {
    this.#detached = true;
    this.worlds[MAIN_WORLD]._detach();
    this.worlds[PUPPETEER_WORLD]._detach();
  }
}
