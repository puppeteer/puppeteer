import {
  createDeferredPromise,
  DeferredPromise,
} from '../util/DeferredPromise.js';
import {assert} from '../util/assert.js';

interface Poller<T> {
  start(): Promise<T>;
  stop(): Promise<void>;
  result(): Promise<T>;
}

export class MutationPoller<T> implements Poller<T> {
  #fn: () => Promise<T>;

  #root: Node;

  #observer?: MutationObserver;
  #promise?: DeferredPromise<T>;
  constructor(fn: () => Promise<T>, root: Node) {
    this.#fn = fn;
    this.#root = root;
  }

  async start(): Promise<T> {
    const promise = (this.#promise = createDeferredPromise<T>());
    const result = await this.#fn();
    if (result) {
      promise.resolve(result);
      return result;
    }

    this.#observer = new MutationObserver(async () => {
      const result = await this.#fn();
      if (!result) {
        return;
      }
      promise.resolve(result);
      await this.stop();
    });
    this.#observer.observe(this.#root, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    return this.#promise;
  }

  async stop(): Promise<void> {
    assert(this.#promise, 'Polling never started.');
    if (!this.#promise.finished()) {
      this.#promise.reject(new Error('Polling stopped'));
    }
    if (this.#observer) {
      this.#observer.disconnect();
    }
  }

  result(): Promise<T> {
    assert(this.#promise, 'Polling never started.');
    return this.#promise;
  }
}

export class RAFPoller<T> implements Poller<T> {
  #fn: () => Promise<T>;
  #promise?: DeferredPromise<T>;
  constructor(fn: () => Promise<T>) {
    this.#fn = fn;
  }

  async start(): Promise<T> {
    const promise = (this.#promise = createDeferredPromise<T>());
    const result = await this.#fn();
    if (result) {
      promise.resolve(result);
      return result;
    }

    const poll = async () => {
      if (promise.finished()) {
        return;
      }
      const result = await this.#fn();
      if (!result) {
        window.requestAnimationFrame(poll);
        return;
      }
      promise.resolve(result);
      await this.stop();
    };
    window.requestAnimationFrame(poll);

    return this.#promise;
  }

  async stop(): Promise<void> {
    assert(this.#promise, 'Polling never started.');
    if (!this.#promise.finished()) {
      this.#promise.reject(new Error('Polling stopped'));
    }
  }

  result(): Promise<T> {
    assert(this.#promise, 'Polling never started.');
    return this.#promise;
  }
}

export class IntervalPoller<T> implements Poller<T> {
  #fn: () => Promise<T>;
  #ms: number;

  #interval?: NodeJS.Timer;
  #promise?: DeferredPromise<T>;
  constructor(fn: () => Promise<T>, ms: number) {
    this.#fn = fn;
    this.#ms = ms;
  }

  async start(): Promise<T> {
    const promise = (this.#promise = createDeferredPromise<T>());
    const result = await this.#fn();
    if (result) {
      promise.resolve(result);
      return result;
    }

    this.#interval = setInterval(async () => {
      const result = await this.#fn();
      if (!result) {
        return;
      }
      promise.resolve(result);
      await this.stop();
    }, this.#ms);

    return this.#promise;
  }

  async stop(): Promise<void> {
    assert(this.#promise, 'Polling never started.');
    if (!this.#promise.finished()) {
      this.#promise.reject(new Error('Polling stopped'));
    }
    if (this.#interval) {
      clearInterval(this.#interval);
    }
  }

  result(): Promise<T> {
    assert(this.#promise, 'Polling never started.');
    return this.#promise;
  }
}
