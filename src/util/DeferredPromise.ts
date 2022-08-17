import {TimeoutError} from '../common/Errors.js';

/**
 * @internal
 */

export interface DeferredPromise<T> extends Promise<T> {
  finished: () => boolean;
  resolved: () => boolean;
  resolve: (_: T) => void;
  reject: (_: unknown) => void;
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
  let resolver: (value: T) => void;
  let rejector: (reason?: unknown) => void;
  const taskPromise = new Promise<T>((resolve, reject) => {
    resolver = resolve;
    rejector = reject;
  });
  const timeoutId = setTimeout(() => {
    isRejected = true;
    rejector(new TimeoutError(timeoutMessage));
  }, timeout);
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
    reject: (err: unknown) => {
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
  let resolver: (value: T) => void;
  let rejector: (reason?: unknown) => void;
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
    reject: (err: unknown) => {
      isRejected = true;
      rejector(err);
    },
  });
}
