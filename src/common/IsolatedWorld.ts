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
import {injectedSourceCode} from '../generated/injected.js';
import {assert} from '../util/assert.js';
import {
  createDeferredPromise,
  DeferredPromise,
} from '../util/DeferredPromise.js';
import {ariaQuerySelector} from './ariaQuerySelector.js';
import {CDPSession} from './Connection.js';
import {ElementHandle} from './ElementHandle.js';
import {ExecutionContext} from './ExecutionContext.js';
import {Frame} from './Frame.js';
import {FrameManager} from './FrameManager.js';
import {MouseButton} from './Input.js';
import {JSHandle} from './JSHandle.js';
import {LifecycleWatcher, PuppeteerLifeCycleEvent} from './LifecycleWatcher.js';
import {TimeoutSettings} from './TimeoutSettings.js';
import {EvaluateFunc, HandleFor, NodeFor} from './types.js';
import {
  createJSHandle,
  debugError,
  importFS,
  pageBindingInitString,
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
 * A unique key for {@link IsolatedWorldChart} to denote the default world.
 * Execution contexts are automatically created in the default world.
 *
 * @internal
 */
export const MAIN_WORLD = Symbol('mainWorld');
/**
 * A unique key for {@link IsolatedWorldChart} to denote the puppeteer world.
 * This world contains all puppeteer-internal bindings/code.
 *
 * @internal
 */
export const PUPPETEER_WORLD = Symbol('puppeteerWorld');
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
  #frameManager: FrameManager;
  #client: CDPSession;
  #frame: Frame;
  #timeoutSettings: TimeoutSettings;
  #injected: boolean;
  #documentPromise: Promise<ElementHandle<Document>> | null = null;
  #contextPromise: DeferredPromise<ExecutionContext> = createDeferredPromise();
  #detached = false;

  // Map of bindings that have been registered in the current context.
  #bindings = new Map<string, Function>();

  #taskManager = new TaskManager();

  get timeoutSettings(): TimeoutSettings {
    return this.#timeoutSettings;
  }

  /**
   * @param injected - Whether to inject Puppeteer code or not.
   */
  constructor(
    client: CDPSession,
    frameManager: FrameManager,
    frame: Frame,
    timeoutSettings: TimeoutSettings,
    injected = false
  ) {
    // Keep own reference to client because it might differ from the FrameManager's
    // client for OOP iframes.
    this.#client = client;
    this.#frameManager = frameManager;
    this.#frame = frame;
    this.#timeoutSettings = timeoutSettings;
    this.#injected = injected;

    this.#client.on('Runtime.bindingCalled', this.#onBindingCalled);
  }

  frame(): Frame {
    return this.#frame;
  }

  clearContext(): void {
    this.#documentPromise = null;
    this.#contextPromise = createDeferredPromise();
  }

  async setContext(context: ExecutionContext): Promise<void> {
    assert(
      this.#contextPromise,
      `ExecutionContext ${context._contextId} has already been set.`
    );
    this.#bindings.clear();
    if (this.#injected) {
      this.#addBinding(context, ariaQuerySelector);
      await context.evaluate(injectedSourceCode);
    }
    this.#contextPromise.resolve(context);
    this.#taskManager.rerunAll();
  }

  hasContext(): boolean {
    return this.#contextPromise.resolved();
  }

  _detach(): void {
    this.#detached = true;
    this.#client.off('Runtime.bindingCalled', this.#onBindingCalled);
    this.#taskManager.terminateAll(new Error('Waiting failed: Frame detached'));
  }

  executionContext(): Promise<ExecutionContext> {
    if (this.#detached) {
      throw new Error(
        `Execution context is not available in detached frame "${this.#frame.url()}" (are you trying to evaluate?)`
      );
    }
    return this.#contextPromise;
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
    if (this.#documentPromise) {
      return this.#documentPromise;
    }
    this.#documentPromise = this.executionContext().then(async context => {
      return await context.evaluateHandle(() => {
        return document;
      });
    });
    return this.#documentPromise;
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

  async waitForSelector<Selector extends string>(
    selector: Selector,
    options: WaitForSelectorOptions
  ): Promise<ElementHandle<NodeFor<Selector>> | null> {
    const document = await this.document();
    return document.waitForSelector(selector, options);
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

  /**
   * Adds a script tag into the current context.
   *
   * @remarks
   * You can pass a URL, filepath or string of contents. Note that when running Puppeteer
   * in a browser environment you cannot pass a filepath and should use either
   * `url` or `content`.
   */
  async addScriptTag(options: {
    url?: string;
    path?: string;
    content?: string;
    id?: string;
    type?: string;
  }): Promise<ElementHandle<HTMLScriptElement>> {
    const {
      url = null,
      path = null,
      content = null,
      id = '',
      type = '',
    } = options;
    if (url !== null) {
      try {
        const context = await this.executionContext();
        return await context.evaluateHandle(addScriptUrl, url, id, type);
      } catch (error) {
        throw new Error(`Loading script from ${url} failed`);
      }
    }

    if (path !== null) {
      let fs;
      try {
        fs = (await import('fs')).promises;
      } catch (error) {
        if (error instanceof TypeError) {
          throw new Error(
            'Can only pass a filepath to addScriptTag in a Node-like environment.'
          );
        }
        throw error;
      }
      let contents = await fs.readFile(path, 'utf8');
      contents += '//# sourceURL=' + path.replace(/\n/g, '');
      const context = await this.executionContext();
      return await context.evaluateHandle(addScriptContent, contents, id, type);
    }

    if (content !== null) {
      const context = await this.executionContext();
      return await context.evaluateHandle(addScriptContent, content, id, type);
    }

    throw new Error(
      'Provide an object with a `url`, `path` or `content` property'
    );

    async function addScriptUrl(url: string, id: string, type: string) {
      const script = document.createElement('script');
      script.src = url;
      if (id) {
        script.id = id;
      }
      if (type) {
        script.type = type;
      }
      const promise = new Promise((res, rej) => {
        script.onload = res;
        script.onerror = rej;
      });
      document.head.appendChild(script);
      await promise;
      return script;
    }

    function addScriptContent(
      content: string,
      id: string,
      type = 'text/javascript'
    ) {
      const script = document.createElement('script');
      script.type = type;
      script.text = content;
      if (id) {
        script.id = id;
      }
      let error = null;
      script.onerror = e => {
        return (error = e);
      };
      document.head.appendChild(script);
      if (error) {
        throw error;
      }
      return script;
    }
  }

  /**
   * Adds a style tag into the current context.
   *
   * @remarks
   * You can pass a URL, filepath or string of contents. Note that when running Puppeteer
   * in a browser environment you cannot pass a filepath and should use either
   * `url` or `content`.
   */
  async addStyleTag(options: {
    url?: string;
    path?: string;
    content?: string;
  }): Promise<ElementHandle<HTMLStyleElement | HTMLLinkElement>> {
    const {url = null, path = null, content = null} = options;
    if (url !== null) {
      try {
        const context = await this.executionContext();
        return (await context.evaluateHandle(
          addStyleUrl,
          url
        )) as ElementHandle<HTMLLinkElement>;
      } catch (error) {
        throw new Error(`Loading style from ${url} failed`);
      }
    }

    if (path !== null) {
      let fs: typeof import('fs').promises;
      try {
        fs = (await importFS()).promises;
      } catch (error) {
        if (error instanceof TypeError) {
          throw new Error(
            'Cannot pass a filepath to addStyleTag in the browser environment.'
          );
        }
        throw error;
      }

      let contents = await fs.readFile(path, 'utf8');
      contents += '/*# sourceURL=' + path.replace(/\n/g, '') + '*/';
      const context = await this.executionContext();
      return (await context.evaluateHandle(
        addStyleContent,
        contents
      )) as ElementHandle<HTMLStyleElement>;
    }

    if (content !== null) {
      const context = await this.executionContext();
      return (await context.evaluateHandle(
        addStyleContent,
        content
      )) as ElementHandle<HTMLStyleElement>;
    }

    throw new Error(
      'Provide an object with a `url`, `path` or `content` property'
    );

    async function addStyleUrl(url: string): Promise<HTMLElement> {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      const promise = new Promise((res, rej) => {
        link.onload = res;
        link.onerror = rej;
      });
      document.head.appendChild(link);
      await promise;
      return link;
    }

    async function addStyleContent(content: string): Promise<HTMLElement> {
      const style = document.createElement('style');
      style.appendChild(document.createTextNode(content));
      const promise = new Promise((res, rej) => {
        style.onload = res;
        style.onerror = rej;
      });
      document.head.appendChild(style);
      await promise;
      return style;
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

  async #addBinding(context: ExecutionContext, fn: Function): Promise<void> {
    // Previous operation added the binding so we are done.
    if (this.#bindings.has(fn.name)) {
      return;
    }
    // Wait for other operation to finish
    if (this.#settingUpBinding) {
      await this.#settingUpBinding;
      return this.#addBinding(context, fn);
    }

    const bind = async (name: string) => {
      const expression = pageBindingInitString('internal', name);
      try {
        // TODO: In theory, it would be enough to call this just once
        await context._client.send('Runtime.addBinding', {
          name,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore The protocol definition is not up to date.
          executionContextName: context._contextName,
        });
        await context.evaluate(expression);
      } catch (error) {
        // We could have tried to evaluate in a context which was already
        // destroyed. This happens, for example, if the page is navigated while
        // we are trying to add the binding
        const ctxDestroyed = (error as Error).message.includes(
          'Execution context was destroyed'
        );
        const ctxNotFound = (error as Error).message.includes(
          'Cannot find context with specified id'
        );
        if (ctxDestroyed || ctxNotFound) {
          return;
        } else {
          debugError(error);
          return;
        }
      }
      this.#bindings.set(name, fn);
    };

    this.#settingUpBinding = bind(fn.name);
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
    if (type !== 'internal' || !this.#bindings.has(name)) {
      return;
    }
    if (context._contextId !== event.executionContextId) {
      return;
    }
    try {
      const fn = this.#bindings.get(name);
      if (!fn) {
        throw new Error(`Bound function $name is not found`);
      }
      const result = await fn(...args);
      await context.evaluate(deliverResult, name, seq, result);
    } catch (error) {
      // The WaitTask may already have been resolved by timing out, or the
      // exection context may have been destroyed.
      // In both caes, the promises above are rejected with a protocol error.
      // We can safely ignores these, as the WaitTask is re-installed in
      // the next execution context if needed.
      if ((error as Error).message.includes('Protocol error')) {
        return;
      }
      debugError(error);
    }
    function deliverResult(name: string, seq: number, result: unknown): void {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore Code is evaluated in a different context.
      (globalThis as any)[name].callbacks.get(seq).resolve(result);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore Code is evaluated in a different context.
      (globalThis as any)[name].callbacks.delete(seq);
    }
  };

  waitForFunction<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    pageFunction: Func,
    options: {
      polling?: 'raf' | 'mutation' | number;
      timeout?: number;
      root?: ElementHandle<Node>;
    } = {},
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>> {
    const {polling = 'raf', timeout = this.#timeoutSettings.timeout()} =
      options;
    const waitTask = new WaitTask(
      this,
      {
        polling,
        timeout,
      },
      pageFunction as unknown as (
        ...args: unknown[]
      ) => Promise<Awaited<ReturnType<Func>>>,
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
}
