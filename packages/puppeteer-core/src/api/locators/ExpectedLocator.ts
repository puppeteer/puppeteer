import {Awaitable} from '../../common/common.js';
import {ElementHandle} from '../ElementHandle.js';

import {
  ActionOptions,
  LOCATOR_CONTEXTS,
  Locator,
  LocatorClickOptions,
  LocatorContext,
  LocatorScrollOptions,
  VisibilityOption,
  type ActionCondition,
} from './locators.js';

/**
 * @public
 */
export type Predicate<From, To extends From = From> =
  | ((value: From) => value is To)
  | ((value: From) => Awaitable<boolean>);

/**
 * @internal
 */
export class ExpectedLocator<From, To extends From> extends Locator<To> {
  #base: Locator<From>;
  #predicate: Predicate<From, To>;

  constructor(base: Locator<From>, predicate: Predicate<From, To>) {
    super();

    this.#base = base;
    this.#predicate = predicate;
  }

  override setVisibility(visibility: VisibilityOption): this {
    this.#base.setVisibility(visibility);
    return this;
  }
  override setTimeout(timeout: number): this {
    this.#base.setTimeout(timeout);
    return this;
  }
  override setEnsureElementIsInTheViewport(value: boolean): this {
    this.#base.setEnsureElementIsInTheViewport(value);
    return this;
  }
  override setWaitForEnabled(value: boolean): this {
    this.#base.setWaitForEnabled(value);
    return this;
  }
  override setWaitForStableBoundingBox(value: boolean): this {
    this.#base.setWaitForStableBoundingBox(value);
    return this;
  }

  #condition: ActionCondition<From> = async (handle, signal) => {
    // TODO(jrandolf): We should remove this once JSHandle has waitForFunction.
    await (handle as ElementHandle<Node>).frame.waitForFunction(
      this.#predicate,
      {signal},
      handle
    );
  };

  #insertFilterCondition<
    FromElement extends Node,
    ToElement extends FromElement,
  >(this: ExpectedLocator<FromElement, ToElement>): void {
    const context = (LOCATOR_CONTEXTS.get(this.#base) ??
      {}) as LocatorContext<FromElement>;
    context.conditions ??= new Set();
    context.conditions.add(this.#condition);
    LOCATOR_CONTEXTS.set(this.#base, context);
  }

  override click<FromElement extends Element, ToElement extends FromElement>(
    this: ExpectedLocator<FromElement, ToElement>,
    options?: Readonly<LocatorClickOptions>
  ): Promise<void> {
    this.#insertFilterCondition();
    return this.#base.click(options);
  }
  override fill<FromElement extends Element, ToElement extends FromElement>(
    this: ExpectedLocator<FromElement, ToElement>,
    value: string,
    options?: Readonly<ActionOptions>
  ): Promise<void> {
    this.#insertFilterCondition();
    return this.#base.fill(value, options);
  }
  override hover<FromElement extends Element, ToElement extends FromElement>(
    this: ExpectedLocator<FromElement, ToElement>,
    options?: Readonly<ActionOptions>
  ): Promise<void> {
    this.#insertFilterCondition();
    return this.#base.hover(options);
  }
  override scroll<FromElement extends Element, ToElement extends FromElement>(
    this: ExpectedLocator<FromElement, ToElement>,
    options?: Readonly<LocatorScrollOptions>
  ): Promise<void> {
    this.#insertFilterCondition();
    return this.#base.scroll(options);
  }
}
