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

import * as fs from 'fs';
import { helper, assert } from './helper';
import { LifecycleWatcher } from './LifecycleWatcher';
import { TimeoutError } from './Errors';
import { FrameManager, Frame } from './FrameManager';
import { TimeoutSettings } from './TimeoutSettings';
import { ExecutionContext } from './ExecutionContext';
import { JSHandle, ElementHandle } from './JSHandle';
import {
  AnyFunction,
  Evalable,
  JSEvalable,
  EvaluateFn,
  SerializableOrJSHandle,
  EvaluateFnReturnType,
  WaitForSelectorOptions,
  NavigationOptions,
  StyleTagOptions,
  ScriptTagOptions,
  ClickOptions,
} from './types';

const noop = () => undefined;
const readFileAsync = helper.promisify(fs.readFile);

export class DOMWorld implements Evalable, JSEvalable {
  private _documentPromise: Promise<ElementHandle> | null = null;
  private _contextPromise!: Promise<ExecutionContext>;
  private _contextResolveCallback: ((context: ExecutionContext) => void) | null = null;
  /* @internal */
  public _waitTasks = new Set<WaitTask>();
  private _detached = false;

  constructor(private frameManager: FrameManager, private _frame: Frame, private timeoutSettings: TimeoutSettings) {
    this._setContext(null);
  }

  public frame(): Frame {
    return this._frame;
  }

  /* @internal */
  public _setContext(context: ExecutionContext | null) {
    if (context) {
      this._contextResolveCallback!.call(null, context);
      this._contextResolveCallback = null;
      for (const waitTask of this._waitTasks) waitTask.rerun().catch(noop);
    } else {
      this._documentPromise = null;
      this._contextPromise = new Promise(fulfill => {
        this._contextResolveCallback = fulfill;
      });
    }
  }

  /* @internal */
  public _hasContext(): boolean {
    return !this._contextResolveCallback;
  }

  /* @internal */
  public _detach() {
    this._detached = true;
    for (const waitTask of this._waitTasks)
      waitTask.terminate(new Error('waitForFunction failed: frame got detached.'));
  }

  public executionContext(): Promise<ExecutionContext> {
    if (this._detached) {
      throw new Error(
          `Execution Context is not available in detached frame "${this._frame.url()}" (are you trying to evaluate?)`
      );
    }
    return this._contextPromise;
  }

  public async evaluateHandle<V extends EvaluateFn<any>>(
    pageFunction: V,
    ...args: SerializableOrJSHandle[]
  ): Promise<JSHandle<EvaluateFnReturnType<V>>> {
    const context = await this.executionContext();
    return context.evaluateHandle(pageFunction, ...args);
  }

  public async evaluate<V extends EvaluateFn<any>>(
    pageFunction: V,
    ...args: SerializableOrJSHandle[]
  ): Promise<EvaluateFnReturnType<V>> {
    const context = await this.executionContext();
    return context.evaluate(pageFunction, ...args);
  }

  public async $(selector: string): Promise<ElementHandle | null> {
    const document = await this._document();
    const value = await document.$(selector);
    return value;
  }

  private async _document(): Promise<ElementHandle> {
    if (this._documentPromise) return this._documentPromise;
    this._documentPromise = this.executionContext().then(async context => {
      const document = await context.evaluateHandle('document');
      return document.asElement()!;
    });
    return this._documentPromise;
  }

  public async $x(expression: string): Promise<ElementHandle[]> {
    const document = await this._document();
    const value = await document.$x(expression);
    return value;
  }

  public async $eval(...args: Parameters<Evalable['$eval']>) {
    const document = await this._document();
    return document.$eval(...args);
  }

  public $$eval: Evalable['$$eval'] = async(...args: Parameters<Evalable['$$eval']>) => {
    const document = await this._document();
    const value = await document.$$eval(...args);
    return value;
  };

  public async $$(selector: string): Promise<ElementHandle[]> {
    const document = await this._document();
    const value = await document.$$(selector);
    return value;
  }

  public async content(): Promise<string> {
    return this.evaluate(() => {
      let retVal = '';
      if (document.doctype) retVal = new XMLSerializer().serializeToString(document.doctype);
      if (document.documentElement) retVal += document.documentElement.outerHTML;
      return retVal;
    });
  }

  public async setContent(html: string, options: NavigationOptions = {}) {
    const { waitUntil = ['load'], timeout = this.timeoutSettings.navigationTimeout() } = options;
    // We rely upon the fact that document.open() will reset frame lifecycle with "init"
    // lifecycle event. @see https://crrev.com/608658
    await this.evaluate(html => {
      document.open();
      document.write(html);
      document.close();
    }, html);
    const watcher = new LifecycleWatcher(this.frameManager, this._frame, waitUntil, timeout);
    const error = await Promise.race([watcher.timeoutOrTerminationPromise(), watcher.lifecyclePromise()]);
    watcher.dispose();
    if (error) throw error;
  }

  public async addScriptTag(options: ScriptTagOptions): Promise<ElementHandle> {
    const { url = null, path = null, content = null, type = '' } = options;
    if (url !== null) {
      try {
        const context = await this.executionContext();
        return (await context.evaluateHandle(addScriptUrl, url, type)).asElement()!;
      } catch (error) {
        throw new Error(`Loading script from ${url} failed`);
      }
    }

    if (path !== null) {
      let contents = await readFileAsync(path, 'utf8');
      contents += '//# sourceURL=' + path.replace(/\n/g, '');
      const context = await this.executionContext();
      return (await context.evaluateHandle(addScriptContent, contents, type)).asElement()!;
    }

    if (content !== null) {
      const context = await this.executionContext();
      return (await context.evaluateHandle(addScriptContent, content, type)).asElement()!;
    }

    throw new Error('Provide an object with a `url`, `path` or `content` property');

    async function addScriptUrl(url: string, type: string): Promise<HTMLElement> {
      const script = document.createElement('script');
      script.src = url;
      if (type) script.type = type;
      const promise = new Promise((res, rej) => {
        script.onload = res;
        script.onerror = rej;
      });
      document.head.appendChild(script);
      await promise;
      return script;
    }

    function addScriptContent(content: string, type = 'text/javascript'): HTMLElement {
      const script = document.createElement('script');
      script.type = type;
      script.text = content;
      let error = null;
      script.onerror = e => (error = e);
      document.head.appendChild(script);
      if (error) throw error;
      return script;
    }
  }

  public async addStyleTag(options: StyleTagOptions): Promise<ElementHandle> {
    const { url = null, path = null, content = null } = options;
    if (url !== null) {
      try {
        const context = await this.executionContext();
        return (await context.evaluateHandle(addStyleUrl, url)).asElement()!;
      } catch (error) {
        throw new Error(`Loading style from ${url} failed`);
      }
    }

    if (path !== null) {
      let contents = await readFileAsync(path, 'utf8');
      contents += '/*# sourceURL=' + path.replace(/\n/g, '') + '*/';
      const context = await this.executionContext();
      return (await context.evaluateHandle(addStyleContent, contents)).asElement()!;
    }

    if (content !== null) {
      const context = await this.executionContext();
      return (await context.evaluateHandle(addStyleContent, content)).asElement()!;
    }

    throw new Error('Provide an object with a `url`, `path` or `content` property');

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

  public async click(selector: string, options?: ClickOptions) {
    const handle = await this.$(selector);
    assert(handle, 'No node found for selector: ' + selector);
    await handle.click(options);
    await handle.dispose();
  }

  public async focus(selector: string) {
    const handle = await this.$(selector);
    assert(handle, 'No node found for selector: ' + selector);
    await handle.focus();
    await handle.dispose();
  }

  public async hover(selector: string) {
    const handle = await this.$(selector);
    assert(handle, 'No node found for selector: ' + selector);
    await handle.hover();
    await handle.dispose();
  }

  public async select(selector: string, ...values: string[]): Promise<string[]> {
    const handle = await this.$(selector);
    assert(handle, 'No node found for selector: ' + selector);
    const result = await handle.select(...values);
    await handle.dispose();
    return result;
  }

  public async tap(selector: string) {
    const handle = await this.$(selector);
    assert(handle, 'No node found for selector: ' + selector);
    await handle.tap();
    await handle.dispose();
  }

  public async type(selector: string, text: string, options?: { delay: number | undefined }) {
    const handle = await this.$(selector);
    assert(handle, 'No node found for selector: ' + selector);
    await handle.type(text, options);
    await handle.dispose();
  }

  public waitForSelector(
    selector: string,
    options?: WaitForSelectorOptions
  ): Promise<ElementHandle | null> {
    return this._waitForSelectorOrXPath(selector, false, options);
  }

  public waitForXPath(
    xpath: string,
    options?: WaitForSelectorOptions
  ): Promise<ElementHandle | null> {
    return this._waitForSelectorOrXPath(xpath, true, options);
  }

  public waitForFunction(
    pageFunction: AnyFunction | string,
    options: { polling?: string | number; timeout?: number } = {},
    ...args: any[]
  ): Promise<JSHandle> {
    const { polling = 'raf', timeout = this.timeoutSettings.timeout() } = options;
    return new WaitTask(this, pageFunction, 'function', polling, timeout, ...args).promise;
  }

  public async title(): Promise<string> {
    return this.evaluate(() => document.title);
  }

  private async _waitForSelectorOrXPath(
    selectorOrXPath: string,
    isXPath: boolean,
    options: WaitForSelectorOptions = {}
  ): Promise<ElementHandle | null> {
    const {
      visible: waitForVisible = false,
      hidden: waitForHidden = false,
      timeout = this.timeoutSettings.timeout()
    } = options;
    const polling = waitForVisible || waitForHidden ? 'raf' : 'mutation';
    const title = `${isXPath ? 'XPath' : 'selector'} "${selectorOrXPath}"${waitForHidden ? ' to be hidden' : ''}`;
    const waitTask = new WaitTask(
        this,
        waitForSelectorPredicate,
        title,
        polling,
        timeout,
        selectorOrXPath,
        isXPath,
        waitForVisible,
        waitForHidden
    );
    const handle = await waitTask.promise;
    if (!handle.asElement()) {
      await handle.dispose();
      return null;
    }
    return handle.asElement();
  }
}

function waitForSelectorPredicate(
  selectorOrXPath: string,
  isXPath: boolean,
  waitForVisible: boolean,
  waitForHidden: boolean
): Node | boolean | null {
  const node = isXPath
    ? document.evaluate(selectorOrXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
    : document.querySelector(selectorOrXPath);
  if (!node) return waitForHidden;
  if (!waitForVisible && !waitForHidden) return node;
  const element = (node.nodeType === Node.TEXT_NODE ? node.parentElement : node) as Element;

  const style = window.getComputedStyle(element);
  const isVisible = style && style.visibility !== 'hidden' && hasVisibleBoundingBox();
  const success = waitForVisible === isVisible || waitForHidden === !isVisible;
  return success ? node : null;

  function hasVisibleBoundingBox(): boolean {
    const rect = element.getBoundingClientRect();
    return !!(rect.top || rect.bottom || rect.width || rect.height);
  }
}

class WaitTask {
  private _domWorld: DOMWorld;
  private _polling: string | number;
  private _timeout: number;
  private _args: any[];
  private _runCount: number;
  private _predicateBody: string;
  private _timeoutTimer?: ReturnType<typeof setTimeout>;
  public promise: Promise<JSHandle>;
  private _resolve!: (handle: JSHandle) => void;
  private _reject!: (e: Error) => void;
  private _terminated?: boolean;

  constructor(
    domWorld: DOMWorld,
    predicateBody: AnyFunction | string,
    title: string,
    polling: string | number,
    timeout: number,
    ...args: any[]
  ) {
    if (helper.isString(polling))
      assert(polling === 'raf' || polling === 'mutation', 'Unknown polling option: ' + polling);
    else if (helper.isNumber(polling)) assert(polling > 0, 'Cannot poll with non-positive interval: ' + polling);
    else throw new Error('Unknown polling options: ' + polling);

    this._domWorld = domWorld;
    this._polling = polling;
    this._timeout = timeout;
    this._predicateBody = helper.isString(predicateBody)
      ? 'return (' + predicateBody + ')'
      : 'return (' + predicateBody + ')(...args)';
    this._args = args;
    this._runCount = 0;
    domWorld._waitTasks.add(this);
    this.promise = new Promise<JSHandle>((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
    // Since page navigation requires us to re-install the pageScript, we should track
    // timeout on our end.
    if (timeout) {
      const timeoutError = new TimeoutError(`waiting for ${title} failed: timeout ${timeout}ms exceeded`);
      this._timeoutTimer = setTimeout(() => this.terminate(timeoutError), timeout);
    }
    this.rerun().catch(noop);
  }

  public terminate(error: Error) {
    this._terminated = true;
    this._reject(error);
    this._cleanup();
  }

  public async rerun() {
    const runCount = ++this._runCount;
    let success: JSHandle | null = null;
    let error: Error | null = null;
    try {
      success = await (await this._domWorld.executionContext()).evaluateHandle(
          waitForPredicatePageFunction,
          this._predicateBody,
          this._polling,
          this._timeout,
          ...this._args
      );
    } catch (e) {
      error = e;
    }

    if (this._terminated || runCount !== this._runCount) {
      if (success) await success.dispose();
      return;
    }

    // Ignore timeouts in pageScript - we track timeouts ourselves.
    // If the frame's execution context has already changed, `frame.evaluate` will
    // throw an error - ignore this predicate run altogether.
    if (!error && (await this._domWorld.evaluate(s => !s, success).catch(() => true))) {
      await success!.dispose();
      return;
    }

    // When the page is navigated, the promise is rejected.
    // We will try again in the new execution context.
    if (error && error.message.includes('Execution context was destroyed')) return;

    // We could have tried to evaluate in a context which was already
    // destroyed.
    if (error && error.message.includes('Cannot find context with specified id')) return;

    if (error) this._reject(error);
    else this._resolve(success!);

    this._cleanup();
  }

  private _cleanup() {
    if (this._timeoutTimer !== undefined) clearTimeout(this._timeoutTimer);

    this._domWorld._waitTasks.delete(this);
  }
}

async function waitForPredicatePageFunction(
  predicateBody: string,
  polling: string,
  timeout: number,
  ...args: any[]
): Promise<any> {
  const predicate = new Function('...args', predicateBody);
  let timedOut = false;
  if (timeout) setTimeout(() => (timedOut = true), timeout);
  if (polling === 'raf') return pollRaf();
  if (polling === 'mutation') return pollMutation();
  if (typeof polling === 'number') return pollInterval(polling);

  function pollMutation(): Promise<any> {
    const success = predicate(...args);
    if (success) return Promise.resolve(success);

    let fulfill: (value?: any) => void;

    const result = new Promise(x => (fulfill = x));
    const observer = new MutationObserver(() => {
      if (timedOut) {
        observer.disconnect();
        fulfill();
      }
      const success = predicate(...args);
      if (success) {
        observer.disconnect();
        fulfill(success);
      }
    });
    observer.observe(document, {
      childList: true,
      subtree: true,
      attributes: true
    });
    return result;
  }

  function pollRaf(): Promise<any> {
    let fulfill: (value?: any) => void;
    const result = new Promise(x => (fulfill = x));
    onRaf();
    return result;

    function onRaf() {
      if (timedOut) {
        fulfill();
        return;
      }
      const success = predicate(...args);
      if (success) fulfill(success);
      else requestAnimationFrame(onRaf);
    }
  }

  function pollInterval(pollInterval: number): Promise<any> {
    let fulfill: (value?: any) => void;
    const result = new Promise(x => (fulfill = x));
    onTimeout();
    return result;

    function onTimeout() {
      if (timedOut) {
        fulfill();
        return;
      }
      const success = predicate(...args);
      if (success) fulfill(success);
      else setTimeout(onTimeout, pollInterval);
    }
  }
}
