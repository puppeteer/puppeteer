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

import { Protocol } from 'devtools-protocol';
import { assert } from './assert.js';
import { CDPSession } from './Connection.js';
import { TimeoutError } from './Errors.js';
import {
  EvaluateFn,
  EvaluateFnReturnType,
  EvaluateHandleFn,
  SerializableOrJSHandle,
  UnwrapPromiseLike,
  WrapElementHandle,
} from './EvalTypes.js';
import { ExecutionContext } from './ExecutionContext.js';
import { Frame, FrameManager } from './FrameManager.js';
import { debugError, helper } from './helper.js';
import { MouseButton } from './Input.js';
import { ElementHandle, JSHandle } from './JSHandle.js';
import {
  LifecycleWatcher,
  PuppeteerLifeCycleEvent,
} from './LifecycleWatcher.js';
import { getQueryHandlerAndSelector } from './QueryHandler.js';
import { TimeoutSettings } from './TimeoutSettings.js';

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
  visible?: boolean;
  hidden?: boolean;
  timeout?: number;
  root?: ElementHandle;
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
export class DOMWorld {
  private _frameManager: FrameManager;
  private _client: CDPSession;
  private _frame: Frame;
  private _timeoutSettings: TimeoutSettings;
  private _documentPromise: Promise<ElementHandle> | null = null;
  private _contextPromise: Promise<ExecutionContext> | null = null;

  private _contextResolveCallback: ((x: ExecutionContext) => void) | null =
    null;

  private _detached = false;
  /**
   * @internal
   */
  _waitTasks = new Set<WaitTask>();

  /**
   * @internal
   * Contains mapping from functions that should be bound to Puppeteer functions.
   */
  _boundFunctions = new Map<string, Function>();
  // Set of bindings that have been registered in the current context.
  private _ctxBindings = new Set<string>();
  private static bindingIdentifier = (name: string, contextId: number) =>
    `${name}_${contextId}`;

  constructor(
    client: CDPSession,
    frameManager: FrameManager,
    frame: Frame,
    timeoutSettings: TimeoutSettings
  ) {
    // Keep own reference to client because it might differ from the FrameManager's
    // client for OOP iframes.
    this._client = client;
    this._frameManager = frameManager;
    this._frame = frame;
    this._timeoutSettings = timeoutSettings;
    this._setContext(null);
    this._onBindingCalled = this._onBindingCalled.bind(this);
    this._client.on('Runtime.bindingCalled', this._onBindingCalled);
  }

  frame(): Frame {
    return this._frame;
  }

  async _setContext(context: ExecutionContext | null): Promise<void> {
    if (context) {
      assert(
        this._contextResolveCallback,
        'Execution Context has already been set.'
      );
      this._ctxBindings.clear();
      this._contextResolveCallback?.call(null, context);
      this._contextResolveCallback = null;
      for (const waitTask of this._waitTasks) waitTask.rerun();
    } else {
      this._documentPromise = null;
      this._contextPromise = new Promise((fulfill) => {
        this._contextResolveCallback = fulfill;
      });
    }
  }

  _hasContext(): boolean {
    return !this._contextResolveCallback;
  }

  _detach(): void {
    this._detached = true;
    this._client.off('Runtime.bindingCalled', this._onBindingCalled);
    for (const waitTask of this._waitTasks)
      waitTask.terminate(
        new Error('waitForFunction failed: frame got detached.')
      );
  }

  executionContext(): Promise<ExecutionContext> {
    if (this._detached)
      throw new Error(
        `Execution context is not available in detached frame "${this._frame.url()}" (are you trying to evaluate?)`
      );
    if (this._contextPromise === null)
      throw new Error(`Execution content promise is missing`);
    return this._contextPromise;
  }

  async evaluateHandle<HandlerType extends JSHandle = JSHandle>(
    pageFunction: EvaluateHandleFn,
    ...args: SerializableOrJSHandle[]
  ): Promise<HandlerType> {
    const context = await this.executionContext();
    return context.evaluateHandle(pageFunction, ...args);
  }

  async evaluate<T extends EvaluateFn>(
    pageFunction: T,
    ...args: SerializableOrJSHandle[]
  ): Promise<UnwrapPromiseLike<EvaluateFnReturnType<T>>> {
    const context = await this.executionContext();
    return context.evaluate<UnwrapPromiseLike<EvaluateFnReturnType<T>>>(
      pageFunction,
      ...args
    );
  }

  async $<T extends Element = Element>(
    selector: string
  ): Promise<ElementHandle<T> | null> {
    const document = await this._document();
    const value = await document.$<T>(selector);
    return value;
  }

  async _document(): Promise<ElementHandle> {
    if (this._documentPromise) return this._documentPromise;
    this._documentPromise = this.executionContext().then(async (context) => {
      const document = await context.evaluateHandle('document');
      const element = document.asElement();
      if (element === null) {
        throw new Error('Document is null');
      }
      return element;
    });
    return this._documentPromise;
  }

  async $x(expression: string): Promise<ElementHandle[]> {
    const document = await this._document();
    const value = await document.$x(expression);
    return value;
  }

  async $eval<ReturnType>(
    selector: string,
    pageFunction: (
      element: Element,
      ...args: unknown[]
    ) => ReturnType | Promise<ReturnType>,
    ...args: SerializableOrJSHandle[]
  ): Promise<WrapElementHandle<ReturnType>> {
    const document = await this._document();
    return document.$eval<ReturnType>(selector, pageFunction, ...args);
  }

  async $$eval<ReturnType>(
    selector: string,
    pageFunction: (
      elements: Element[],
      ...args: unknown[]
    ) => ReturnType | Promise<ReturnType>,
    ...args: SerializableOrJSHandle[]
  ): Promise<WrapElementHandle<ReturnType>> {
    const document = await this._document();
    const value = await document.$$eval<ReturnType>(
      selector,
      pageFunction,
      ...args
    );
    return value;
  }

  async $$<T extends Element = Element>(
    selector: string
  ): Promise<Array<ElementHandle<T>>> {
    const document = await this._document();
    const value = await document.$$<T>(selector);
    return value;
  }

  async content(): Promise<string> {
    return await this.evaluate(() => {
      let retVal = '';
      if (document.doctype)
        retVal = new XMLSerializer().serializeToString(document.doctype);
      if (document.documentElement)
        retVal += document.documentElement.outerHTML;
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
      timeout = this._timeoutSettings.navigationTimeout(),
    } = options;
    // We rely upon the fact that document.open() will reset frame lifecycle with "init"
    // lifecycle event. @see https://crrev.com/608658
    await this.evaluate<(x: string) => void>((html) => {
      document.open();
      document.write(html);
      document.close();
    }, html);
    const watcher = new LifecycleWatcher(
      this._frameManager,
      this._frame,
      waitUntil,
      timeout
    );
    const error = await Promise.race([
      watcher.timeoutOrTerminationPromise(),
      watcher.lifecyclePromise(),
    ]);
    watcher.dispose();
    if (error) throw error;
  }

  /**
   * Adds a script tag into the current context.
   *
   * @remarks
   *
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
  }): Promise<ElementHandle> {
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
        const handle = await context.evaluateHandle(
          addScriptUrl,
          url,
          id,
          type
        );
        const elementHandle = handle.asElement();
        if (elementHandle === null) {
          throw new Error('Script element is not found');
        }
        return elementHandle;
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
      const handle = await context.evaluateHandle(
        addScriptContent,
        contents,
        id,
        type
      );
      const elementHandle = handle.asElement();
      if (elementHandle === null) {
        throw new Error('Script element is not found');
      }
      return elementHandle;
    }

    if (content !== null) {
      const context = await this.executionContext();
      const handle = await context.evaluateHandle(
        addScriptContent,
        content,
        id,
        type
      );
      const elementHandle = handle.asElement();
      if (elementHandle === null) {
        throw new Error('Script element is not found');
      }
      return elementHandle;
    }

    throw new Error(
      'Provide an object with a `url`, `path` or `content` property'
    );

    async function addScriptUrl(
      url: string,
      id: string,
      type: string
    ): Promise<HTMLElement> {
      const script = document.createElement('script');
      script.src = url;
      if (id) script.id = id;
      if (type) script.type = type;
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
    ): HTMLElement {
      const script = document.createElement('script');
      script.type = type;
      script.text = content;
      if (id) script.id = id;
      let error = null;
      script.onerror = (e) => (error = e);
      document.head.appendChild(script);
      if (error) throw error;
      return script;
    }
  }

  /**
   * Adds a style tag into the current context.
   *
   * @remarks
   *
   * You can pass a URL, filepath or string of contents. Note that when running Puppeteer
   * in a browser environment you cannot pass a filepath and should use either
   * `url` or `content`.
   *
   */
  async addStyleTag(options: {
    url?: string;
    path?: string;
    content?: string;
  }): Promise<ElementHandle> {
    const { url = null, path = null, content = null } = options;
    if (url !== null) {
      try {
        const context = await this.executionContext();
        const handle = await context.evaluateHandle(addStyleUrl, url);
        const elementHandle = handle.asElement();
        if (elementHandle === null) {
          throw new Error('Style element is not found');
        }
        return elementHandle;
      } catch (error) {
        throw new Error(`Loading style from ${url} failed`);
      }
    }

    if (path !== null) {
      let fs: typeof import('fs').promises;
      try {
        fs = (await import('fs')).promises;
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
      const handle = await context.evaluateHandle(addStyleContent, contents);
      const elementHandle = handle.asElement();
      if (elementHandle === null) {
        throw new Error('Style element is not found');
      }
      return elementHandle;
    }

    if (content !== null) {
      const context = await this.executionContext();
      const handle = await context.evaluateHandle(addStyleContent, content);
      const elementHandle = handle.asElement();
      if (elementHandle === null) {
        throw new Error('Style element is not found');
      }
      return elementHandle;
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
      style.type = 'text/css';
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
    options: { delay?: number; button?: MouseButton; clickCount?: number }
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
    options?: { delay: number }
  ): Promise<void> {
    const handle = await this.$(selector);
    assert(handle, `No element found for selector: ${selector}`);
    await handle.type(text, options);
    await handle.dispose();
  }

  async waitForSelector(
    selector: string,
    options: WaitForSelectorOptions
  ): Promise<ElementHandle | null> {
    const { updatedSelector, queryHandler } =
      getQueryHandlerAndSelector(selector);
    assert(queryHandler.waitFor, 'Query handler does not support waiting');
    return queryHandler.waitFor(this, updatedSelector, options);
  }

  // If multiple waitFor are set up asynchronously, we need to wait for the
  // first one to set up the binding in the page before running the others.
  private _settingUpBinding: Promise<void> | null = null;
  /**
   * @internal
   */
  async addBindingToContext(
    context: ExecutionContext,
    name: string
  ): Promise<void> {
    // Previous operation added the binding so we are done.
    if (
      this._ctxBindings.has(
        DOMWorld.bindingIdentifier(name, context._contextId)
      )
    ) {
      return;
    }
    // Wait for other operation to finish
    if (this._settingUpBinding) {
      await this._settingUpBinding;
      return this.addBindingToContext(context, name);
    }

    const bind = async (name: string) => {
      const expression = helper.pageBindingInitString('internal', name);
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
      this._ctxBindings.add(
        DOMWorld.bindingIdentifier(name, context._contextId)
      );
    };

    this._settingUpBinding = bind(name);
    await this._settingUpBinding;
    this._settingUpBinding = null;
  }

  private async _onBindingCalled(
    event: Protocol.Runtime.BindingCalledEvent
  ): Promise<void> {
    let payload: { type: string; name: string; seq: number; args: unknown[] };
    if (!this._hasContext()) return;
    const context = await this.executionContext();
    try {
      payload = JSON.parse(event.payload);
    } catch {
      // The binding was either called by something in the page or it was
      // called before our wrapper was initialized.
      return;
    }
    const { type, name, seq, args } = payload;
    if (
      type !== 'internal' ||
      !this._ctxBindings.has(
        DOMWorld.bindingIdentifier(name, context._contextId)
      )
    )
      return;
    if (context._contextId !== event.executionContextId) return;
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
      if ((error as Error).message.includes('Protocol error')) return;
      debugError(error);
    }
    function deliverResult(name: string, seq: number, result: unknown): void {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore Code is evaluated in a different context.
      globalThis[name].callbacks.get(seq).resolve(result);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore Code is evaluated in a different context.
      globalThis[name].callbacks.delete(seq);
    }
  }

  /**
   * @internal
   */
  async waitForSelectorInPage(
    queryOne: Function,
    selector: string,
    options: WaitForSelectorOptions,
    binding?: PageBinding
  ): Promise<ElementHandle | null> {
    const {
      visible: waitForVisible = false,
      hidden: waitForHidden = false,
      timeout = this._timeoutSettings.timeout(),
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
      domWorld: this,
      predicateBody: helper.makePredicateString(predicate, queryOne),
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

  async waitForXPath(
    xpath: string,
    options: WaitForSelectorOptions
  ): Promise<ElementHandle | null> {
    const {
      visible: waitForVisible = false,
      hidden: waitForHidden = false,
      timeout = this._timeoutSettings.timeout(),
    } = options;
    const polling = waitForVisible || waitForHidden ? 'raf' : 'mutation';
    const title = `XPath \`${xpath}\`${waitForHidden ? ' to be hidden' : ''}`;
    function predicate(
      root: Element | Document,
      xpath: string,
      waitForVisible: boolean,
      waitForHidden: boolean
    ): Node | null | boolean {
      const node = document.evaluate(
        xpath,
        root,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;
      return checkWaitForOptions(node, waitForVisible, waitForHidden);
    }
    const waitTaskOptions: WaitTaskOptions = {
      domWorld: this,
      predicateBody: helper.makePredicateString(predicate),
      predicateAcceptsContextElement: true,
      title,
      polling,
      timeout,
      args: [xpath, waitForVisible, waitForHidden],
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
    options: { polling?: string | number; timeout?: number } = {},
    ...args: SerializableOrJSHandle[]
  ): Promise<JSHandle> {
    const { polling = 'raf', timeout = this._timeoutSettings.timeout() } =
      options;
    const waitTaskOptions: WaitTaskOptions = {
      domWorld: this,
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
    return this.evaluate(() => document.title);
  }
}

/**
 * @internal
 */
export interface WaitTaskOptions {
  domWorld: DOMWorld;
  predicateBody: Function | string;
  predicateAcceptsContextElement: boolean;
  title: string;
  polling: string | number;
  timeout: number;
  binding?: PageBinding;
  args: SerializableOrJSHandle[];
  root?: ElementHandle;
}

const noop = (): void => {};

/**
 * @internal
 */
export class WaitTask {
  _domWorld: DOMWorld;
  _polling: string | number;
  _timeout: number;
  _predicateBody: string;
  _predicateAcceptsContextElement: boolean;
  _args: SerializableOrJSHandle[];
  _binding?: PageBinding;
  _runCount = 0;
  promise: Promise<JSHandle>;
  _resolve: (x: JSHandle) => void = noop;
  _reject: (x: Error) => void = noop;
  _timeoutTimer?: NodeJS.Timeout;
  _terminated = false;
  _root: ElementHandle | null = null;

  constructor(options: WaitTaskOptions) {
    if (helper.isString(options.polling))
      assert(
        options.polling === 'raf' || options.polling === 'mutation',
        'Unknown polling option: ' + options.polling
      );
    else if (helper.isNumber(options.polling))
      assert(
        options.polling > 0,
        'Cannot poll with non-positive interval: ' + options.polling
      );
    else throw new Error('Unknown polling options: ' + options.polling);

    function getPredicateBody(predicateBody: Function | string) {
      if (helper.isString(predicateBody)) return `return (${predicateBody});`;
      return `return (${predicateBody})(...args);`;
    }

    this._domWorld = options.domWorld;
    this._polling = options.polling;
    this._timeout = options.timeout;
    this._root = options.root || null;
    this._predicateBody = getPredicateBody(options.predicateBody);
    this._predicateAcceptsContextElement =
      options.predicateAcceptsContextElement;
    this._args = options.args;
    this._binding = options.binding;
    this._runCount = 0;
    this._domWorld._waitTasks.add(this);
    if (this._binding) {
      this._domWorld._boundFunctions.set(
        this._binding.name,
        this._binding.pptrFunction
      );
    }
    this.promise = new Promise<JSHandle>((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
    // Since page navigation requires us to re-install the pageScript, we should track
    // timeout on our end.
    if (options.timeout) {
      const timeoutError = new TimeoutError(
        `waiting for ${options.title} failed: timeout ${options.timeout}ms exceeded`
      );
      this._timeoutTimer = setTimeout(
        () => this.terminate(timeoutError),
        options.timeout
      );
    }
    this.rerun();
  }

  terminate(error: Error): void {
    this._terminated = true;
    this._reject(error);
    this._cleanup();
  }

  async rerun(): Promise<void> {
    const runCount = ++this._runCount;
    let success: JSHandle | null = null;
    let error: Error | null = null;
    const context = await this._domWorld.executionContext();
    if (this._terminated || runCount !== this._runCount) return;
    if (this._binding) {
      await this._domWorld.addBindingToContext(context, this._binding.name);
    }
    if (this._terminated || runCount !== this._runCount) return;
    try {
      success = await context.evaluateHandle(
        waitForPredicatePageFunction,
        this._root || null,
        this._predicateBody,
        this._predicateAcceptsContextElement,
        this._polling,
        this._timeout,
        ...this._args
      );
    } catch (error_) {
      error = error_ as Error;
    }

    if (this._terminated || runCount !== this._runCount) {
      if (success) await success.dispose();
      return;
    }

    // Ignore timeouts in pageScript - we track timeouts ourselves.
    // If the frame's execution context has already changed, `frame.evaluate` will
    // throw an error - ignore this predicate run altogether.
    if (
      !error &&
      (await this._domWorld.evaluate((s) => !s, success).catch(() => true))
    ) {
      if (!success)
        throw new Error('Assertion: result handle is not available');
      await success.dispose();
      return;
    }
    if (error) {
      if (error.message.includes('TypeError: binding is not a function')) {
        return this.rerun();
      }
      // When frame is detached the task should have been terminated by the DOMWorld.
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
      if (error.message.includes('Execution context was destroyed')) return;

      // We could have tried to evaluate in a context which was already
      // destroyed.
      if (error.message.includes('Cannot find context with specified id'))
        return;

      this._reject(error);
    } else {
      if (!success)
        throw new Error('Assertion: result handle is not available');
      this._resolve(success);
    }
    this._cleanup();
  }

  _cleanup(): void {
    this._timeoutTimer !== undefined && clearTimeout(this._timeoutTimer);
    this._domWorld._waitTasks.delete(this);
  }
}

async function waitForPredicatePageFunction(
  root: Element | Document | null,
  predicateBody: string,
  predicateAcceptsContextElement: boolean,
  polling: 'raf' | 'mutation' | number,
  timeout: number,
  ...args: unknown[]
): Promise<unknown> {
  root = root || document;
  const predicate = new Function('...args', predicateBody);
  let timedOut = false;
  if (timeout) setTimeout(() => (timedOut = true), timeout);
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
    if (success) return Promise.resolve(success);

    let fulfill = (_?: unknown) => {};
    const result = new Promise((x) => (fulfill = x));
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
    const result = new Promise((x) => (fulfill = x));
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
      if (success) fulfill(success);
      else requestAnimationFrame(onRaf);
    }
  }

  async function pollInterval(pollInterval: number): Promise<unknown> {
    let fulfill = (_?: unknown): void => {};
    const result = new Promise((x) => (fulfill = x));
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
      if (success) fulfill(success);
      else setTimeout(onTimeout, pollInterval);
    }
  }
}
