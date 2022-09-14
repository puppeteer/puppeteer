/**
 * @internal
 */
export class LazyArg<T> {
  #get: () => Promise<T>;
  constructor(get: () => Promise<T>) {
    this.#get = get;
  }

  get(): Promise<T> {
    return this.#get();
  }
}
