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

declare global {
  interface SymbolConstructor {
    /**
     * A method that is used to release resources held by an object. Called by
     * the semantics of the `using` statement.
     */
    readonly dispose: unique symbol;

    /**
     * A method that is used to asynchronously release resources held by an
     * object. Called by the semantics of the `await using` statement.
     */
    readonly asyncDispose: unique symbol;
  }

  interface Disposable {
    [Symbol.dispose](): void;
  }

  interface AsyncDisposable {
    [Symbol.asyncDispose](): PromiseLike<void>;
  }
}

(Symbol as any).dispose ??= Symbol('dispose');
(Symbol as any).asyncDispose ??= Symbol('asyncDispose');

/**
 * @internal
 */
export const disposeSymbol: typeof Symbol.dispose = Symbol.dispose;

/**
 * @internal
 */
export const asyncDisposeSymbol: typeof Symbol.asyncDispose =
  Symbol.asyncDispose;

/**
 * @internal
 */
export class DisposableStack {
  #disposed = false;
  #stack: Disposable[] = [];

  /**
   * Returns a value indicating whether this stack has been disposed.
   */
  get disposed(): boolean {
    return this.#disposed;
  }

  /**
   * Disposes each resource in the stack in the reverse order that they were added.
   */
  dispose(): void {
    if (this.#disposed) {
      return;
    }
    this.#disposed = true;
    for (const resource of this.#stack.reverse()) {
      resource[disposeSymbol]();
    }
  }

  /**
   * Adds a disposable resource to the stack, returning the resource.
   *
   * @param value - The resource to add. `null` and `undefined` will not be added,
   * but will be returned.
   * @returns The provided `value`.
   */
  use<T extends Disposable | null | undefined>(value: T): T {
    if (value) {
      this.#stack.push(value);
    }
    return value;
  }

  /**
   * Adds a value and associated disposal callback as a resource to the stack.
   *
   * @param value - The value to add.
   * @param onDispose - The callback to use in place of a `[disposeSymbol]()`
   * method. Will be invoked with `value` as the first parameter.
   * @returns The provided `value`.
   */
  adopt<T>(value: T, onDispose: (value: T) => void): T {
    this.#stack.push({
      [disposeSymbol]() {
        onDispose(value);
      },
    });
    return value;
  }

  /**
   * Adds a callback to be invoked when the stack is disposed.
   */
  defer(onDispose: () => void): void {
    this.#stack.push({
      [disposeSymbol]() {
        onDispose();
      },
    });
  }

  /**
   * Move all resources out of this stack and into a new `DisposableStack`, and
   * marks this stack as disposed.
   *
   * @example
   *
   * ```ts
   * class C {
   *   #res1: Disposable;
   *   #res2: Disposable;
   *   #disposables: DisposableStack;
   *   constructor() {
   *     // stack will be disposed when exiting constructor for any reason
   *     using stack = new DisposableStack();
   *
   *     // get first resource
   *     this.#res1 = stack.use(getResource1());
   *
   *     // get second resource. If this fails, both `stack` and `#res1` will be disposed.
   *     this.#res2 = stack.use(getResource2());
   *
   *     // all operations succeeded, move resources out of `stack` so that
   *     // they aren't disposed when constructor exits
   *     this.#disposables = stack.move();
   *   }
   *
   *   [disposeSymbol]() {
   *     this.#disposables.dispose();
   *   }
   * }
   * ```
   */
  move(): DisposableStack {
    if (this.#disposed) {
      throw new ReferenceError('a disposed stack can not use anything new'); // step 3
    }
    const stack = new DisposableStack(); // step 4-5
    stack.#stack = this.#stack;
    this.#disposed = true;
    return stack;
  }

  [disposeSymbol] = this.dispose;

  readonly [Symbol.toStringTag] = 'DisposableStack';
}

/**
 * @internal
 */
export class AsyncDisposableStack {
  #disposed = false;
  #stack: AsyncDisposable[] = [];

  /**
   * Returns a value indicating whether this stack has been disposed.
   */
  get disposed(): boolean {
    return this.#disposed;
  }

  /**
   * Disposes each resource in the stack in the reverse order that they were added.
   */
  async dispose(): Promise<void> {
    if (this.#disposed) {
      return;
    }
    this.#disposed = true;
    for (const resource of this.#stack.reverse()) {
      await resource[asyncDisposeSymbol]();
    }
  }

  /**
   * Adds a disposable resource to the stack, returning the resource.
   *
   * @param value - The resource to add. `null` and `undefined` will not be added,
   * but will be returned.
   * @returns The provided {@link value}.
   */
  use<T extends AsyncDisposable | null | undefined>(value: T): T {
    if (value) {
      this.#stack.push(value);
    }
    return value;
  }

  /**
   * Adds a value and associated disposal callback as a resource to the stack.
   *
   * @param value - The value to add.
   * @param onDispose - The callback to use in place of a `[disposeSymbol]()`
   * method. Will be invoked with `value` as the first parameter.
   * @returns The provided {@link value}.
   */
  adopt<T>(value: T, onDispose: (value: T) => Promise<void>): T {
    this.#stack.push({
      [asyncDisposeSymbol]() {
        return onDispose(value);
      },
    });
    return value;
  }

  /**
   * Adds a callback to be invoked when the stack is disposed.
   */
  defer(onDispose: () => Promise<void>): void {
    this.#stack.push({
      [asyncDisposeSymbol]() {
        return onDispose();
      },
    });
  }

  /**
   * Move all resources out of this stack and into a new `DisposableStack`, and
   * marks this stack as disposed.
   *
   * @example
   *
   * ```ts
   * class C {
   *   #res1: Disposable;
   *   #res2: Disposable;
   *   #disposables: DisposableStack;
   *   constructor() {
   *     // stack will be disposed when exiting constructor for any reason
   *     using stack = new DisposableStack();
   *
   *     // get first resource
   *     this.#res1 = stack.use(getResource1());
   *
   *     // get second resource. If this fails, both `stack` and `#res1` will be disposed.
   *     this.#res2 = stack.use(getResource2());
   *
   *     // all operations succeeded, move resources out of `stack` so that
   *     // they aren't disposed when constructor exits
   *     this.#disposables = stack.move();
   *   }
   *
   *   [disposeSymbol]() {
   *     this.#disposables.dispose();
   *   }
   * }
   * ```
   */
  move(): AsyncDisposableStack {
    if (this.#disposed) {
      throw new ReferenceError('a disposed stack can not use anything new'); // step 3
    }
    const stack = new AsyncDisposableStack(); // step 4-5
    stack.#stack = this.#stack;
    this.#disposed = true;
    return stack;
  }

  [asyncDisposeSymbol] = this.dispose;

  readonly [Symbol.toStringTag] = 'AsyncDisposableStack';
}
