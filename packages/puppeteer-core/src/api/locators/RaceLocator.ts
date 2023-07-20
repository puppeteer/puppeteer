import {isErrorLike} from '../../util/ErrorLike.js';

import {
  Locator,
  VisibilityOption,
  LocatorEmittedEvents,
  LocatorClickOptions,
  ActionOptions,
  LocatorScrollOptions,
} from './locators.js';

/**
 * @public
 */
export type UnionLocatorOf<T> = T extends Array<Locator<infer S>> ? S : never;

/**
 * @internal
 */
export class RaceLocator<T> extends Locator<T> {
  #locators: Array<Locator<T>>;

  constructor(locators: Array<Locator<T>>) {
    super();
    this.#locators = locators;
  }

  override setVisibility(visibility: VisibilityOption): this {
    for (const locator of this.#locators) {
      locator.setVisibility(visibility);
    }
    return this;
  }

  override setTimeout(timeout: number): this {
    for (const locator of this.#locators) {
      locator.setTimeout(timeout);
    }
    return this;
  }

  override setEnsureElementIsInTheViewport(value: boolean): this {
    for (const locator of this.#locators) {
      locator.setEnsureElementIsInTheViewport(value);
    }
    return this;
  }

  override setWaitForEnabled(value: boolean): this {
    for (const locator of this.#locators) {
      locator.setWaitForEnabled(value);
    }
    return this;
  }

  override setWaitForStableBoundingBox(value: boolean): this {
    for (const locator of this.#locators) {
      locator.setWaitForStableBoundingBox(value);
    }
    return this;
  }

  async #run<U>(
    action: (locator: Locator<T>, signal: AbortSignal) => Promise<U>,
    signal?: AbortSignal
  ): Promise<U> {
    const abortControllers = new WeakMap<Locator<T>, AbortController>();

    // Abort all locators if the user-provided signal aborts.
    signal?.addEventListener('abort', () => {
      for (const locator of this.#locators) {
        abortControllers.get(locator)?.abort();
      }
    });

    const handleLocatorAction = (locator: Locator<T>): (() => void) => {
      return () => {
        // When one locator is ready to act, we will abort other locators.
        for (const other of this.#locators) {
          if (other !== locator) {
            abortControllers.get(other)?.abort();
          }
        }
        this.emit(LocatorEmittedEvents.Action);
      };
    };

    const createAbortController = (locator: Locator<T>): AbortController => {
      const abortController = new AbortController();
      abortControllers.set(locator, abortController);
      return abortController;
    };

    const results = await Promise.allSettled(
      this.#locators.map(locator => {
        return action(
          locator.on(LocatorEmittedEvents.Action, handleLocatorAction(locator)),
          createAbortController(locator).signal
        );
      })
    );

    signal?.throwIfAborted();

    const rejected = results.filter(
      (result): result is PromiseRejectedResult => {
        return result.status === 'rejected';
      }
    );

    // If some locators are fulfilled, do not throw.
    if (rejected.length !== results.length) {
      // SAFETY: If there is no value, then U is undefined, so the `as` coercion
      // holds.
      return results.filter(
        (result): result is PromiseFulfilledResult<Awaited<U>> => {
          return result.status === 'fulfilled';
        }
      )[0]?.value as Awaited<U>;
    }

    for (const result of rejected) {
      const reason = result.reason;
      // AbortError is be an expected result of a race.
      if (isErrorLike(reason) && reason.name === 'AbortError') {
        continue;
      }
      throw reason;
    }

    // SAFETY: If there is no value, then U is undefined, so the `as` coercion
    // holds.
    return results.filter(
      (result): result is PromiseFulfilledResult<Awaited<U>> => {
        return result.status === 'fulfilled';
      }
    )[0]?.value as Awaited<U>;
  }

  override wait(
    this: RaceLocator<T>,
    options?: Readonly<ActionOptions>
  ): Promise<T> {
    return this.#run(
      (locator, signal) => {
        return locator.wait({...options, signal});
      },
      options?.signal
    );
  }

  async click<ElementType extends Element>(
    this: RaceLocator<ElementType>,
    options?: Readonly<LocatorClickOptions>
  ): Promise<void> {
    return await this.#run(
      (locator, signal) => {
        return locator.click({...options, signal});
      },
      options?.signal
    );
  }

  async fill<ElementType extends Element>(
    this: RaceLocator<ElementType>,
    value: string,
    options?: Readonly<ActionOptions>
  ): Promise<void> {
    return await this.#run(
      (locator, signal) => {
        return locator.fill(value, {...options, signal});
      },
      options?.signal
    );
  }

  async hover<ElementType extends Element>(
    this: RaceLocator<ElementType>,
    options?: Readonly<ActionOptions>
  ): Promise<void> {
    return await this.#run(
      (locator, signal) => {
        return locator.hover({...options, signal});
      },
      options?.signal
    );
  }

  async scroll<ElementType extends Element>(
    this: RaceLocator<ElementType>,
    options?: Readonly<LocatorScrollOptions>
  ): Promise<void> {
    return await this.#run(
      (locator, signal) => {
        return locator.scroll({...options, signal});
      },
      options?.signal
    );
  }
}
