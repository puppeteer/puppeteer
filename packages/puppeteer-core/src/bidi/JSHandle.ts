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

import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import type {ElementHandle} from '../api/ElementHandle.js';
import {JSHandle} from '../api/JSHandle.js';

import {BidiDeserializer} from './Deserializer.js';
import type {BidiRealm} from './Realm.js';
import type {Sandbox} from './Sandbox.js';
import {releaseReference} from './util.js';

/**
 * @internal
 */
export class BidiJSHandle<T = unknown> extends JSHandle<T> {
  #disposed = false;
  readonly #sandbox: Sandbox;
  readonly #remoteValue: Bidi.Script.RemoteValue;

  constructor(sandbox: Sandbox, remoteValue: Bidi.Script.RemoteValue) {
    super();
    this.#sandbox = sandbox;
    this.#remoteValue = remoteValue;
  }

  context(): BidiRealm {
    return this.realm.environment.context();
  }

  override get realm(): Sandbox {
    return this.#sandbox;
  }

  override get disposed(): boolean {
    return this.#disposed;
  }

  override async jsonValue(): Promise<T> {
    return await this.evaluate(value => {
      return value;
    });
  }

  override asElement(): ElementHandle<Node> | null {
    return null;
  }

  override async dispose(): Promise<void> {
    if (this.#disposed) {
      return;
    }
    this.#disposed = true;
    if ('handle' in this.#remoteValue) {
      await releaseReference(
        this.context(),
        this.#remoteValue as Bidi.Script.RemoteReference
      );
    }
  }

  get isPrimitiveValue(): boolean {
    switch (this.#remoteValue.type) {
      case 'string':
      case 'number':
      case 'bigint':
      case 'boolean':
      case 'undefined':
      case 'null':
        return true;

      default:
        return false;
    }
  }

  override toString(): string {
    if (this.isPrimitiveValue) {
      return 'JSHandle:' + BidiDeserializer.deserialize(this.#remoteValue);
    }

    return 'JSHandle@' + this.#remoteValue.type;
  }

  override get id(): string | undefined {
    return 'handle' in this.#remoteValue ? this.#remoteValue.handle : undefined;
  }

  remoteValue(): Bidi.Script.RemoteValue {
    return this.#remoteValue;
  }

  override remoteObject(): never {
    throw new Error('Not available in WebDriver BiDi');
  }
}
