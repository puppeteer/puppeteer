import {TimeoutError} from '../common/Errors.js';
import {DEFERRED_PROMISE_DEBUG_TIMEOUT} from '../environment.js';

/**
 * @internal
 */
export interface DeferredPromise<T> extends Promise<T> {
  finished: () => boolean;
  resolved: () => boolean;
  resolve: (_: T) => void;
  reject: (_: Error) => void;
}

interface DeferredPromiseOptions {
  message?: string;
  timeout?: number;
  isDebug?: boolean;
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
  if (DEFERRED_PROMISE_DEBUG_TIMEOUT > 0 && !timeout) {
    timeout = DEFERRED_PROMISE_DEBUG_TIMEOUT;
  }
  let isResolved = false;
  let isRejected = false;
  let resolver = (_: T): void => {};
  let rejector = (_: Error) => {};
  const taskPromise = new Promise<T>((resolve, reject) => {
    resolver = resolve;
    rejector = reject;
  });
  const timeoutId = message
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
