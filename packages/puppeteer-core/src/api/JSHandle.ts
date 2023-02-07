import {ElementHandle} from '../common/ElementHandle.js';
import {EvaluateFunc, HandleFor, HandleOr} from '../common/types.js';

declare const __JSHandleSymbol: unique symbol;

export class JSHandle<T = unknown> {
  /**
   * Used for nominally typing {@link JSHandle}.
   */
  [__JSHandleSymbol]?: T;

  #disposed = false;

  /**
   * @internal
   */
  executionContext(): any {
    throw new Error('Not implemented');
  }

  /**
   * @internal
   */
  get client(): any {
    throw new Error('Not implemented');
  }

  /**
   * @internal
   */
  get disposed(): boolean {
    return this.#disposed;
  }

  /**
   * Evaluates the given function with the current handle as its first argument.
   */
  async evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<[this, ...Params]> = EvaluateFunc<
      [this, ...Params]
    >
  >(
    _pageFunction: Func | string,
    ..._args: Params
  ): Promise<Awaited<ReturnType<Func>>> {
    throw new Error('Not implemented');
  }

  /**
   * Evaluates the given function with the current handle as its first argument.
   *
   */
  async evaluateHandle<
    Params extends unknown[],
    Func extends EvaluateFunc<[this, ...Params]> = EvaluateFunc<
      [this, ...Params]
    >
  >(
    _pageFunction: Func | string,
    ..._args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>> {
    throw new Error('Not implemented');
  }

  /**
   * Fetches a single property from the referenced object.
   */
  async getProperty<K extends keyof T>(
    propertyName: HandleOr<K>
  ): Promise<HandleFor<T[K]>>;
  async getProperty(_propertyName: string): Promise<HandleFor<unknown>>;
  async getProperty<K extends keyof T>(
    _propertyName: HandleOr<K>
  ): Promise<HandleFor<T[K]>> {
    throw new Error('Not implemented');
  }

  /**
   * Gets a map of handles representing the properties of the current handle.
   *
   * @example
   *
   * ```ts
   * const listHandle = await page.evaluateHandle(() => document.body.children);
   * const properties = await listHandle.getProperties();
   * const children = [];
   * for (const property of properties.values()) {
   *   const element = property.asElement();
   *   if (element) {
   *     children.push(element);
   *   }
   * }
   * children; // holds elementHandles to all children of document.body
   * ```
   */
  async getProperties(): Promise<Map<string, JSHandle>> {
    throw new Error('Not implemented');
  }

  /**
   * @returns A vanilla object representing the serializable portions of the
   * referenced object.
   * @throws Throws if the object cannot be serialized due to circularity.
   *
   * @remarks
   * If the object has a `toJSON` function, it **will not** be called.
   */
  async jsonValue(): Promise<T> {
    throw new Error('Not implemented');
  }

  /**
   * @returns Either `null` or the handle itself if the handle is an
   * instance of {@link ElementHandle}.
   */
  asElement(): ElementHandle<Node> | null {
    throw new Error('Not implemented');
  }

  /**
   * Releases the object referenced by the handle for garbage collection.
   */
  async dispose(): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * Returns a string representation of the JSHandle.
   *
   * @remarks
   * Useful during debugging.
   */
  toString(): string {
    throw new Error('Not implemented');
  }

  remoteObject(): any {
    throw new Error('Not implemented');
  }
}
