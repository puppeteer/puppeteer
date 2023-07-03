/**
 * Copyright 2019 Google Inc. All rights reserved.
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

import type {ClickOptions, ElementHandle} from '../api/ElementHandle.js';
import {Realm} from '../api/Frame.js';
import {KeyboardTypeOptions} from '../api/Input.js';
import {JSHandle} from '../api/JSHandle.js';
import {assert} from '../util/assert.js';
import {Deferred} from '../util/Deferred.js';

import {Binding} from './Binding.js';
import {CDPSession} from './Connection.js';
import {ExecutionContext} from './ExecutionContext.js';
import {Frame} from './Frame.js';
import {FrameManager} from './FrameManager.js';
import {MAIN_WORLD, PUPPETEER_WORLD} from './IsolatedWorlds.js';
import {LifecycleWatcher, PuppeteerLifeCycleEvent} from './LifecycleWatcher.js';
import {TimeoutSettings} from './TimeoutSettings.js';
import {
  BindingPayload,
  EvaluateFunc,
  EvaluateFuncWith,
  HandleFor,
  InnerLazyParams,
  NodeFor,
} from './types.js';
import {
  addPageBinding,
  createJSHandle,
  debugError,
  getPageContent,
  setPageContent,
  withSourcePuppeteerURLIfNone,
} from './util.js';
import {TaskManager, WaitTask} from './WaitTask.js';

/**
 * @public
 */
export interface WaitForSelectorOptions {
  /**
   * Wait for the selected element to be present in DOM and to be visible, i.e.
   * to not have `display: none` or `visibility: hidden` CSS properties.
   *
   * @defaultValue `false`
   */
  visible?: boolean;
  /**
   * Wait for the selected element to not be found in the DOM or to be hidden,
   * i.e. have `display: none` or `visibility: hidden` CSS properties.
   *
   * @defaultValue `false`
   */
  hidden?: boolean;
  /**
   * Maximum time to wait in milliseconds. Pass `0` to disable timeout.
   *
   * The default value can be changed by using {@link Page.setDefaultTimeout}
   *
   * @defaultValue `30_000` (30 seconds)
   */
  timeout?: number;
  /**
   * A signal object that allows you to cancel a waitForSelector call.
   */
  signal?: AbortSignal;
}

/**
 * @internal
 */
export interface PageBinding {
  name: string;
  pptrFunction: Function;
}

/**
 * @internal
 */
export interface IsolatedWorldChart {
  [key: string]: IsolatedWorld;
  [MAIN_WORLD]: IsolatedWorld;
  [PUPPETEER_WORLD]: IsolatedWorld;
}

/**
 * @internal
 */
export class IsolatedWorld implements Realm {
  #frame: Frame;
  #document?: ElementHandle<Document>;
  #context = Deferred.create<ExecutionContext>();
  #detached = false;

  // Set of bindings that have been registered in the current context.
  #contextBindings = new Set<string>();

  // Contains mapping from functions that should be bound to Puppeteer functions.
  #bindings = new Map<string, Binding>();
  #taskManager = new TaskManager();

  get taskManager(): TaskManager {
    return this.#taskManager;
  }

  get _bindings(): Map<string, Binding> {
    return this.#bindings;
  }

  constructor(frame: Frame) {
    // Keep own reference to client because it might differ from the FrameManager's
    // client for OOP iframes.
    this.#frame = frame;
    this.#client.on('Runtime.bindingCalled', this.#onBindingCalled);
  }

  get #client(): CDPSession {
    return this.#frame._client();
  }

  get #frameManager(): FrameManager {
    return this.#frame._frameManager;
  }

  get #timeoutSettings(): TimeoutSettings {
    return this.#frameManager.timeoutSettings;
  }

  frame(): Frame {
    return this.#frame;
  }

  clearContext(): void {
    this.#document = undefined;
    this.#context = Deferred.create();
  }

  setContext(context: ExecutionContext): void {
    this.#contextBindings.clear();
    this.#context.resolve(context);
    void this.#taskManager.rerunAll();
  }

  hasContext(): boolean {
    return this.#context.resolved();
  }

  _detach(): void {
    this.#detached = true;
    this.#client.off('Runtime.bindingCalled', this.#onBindingCalled);
    this.#taskManager.terminateAll(
      new Error('waitForFunction failed: frame got detached.')
    );
  }

  executionContext(): Promise<ExecutionContext> {
    if (this.#detached) {
      throw new Error(
        `Execution context is not available in detached frame "${this.#frame.url()}" (are you trying to evaluate?)`
      );
    }
    if (this.#context === null) {
      throw new Error(`Execution content promise is missing`);
    }
    return this.#context.valueOrThrow();
  }

  async evaluateHandle<
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
    const context = await this.executionContext();
    return context.evaluateHandle(pageFunction, ...args);
  }

  async evaluate<
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
    const context = await this.executionContext();
    return context.evaluate(pageFunction, ...args);
  }

  async $<Selector extends string>(
    selector: Selector
  ): Promise<ElementHandle<NodeFor<Selector>> | null> {
    const document = await this.document();
    return document.$(selector);
  }

  async $$<Selector extends string>(
    selector: Selector
  ): Promise<Array<ElementHandle<NodeFor<Selector>>>> {
    const document = await this.document();
    return document.$$(selector);
  }

  async document(): Promise<ElementHandle<Document>> {
    if (this.#document) {
      return this.#document;
    }
    const context = await this.executionContext();
    this.#document = await context.evaluateHandle(() => {
      return document;
    });
    return this.#document;
  }

  async $x(expression: string): Promise<Array<ElementHandle<Node>>> {
    const document = await this.document();
    return document.$x(expression);
  }

  async $eval<
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
    const document = await this.document();
    return document.$eval(selector, pageFunction, ...args);
  }

  async $$eval<
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
    const document = await this.document();
    return document.$$eval(selector, pageFunction, ...args);
  }

  async content(): Promise<string> {
    return await this.evaluate(getPageContent);
  }

  async setContent(
    html: string,
    options: {
      timeout?: number;
      waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
    } = {}
  ): Promise<void> {
    const {
      waitUntil = ['load'],
      timeout = this.#timeoutSettings.navigationTimeout(),
    } = options;

    await setPageContent(this, html);

    const watcher = new LifecycleWatcher(
      this.#frameManager,
      this.#frame,
      waitUntil,
      timeout
    );
    const error = await Deferred.race<void | Error | undefined>([
      watcher.terminationPromise(),
      watcher.lifecyclePromise(),
    ]);
    watcher.dispose();
    if (error) {
      throw error;
    }
  }

  async click(
    selector: string,
    options?: Readonly<ClickOptions>
  ): Promise<void> {
    const handle = await this.$(selector);
    assert(handle, `No element found for selector: ${selector}`);
    await handle.click(options);
    await handle.dispose();
  }

  async focus(selector: string): Promise<void> {
    const handle = await this.$(selector);
    assert(handle, `No element found for selector: ${selector}`);
    await handle.focus();
    await handle.dispose();
  }

  async hover(selector: string): Promise<void> {
    const handle = await this.$(selector);
    assert(handle, `No element found for selector: ${selector}`);
    await handle.hover();
    await handle.dispose();
  }

  async select(selector: string, ...values: string[]): Promise<string[]> {
    const handle = await this.$(selector);
    assert(handle, `No element found for selector: ${selector}`);
    const result = await handle.select(...values);
    await handle.dispose();
    return result;
  }

  async tap(selector: string): Promise<void> {
    const handle = await this.$(selector);
    assert(handle, `No element found for selector: ${selector}`);
    await handle.tap();
    await handle.dispose();
  }

  async type(
    selector: string,
    text: string,
    options?: Readonly<KeyboardTypeOptions>
  ): Promise<void> {
    const handle = await this.$(selector);
    assert(handle, `No element found for selector: ${selector}`);
    await handle.type(text, options);
    await handle.dispose();
  }

  // If multiple waitFor are set up asynchronously, we need to wait for the
  // first one to set up the binding in the page before running the others.
  #mutex = new Mutex();
  async _addBindingToContext(
    context: ExecutionContext,
    name: string
  ): Promise<void> {
    if (this.#contextBindings.has(name)) {
      return;
    }

    await this.#mutex.acquire();
    try {
      await context._client.send(
        'Runtime.addBinding',
        context._contextName
          ? {
              name,
              executionContextName: context._contextName,
            }
          : {
              name,
              executionContextId: context._contextId,
            }
      );

      await context.evaluate(addPageBinding, 'internal', name);

      this.#contextBindings.add(name);
    } catch (error) {
      // We could have tried to evaluate in a context which was already
      // destroyed. This happens, for example, if the page is navigated while
      // we are trying to add the binding
      if (error instanceof Error) {
        // Destroyed context.
        if (error.message.includes('Execution context was destroyed')) {
          return;
        }
        // Missing context.
        if (error.message.includes('Cannot find context with specified id')) {
          return;
        }
      }

      debugError(error);
    } finally {
      this.#mutex.release();
    }
  }

  #onBindingCalled = async (
    event: Protocol.Runtime.BindingCalledEvent
  ): Promise<void> => {
    let payload: BindingPayload;
    try {
      payload = JSON.parse(event.payload);
    } catch {
      // The binding was either called by something in the page or it was
      // called before our wrapper was initialized.
      return;
    }
    const {type, name, seq, args, isTrivial} = payload;
    if (type !== 'internal') {
      return;
    }
    if (!this.#contextBindings.has(name)) {
      return;
    }

    try {
      const context = await this.#context.valueOrThrow();
      if (event.executionContextId !== context._contextId) {
        return;
      }

      const binding = this._bindings.get(name);
      await binding?.run(context, seq, args, isTrivial);
    } catch (err) {
      debugError(err);
    }
  };

  waitForFunction<
    Params extends unknown[],
    Func extends EvaluateFunc<InnerLazyParams<Params>> = EvaluateFunc<
      InnerLazyParams<Params>
    >
  >(
    pageFunction: Func | string,
    options: {
      polling?: 'raf' | 'mutation' | number;
      timeout?: number;
      root?: ElementHandle<Node>;
      signal?: AbortSignal;
    } = {},
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>> {
    const {
      polling = 'raf',
      timeout = this.#timeoutSettings.timeout(),
      root,
      signal,
    } = options;
    if (typeof polling === 'number' && polling < 0) {
      throw new Error('Cannot poll with non-positive interval');
    }
    const waitTask = new WaitTask(
      this,
      {
        polling,
        root,
        timeout,
        signal,
      },
      pageFunction as unknown as
        | ((...args: unknown[]) => Promise<Awaited<ReturnType<Func>>>)
        | string,
      ...args
    );
    return waitTask.result;
  }

  async title(): Promise<string> {
    return this.evaluate(() => {
      return document.title;
    });
  }

  async adoptBackendNode(
    backendNodeId?: Protocol.DOM.BackendNodeId
  ): Promise<JSHandle<Node>> {
    const executionContext = await this.executionContext();
    const {object} = await this.#client.send('DOM.resolveNode', {
      backendNodeId: backendNodeId,
      executionContextId: executionContext._contextId,
    });
    return createJSHandle(executionContext, object) as JSHandle<Node>;
  }

  async adoptHandle<T extends JSHandle<Node>>(handle: T): Promise<T> {
    const context = await this.executionContext();
    assert(
      handle.executionContext() !== context,
      'Cannot adopt handle that already belongs to this execution context'
    );
    const nodeInfo = await this.#client.send('DOM.describeNode', {
      objectId: handle.id,
    });
    return (await this.adoptBackendNode(nodeInfo.node.backendNodeId)) as T;
  }

  async transferHandle<T extends JSHandle<Node>>(handle: T): Promise<T> {
    const context = await this.executionContext();
    if (handle.executionContext() === context) {
      return handle;
    }
    const info = await this.#client.send('DOM.describeNode', {
      objectId: handle.remoteObject().objectId,
    });
    const newHandle = (await this.adoptBackendNode(
      info.node.backendNodeId
    )) as T;
    await handle.dispose();
    return newHandle;
  }
}

class Mutex {
  #locked = false;
  #acquirers: Array<() => void> = [];

  // This is FIFO.
  acquire(): Promise<void> {
    if (!this.#locked) {
      this.#locked = true;
      return Promise.resolve();
    }
    const deferred = Deferred.create<void>();
    this.#acquirers.push(deferred.resolve.bind(deferred));
    return deferred.valueOrThrow();
  }

  release(): void {
    const resolve = this.#acquirers.shift();
    if (!resolve) {
      this.#locked = false;
      return;
    }
    resolve();
  }
}
