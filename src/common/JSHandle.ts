/**
 * Copyright 2019 Google Inc. All rights reserved.
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

import {Protocol} from 'devtools-protocol';
import {assert} from './assert.js';
import {CDPSession} from './Connection.js';
import type {ElementHandle} from './ElementHandle.js';
import {ExecutionContext} from './ExecutionContext.js';
import {MouseButton} from './Input.js';
import {EvaluateFunc, HandleFor, HandleOr} from './types.js';
import {createJSHandle, releaseObject, valueFromRemoteObject} from './util.js';

declare const __JSHandleSymbol: unique symbol;

/**
 * @public
 */
export interface BoxModel {
  content: Point[];
  padding: Point[];
  border: Point[];
  margin: Point[];
  width: number;
  height: number;
}

/**
 * @public
 */
export interface BoundingBox extends Point {
  /**
   * the width of the element in pixels.
   */
  width: number;
  /**
   * the height of the element in pixels.
   */
  height: number;
}

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

  #client: CDPSession;
  #disposed = false;
  #context: ExecutionContext;
  #remoteObject: Protocol.Runtime.RemoteObject;

  /**
   * @internal
   */
  get client(): CDPSession {
    return this.#client;
  }

  /**
   * @internal
   */
  get disposed(): boolean {
    return this.#disposed;
  }

  /**
   * @internal
   */
  constructor(
    context: ExecutionContext,
    client: CDPSession,
    remoteObject: Protocol.Runtime.RemoteObject
  ) {
    this.#context = context;
    this.#client = client;
    this.#remoteObject = remoteObject;
  }

  /**
   * @returns The execution context the handle belongs to.
   */
  executionContext(): ExecutionContext {
    return this.#context;
  }

  /**
   * Evaluates the given function with the current handle as its first argument.
   *
   * @see {@link ExecutionContext.evaluate} for more details.
   */
  async evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<[this, ...Params]> = EvaluateFunc<
      [this, ...Params]
    >
  >(
    pageFunction: Func | string,
    ...args: Params
  ): // @ts-expect-error Circularity here is okay because we only need the return
  // type which doesn't use `this`.
  Promise<Awaited<ReturnType<Func>>> {
    return await this.executionContext().evaluate(pageFunction, this, ...args);
  }

  /**
   * Evaluates the given function with the current handle as its first argument.
   *
   * @see {@link ExecutionContext.evaluateHandle} for more details.
   */
  async evaluateHandle<
    Params extends unknown[],
    Func extends EvaluateFunc<[this, ...Params]> = EvaluateFunc<
      [this, ...Params]
    >
  >(
    pageFunction: Func | string,
    ...args: Params
  ): // @ts-expect-error Circularity here is okay because we only need the return
  // type which doesn't use `this`.
  Promise<HandleFor<Awaited<ReturnType<Func>>>> {
    return await this.executionContext().evaluateHandle(
      pageFunction,
      this,
      ...args
    );
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
  ): Promise<HandleFor<T[K]>> {
    return this.evaluateHandle((object, propertyName) => {
      return object[propertyName];
    }, propertyName);
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
    assert(this.#remoteObject.objectId);
    // We use Runtime.getProperties rather than iterative building because the
    // iterative approach might create a distorted snapshot.
    const response = await this.#client.send('Runtime.getProperties', {
      objectId: this.#remoteObject.objectId,
      ownProperties: true,
    });
    const result = new Map<string, JSHandle>();
    for (const property of response.result) {
      if (!property.enumerable || !property.value) {
        continue;
      }
      result.set(property.name, createJSHandle(this.#context, property.value));
    }
    return result;
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
    if (!this.#remoteObject.objectId) {
      return valueFromRemoteObject(this.#remoteObject);
    }
    const value = await this.evaluate(object => {
      return object;
    });
    if (value === undefined) {
      throw new Error('Could not serialize referenced object');
    }
    return value;
  }

  /**
   * @returns Either `null` or the handle itself if the handle is an
   * instance of {@link ElementHandle}.
   */
  asElement(): ElementHandle<Node> | null {
    return null;
  }

  /**
   * Releases the object referenced by the handle for garbage collection.
   */
  async dispose(): Promise<void> {
    if (this.#disposed) {
      return;
    }
    this.#disposed = true;
    await releaseObject(this.#client, this.#remoteObject);
  }

  /**
   * Returns a string representation of the JSHandle.
   *
   * @remarks
   * Useful during debugging.
   */
  toString(): string {
    if (!this.#remoteObject.objectId) {
      return 'JSHandle:' + valueFromRemoteObject(this.#remoteObject);
    }
    const type = this.#remoteObject.subtype || this.#remoteObject.type;
    return 'JSHandle@' + type;
  }

  /**
   * Provides access to the
   * [Protocol.Runtime.RemoteObject](https://chromedevtools.github.io/devtools-protocol/tot/Runtime/#type-RemoteObject)
   * backing this handle.
   */
  remoteObject(): Protocol.Runtime.RemoteObject {
    return this.#remoteObject;
  }
}

/**
 * @public
 */
export interface Offset {
  /**
   * x-offset for the clickable point relative to the top-left corder of the border box.
   */
  x: number;
  /**
   * y-offset for the clickable point relative to the top-left corder of the border box.
   */
  y: number;
}

/**
 * @public
 */
export interface ClickOptions {
  /**
   * Time to wait between `mousedown` and `mouseup` in milliseconds.
   *
   * @defaultValue 0
   */
  delay?: number;
  /**
   * @defaultValue 'left'
   */
  button?: MouseButton;
  /**
   * @defaultValue 1
   */
  clickCount?: number;
  /**
   * Offset for the clickable point relative to the top-left corder of the border box.
   */
  offset?: Offset;
}

/**
 * @public
 */
export interface PressOptions {
  /**
   * Time to wait between `keydown` and `keyup` in milliseconds. Defaults to 0.
   */
  delay?: number;
  /**
   * If specified, generates an input event with this text.
   */
  text?: string;
}

/**
 * @public
 */
export interface Point {
  x: number;
  y: number;
}
