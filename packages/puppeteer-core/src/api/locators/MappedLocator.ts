import {Observable, from, mergeMap} from '../../../third_party/rxjs/rxjs.js';
import {Awaitable, HandleFor} from '../../common/common.js';
import {JSHandle} from '../JSHandle.js';

import {ActionOptions, Locator, VisibilityOption} from './locators.js';

/**
 * @public
 */
export type Mapper<From, To> = (value: From) => Awaitable<To>;

/**
 * @internal
 */
export class MappedLocator<From, To> extends Locator<To> {
  #base: Locator<From>;
  #mapper: Mapper<From, To>;

  constructor(base: Locator<From>, mapper: Mapper<From, To>) {
    super();

    this.#base = base;
    this.#mapper = mapper;

    this.copyOptions(this.#base);
  }

  override setTimeout(timeout: number): this {
    super.setTimeout(timeout);
    this.#base.setTimeout(timeout);
    return this;
  }

  override setVisibility<FromNode extends Node, ToNode extends FromNode>(
    this: MappedLocator<FromNode, ToNode>,
    visibility: VisibilityOption
  ): Locator<ToNode> {
    super.setVisibility(visibility);
    this.#base.setVisibility(visibility);
    return this;
  }

  override setWaitForEnabled<FromNode extends Node, ToNode extends FromNode>(
    this: MappedLocator<FromNode, ToNode>,
    value: boolean
  ): Locator<ToNode> {
    super.setWaitForEnabled(value);
    this.#base.setWaitForEnabled(value);
    return this;
  }

  override setEnsureElementIsInTheViewport<
    FromElement extends Element,
    ToElement extends FromElement,
  >(
    this: MappedLocator<FromElement, ToElement>,
    value: boolean
  ): Locator<ToElement> {
    super.setEnsureElementIsInTheViewport(value);
    this.#base.setEnsureElementIsInTheViewport(value);
    return this;
  }

  override setWaitForStableBoundingBox<
    FromElement extends Element,
    ToElement extends FromElement,
  >(
    this: MappedLocator<FromElement, ToElement>,
    value: boolean
  ): Locator<ToElement> {
    super.setWaitForStableBoundingBox(value);
    this.#base.setWaitForStableBoundingBox(value);
    return this;
  }

  override waitImpl(
    options?: Readonly<ActionOptions>
  ): Observable<HandleFor<To>> {
    return this.#base.waitImpl(options).pipe(
      mergeMap(handle => {
        return from((handle as JSHandle<From>).evaluateHandle(this.#mapper));
      }),
      this.operators.retryAndRaceWithSignalAndTimer(options?.signal)
    );
  }
}
