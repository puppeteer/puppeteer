/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
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
   * Gets a value indicating whether the stack has been disposed.
   * @returns {boolean}
   */
  get disposed(): boolean {
    return this.#disposed;
  }

  /**
   * Alias for `[Symbol.dispose]()`.
   */
  dispose(): void {
    this[disposeSymbol]();
  }

  /**
   * Adds a disposable resource to the top of stack, returning the resource. Has no effect if provided `null` or `undefined`.
   * @template {Disposable | null | undefined} T
   * @param {T} value - A `Disposable` object, `null`, or `undefined`.
   * `null` and `undefined` will not be added, but will be returned.
   * @returns {T} The provided `value`.
   */
  use<T extends Disposable | null | undefined>(value: T): T {
    if (value && typeof value[disposeSymbol] === 'function') {
      this.#stack.push(value);
    }
    return value;
  }

  /**
   * Adds a non-disposable resource and a disposal callback to the top of the stack.
   * @template T
   * @param {T} value - A resource to be disposed.
   * @param {(value: T) => void} onDispose - A callback invoked to dispose the provided value.
   * Will be invoked with `value` as the first parameter.
   * @returns {T} The provided `value`.
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
   * Adds a disposal callback to the top of the stack to be invoked when stack is disposed.
   * @param {() => void} onDispose - A callback to evaluate when this object is disposed.
   * @returns {void}
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
   * @returns {DisposableStack} The new `DisposableStack`.
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
      throw new ReferenceError('A disposed stack can not use anything new');
    }
    const stack = new DisposableStack();
    stack.#stack = this.#stack;
    this.#disposed = true;
    return stack;
  }

  /**
   * Disposes each resource in the stack in last-in-first-out (LIFO) manner
   * @returns {void}
   */
  [disposeSymbol](): void {
    if (this.#disposed) {
      return;
    }
    this.#disposed = true;
    const errors: unknown[] = [];
    for (const resource of this.#stack) {
      try {
        resource[disposeSymbol]();
      } catch (e) {
        errors.push(e);
      }
    }
    if (errors.length === 1) {
      throw errors[0];
    } else if (errors.length > 1) {
      throw new AggregateError(
        errors,
        'Multiple errors occurred during disposal',
      );
    }
  }

  readonly [Symbol.toStringTag] = 'DisposableStack';
}

/**
 * @internal
 */
export class AsyncDisposableStack {
  #disposed = false;
  #stack: AsyncDisposable[] = [];

  /**
   * Gets a value indicating whether the stack has been disposed.
   * @returns {boolean}
   */
  get disposed(): boolean {
    return this.#disposed;
  }

  /**
   * Alias for `[Symbol.asyncDispose]()`.
   */
  async dispose(): Promise<void> {
    await this[asyncDisposeSymbol]();
  }

  /**
   * Adds a AsyncDisposable resource to the top of stack, returning the resource. Has no effect if provided `null` or `undefined`.
   * @template {AsyncDisposable | null | undefined} T
   * @param {T} value - A `AsyncDisposable` object, `null`, or `undefined`.
   * `null` and `undefined` will not be added, but will be returned.
   * @returns {T} The provided `value`.
   */
  use<T extends AsyncDisposable | null | undefined>(value: T): T {
    if (value && typeof value[asyncDisposeSymbol] === 'function') {
      this.#stack.push(value);
    }
    return value;
  }

  /**
   * Adds a non-disposable resource and a disposal callback to the top of the stack.
   * @template T
   * @param {T} value - A resource to be disposed.
   * @param {(value: T) => Promise<void>} onDispose - A callback invoked to dispose the provided value.
   * Will be invoked with `value` as the first parameter.
   * @returns {T} The provided `value`.
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
   * Adds a disposal callback to the top of the stack to be invoked when stack is disposed.
   * @param {() => Promise<void>} onDispose - A callback to evaluate when this object is disposed.
   * @returns {void}
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
   * @returns {AsyncDisposableStack} The new `AsyncDisposableStack`.
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
      throw new ReferenceError('A disposed stack can not use anything new');
    }
    const stack = new AsyncDisposableStack();
    stack.#stack = this.#stack;
    this.#disposed = true;
    return stack;
  }

  /**
   * Disposes each resource in the stack in last-in-first-out (LIFO) manner.
   * @returns {Promise<void>}
   */
  async [asyncDisposeSymbol](): Promise<void> {
    if (this.#disposed) {
      return;
    }
    this.#disposed = true;
    const errors: unknown[] = [];
    for (const resource of this.#stack) {
      try {
        await resource[asyncDisposeSymbol]();
      } catch (e) {
        errors.push(e);
      }
    }
    if (errors.length === 1) {
      throw errors[0];
    } else if (errors.length > 1) {
      throw new AggregateError(
        errors,
        'Multiple errors occurred during async disposal',
      );
    }
  }

  readonly [Symbol.toStringTag] = 'AsyncDisposableStack';
}
