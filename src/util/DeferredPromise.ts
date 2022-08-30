import {TimeoutError} from '../common/Errors.js';
import {deferredPromiseDebugTimeout} from '../environment.js';

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
 * Creates an returns a promise along with the resolve/reject functions.
 *
 * If the promise has not been resolved/rejected withing the `timeout` period,
 * the promise gets rejected with a timeout error.
 *
 * @internal
 */
export function createDeferredPromiseWithTimer<T>(
  timeoutMessage: string,
  timeout = 5000
): DeferredPromise<T> {
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
          rejector(new TimeoutError(timeoutMessage));
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
      clearTimeout(timeoutId);
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

/**
 * Creates an returns a promise along with the resolve/reject functions.
 *
 * @internal
 */
export function createDeferredPromise<T>(): DeferredPromise<T> {
  let isResolved = false;
  let isRejected = false;
  let resolver = (_: T): void => {};
  let rejector = (_: Error) => {};
  const taskPromise = new Promise<T>((resolve, reject) => {
    resolver = resolve;
    rejector = reject;
  });
  return Object.assign(taskPromise, {
    resolved: () => {
      return isResolved;
    },
    finished: () => {
      return isResolved || isRejected;
    },
    resolve: (value: T) => {
      isResolved = true;
      resolver(value);
    },
    reject: (err: Error) => {
      isRejected = true;
      rejector(err);
    },
  });
}

/**
 * @internal
 */
export function createDebuggableDeferredPromise<T>(
  timeoutMessage: string
): DeferredPromise<T> {
  if (deferredPromiseDebugTimeout > 0) {
    return createDeferredPromiseWithTimer(
      timeoutMessage,
      deferredPromiseDebugTimeout
    );
  }
  return createDeferredPromise();
}
