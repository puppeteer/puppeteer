/**
 * Copyright 2022 Google Inc. All rights reserved.
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

import {ElementHandle} from '../api/ElementHandle.js';
import {Realm} from '../api/Frame.js';
import {JSHandle} from '../api/JSHandle.js';
import type {Poller} from '../injected/Poller.js';
import {Deferred} from '../util/Deferred.js';
import {isErrorLike} from '../util/ErrorLike.js';
import {stringifyFunction} from '../util/Function.js';

import {TimeoutError} from './Errors.js';
import {LazyArg} from './LazyArg.js';
import {HandleFor} from './types.js';

/**
 * @internal
 */
export interface WaitTaskOptions {
  polling: 'raf' | 'mutation' | number;
  root?: ElementHandle<Node>;
  timeout: number;
  signal?: AbortSignal;
}

/**
 * @internal
 */
export class WaitTask<T = unknown> {
  #world: Realm;
  #polling: 'raf' | 'mutation' | number;
  #root?: ElementHandle<Node>;

  #fn: string;
  #args: unknown[];

  #timeout?: NodeJS.Timeout;

  #result = Deferred.create<HandleFor<T>>();

  #poller?: JSHandle<Poller<T>>;
  #signal?: AbortSignal;

  constructor(
    world: Realm,
    options: WaitTaskOptions,
    fn: ((...args: unknown[]) => Promise<T>) | string,
    ...args: unknown[]
  ) {
    this.#world = world;
    this.#polling = options.polling;
    this.#root = options.root;
    this.#signal = options.signal;
    this.#signal?.addEventListener(
      'abort',
      () => {
        void this.terminate(this.#signal?.reason);
      },
      {
        once: true,
      }
    );

    switch (typeof fn) {
      case 'string':
        this.#fn = `() => {return (${fn});}`;
        break;
      default:
        this.#fn = stringifyFunction(fn);
        break;
    }
    this.#args = args;

    this.#world.taskManager.add(this);

    if (options.timeout) {
      this.#timeout = setTimeout(() => {
        void this.terminate(
          new TimeoutError(`Waiting failed: ${options.timeout}ms exceeded`)
        );
      }, options.timeout);
    }

    void this.rerun();
  }

  get result(): Promise<HandleFor<T>> {
    return this.#result.valueOrThrow();
  }

  async rerun(): Promise<void> {
    try {
      switch (this.#polling) {
        case 'raf':
          this.#poller = await this.#world.evaluateHandle(
            ({RAFPoller, createFunction}, fn, ...args) => {
              const fun = createFunction(fn);
              return new RAFPoller(() => {
                return fun(...args) as Promise<T>;
              });
            },
            LazyArg.create(context => {
              return context.puppeteerUtil;
            }),
            this.#fn,
            ...this.#args
          );
          break;
        case 'mutation':
          this.#poller = await this.#world.evaluateHandle(
            ({MutationPoller, createFunction}, root, fn, ...args) => {
              const fun = createFunction(fn);
              return new MutationPoller(() => {
                return fun(...args) as Promise<T>;
              }, root || document);
            },
            LazyArg.create(context => {
              return context.puppeteerUtil;
            }),
            this.#root,
            this.#fn,
            ...this.#args
          );
          break;
        default:
          this.#poller = await this.#world.evaluateHandle(
            ({IntervalPoller, createFunction}, ms, fn, ...args) => {
              const fun = createFunction(fn);
              return new IntervalPoller(() => {
                return fun(...args) as Promise<T>;
              }, ms);
            },
            LazyArg.create(context => {
              return context.puppeteerUtil;
            }),
            this.#polling,
            this.#fn,
            ...this.#args
          );
          break;
      }

      await this.#poller.evaluate(poller => {
        void poller.start();
      });

      const result = await this.#poller.evaluateHandle(poller => {
        return poller.result();
      });
      this.#result.resolve(result);

      await this.terminate();
    } catch (error) {
      const badError = this.getBadError(error);
      if (badError) {
        await this.terminate(badError);
      }
    }
  }

  async terminate(error?: Error): Promise<void> {
    this.#world.taskManager.delete(this);

    if (this.#timeout) {
      clearTimeout(this.#timeout);
    }

    if (error && !this.#result.finished()) {
      this.#result.reject(error);
    }

    if (this.#poller) {
      try {
        await this.#poller.evaluateHandle(async poller => {
          await poller.stop();
        });
        if (this.#poller) {
          await this.#poller.dispose();
          this.#poller = undefined;
        }
      } catch {
        // Ignore errors since they most likely come from low-level cleanup.
      }
    }
  }

  /**
   * Not all errors lead to termination. They usually imply we need to rerun the task.
   */
  getBadError(error: unknown): Error | undefined {
    if (isErrorLike(error)) {
      // When frame is detached the task should have been terminated by the IsolatedWorld.
      // This can fail if we were adding this task while the frame was detached,
      // so we terminate here instead.
      if (
        error.message.includes(
          'Execution context is not available in detached frame'
        )
      ) {
        return new Error('Waiting failed: Frame detached');
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

      return error;
    }

    // @ts-expect-error TODO: uncomment once cause is supported in Node types.
    return new Error('WaitTask failed with an error', {
      cause: error,
    });
  }
}

/**
 * @internal
 */
export class TaskManager {
  #tasks: Set<WaitTask> = new Set<WaitTask>();

  add(task: WaitTask<any>): void {
    this.#tasks.add(task);
  }

  delete(task: WaitTask<any>): void {
    this.#tasks.delete(task);
  }

  terminateAll(error?: Error): void {
    for (const task of this.#tasks) {
      void task.terminate(error);
    }
    this.#tasks.clear();
  }

  async rerunAll(): Promise<void> {
    await Promise.all(
      [...this.#tasks].map(task => {
        return task.rerun();
      })
    );
  }
}
