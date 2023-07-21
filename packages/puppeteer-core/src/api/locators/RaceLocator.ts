import {Observable, race} from '../../../third_party/rxjs/rxjs.js';
import {HandleFor} from '../../puppeteer-core.js';

import {ActionOptions, Locator} from './locators.js';

/**
 * @public
 */
export type AwaitedLocator<T> = T extends Locator<infer S> ? S : never;

function checkLocatorArray<T extends readonly unknown[] | []>(
  locators: T
): ReadonlyArray<Locator<AwaitedLocator<T[number]>>> {
  for (const locator of locators) {
    if (!(locator instanceof Locator)) {
      throw new Error('Unknown locator for race candidate');
    }
  }
  return locators as ReadonlyArray<Locator<AwaitedLocator<T[number]>>>;
}

/**
 * @internal
 */
export class RaceLocator<T> extends Locator<T> {
  static create<T extends readonly unknown[]>(
    locators: T
  ): Locator<AwaitedLocator<T[number]>> {
    const array = checkLocatorArray(locators);
    return new RaceLocator(array);
  }

  #locators: ReadonlyArray<Locator<T>>;

  constructor(locators: ReadonlyArray<Locator<T>>) {
    super();
    this.#locators = locators;
  }

  override waitImpl(
    options?: Readonly<ActionOptions>
  ): Observable<HandleFor<T>> {
    return race(
      ...this.#locators.map(locator => {
        return locator.waitImpl(options);
      })
    );
  }
}
