/**
 * Copyright 2023 Google Inc. All rights reserved.
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

import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {ClickOptions, ElementHandle} from '../../api/ElementHandle.js';
import {Realm as RealmBase} from '../../api/Frame.js';
import {KeyboardTypeOptions} from '../../api/Input.js';
import {JSHandle as BaseJSHandle} from '../../api/JSHandle.js';
import {assert} from '../../util/assert.js';
import {TimeoutSettings} from '../TimeoutSettings.js';
import {
  EvaluateFunc,
  EvaluateFuncWith,
  HandleFor,
  InnerLazyParams,
  NodeFor,
} from '../types.js';
import {withSourcePuppeteerURLIfNone} from '../util.js';
import {TaskManager, WaitTask} from '../WaitTask.js';

import {BrowsingContext} from './BrowsingContext.js';
import {JSHandle} from './JSHandle.js';
import {Realm} from './Realm.js';
/**
 * A unique key for {@link SandboxChart} to denote the default world.
 * Realms are automatically created in the default sandbox.
 *
 * @internal
 */
export const MAIN_SANDBOX = Symbol('mainSandbox');
/**
 * A unique key for {@link SandboxChart} to denote the puppeteer sandbox.
 * This world contains all puppeteer-internal bindings/code.
 *
 * @internal
 */
export const PUPPETEER_SANDBOX = Symbol('puppeteerSandbox');

/**
 * @internal
 */
export interface SandboxChart {
  [key: string]: Sandbox;
  [MAIN_SANDBOX]: Sandbox;
  [PUPPETEER_SANDBOX]: Sandbox;
}

/**
 * @internal
 */
export class Sandbox implements RealmBase {
  #realm: Realm;

  #timeoutSettings: TimeoutSettings;
  #taskManager = new TaskManager();

  constructor(
    // TODO: We should split the Realm and BrowsingContext
    realm: Realm | BrowsingContext,
    timeoutSettings: TimeoutSettings
  ) {
    this.#realm = realm;
    this.#timeoutSettings = timeoutSettings;

    // TODO: Tack correct realm similar to BrowsingContexts
    this.#realm.connection.on(
      Bidi.ChromiumBidi.Script.EventNames.RealmCreated,
      () => {
        void this.#taskManager.rerunAll();
      }
    );
  }

  dispose(): void {
    this.#taskManager.terminateAll(
      new Error('waitForFunction failed: frame got detached.')
    );
  }

  get taskManager(): TaskManager {
    return this.#taskManager;
  }

  async document(): Promise<ElementHandle<Document>> {
    // TODO(#10813): Implement document caching.
    return await this.#realm.evaluateHandle(() => {
      return document;
    });
  }

  async $<Selector extends string>(
    selector: Selector
  ): Promise<ElementHandle<NodeFor<Selector>> | null> {
    using document = await this.document();
    return await document.$(selector);
  }

  async $$<Selector extends string>(
    selector: Selector
  ): Promise<Array<ElementHandle<NodeFor<Selector>>>> {
    using document = await this.document();
    return await document.$$(selector);
  }

  async $eval<
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
    using document = await this.document();
    return await document.$eval(selector, pageFunction, ...args);
  }

  async $$eval<
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
    using document = await this.document();
    return await document.$$eval(selector, pageFunction, ...args);
  }

  async $x(expression: string): Promise<Array<ElementHandle<Node>>> {
    using document = await this.document();
    return await document.$x(expression);
  }

  async evaluateHandle<
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
    return this.#realm.evaluateHandle(pageFunction, ...args);
  }

  async evaluate<
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
    return this.#realm.evaluate(pageFunction, ...args);
  }

  async adoptHandle<T extends BaseJSHandle<Node>>(handle: T): Promise<T> {
    return (await this.evaluateHandle(node => {
      return node;
    }, handle)) as unknown as T;
  }

  async transferHandle<T extends BaseJSHandle<Node>>(handle: T): Promise<T> {
    if ((handle as unknown as JSHandle).context() === this.#realm) {
      return handle;
    }
    const transferredHandle = await this.evaluateHandle(node => {
      return node;
    }, handle);

    await handle.dispose();
    return transferredHandle as unknown as T;
  }

  waitForFunction<
    Params extends unknown[],
    Func extends EvaluateFunc<InnerLazyParams<Params>> = EvaluateFunc<
      InnerLazyParams<Params>
    >,
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

  // ///////////////////
  // // Input methods //
  // ///////////////////
  async click(
    selector: string,
    options?: Readonly<ClickOptions>
  ): Promise<void> {
    using handle = await this.$(selector);
    assert(handle, `No element found for selector: ${selector}`);
    await handle.click(options);
  }

  async focus(selector: string): Promise<void> {
    using handle = await this.$(selector);
    assert(handle, `No element found for selector: ${selector}`);
    await handle.focus();
  }

  async hover(selector: string): Promise<void> {
    using handle = await this.$(selector);
    assert(handle, `No element found for selector: ${selector}`);
    await handle.hover();
  }

  async select(selector: string, ...values: string[]): Promise<string[]> {
    using handle = await this.$(selector);
    assert(handle, `No element found for selector: ${selector}`);
    const result = await handle.select(...values);
    return result;
  }

  async tap(selector: string): Promise<void> {
    using handle = await this.$(selector);
    assert(handle, `No element found for selector: ${selector}`);
    await handle.tap();
  }

  async type(
    selector: string,
    text: string,
    options?: Readonly<KeyboardTypeOptions>
  ): Promise<void> {
    using handle = await this.$(selector);
    assert(handle, `No element found for selector: ${selector}`);
    await handle.type(text, options);
  }
}
