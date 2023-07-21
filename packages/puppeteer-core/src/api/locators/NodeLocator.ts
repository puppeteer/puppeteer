import {
  EMPTY,
  Observable,
  defer,
  filter,
  first,
  from,
  identity,
  ignoreElements,
} from '../../../third_party/rxjs/rxjs.js';
import {HandleFor, NodeFor} from '../../common/types.js';
import {Frame} from '../Frame.js';
import {Page} from '../Page.js';

import {ActionOptions, Locator} from './locators.js';

/**
 * @internal
 */
export type Action<T, U> = (
  element: HandleFor<T>,
  signal?: AbortSignal
) => Observable<U>;

/**
 * @internal
 */
export class NodeLocator<T extends Node> extends Locator<T> {
  static create<Selector extends string>(
    pageOrFrame: Page | Frame,
    selector: Selector
  ): Locator<NodeFor<Selector>> {
    return new NodeLocator<NodeFor<Selector>>(pageOrFrame, selector).setTimeout(
      'getDefaultTimeout' in pageOrFrame
        ? pageOrFrame.getDefaultTimeout()
        : pageOrFrame.page().getDefaultTimeout()
    );
  }

  #pageOrFrame: Page | Frame;
  #selector: string;

  private constructor(pageOrFrame: Page | Frame, selector: string) {
    super();

    this.#pageOrFrame = pageOrFrame;
    this.#selector = selector;
  }

  /**
   * Waits for the element to become visible or hidden. visibility === 'visible'
   * means that the element has a computed style, the visibility property other
   * than 'hidden' or 'collapse' and non-empty bounding box. visibility ===
   * 'hidden' means the opposite of that.
   */
  #waitForVisibilityIfNeeded = (
    handle: HandleFor<T>,
    signal?: AbortSignal
  ): Observable<never> => {
    if (!this.visibility) {
      return EMPTY;
    }

    return (() => {
      switch (this.visibility) {
        case 'hidden':
          return defer(() => {
            return from(handle.isHidden());
          });
        case 'visible':
          return defer(() => {
            return from(handle.isVisible());
          });
      }
    })().pipe(
      first(identity),
      this.operators.retryAndRaceWithSignalAndTimer(signal),
      ignoreElements()
    );
  };

  waitImpl(options?: Readonly<ActionOptions>): Observable<HandleFor<T>> {
    const signal = options?.signal;
    return defer(() => {
      return from(
        this.#pageOrFrame.waitForSelector(this.#selector, {
          visible: false,
          timeout: this.timeout,
          signal,
        }) as Promise<HandleFor<T> | null>
      );
    }).pipe(
      filter((value): value is NonNullable<typeof value> => {
        return value !== null;
      }),
      this.operators.conditions([this.#waitForVisibilityIfNeeded], signal),
      first(),
      this.operators.retryAndRaceWithSignalAndTimer(signal)
    );
  }
}
