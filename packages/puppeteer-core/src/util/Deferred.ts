import {TimeoutError} from '../common/Errors.js';

/**
 * @internal
 */
export interface Deferred<T> {
  finished: () => boolean;
  resolved: () => boolean;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  value: () => T | Error | undefined;
  valueOrThrow: () => Promise<T>;
}

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
export function createDeferred<T>(opts?: DeferredOptions): Deferred<T> {
  let isResolved = false;
  let isRejected = false;
  let _value: T | Error | undefined;
  let resolver: (value: void) => void;
  const taskPromise = new Promise<void>(resolve => {
    resolver = resolve;
  });
  const timeoutId =
    opts && opts.timeout > 0
      ? setTimeout(() => {
          reject(new TimeoutError(opts.message));
        }, opts.timeout)
      : undefined;

  function finish(value: T | Error) {
    clearTimeout(timeoutId);
    _value = value;
    resolver();
  }

  function resolve(value: T) {
    if (isRejected || isResolved) {
      return;
    }
    isResolved = true;
    finish(value);
  }

  function reject(error: Error) {
    if (isRejected || isResolved) {
      return;
    }
    isRejected = true;
    finish(error);
  }

  return {
    resolved: () => {
      return isResolved;
    },
    finished: () => {
      return isResolved || isRejected;
    },
    resolve,
    reject,
    value: () => {
      return _value;
    },
    async valueOrThrow() {
      await taskPromise;
      if (isRejected) {
        throw _value;
      }
      return _value as T;
    },
  };
}
