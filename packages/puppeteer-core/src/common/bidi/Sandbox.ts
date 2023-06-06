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

import {ElementHandle} from '../../api/ElementHandle.js';
import {withSourcePuppeteerURLIfNone} from '../common.js';
import {EvaluateFuncWith, NodeFor} from '../types.js';

import {BrowsingContext} from './BrowsingContext.js';

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
export class Sandbox {
  #document?: ElementHandle<Document>;
  #context: BrowsingContext;

  constructor(context: BrowsingContext) {
    this.#context = context;
  }

  async document(): Promise<ElementHandle<Document>> {
    if (this.#document) {
      return this.#document;
    }
    this.#document = await this.#context.evaluateHandle(() => {
      return document;
    });
    return this.#document;
  }

  async $<Selector extends string>(
    selector: Selector
  ): Promise<ElementHandle<NodeFor<Selector>> | null> {
    const document = await this.document();
    return document.$(selector);
  }

  async $$<Selector extends string>(
    selector: Selector
  ): Promise<Array<ElementHandle<NodeFor<Selector>>>> {
    const document = await this.document();
    return document.$$(selector);
  }

  async $eval<
    Selector extends string,
    Params extends unknown[],
    Func extends EvaluateFuncWith<NodeFor<Selector>, Params> = EvaluateFuncWith<
      NodeFor<Selector>,
      Params
    >
  >(
    selector: Selector,
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>> {
    pageFunction = withSourcePuppeteerURLIfNone(this.$eval.name, pageFunction);
    const document = await this.document();
    return document.$eval(selector, pageFunction, ...args);
  }

  async $$eval<
    Selector extends string,
    Params extends unknown[],
    Func extends EvaluateFuncWith<
      Array<NodeFor<Selector>>,
      Params
    > = EvaluateFuncWith<Array<NodeFor<Selector>>, Params>
  >(
    selector: Selector,
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>> {
    pageFunction = withSourcePuppeteerURLIfNone(this.$$eval.name, pageFunction);
    const document = await this.document();
    return document.$$eval(selector, pageFunction, ...args);
  }

  async $x(expression: string): Promise<Array<ElementHandle<Node>>> {
    const document = await this.document();
    return document.$x(expression);
  }
}
