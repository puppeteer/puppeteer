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

import {TimeoutSettings} from '../common/TimeoutSettings.js';
import {
  EvaluateFunc,
  EvaluateFuncWith,
  HandleFor,
  InnerLazyParams,
  NodeFor,
} from '../common/types.js';
import {getPageContent, withSourcePuppeteerURLIfNone} from '../common/util.js';
import {TaskManager, WaitTask} from '../common/WaitTask.js';
import {assert} from '../util/assert.js';

import {ClickOptions, ElementHandle} from './ElementHandle.js';
import {KeyboardTypeOptions} from './Input.js';
import {JSHandle} from './JSHandle.js';

/**
 * @internal
 */
export abstract class Realm implements Disposable {
  #timeoutSettings: TimeoutSettings;
  #taskManager = new TaskManager();

  constructor(timeoutSettings: TimeoutSettings) {
    this.#timeoutSettings = timeoutSettings;
  }

  protected get timeoutSettings(): TimeoutSettings {
    return this.#timeoutSettings;
  }

  get taskManager(): TaskManager {
    return this.#taskManager;
  }

  abstract adoptHandle<T extends JSHandle<Node>>(handle: T): Promise<T>;
  abstract transferHandle<T extends JSHandle<Node>>(handle: T): Promise<T>;
  abstract evaluateHandle<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>,
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>>;
  abstract evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>,
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>>;

  async document(): Promise<ElementHandle<Document>> {
    // TODO(#10813): Implement document caching.
    return await this.evaluateHandle(() => {
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

  async $x(expression: string): Promise<Array<ElementHandle<Node>>> {
    using document = await this.document();
    return await document.$x(expression);
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

  async content(): Promise<string> {
    return await this.evaluate(getPageContent);
  }

  async title(): Promise<string> {
    return this.evaluate(() => {
      return document.title;
    });
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

  async click(
    selector: string,
    options?: Readonly<ClickOptions>
  ): Promise<void> {
    using handle = await this.$(selector);
    assert(handle, `No element found for selector: ${selector}`);
    await handle.click(options);
    await handle.dispose();
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
    return await handle.select(...values);
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

  get disposed(): boolean {
    return this.#disposed;
  }

  #disposed = false;
  [Symbol.dispose](): void {
    this.#disposed = true;
    this.taskManager.terminateAll(
      new Error('waitForFunction failed: frame got detached.')
    );
  }
}
