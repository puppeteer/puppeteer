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

import {JSHandle} from '../api/JSHandle.js';
import {assert} from '../util/assert.js';

import {CDPSession} from './Connection.js';
import type {CDPElementHandle} from './ElementHandle.js';
import {ExecutionContext} from './ExecutionContext.js';
import {EvaluateFuncWith, HandleFor, HandleOr} from './types.js';
import {
  createJSHandle,
  releaseObject,
  valueFromRemoteObject,
  withSourcePuppeteerURLIfNone,
} from './util.js';

/**
 * @internal
 */
export class CDPJSHandle<T = unknown> extends JSHandle<T> {
  #disposed = false;
  #context: ExecutionContext;
  #remoteObject: Protocol.Runtime.RemoteObject;

  override get disposed(): boolean {
    return this.#disposed;
  }

  constructor(
    context: ExecutionContext,
    remoteObject: Protocol.Runtime.RemoteObject
  ) {
    super();
    this.#context = context;
    this.#remoteObject = remoteObject;
  }

  executionContext(): ExecutionContext {
    return this.#context;
  }

  get client(): CDPSession {
    return this.#context._client;
  }

  /**
   * @see {@link ExecutionContext.evaluate} for more details.
   */
  override async evaluate<
    Params extends unknown[],
    Func extends EvaluateFuncWith<T, Params> = EvaluateFuncWith<T, Params>,
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>> {
    pageFunction = withSourcePuppeteerURLIfNone(
      this.evaluate.name,
      pageFunction
    );
    return await this.executionContext().evaluate(pageFunction, this, ...args);
  }

  /**
   * @see {@link ExecutionContext.evaluateHandle} for more details.
   */
  override async evaluateHandle<
    Params extends unknown[],
    Func extends EvaluateFuncWith<T, Params> = EvaluateFuncWith<T, Params>,
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>> {
    pageFunction = withSourcePuppeteerURLIfNone(
      this.evaluateHandle.name,
      pageFunction
    );
    return await this.executionContext().evaluateHandle(
      pageFunction,
      this,
      ...args
    );
  }

  override async getProperty<K extends keyof T>(
    propertyName: HandleOr<K>
  ): Promise<HandleFor<T[K]>>;
  override async getProperty(propertyName: string): Promise<JSHandle<unknown>>;
  override async getProperty<K extends keyof T>(
    propertyName: HandleOr<K>
  ): Promise<HandleFor<T[K]>> {
    return this.evaluateHandle((object, propertyName) => {
      return object[propertyName as K];
    }, propertyName);
  }

  override async getProperties(): Promise<Map<string, JSHandle>> {
    assert(this.#remoteObject.objectId);
    // We use Runtime.getProperties rather than iterative building because the
    // iterative approach might create a distorted snapshot.
    const response = await this.client.send('Runtime.getProperties', {
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

  override async jsonValue(): Promise<T> {
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
   * Either `null` or the handle itself if the handle is an
   * instance of {@link ElementHandle}.
   */
  override asElement(): CDPElementHandle<Node> | null {
    return null;
  }

  override async dispose(): Promise<void> {
    if (this.#disposed) {
      return;
    }
    this.#disposed = true;
    await releaseObject(this.client, this.#remoteObject);
  }

  override toString(): string {
    if (!this.#remoteObject.objectId) {
      return 'JSHandle:' + valueFromRemoteObject(this.#remoteObject);
    }
    const type = this.#remoteObject.subtype || this.#remoteObject.type;
    return 'JSHandle@' + type;
  }

  override get id(): string | undefined {
    return this.#remoteObject.objectId;
  }

  override remoteObject(): Protocol.Runtime.RemoteObject {
    return this.#remoteObject;
  }
}
