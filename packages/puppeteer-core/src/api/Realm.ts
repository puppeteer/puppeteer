/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {TimeoutSettings} from '../common/TimeoutSettings.js';
import type {EvaluateFunc, HandleFor} from '../common/types.js';
import {TaskManager, WaitTask} from '../common/WaitTask.js';
import {disposeSymbol} from '../util/disposable.js';

import type {ElementHandle} from './ElementHandle.js';
import type {Environment} from './Environment.js';
import type {Extension} from './Extension.js';
import type {JSHandle} from './JSHandle.js';

/**
 * @public
 */
export abstract class Realm {
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
   * This method returns the origin that created the Realm.
   * @experimental
   * @example
   * `chrome-extension://<chrome-extension-id>`
   */
  abstract get origin(): string | undefined;
  /**
   * This method returns the extension that created this realm
   * if the realm was created from an Extension.
   * An example of this is an extension content script running
   * on a page.
   * @experimental
   */
  abstract extension(): Promise<Extension | null>;

  /** @internal */
  abstract adoptHandle<T extends JSHandle<Node>>(handle: T): Promise<T>;

  /** @internal */
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
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>,
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
