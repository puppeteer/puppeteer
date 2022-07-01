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
import {EvaluateFunc, HandleFor, HandleOr} from './types.js';
import {ExecutionContext} from './ExecutionContext.js';
import {MouseButton} from './Input.js';
import {releaseObject, valueFromRemoteObject, createJSHandle} from './util.js';
import type {ElementHandle} from './ElementHandle.js';

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
 * Represents an in-page JavaScript object. JSHandles can be created with the
 * {@link Page.evaluateHandle | page.evaluateHandle} method.
 *
 * @example
 * ```ts
 * const windowHandle = await page.evaluateHandle(() => window);
 * ```
 *
 * JSHandle prevents the referenced JavaScript object from being garbage-collected
 * unless the handle is {@link JSHandle.dispose | disposed}. JSHandles are auto-
 * disposed when their origin frame gets navigated or the parent context gets destroyed.
 *
 * JSHandle instances can be used as arguments for {@link Page.$eval},
 * {@link Page.evaluate}, and {@link Page.evaluateHandle}.
 *
 * @public
 */
export class JSHandle<T = unknown> {
  #client: CDPSession;
  #disposed = false;
  #context: ExecutionContext;
  #remoteObject: Protocol.Runtime.RemoteObject;

  /**
   * @internal
   */
  get _client(): CDPSession {
    return this.#client;
  }

  /**
   * @internal
   */
  get _disposed(): boolean {
    return this.#disposed;
  }

  /**
   * @internal
   */
  get _remoteObject(): Protocol.Runtime.RemoteObject {
    return this.#remoteObject;
  }

  /**
   * @internal
   */
  get _context(): ExecutionContext {
    return this.#context;
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

  /** Returns the execution context the handle belongs to.
   */
  executionContext(): ExecutionContext {
    return this.#context;
  }

  /**
   * This method passes this handle as the first argument to `pageFunction`. If
   * `pageFunction` returns a Promise, then `handle.evaluate` would wait for the
   * promise to resolve and return its value.
   *
   * @example
   * ```ts
   * const tweetHandle = await page.$('.tweet .retweets');
   * expect(await tweetHandle.evaluate(node => node.innerText)).toBe('10');
   * ```
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
   * This method passes this handle as the first argument to `pageFunction`.
   *
   * @remarks
   *
   * The only difference between `jsHandle.evaluate` and
   * `jsHandle.evaluateHandle` is that `jsHandle.evaluateHandle` returns an
   * in-page object (JSHandle).
   *
   * If the function passed to `jsHandle.evaluateHandle` returns a Promise, then
   * `evaluateHandle.evaluateHandle` waits for the promise to resolve and
   * returns its value.
   *
   * See {@link Page.evaluateHandle} for more details.
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
    return await this.evaluateHandle((object, propertyName) => {
      return object[propertyName];
    }, propertyName);
  }

  /**
   * The method returns a map with property names as keys and JSHandle instances
   * for the property values.
   *
   * @example
   * ```ts
   * const listHandle = await page.evaluateHandle(() => document.body.children);
   * const properties = await listHandle.getProperties();
   * const children = [];
   * for (const property of properties.values()) {
   *   const element = property.asElement();
   *   if (element)
   *     children.push(element);
   * }
   * children; // holds elementHandles to all children of document.body
   * ```
   */
  async getProperties(): Promise<Map<string, JSHandle>> {
    assert(this.#remoteObject.objectId);
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
   * @returns Returns a JSON representation of the object.If the object has a
   * `toJSON` function, it will not be called.
   * @remarks
   *
   * The JSON is generated by running {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify | JSON.stringify}
   * on the object in page and consequent {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse | JSON.parse} in puppeteer.
   * **NOTE** The method throws if the referenced object is not stringifiable.
   */
  async jsonValue<T = unknown>(): Promise<T> {
    if (this.#remoteObject.objectId) {
      const response = await this.#client.send('Runtime.callFunctionOn', {
        functionDeclaration: 'function() { return this; }',
        objectId: this.#remoteObject.objectId,
        returnByValue: true,
        awaitPromise: true,
      });
      return valueFromRemoteObject(response.result) as T;
    }
    return valueFromRemoteObject(this.#remoteObject) as T;
  }

  /**
   * @returns Either `null` or the object handle itself, if the object
   * handle is an instance of {@link ElementHandle}.
   */
  asElement(): ElementHandle | null {
    /*  This always returns null, but subclasses can override this and return an
         ElementHandle.
     */
    return null;
  }

  /**
   * Stops referencing the element handle, and resolves when the object handle is
   * successfully disposed of.
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
   * @remarks Useful during debugging.
   */
  toString(): string {
    if (this.#remoteObject.objectId) {
      const type = this.#remoteObject.subtype || this.#remoteObject.type;
      return 'JSHandle@' + type;
    }
    return 'JSHandle:' + valueFromRemoteObject(this.#remoteObject);
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
