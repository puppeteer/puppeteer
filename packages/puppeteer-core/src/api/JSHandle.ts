/**
 * Copyright 2023 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Protocol from 'devtools-protocol';

import {CDPSession} from '../common/Connection.js';
import {ExecutionContext} from '../common/ExecutionContext.js';
import {EvaluateFuncWith, HandleFor, HandleOr} from '../common/types.js';

import {ElementHandle} from './ElementHandle.js';

declare const __JSHandleSymbol: unique symbol;

/**
 * Represents a reference to a JavaScript object. Instances can be created using
 * {@link Page.evaluateHandle}.
 *
 * Handles prevent the referenced JavaScript object from being garbage-collected
 * unless the handle is purposely {@link JSHandle.dispose | disposed}. JSHandles
 * are auto-disposed when their associated frame is navigated away or the parent
 * context gets destroyed.
 *
 * Handles can be used as arguments for any evaluation function such as
 * {@link Page.$eval}, {@link Page.evaluate}, and {@link Page.evaluateHandle}.
 * They are resolved to their referenced object.
 *
 * @example
 *
 * ```ts
 * const windowHandle = await page.evaluateHandle(() => window);
 * ```
 *
 * @public
 */
export class JSHandle<T = unknown> {
  /**
   * Used for nominally typing {@link JSHandle}.
   */
  [__JSHandleSymbol]?: T;

  /**
   * @internal
   */
  constructor() {}

  /**
   * @internal
   */
  get disposed(): boolean {
    throw new Error('Not implemented');
  }

  /**
   * @internal
   */
  executionContext(): ExecutionContext {
    throw new Error('Not implemented');
  }

  /**
   * @internal
   */
  get client(): CDPSession {
    throw new Error('Not implemented');
  }

  /**
   * Evaluates the given function with the current handle as its first argument.
   */
  async evaluate<
    Params extends unknown[],
    Func extends EvaluateFuncWith<T, Params> = EvaluateFuncWith<T, Params>
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>>;
  async evaluate(): Promise<unknown> {
    throw new Error('Not implemented');
  }

  /**
   * Evaluates the given function with the current handle as its first argument.
   *
   */
  async evaluateHandle<
    Params extends unknown[],
    Func extends EvaluateFuncWith<T, Params> = EvaluateFuncWith<T, Params>
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>>;
  async evaluateHandle(): Promise<HandleFor<unknown>> {
    throw new Error('Not implemented');
  }

  /**
   * Fetches a single property from the referenced object.
   */
  async getProperty<K extends keyof T>(
    propertyName: HandleOr<K>
  ): Promise<HandleFor<T[K]>>;
  async getProperty(propertyName: string): Promise<JSHandle<unknown>>;
  async getProperty<K extends keyof T>(
    propertyName: HandleOr<K>
  ): Promise<HandleFor<T[K]>>;
  async getProperty<K extends keyof T>(): Promise<HandleFor<T[K]>> {
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
   * A vanilla object representing the serializable portions of the
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
   * Either `null` or the handle itself if the handle is an
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

  /**
   * @internal
   */
  get id(): string | undefined {
    throw new Error('Not implemented');
  }

  /**
   * Provides access to the
   * {@link https://chromedevtools.github.io/devtools-protocol/tot/Runtime/#type-RemoteObject | Protocol.Runtime.RemoteObject}
   * backing this handle.
   */
  remoteObject(): Protocol.Runtime.RemoteObject {
    throw new Error('Not implemented');
  }
}
