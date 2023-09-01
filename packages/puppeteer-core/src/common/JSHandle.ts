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

import {CDPSession} from './Connection.js';
import type {CDPElementHandle} from './ElementHandle.js';
import {IsolatedWorld} from './IsolatedWorld.js';
import {releaseObject, valueFromRemoteObject} from './util.js';

/**
 * @internal
 */
export class CDPJSHandle<T = unknown> extends JSHandle<T> {
  #disposed = false;
  readonly #remoteObject: Protocol.Runtime.RemoteObject;
  readonly #world: IsolatedWorld;

  constructor(
    world: IsolatedWorld,
    remoteObject: Protocol.Runtime.RemoteObject
  ) {
    super();
    this.#world = world;
    this.#remoteObject = remoteObject;
  }

  override get disposed(): boolean {
    return this.#disposed;
  }

  override get realm(): IsolatedWorld {
    return this.#world;
  }

  get client(): CDPSession {
    return this.realm.environment.client;
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
