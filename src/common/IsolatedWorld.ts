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
import {assert} from './assert.js';
import {CDPSession} from './Connection.js';
import {ElementHandle} from './ElementHandle.js';
import {TimeoutError} from './Errors.js';
import {ExecutionContext} from './ExecutionContext.js';
import {Frame, FrameManager} from './FrameManager.js';
import {MouseButton} from './Input.js';
import {JSHandle} from './JSHandle.js';
import {LifecycleWatcher, PuppeteerLifeCycleEvent} from './LifecycleWatcher.js';
import {getQueryHandlerAndSelector} from './QueryHandler.js';
import {TimeoutSettings} from './TimeoutSettings.js';
import {EvaluateFunc, HandleFor, NodeFor} from './types.js';
import {
  createDeferredPromise,
  createJSHandle,
  debugError,
  DeferredPromise,
  importFS,
  isNumber,
  isString,
  makePredicateString,
  pageBindingInitString,
} from './util.js';

// predicateQueryHandler and checkWaitForOptions are declared here so that
// TypeScript knows about them when used in the predicate function below.
declare const predicateQueryHandler: (
  element: Element | Document,
  selector: string
) => Promise<Element | Element[] | NodeListOf<Element>>;
declare const checkWaitForOptions: (
  node: Node | null,
  waitForVisible: boolean,
  waitForHidden: boolean
) => Element | null | boolean;

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
  /**
   * @deprecated Do not use. Use the {@link ElementHandle.waitForSelector}
   */
  root?: ElementHandle<Node>;
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
  #documentPromise: Promise<ElementHandle<Document>> | null = null;
  #contextPromise: DeferredPromise<ExecutionContext> = createDeferredPromise();
  #detached = false;

  // Set of bindings that have been registered in the current context.
  #ctxBindings = new Set<string>();

  // Contains mapping from functions that should be bound to Puppeteer functions.
  #boundFunctions = new Map<string, Function>();
  #waitTasks = new Set<WaitTask>();

  get _waitTasks(): Set<WaitTask> {
    return this.#waitTasks;
  }

  get _boundFunctions(): Map<string, Function> {
    return this.#boundFunctions;
  }

  static #bindingIdentifier = (name: string, contextId: number) => {
    return `${name}_${contextId}`;
  };

  constructor(
    client: CDPSession,
    frameManager: FrameManager,
    frame: Frame,
    timeoutSettings: TimeoutSettings
  ) {
    // Keep own reference to client because it might differ from the FrameManager's
    // client for OOP iframes.
    this.#client = client;
    this.#frameManager = frameManager;
    this.#frame = frame;
    this.#timeoutSettings = timeoutSettings;
    this.#client.on('Runtime.bindingCalled', this.#onBindingCalled);
  }

  frame(): Frame {
    return this.#frame;
  }

  clearContext(): void {
    this.#documentPromise = null;
    this.#contextPromise = createDeferredPromise();
  }

  setContext(context: ExecutionContext): void {
    assert(
      this.#contextPromise,
      `ExecutionContext ${context._contextId} has already been set.`
    );
    this.#ctxBindings.clear();
    this.#contextPromise.resolve(context);
    for (const waitTask of this._waitTasks) {
      waitTask.rerun();
    }
  }

  hasContext(): boolean {
    return this.#contextPromise.resolved();
  }

  _detach(): void {
    this.#detached = true;
    this.#client.off('Runtime.bindingCalled', this.#onBindingCalled);
    for (const waitTask of this._waitTasks) {
      waitTask.terminate(
        new Error('waitForFunction failed: frame got detached.')
      );
    }
  }

  executionContext(): Promise<ExecutionContext> {
    if (this.#detached) {
      throw new Error(
        `Execution context is not available in detached frame "${this.#frame.url()}" (are you trying to evaluate?)`
      );
    }
    if (this.#contextPromise === null) {
      throw new Error(`Execution content promise is missing`);
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
    const {updatedSelector, queryHandler} =
      getQueryHandlerAndSelector(selector);
    assert(queryHandler.waitFor, 'Query handler does not support waiting');
    return (await queryHandler.waitFor(
      this,
      updatedSelector,
      options
    )) as ElementHandle<NodeFor<Selector>> | null;
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

  async _waitForSelectorInPage(
    queryOne: Function,
    selector: string,
    options: WaitForSelectorOptions,
    binding?: PageBinding
  ): Promise<ElementHandle<Node> | null> {
    const {
      visible: waitForVisible = false,
      hidden: waitForHidden = false,
      timeout = this.#timeoutSettings.timeout(),
    } = options;
    const polling = waitForVisible || waitForHidden ? 'raf' : 'mutation';
    const title = `selector \`${selector}\`${
      waitForHidden ? ' to be hidden' : ''
    }`;
    async function predicate(
      root: Element | Document,
      selector: string,
      waitForVisible: boolean,
      waitForHidden: boolean
    ): Promise<Node | null | boolean> {
      const node = predicateQueryHandler
        ? ((await predicateQueryHandler(root, selector)) as Element)
        : root.querySelector(selector);
      return checkWaitForOptions(node, waitForVisible, waitForHidden);
    }
    const waitTaskOptions: WaitTaskOptions = {
      isolatedWorld: this,
      predicateBody: makePredicateString(predicate, queryOne),
      predicateAcceptsContextElement: true,
      title,
      polling,
      timeout,
      args: [selector, waitForVisible, waitForHidden],
      binding,
      root: options.root,
    };
    const waitTask = new WaitTask(waitTaskOptions);
    const jsHandle = await waitTask.promise;
    const elementHandle = jsHandle.asElement();
    if (!elementHandle) {
      await jsHandle.dispose();
      return null;
    }
    return elementHandle;
  }

  waitForFunction(
    pageFunction: Function | string,
    options: {polling?: string | number; timeout?: number} = {},
    ...args: unknown[]
  ): Promise<JSHandle> {
    const {polling = 'raf', timeout = this.#timeoutSettings.timeout()} =
      options;
    const waitTaskOptions: WaitTaskOptions = {
      isolatedWorld: this,
      predicateBody: pageFunction,
      predicateAcceptsContextElement: false,
      title: 'function',
      polling,
      timeout,
      args,
    };
    const waitTask = new WaitTask(waitTaskOptions);
    return waitTask.promise;
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

/**
 * @internal
 */
export interface WaitTaskOptions {
  isolatedWorld: IsolatedWorld;
  predicateBody: Function | string;
  predicateAcceptsContextElement: boolean;
  title: string;
  polling: string | number;
  timeout: number;
  binding?: PageBinding;
  args: unknown[];
  root?: ElementHandle<Node>;
}

const noop = (): void => {};

/**
 * @internal
 */
export class WaitTask {
  #isolatedWorld: IsolatedWorld;
  #polling: 'raf' | 'mutation' | number;
  #timeout: number;
  #predicateBody: string;
  #predicateAcceptsContextElement: boolean;
  #args: unknown[];
  #binding?: PageBinding;
  #runCount = 0;
  #resolve: (x: JSHandle) => void = noop;
  #reject: (x: Error) => void = noop;
  #timeoutTimer?: NodeJS.Timeout;
  #terminated = false;
  #root: ElementHandle<Node> | null = null;

  promise: Promise<JSHandle>;

  constructor(options: WaitTaskOptions) {
    if (isString(options.polling)) {
      assert(
        options.polling === 'raf' || options.polling === 'mutation',
        'Unknown polling option: ' + options.polling
      );
    } else if (isNumber(options.polling)) {
      assert(
        options.polling > 0,
        'Cannot poll with non-positive interval: ' + options.polling
      );
    } else {
      throw new Error('Unknown polling options: ' + options.polling);
    }

    function getPredicateBody(predicateBody: Function | string) {
      if (isString(predicateBody)) {
        return `return (${predicateBody});`;
      }
      return `return (${predicateBody})(...args);`;
    }

    this.#isolatedWorld = options.isolatedWorld;
    this.#polling = options.polling;
    this.#timeout = options.timeout;
    this.#root = options.root || null;
    this.#predicateBody = getPredicateBody(options.predicateBody);
    this.#predicateAcceptsContextElement =
      options.predicateAcceptsContextElement;
    this.#args = options.args;
    this.#binding = options.binding;
    this.#runCount = 0;
    this.#isolatedWorld._waitTasks.add(this);
    if (this.#binding) {
      this.#isolatedWorld._boundFunctions.set(
        this.#binding.name,
        this.#binding.pptrFunction
      );
    }
    this.promise = new Promise<JSHandle>((resolve, reject) => {
      this.#resolve = resolve;
      this.#reject = reject;
    });
    // Since page navigation requires us to re-install the pageScript, we should track
    // timeout on our end.
    if (options.timeout) {
      const timeoutError = new TimeoutError(
        `waiting for ${options.title} failed: timeout ${options.timeout}ms exceeded`
      );
      this.#timeoutTimer = setTimeout(() => {
        return this.terminate(timeoutError);
      }, options.timeout);
    }
    this.rerun();
  }

  terminate(error: Error): void {
    this.#terminated = true;
    this.#reject(error);
    this.#cleanup();
  }

  async rerun(): Promise<void> {
    const runCount = ++this.#runCount;
    let success: JSHandle | null = null;
    let error: Error | null = null;
    const context = await this.#isolatedWorld.executionContext();
    if (this.#terminated || runCount !== this.#runCount) {
      return;
    }
    if (this.#binding) {
      await this.#isolatedWorld._addBindingToContext(
        context,
        this.#binding.name
      );
    }
    if (this.#terminated || runCount !== this.#runCount) {
      return;
    }
    try {
      success = await context.evaluateHandle(
        waitForPredicatePageFunction,
        this.#root || null,
        this.#predicateBody,
        this.#predicateAcceptsContextElement,
        this.#polling,
        this.#timeout,
        ...this.#args
      );
    } catch (error_) {
      error = error_ as Error;
    }

    if (this.#terminated || runCount !== this.#runCount) {
      if (success) {
        await success.dispose();
      }
      return;
    }

    // Ignore timeouts in pageScript - we track timeouts ourselves.
    // If the frame's execution context has already changed, `frame.evaluate` will
    // throw an error - ignore this predicate run altogether.
    if (
      !error &&
      (await this.#isolatedWorld
        .evaluate(s => {
          return !s;
        }, success)
        .catch(() => {
          return true;
        }))
    ) {
      if (!success) {
        throw new Error('Assertion: result handle is not available');
      }
      await success.dispose();
      return;
    }
    if (error) {
      if (error.message.includes('TypeError: binding is not a function')) {
        return this.rerun();
      }
      // When frame is detached the task should have been terminated by the IsolatedWorld.
      // This can fail if we were adding this task while the frame was detached,
      // so we terminate here instead.
      if (
        error.message.includes(
          'Execution context is not available in detached frame'
        )
      ) {
        this.terminate(
          new Error('waitForFunction failed: frame got detached.')
        );
        return;
      }

      // When the page is navigated, the promise is rejected.
      // We will try again in the new execution context.
      if (error.message.includes('Execution context was destroyed')) {
        return;
      }

      // We could have tried to evaluate in a context which was already
      // destroyed.
      if (error.message.includes('Cannot find context with specified id')) {
        return;
      }

      this.#reject(error);
    } else {
      if (!success) {
        throw new Error('Assertion: result handle is not available');
      }
      this.#resolve(success);
    }
    this.#cleanup();
  }

  #cleanup(): void {
    this.#timeoutTimer !== undefined && clearTimeout(this.#timeoutTimer);
    this.#isolatedWorld._waitTasks.delete(this);
  }
}

async function waitForPredicatePageFunction(
  root: Node | null,
  predicateBody: string,
  predicateAcceptsContextElement: boolean,
  polling: 'raf' | 'mutation' | number,
  timeout: number,
  ...args: unknown[]
): Promise<unknown> {
  root = root || document;
  const predicate = new Function('...args', predicateBody);
  let timedOut = false;
  if (timeout) {
    setTimeout(() => {
      return (timedOut = true);
    }, timeout);
  }
  switch (polling) {
    case 'raf':
      return await pollRaf();
    case 'mutation':
      return await pollMutation();
    default:
      return await pollInterval(polling);
  }

  async function pollMutation(): Promise<unknown> {
    const success = predicateAcceptsContextElement
      ? await predicate(root, ...args)
      : await predicate(...args);
    if (success) {
      return Promise.resolve(success);
    }

    let fulfill = (_?: unknown) => {};
    const result = new Promise(x => {
      return (fulfill = x);
    });
    const observer = new MutationObserver(async () => {
      if (timedOut) {
        observer.disconnect();
        fulfill();
      }
      const success = predicateAcceptsContextElement
        ? await predicate(root, ...args)
        : await predicate(...args);
      if (success) {
        observer.disconnect();
        fulfill(success);
      }
    });
    if (!root) {
      throw new Error('Root element is not found.');
    }
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
    });
    return result;
  }

  async function pollRaf(): Promise<unknown> {
    let fulfill = (_?: unknown): void => {};
    const result = new Promise(x => {
      return (fulfill = x);
    });
    await onRaf();
    return result;

    async function onRaf(): Promise<void> {
      if (timedOut) {
        fulfill();
        return;
      }
      const success = predicateAcceptsContextElement
        ? await predicate(root, ...args)
        : await predicate(...args);
      if (success) {
        fulfill(success);
      } else {
        requestAnimationFrame(onRaf);
      }
    }
  }

  async function pollInterval(pollInterval: number): Promise<unknown> {
    let fulfill = (_?: unknown): void => {};
    const result = new Promise(x => {
      return (fulfill = x);
    });
    await onTimeout();
    return result;

    async function onTimeout(): Promise<void> {
      if (timedOut) {
        fulfill();
        return;
      }
      const success = predicateAcceptsContextElement
        ? await predicate(root, ...args)
        : await predicate(...args);
      if (success) {
        fulfill(success);
      } else {
        setTimeout(onTimeout, pollInterval);
      }
    }
  }
}
