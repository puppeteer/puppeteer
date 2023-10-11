import {TimeoutError} from '../common/Errors.js';

/**
 * @internal
 */
export interface DeferredOptions {
  message: string;
  timeout: number;
}

/**
 * Creates and returns a deferred object along with the resolve/reject functions.
 *
 * If the deferred has not been resolved/rejected within the `timeout` period,
 * the deferred gets resolves with a timeout error. `timeout` has to be greater than 0 or
 * it is ignored.
 *
 * @internal
 */
export class Deferred<T, V extends Error = Error> {
  #isResolved = false;
  #isRejected = false;
  #value: T | V | TimeoutError | undefined;
  #resolver: (value: void) => void = () => {};
  #taskPromise = new Promise<void>(resolve => {
    this.#resolver = resolve;
  });
  #timeoutId: ReturnType<typeof setTimeout> | undefined;
  #timeoutError: TimeoutError | undefined;

  constructor(opts?: DeferredOptions) {
    if (opts && opts.timeout > 0) {
      this.#timeoutError = new TimeoutError(opts.message);
      this.#timeoutId = setTimeout(() => {
        this.reject(this.#timeoutError!);
      }, opts.timeout);
    }
  }

  #finish(value: T | V | TimeoutError) {
    clearTimeout(this.#timeoutId);
    this.#value = value;
    this.#resolver();
  }

  resolve(value: T): void {
    if (this.#isRejected || this.#isResolved) {
      return;
    }
    this.#isResolved = true;
    this.#finish(value);
  }

  reject(error: V | TimeoutError): void {
    if (this.#isRejected || this.#isResolved) {
      return;
    }
    this.#isRejected = true;
    this.#finish(error);
  }

  resolved(): boolean {
    return this.#isResolved;
  }

  finished(): boolean {
    return this.#isResolved || this.#isRejected;
  }

  value(): T | V | TimeoutError | undefined {
    return this.#value;
  }

  async valueOrThrow(): Promise<T> {
    await this.#taskPromise;
    if (this.#isRejected) {
      throw this.#value;
    }
    return this.#value as T;
  }

  static create<R, X extends Error = Error>(
    opts?: DeferredOptions
  ): Deferred<R> {
    return new Deferred<R, X>(opts);
  }

  static async race<R>(
    awaitables: Array<Promise<R> | Deferred<R>>
  ): Promise<R> {
    const deferredWithTimeout = new Set<Deferred<R>>();
    try {
      const promises = awaitables.map(value => {
        if (value instanceof Deferred) {
          if (value.#timeoutId) {
            deferredWithTimeout.add(value);
          }

          return value.valueOrThrow();
        }

        return value;
      });
      // eslint-disable-next-line no-restricted-syntax
      return await Promise.race(promises);
    } finally {
      for (const deferred of deferredWithTimeout) {
        // We need to stop the timeout else
        // Node.JS will keep running the event loop till the
        // timer executes
        deferred.reject(new Error('Timeout cleared'));
      }
    }
  }
}
