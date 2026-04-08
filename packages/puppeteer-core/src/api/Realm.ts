/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {TimeoutSettings} from '../common/TimeoutSettings.js';
import type {
  EvaluateFunc,
  HandleFor,
  InnerLazyParams,
} from '../common/types.js';
import {TaskManager, WaitTask} from '../common/WaitTask.js';
import {disposeSymbol} from '../util/disposable.js';

import type {ElementHandle} from './ElementHandle.js';
import type {Environment} from './Environment.js';
import type {Extension} from './Extension.js';
import type {JSHandle} from './JSHandle.js';

/**
 * @public
 */
export abstract class Realm implements Disposable {
  /** @internal */
  protected readonly timeoutSettings: TimeoutSettings;
  /** @internal */
  readonly taskManager = new TaskManager();
  /** @internal */
  constructor(timeoutSettings: TimeoutSettings) {
    this.timeoutSettings = timeoutSettings;
  }
  /** @internal */
  abstract get environment(): Environment;

  /**
   * The identifier for this realm.
   *
   * @public
   */
  abstract get worldId(): string | symbol;

  abstract set worldId(worldId: string | symbol);

  /**
   * This method returns the extension from the ExecutionContext paired with the realm
   * at the moment of the execution.
   *
   * @public
   */
  abstract extension(): Promise<Extension | null>;

  /** @internal */
  abstract adoptHandle<T extends JSHandle<Node>>(handle: T): Promise<T>;

  /** @internal */
  abstract transferHandle<T extends JSHandle<Node>>(handle: T): Promise<T>;

  /** @public */
  abstract evaluateHandle<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>,
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>>;

  /** @public */
  abstract evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>,
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>>;

  /** @public */
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
      ...args,
    );
    return await waitTask.result;
  }

  /** @internal */
  abstract adoptBackendNode(backendNodeId?: number): Promise<JSHandle<Node>>;

  /** @internal */
  get disposed(): boolean {
    return this.#disposed;
  }

  /** @internal */
  #disposed = false;
  /** @internal */
  dispose(): void {
    this.#disposed = true;
    this.taskManager.terminateAll(
      new Error('waitForFunction failed: frame got detached.'),
    );
  }
  /** @internal */
  [disposeSymbol](): void {
    this.dispose();
  }
}
