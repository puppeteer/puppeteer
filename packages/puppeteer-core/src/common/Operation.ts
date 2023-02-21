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

import type {Awaitable} from './types.js';

/**
 * Operations are promises that can have <a
 * href="https://en.wikipedia.org/wiki/Side_effect_(computer_science)">effects</a>
 * added on them (through {@link Operation.effect}).
 *
 * Semantically-speaking, adding an effect equates to guaranteeing the operation
 * causes the added effect.
 *
 * The first effect that errors will propogate its error back to the operation.
 *
 * @example
 *
 * ```ts
 * await input.click().effect(async () => {
 *   await page.waitForNavigation();
 * });
 * ```
 *
 * @remarks
 *
 * Adding effects to a completed operation will result in an error. This occurs
 * when either
 *
 * 1. the effects are added asynchronously or
 * 2. the operation was awaited before effects were added.
 *
 * For example for (1),
 *
 * ```ts
 * const operation = input.click();
 * await new Promise(resolve => setTimeout(resolve, 100));
 * await operation.effect(() => console.log('Works!')); // This will throw because of (1).
 * ```
 *
 * For example for (2),
 *
 * ```ts
 * const operation = await input.click();
 * await operation.effect(() => console.log('Works!')); // This will throw because of (2).
 * ```
 *
 * Tl;dr, effects **must** be added synchronously (no `await` statements between
 * the time the operation is created and the effect is added).
 *
 * @internal
 */
export class Operation<T> extends Promise<T> {
  /**
   * @internal
   */
  static create<T>(fn: () => Awaitable<T>, delay = 0): Operation<T> {
    return new Operation((resolve, reject) => {
      setTimeout(async () => {
        try {
          resolve(await fn());
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }

  #settled = false;
  #effects: Array<Awaitable<unknown>> = [];
  #error?: unknown;

  /**
   * Adds the given effect.
   *
   * @example
   *
   * ```ts
   * await input.click().effect(async () => {
   *   await page.waitForNavigation();
   * });
   * ```
   *
   * @param effect - The effect to add.
   * @returns `this` for chaining.
   *
   * @public
   */
  effect(effect: () => Awaitable<void>): this {
    if (this.#settled) {
      throw new Error(
        'Attempted to add effect to a completed operation. Make sure effects are added synchronously after the operation is created.'
      );
    }
    this.#effects.push(
      (async () => {
        try {
          return await effect();
        } catch (error) {
          // Note we can't just push a rejected promise to #effects. This is because
          // all rejections must be handled somewhere up in the call stack and since
          // this function is synchronous, it is not handled anywhere in the call
          // stack.
          this.#error = error;
        }
      })()
    );
    return this;
  }

  get #effectsPromise(): Promise<unknown> {
    if (this.#error) {
      return Promise.reject(this.#error);
    }
    return Promise.all(this.#effects);
  }

  override then<TResult1 = T, TResult2 = never>(
    onfulfilled?: (value: T) => TResult1 | PromiseLike<TResult1>,
    onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>
  ): Operation<TResult1 | TResult2> {
    return super.then(
      value => {
        this.#settled = true;
        return this.#effectsPromise.then(() => {
          if (!onfulfilled) {
            return value;
          }
          return onfulfilled(value);
        }, onrejected);
      },
      reason => {
        this.#settled = true;
        if (!onrejected) {
          throw reason;
        }
        return onrejected(reason);
      }
    ) as Operation<TResult1 | TResult2>;
  }
}
