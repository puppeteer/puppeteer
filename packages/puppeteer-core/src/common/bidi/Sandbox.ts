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

import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {JSHandle as BaseJSHandle} from '../../api/JSHandle.js';
import {Realm as RealmApi} from '../../api/Realm.js';
import {TimeoutSettings} from '../TimeoutSettings.js';
import {EvaluateFunc, HandleFor} from '../types.js';
import {withSourcePuppeteerURLIfNone} from '../util.js';

import {BrowsingContext} from './BrowsingContext.js';
import {JSHandle} from './JSHandle.js';
import {Realm} from './Realm.js';
/**
 * A unique key for {@link SandboxChart} to denote the default world.
 * Realms are automatically created in the default sandbox.
 *
 * @internal
 */
export const MAIN_SANDBOX = Symbol('mainSandbox');
/**
 * A unique key for {@link SandboxChart} to denote the puppeteer sandbox.
 * This world contains all puppeteer-internal bindings/code.
 *
 * @internal
 */
export const PUPPETEER_SANDBOX = Symbol('puppeteerSandbox');

/**
 * @internal
 */
export interface SandboxChart {
  [key: string]: Sandbox;
  [MAIN_SANDBOX]: Sandbox;
  [PUPPETEER_SANDBOX]: Sandbox;
}

/**
 * @internal
 */
export class Sandbox extends RealmApi {
  #realm: Realm;

  constructor(
    // TODO: We should split the Realm and BrowsingContext
    realm: Realm | BrowsingContext,
    timeoutSettings: TimeoutSettings
  ) {
    super(timeoutSettings);
    this.#realm = realm;

    // TODO: Tack correct realm similar to BrowsingContexts
    this.#realm.connection.on(
      Bidi.ChromiumBidi.Script.EventNames.RealmCreated,
      () => {
        void this.taskManager.rerunAll();
      }
    );
  }

  async evaluateHandle<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>,
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>> {
    pageFunction = withSourcePuppeteerURLIfNone(
      this.evaluateHandle.name,
      pageFunction
    );
    return this.#realm.evaluateHandle(pageFunction, ...args);
  }

  async evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>,
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>> {
    pageFunction = withSourcePuppeteerURLIfNone(
      this.evaluate.name,
      pageFunction
    );
    return this.#realm.evaluate(pageFunction, ...args);
  }

  async adoptHandle<T extends BaseJSHandle<Node>>(handle: T): Promise<T> {
    return (await this.evaluateHandle(node => {
      return node;
    }, handle)) as unknown as T;
  }

  async transferHandle<T extends BaseJSHandle<Node>>(handle: T): Promise<T> {
    if ((handle as unknown as JSHandle).context() === this.#realm) {
      return handle;
    }
    const transferredHandle = await this.evaluateHandle(node => {
      return node;
    }, handle);

    await handle.dispose();
    return transferredHandle as unknown as T;
  }
}
