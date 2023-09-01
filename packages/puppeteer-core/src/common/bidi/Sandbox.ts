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

import {JSHandle} from '../../api/JSHandle.js';
import {Realm} from '../../api/Realm.js';
import {TimeoutSettings} from '../TimeoutSettings.js';
import {EvaluateFunc, HandleFor} from '../types.js';
import {withSourcePuppeteerURLIfNone} from '../util.js';

import {BrowsingContext} from './BrowsingContext.js';
import {BidiFrame} from './Frame.js';
import {Realm as BidiRealm} from './Realm.js';
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
export class Sandbox extends Realm {
  readonly name: string | undefined;
  readonly realm: BidiRealm;
  #frame: BidiFrame;

  constructor(
    name: string | undefined,
    frame: BidiFrame,
    // TODO: We should split the Realm and BrowsingContext
    realm: BidiRealm | BrowsingContext,
    timeoutSettings: TimeoutSettings
  ) {
    super(timeoutSettings);
    this.name = name;
    this.realm = realm;
    this.#frame = frame;
    this.realm.setSandbox(this);
  }

  override get environment(): BidiFrame {
    return this.#frame;
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
    return await this.realm.evaluateHandle(pageFunction, ...args);
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
    return await this.realm.evaluate(pageFunction, ...args);
  }

  async adoptHandle<T extends JSHandle<Node>>(handle: T): Promise<T> {
    return (await this.evaluateHandle(node => {
      return node;
    }, handle)) as unknown as T;
  }

  async transferHandle<T extends JSHandle<Node>>(handle: T): Promise<T> {
    if (handle.realm === this) {
      return handle;
    }
    const transferredHandle = await this.evaluateHandle(node => {
      return node;
    }, handle);
    await handle.dispose();
    return transferredHandle as unknown as T;
  }
}
