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
import {source as injectedSource} from '../generated/injected.js';
import {assert} from '../util/assert.js';
import {createDeferredPromise} from '../util/DeferredPromise.js';
import {isErrorLike} from '../util/ErrorLike.js';
import {CDPSession} from './Connection.js';
import {ExecutionContext} from './ExecutionContext.js';
import {Frame} from './Frame.js';
import {FrameManager} from './FrameManager.js';
import {MouseButton} from './Input.js';
import {JSHandle} from './JSHandle.js';
import {LazyArg} from './LazyArg.js';
import {LifecycleWatcher, PuppeteerLifeCycleEvent} from './LifecycleWatcher.js';
import {TimeoutSettings} from './TimeoutSettings.js';
import {EvaluateFunc, HandleFor, InnerLazyParams, NodeFor} from './types.js';
import {createJSHandle, debugError, pageBindingInitString} from './util.js';
import {TaskManager, WaitTask} from './WaitTask.js';
import {MAIN_WORLD, PUPPETEER_WORLD} from './IsolatedWorlds.js';

import type PuppeteerUtil from '../injected/injected.js';
import type {ElementHandle} from './ElementHandle.js';

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
   * @defaultValue `30000` (30 seconds)
   */
  timeout?: number;
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
export class IsolatedWorld {
  #frame: Frame;
  #document?: ElementHandle<Document>;
  #context = createDeferredPromise<ExecutionContext>();
  #detached = false;

  // Set of bindings that have been registered in the current context.
  #ctxBindings = new Set<string>();

  // Contains mapping from functions that should be bound to Puppeteer functions.
  #boundFunctions = new Map<string, Function>();
  #taskManager = new TaskManager();
  #puppeteerUtil = createDeferredPromise<JSHandle<PuppeteerUtil>>();

  get puppeteerUtil(): Promise<JSHandle<PuppeteerUtil>> {
    return this.#puppeteerUtil;
  }

  get taskManager(): TaskManager {
    return this.#taskManager;
  }

  get _boundFunctions(): Map<string, Function> {
    return this.#boundFunctions;
  }

  static #bindingIdentifier = (name: string, contextId: number) => {
    return `${name}_${contextId}`;
  };

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
    this.#puppeteerUtil = createDeferredPromise();
    this.#context = createDeferredPromise();
  }

  setContext(context: ExecutionContext): void {
    this.#injectPuppeteerUtil(context);
    this.#ctxBindings.clear();
    this.#context.resolve(context);
  }

  async #injectPuppeteerUtil(context: ExecutionContext): Promise<void> {
    try {
      this.#puppeteerUtil.resolve(
        (await context.evaluateHandle(
          `(() => {
              const module = {};
              ${injectedSource}
              return module.exports.default;
            })()`
        )) as JSHandle<PuppeteerUtil>
      );
      this.#taskManager.rerunAll();
    } catch (error: unknown) {
      debugError(error);
    }
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
    return this.#context;
  }

  async evaluateHandle<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>> {
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
    Func extends EvaluateFunc<
      [ElementHandle<NodeFor<Selector>>, ...Params]
    > = EvaluateFunc<[ElementHandle<NodeFor<Selector>>, ...Params]>
  >(
    selector: Selector,
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>> {
    const document = await this.document();
    return document.$eval(selector, pageFunction, ...args);
  }

  async $$eval<
    Selector extends string,
    Params extends unknown[],
    Func extends EvaluateFunc<
      [Array<NodeFor<Selector>>, ...Params]
    > = EvaluateFunc<[Array<NodeFor<Selector>>, ...Params]>
  >(
    selector: Selector,
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>> {
    const document = await this.document();
    return document.$$eval(selector, pageFunction, ...args);
  }

  async content(): Promise<string> {
    return await this.evaluate(() => {
      let retVal = '';
      if (document.doctype) {
        retVal = new XMLSerializer().serializeToString(document.doctype);
      }
      if (document.documentElement) {
        retVal += document.documentElement.outerHTML;
      }
      return retVal;
    });
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
    // We rely upon the fact that document.open() will reset frame lifecycle with "init"
    // lifecycle event. @see https://crrev.com/608658
    await this.evaluate(html => {
      document.open();
      document.write(html);
      document.close();
    }, html);
    const watcher = new LifecycleWatcher(
      this.#frameManager,
      this.#frame,
      waitUntil,
      timeout
    );
    const error = await Promise.race([
      watcher.timeoutOrTerminationPromise(),
      watcher.lifecyclePromise(),
    ]);
    watcher.dispose();
    if (error) {
      throw error;
    }
  }

  async click(
    selector: string,
    options: {delay?: number; button?: MouseButton; clickCount?: number}
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
    options?: {delay: number}
  ): Promise<void> {
    const handle = await this.$(selector);
    assert(handle, `No element found for selector: ${selector}`);
    await handle.type(text, options);
    await handle.dispose();
  }

  // If multiple waitFor are set up asynchronously, we need to wait for the
  // first one to set up the binding in the page before running the others.
  #settingUpBinding: Promise<void> | null = null;

  async _addBindingToContext(
    context: ExecutionContext,
    name: string
  ): Promise<void> {
    // Previous operation added the binding so we are done.
    if (
      this.#ctxBindings.has(
        IsolatedWorld.#bindingIdentifier(name, context._contextId)
      )
    ) {
      return;
    }
    // Wait for other operation to finish
    if (this.#settingUpBinding) {
      await this.#settingUpBinding;
      return this._addBindingToContext(context, name);
    }

    const bind = async (name: string) => {
      const expression = pageBindingInitString('internal', name);
      try {
        // TODO: In theory, it would be enough to call this just once
        await context._client.send('Runtime.addBinding', {
          name,
          executionContextName: context._contextName,
        });
        await context.evaluate(expression);
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
        return;
      }
      this.#ctxBindings.add(
        IsolatedWorld.#bindingIdentifier(name, context._contextId)
      );
    };

    this.#settingUpBinding = bind(name);
    await this.#settingUpBinding;
    this.#settingUpBinding = null;
  }

  #onBindingCalled = async (
    event: Protocol.Runtime.BindingCalledEvent
  ): Promise<void> => {
    let payload: {type: string; name: string; seq: number; args: unknown[]};
    if (!this.hasContext()) {
      return;
    }
    const context = await this.executionContext();
    try {
      payload = JSON.parse(event.payload);
    } catch {
      // The binding was either called by something in the page or it was
      // called before our wrapper was initialized.
      return;
    }
    const {type, name, seq, args} = payload;
    if (
      type !== 'internal' ||
      !this.#ctxBindings.has(
        IsolatedWorld.#bindingIdentifier(name, context._contextId)
      )
    ) {
      return;
    }
    if (context._contextId !== event.executionContextId) {
      return;
    }
    try {
      const fn = this._boundFunctions.get(name);
      if (!fn) {
        throw new Error(`Bound function $name is not found`);
      }
      const result = await fn(...args);
      await context.evaluate(
        (name: string, seq: number, result: unknown) => {
          // @ts-expect-error Code is evaluated in a different context.
          const callbacks = self[name].callbacks;
          callbacks.get(seq).resolve(result);
          callbacks.delete(seq);
        },
        name,
        seq,
        result
      );
    } catch (error) {
      // The WaitTask may already have been resolved by timing out, or the
      // execution context may have been destroyed.
      // In both caes, the promises above are rejected with a protocol error.
      // We can safely ignores these, as the WaitTask is re-installed in
      // the next execution context if needed.
      if ((error as Error).message.includes('Protocol error')) {
        return;
      }
      debugError(error);
    }
  };

  async _waitForSelectorInPage(
    queryOne: Function,
    root: ElementHandle<Node> | undefined,
    selector: string,
    options: WaitForSelectorOptions,
    bindings = new Map<string, (...args: never[]) => unknown>()
  ): Promise<JSHandle<unknown> | null> {
    const {
      visible: waitForVisible = false,
      hidden: waitForHidden = false,
      timeout = this.#timeoutSettings.timeout(),
    } = options;

    try {
      const handle = await this.waitForFunction(
        async (PuppeteerUtil, query, selector, root, visible) => {
          if (!PuppeteerUtil) {
            return;
          }
          const node = (await PuppeteerUtil.createFunction(query)(
            root || document,
            selector,
            PuppeteerUtil
          )) as Node | null;
          return PuppeteerUtil.checkVisibility(node, visible);
        },
        {
          bindings,
          polling: waitForVisible || waitForHidden ? 'raf' : 'mutation',
          root,
          timeout,
        },
        new LazyArg(async () => {
          try {
            // In case CDP fails.
            return await this.puppeteerUtil;
          } catch {
            return undefined;
          }
        }),
        queryOne.toString(),
        selector,
        root,
        waitForVisible ? true : waitForHidden ? false : undefined
      );
      const elementHandle = handle.asElement();
      if (!elementHandle) {
        await handle.dispose();
        return null;
      }
      return elementHandle;
    } catch (error) {
      if (!isErrorLike(error)) {
        throw error;
      }
      error.message = `Waiting for selector \`${selector}\` failed: ${error.message}`;
      throw error;
    }
  }

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
      bindings?: Map<string, (...args: never[]) => unknown>;
    } = {},
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>> {
    const {
      polling = 'raf',
      timeout = this.#timeoutSettings.timeout(),
      bindings,
      root,
    } = options;
    if (typeof polling === 'number' && polling < 0) {
      throw new Error('Cannot poll with non-positive interval');
    }
    const waitTask = new WaitTask(
      this,
      {
        bindings,
        polling,
        root,
        timeout,
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
    const executionContext = await this.executionContext();
    assert(
      handle.executionContext() !== executionContext,
      'Cannot adopt handle that already belongs to this execution context'
    );
    const nodeInfo = await this.#client.send('DOM.describeNode', {
      objectId: handle.remoteObject().objectId,
    });
    return (await this.adoptBackendNode(nodeInfo.node.backendNodeId)) as T;
  }

  async transferHandle<T extends JSHandle<Node>>(handle: T): Promise<T> {
    const result = await this.adoptHandle(handle);
    await handle.dispose();
    return result;
  }
}
