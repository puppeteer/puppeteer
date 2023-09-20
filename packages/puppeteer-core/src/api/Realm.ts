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

import {type TimeoutSettings} from '../common/TimeoutSettings.js';
import {
  type EvaluateFunc,
  type HandleFor,
  type InnerLazyParams,
} from '../common/types.js';
import {TaskManager, WaitTask} from '../common/WaitTask.js';
import {disposeSymbol} from '../util/disposable.js';

import {type ElementHandle} from './ElementHandle.js';
import {type Environment} from './Environment.js';
import {type JSHandle} from './JSHandle.js';

/**
 * @internal
 */
export abstract class Realm implements Disposable {
  protected readonly timeoutSettings: TimeoutSettings;
  readonly taskManager = new TaskManager();

  constructor(timeoutSettings: TimeoutSettings) {
    this.timeoutSettings = timeoutSettings;
  }

  abstract get environment(): Environment;

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

  async waitForFunction<
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
      timeout = this.timeoutSettings.timeout(),
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
    return await waitTask.result;
  }

  abstract adoptBackendNode(backendNodeId?: number): Promise<JSHandle<Node>>;

  get disposed(): boolean {
    return this.#disposed;
  }

  #disposed = false;
  /** @internal */
  [disposeSymbol](): void {
    this.#disposed = true;
    this.taskManager.terminateAll(
      new Error('waitForFunction failed: frame got detached.')
    );
  }
}
