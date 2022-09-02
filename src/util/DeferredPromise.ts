import {TimeoutError} from '../common/Errors.js';

/**
 * @internal
 */
export interface DeferredPromise<T> extends Promise<T> {
  finished: () => boolean;
  resolved: () => boolean;
  resolve: (_: T) => void;
  reject: (_: Error) => void;
}

/**
 * @internal
 */
export interface DeferredPromiseOptions {
  message?: string;
  timeout?: number;
}

/**
 * Creates and returns a promise along with the resolve/reject functions.
 *
 * If the promise has not been resolved/rejected within the `timeout` period,
 * the promise gets rejected with a timeout error.
 *
 * @internal
 */
export function createDeferredPromise<T>({
  message,
  timeout = 5000,
}: DeferredPromiseOptions = {}): DeferredPromise<T> {
  let isResolved = false;
  let isRejected = false;
  let resolver = (_: T): void => {};
  let rejector = (_: Error) => {};
  const taskPromise = new Promise<T>((resolve, reject) => {
    resolver = resolve;
    rejector = reject;
  });
  const timeoutId =
    timeout > 0
      ? setTimeout(() => {
          isRejected = true;
          rejector(new TimeoutError(message));
        }, timeout)
      : undefined;
  return Object.assign(taskPromise, {
    resolved: () => {
      return isResolved;
    },
    finished: () => {
      return isResolved || isRejected;
    },
    resolve: (value: T) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      isResolved = true;
      resolver(value);
    },
    reject: (err: Error) => {
      clearTimeout(timeoutId);
      isRejected = true;
      rejector(err);
    },
  });
}
