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
import {
  Frame as BaseFrame,
  FrameAddScriptTagOptions,
  FrameAddStyleTagOptions,
} from '../api/Frame.js';
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
import {IsolatedWorld, IsolatedWorldChart} from './IsolatedWorld.js';
import {MAIN_WORLD, PUPPETEER_WORLD} from './IsolatedWorlds.js';
import {LazyArg} from './LazyArg.js';
import {LifecycleWatcher, PuppeteerLifeCycleEvent} from './LifecycleWatcher.js';
import {EvaluateFunc, EvaluateFuncWith, HandleFor, NodeFor} from './types.js';
import {importFSPromises, withSourcePuppeteerURLIfNone} from './util.js';

/**
 * @internal
 */
export class Frame extends BaseFrame {
  #url = '';
  #detached = false;
  #client!: CDPSession;

  override worlds!: IsolatedWorldChart;
  _frameManager: FrameManager;
  override _id: string;
  _loaderId = '';
  override _name?: string;
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
  }

  updateClient(client: CDPSession): void {
    this.#client = client;
    this.worlds = {
      [MAIN_WORLD]: new IsolatedWorld(this),
      [PUPPETEER_WORLD]: new IsolatedWorld(this),
    };
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
      this._frameManager,
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
      this._frameManager,
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
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
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
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
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
    >
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
    > = EvaluateFuncWith<Array<NodeFor<Selector>>, Params>
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

  override async addScriptTag(
    options: FrameAddScriptTagOptions
  ): Promise<ElementHandle<HTMLScriptElement>> {
    let {content = '', type} = options;
    const {path} = options;
    if (+!!options.url + +!!path + +!!content !== 1) {
      throw new Error(
        'Exactly one of `url`, `path`, or `content` must be specified.'
      );
    }

    if (path) {
      const fs = await importFSPromises();
      content = await fs.readFile(path, 'utf8');
      content += `//# sourceURL=${path.replace(/\n/g, '')}`;
    }

    type = type ?? 'text/javascript';

    return this.mainRealm().transferHandle(
      await this.isolatedRealm().evaluateHandle(
        async ({Deferred}, {url, id, type, content}) => {
          const deferred = Deferred.create<void>();
          const script = document.createElement('script');
          script.type = type;
          script.text = content;
          if (url) {
            script.src = url;
            script.addEventListener(
              'load',
              () => {
                return deferred.resolve();
              },
              {once: true}
            );
            script.addEventListener(
              'error',
              event => {
                deferred.reject(
                  new Error(event.message ?? 'Could not load script')
                );
              },
              {once: true}
            );
          } else {
            deferred.resolve();
          }
          if (id) {
            script.id = id;
          }
          document.head.appendChild(script);
          await deferred.valueOrThrow();
          return script;
        },
        LazyArg.create(context => {
          return context.puppeteerUtil;
        }),
        {...options, type, content}
      )
    );
  }

  override async addStyleTag(
    options: Omit<FrameAddStyleTagOptions, 'url'>
  ): Promise<ElementHandle<HTMLStyleElement>>;
  override async addStyleTag(
    options: FrameAddStyleTagOptions
  ): Promise<ElementHandle<HTMLLinkElement>>;
  override async addStyleTag(
    options: FrameAddStyleTagOptions
  ): Promise<ElementHandle<HTMLStyleElement | HTMLLinkElement>> {
    let {content = ''} = options;
    const {path} = options;
    if (+!!options.url + +!!path + +!!content !== 1) {
      throw new Error(
        'Exactly one of `url`, `path`, or `content` must be specified.'
      );
    }

    if (path) {
      const fs = await importFSPromises();

      content = await fs.readFile(path, 'utf8');
      content += '/*# sourceURL=' + path.replace(/\n/g, '') + '*/';
      options.content = content;
    }

    return this.mainRealm().transferHandle(
      await this.isolatedRealm().evaluateHandle(
        async ({Deferred}, {url, content}) => {
          const deferred = Deferred.create<void>();
          let element: HTMLStyleElement | HTMLLinkElement;
          if (!url) {
            element = document.createElement('style');
            element.appendChild(document.createTextNode(content!));
          } else {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            element = link;
          }
          element.addEventListener(
            'load',
            () => {
              deferred.resolve();
            },
            {once: true}
          );
          element.addEventListener(
            'error',
            event => {
              deferred.reject(
                new Error(
                  (event as ErrorEvent).message ?? 'Could not load style'
                )
              );
            },
            {once: true}
          );
          document.head.appendChild(element);
          await deferred.valueOrThrow();
          return element;
        },
        LazyArg.create(context => {
          return context.puppeteerUtil;
        }),
        options
      )
    );
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
