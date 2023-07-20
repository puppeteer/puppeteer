import {EventEmitter} from '../../common/EventEmitter.js';
import {ClickOptions} from '../ElementHandle.js';

import {
  ExpectedLocator,
  Predicate,
  RaceLocator,
  UnionLocatorOf,
  type ActionCondition,
} from './locators.js';

/**
 * @internal
 */
export interface LocatorContext<T> {
  conditions?: Set<ActionCondition<T>>;
}

/**
 * @internal
 */
export const LOCATOR_CONTEXTS = new WeakMap<
  Locator<unknown>,
  LocatorContext<never>
>();

/**
 * @public
 */
export type VisibilityOption = 'hidden' | 'visible' | null;

/**
 * @public
 */
export interface LocatorOptions {
  /**
   * Whether to wait for the element to be `visible` or `hidden`. `null` to
   * disable visibility checks.
   */
  visibility: VisibilityOption;
  /**
   * Total timeout for the entire locator operation.
   *
   * Pass `0` to disable timeout.
   *
   * @defaultValue `Page.getDefaultTimeout()`
   */
  timeout: number;
  /**
   * Whether to scroll the element into viewport if not in the viewprot already.
   * @defaultValue `true`
   */
  ensureElementIsInTheViewport: boolean;
  /**
   * Whether to wait for input elements to become enabled before the action.
   * Applicable to `click` and `fill` actions.
   * @defaultValue `true`
   */
  waitForEnabled: boolean;
  /**
   * Whether to wait for the element's bounding box to be same between two
   * animation frames.
   * @defaultValue `true`
   */
  waitForStableBoundingBox: boolean;
}

/**
 * @public
 */
export interface ActionOptions {
  signal?: AbortSignal;
}

/**
 * @public
 */
export type LocatorClickOptions = ClickOptions & ActionOptions;

/**
 * @public
 */
export interface LocatorScrollOptions extends ActionOptions {
  scrollTop?: number;
  scrollLeft?: number;
}

/**
 * All the events that a locator instance may emit.
 *
 * @public
 */
export enum LocatorEmittedEvents {
  /**
   * Emitted every time before the locator performs an action on the located element(s).
   */
  Action = 'action',
}

/**
 * @public
 */
export interface LocatorEventObject {
  [LocatorEmittedEvents.Action]: never;
}

/**
 * Locators describe a strategy of locating elements and performing an action on
 * them. If the action fails because the element is not ready for the action,
 * the whole operation is retried. Various preconditions for a successful action
 * are checked automatically.
 *
 * @public
 */
export abstract class Locator<T> extends EventEmitter {
  /**
   * Used for nominally typing {@link Locator}.
   */
  declare _?: T;

  /**
   * Creates a race between multiple locators but ensures that only a single one
   * acts.
   */
  static race<Locators extends Array<Locator<unknown>>>(
    locators: Locators
  ): Locator<UnionLocatorOf<Locators>> {
    return new RaceLocator(
      locators as Array<Locator<UnionLocatorOf<Locators>>>
    );
  }

  /**
   * Creates an expectation that is evaluated against located values.
   *
   * If the expectations do not match, then the locator will retry.
   *
   * @internal
   */
  expect<S extends T>(predicate: Predicate<T, S>): Locator<S> {
    return new ExpectedLocator(this, predicate);
  }

  override on<K extends keyof LocatorEventObject>(
    eventName: K,
    handler: (event: LocatorEventObject[K]) => void
  ): this {
    return super.on(eventName, handler);
  }

  override once<K extends keyof LocatorEventObject>(
    eventName: K,
    handler: (event: LocatorEventObject[K]) => void
  ): this {
    return super.once(eventName, handler);
  }

  override off<K extends keyof LocatorEventObject>(
    eventName: K,
    handler: (event: LocatorEventObject[K]) => void
  ): this {
    return super.off(eventName, handler);
  }

  abstract setVisibility(visibility: VisibilityOption): this;

  abstract setTimeout(timeout: number): this;

  abstract setEnsureElementIsInTheViewport(value: boolean): this;

  abstract setWaitForEnabled(value: boolean): this;

  abstract setWaitForStableBoundingBox(value: boolean): this;

  abstract click<ElementType extends Element>(
    this: Locator<ElementType>,
    options?: Readonly<LocatorClickOptions>
  ): Promise<void>;

  /**
   * Fills out the input identified by the locator using the provided value. The
   * type of the input is determined at runtime and the appropriate fill-out
   * method is chosen based on the type. contenteditable, selector, inputs are
   * supported.
   */
  abstract fill<ElementType extends Element>(
    this: Locator<ElementType>,
    value: string,
    options?: Readonly<ActionOptions>
  ): Promise<void>;

  abstract hover<ElementType extends Element>(
    this: Locator<ElementType>,
    options?: Readonly<ActionOptions>
  ): Promise<void>;

  abstract scroll<ElementType extends Element>(
    this: Locator<ElementType>,
    options?: Readonly<LocatorScrollOptions>
  ): Promise<void>;
}
