import {TimeoutError} from '../common/Errors.js';

/**
 * @internal
 */
export interface DeferredPromise<T> extends Promise<T> {
  finished: () => boolean;
  resolved: () => boolean;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

/**
 * @internal
 */
export interface DeferredPromiseOptions {
  message: string;
  timeout: number;
}

/**
 * Creates and returns a promise along with the resolve/reject functions.
 *
 * If the promise has not been resolved/rejected within the `timeout` period,
 * the promise gets rejected with a timeout error. `timeout` has to be greater than 0 or
 * it is ignored.
 *
 * @internal
 */
export function createDeferredPromise<T>(
  opts?: DeferredPromiseOptions
): DeferredPromise<T> {
  let isResolved = false;
  let isRejected = false;
  let resolver: (value: T) => void;
  let rejector: (reason?: unknown) => void;
  const taskPromise = new Promise<T>((resolve, reject) => {
    resolver = resolve;
    rejector = reject;
  });
  const timeoutId =
    opts && opts.timeout > 0
      ? setTimeout(() => {
          isRejected = true;
          rejector(new TimeoutError(opts.message));
        }, opts.timeout)
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
    reject: (err?: unknown) => {
      clearTimeout(timeoutId);
      isRejected = true;
      rejector(err);
    },
  });
}
