import {
  IntervalPoller,
  MutationPoller,
  Poller,
  RAFPoller,
} from '../injected/Poller.js';
import {createFunction} from '../injected/util.js';
import {assert} from '../util/assert.js';
import {createDeferredPromise} from '../util/DeferredPromise.js';
import {ElementHandle} from './ElementHandle.js';
import {TimeoutError} from './Errors.js';
import {IsolatedWorld} from './IsolatedWorld.js';
import {JSHandle} from './JSHandle.js';
import {HandleFor} from './types.js';

/**
 * @internal
 */
export interface WaitTaskOptions {
  polling: 'raf' | 'mutation' | number;
  timeout: number;
  root?: ElementHandle<Node>;
}

/**
 * @internal
 */
export class WaitTask<T = unknown> {
  #world: IsolatedWorld;
  #polling: 'raf' | 'mutation' | number;
  #root?: ElementHandle<Node>;

  #fn: (...args: unknown[]) => Promise<T>;
  #args: unknown[];

  #timeout?: NodeJS.Timeout;

  #result = createDeferredPromise<HandleFor<T>>();

  #poller?: JSHandle<Poller<T>>;

  constructor(
    world: IsolatedWorld,
    options: WaitTaskOptions,
    fn: (...args: unknown[]) => Promise<T>,
    ...args: unknown[]
  ) {
    this.#world = world;
    this.#polling = options.polling;
    this.#root = options.root;

    this.#fn = fn;
    this.#args = args;

    if (options.timeout) {
      this.#timeout = setTimeout(() => {
        this.terminate(
          new TimeoutError(`Waiting failed: ${options.timeout}ms exceeded`)
        );
      }, options.timeout);
    }

    this.rerun();
  }

  get result(): Promise<HandleFor<T>> {
    return this.#result;
  }

  async rerun(): Promise<void> {
    const context = await this.#world.executionContext();

    switch (this.#polling) {
      case 'raf':
        this.#poller = await context.evaluateHandle(
          (fn, ...args) => {
            return new RAFPoller(() => {
              return createFunction<(...args: unknown[]) => Promise<T>>(fn)(
                ...args
              );
            });
          },
          this.#fn.toString(),
          ...this.#args
        );
        break;
      case 'mutation':
        this.#poller = await context.evaluateHandle(
          (root, fn, ...args) => {
            return new MutationPoller(() => {
              return createFunction<(...args: unknown[]) => Promise<T>>(fn)(
                ...args
              );
            }, root || document);
          },
          this.#root,
          this.#fn.toString(),
          ...this.#args
        );
        break;
      default:
        this.#poller = await context.evaluateHandle(
          (ms, fn, ...args) => {
            return new IntervalPoller(() => {
              return createFunction<(...args: unknown[]) => Promise<T>>(fn)(
                ...args
              );
            }, ms);
          },
          this.#polling,
          this.#fn.toString(),
          ...this.#args
        );
        break;
    }

    try {
      this.#result.resolve(
        await this.#poller.evaluateHandle(poller => {
          return poller.start();
        })
      );
      await this.terminate();
    } catch (error) {
      await this.handleError(error);
    }
  }

  async terminate(error?: unknown): Promise<void> {
    if (this.#timeout) {
      clearTimeout(this.#timeout);
    }

    assert(this.#result, 'Task never ran');
    if (error && !this.#result.finished()) {
      this.#result.reject(error);
    }

    if (this.#poller) {
      await this.#poller.evaluateHandle(async poller => {
        await poller.stop();
      });
      await this.#poller.dispose();
      this.#poller = undefined;
    }
  }

  async handleError(error: unknown): Promise<void> {
    if (error instanceof Error) {
      if (error.message.includes('TypeError: binding is not a function')) {
        return this.rerun();
      }
      // When frame is detached the task should have been terminated by the IsolatedWorld.
      // This can fail if we were adding this task while the frame was detached,
      // so we terminate here instead.
      if (
        error.message.includes(
          'Execution context is not available in detached frame'
        )
      ) {
        this.terminate(new Error('Waiting failed: Frame detached'));
        return;
      }

      // When the page is navigated, the promise is rejected.
      // We will try again in the new execution context.
      if (error.message.includes('Execution context was destroyed')) {
        return;
      }

      // We could have tried to evaluate in a context which was already
      // destroyed.
      if (error.message.includes('Cannot find context with specified id')) {
        return;
      }
    }

    this.terminate(error);
  }
}

/**
 * @internal
 */
export class TaskManager {
  #tasks: Set<WaitTask> = new Set<WaitTask>();

  add(task: WaitTask): void {
    this.#tasks.add(task);
  }

  delete(task: WaitTask): void {
    this.#tasks.delete(task);
  }

  terminateAll(error?: Error): void {
    for (const task of this.#tasks) {
      task.terminate(error);
    }
    this.#tasks.clear();
  }

  async rerunAll(): Promise<void> {
    await Promise.all(
      [...this.#tasks].map(task => {
        return task.rerun();
      })
    );
  }
}
