import 'disposablestack/auto';

declare global {
  class DisposableStack implements Disposable {
    constructor();

    /**
     * Gets a value indicating whether the stack has been disposed.
     */
    get disposed(): boolean;

    /**
     * Alias for `[Symbol.dispose]()`.
     */
    dispose(): void;

    /**
     * Adds a resource to the top of the stack. Has no effect if provided `null`
     * or `undefined`.
     */
    use<T>(value: T): T;

    /**
     * Adds a non-disposable resource and a disposal callback to the top of the
     * stack.
     */
    adopt<T>(value: T, onDispose: (value: T) => void): T;

    /**
     * Adds a disposal callback to the top of the stack.
     */
    defer(onDispose: () => void): void;

    /**
     * Moves all resources currently in this stack into a new `DisposableStack`.
     */
    move(): DisposableStack;

    /**
     * Disposes of resources within this object.
     */
    [Symbol.dispose](): void;
  }

  class AsyncDisposableStack implements AsyncDisposable {
    constructor();

    /**
     * Gets a value indicating whether the stack has been disposed.
     */
    get disposed(): boolean;

    /**
     * Alias for `[Symbol.dispose]()`.
     */
    dispose(): void;

    /**
     * Adds a resource to the top of the stack. Has no effect if provided `null`
     * or `undefined`.
     */
    use<T>(value: T): T;

    /**
     * Adds a non-disposable resource and a disposal callback to the top of the
     * stack.
     */
    adopt<T>(value: T, onDispose: (value: T) => Promise<void>): T;

    /**
     * Adds a disposal callback to the top of the stack.
     */
    defer(onDispose: () => Promise<void>): void;

    /**
     * Moves all resources currently in this stack into a new `DisposableStack`.
     */
    move(): AsyncDisposableStack;

    /**
     * Disposes of resources within this object.
     */
    [Symbol.asyncDispose](): Promise<void>;
  }
}

export const Symbol = globalThis.Symbol;
export const DisposableStack = (
  globalThis as unknown as {DisposableStack: DisposableStack}
).DisposableStack;
export const AsyncDisposableStack = (
  globalThis as unknown as {AsyncDisposableStack: AsyncDisposableStack}
).AsyncDisposableStack;
