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
import {Frame as BaseFrame} from '../../api/Frame.js';
import {UTILITY_WORLD_NAME} from '../FrameManager.js';
import {PuppeteerLifeCycleEvent} from '../LifecycleWatcher.js';
import {TimeoutSettings} from '../TimeoutSettings.js';
import {EvaluateFunc, EvaluateFuncWith, HandleFor, NodeFor} from '../types.js';
import {withSourcePuppeteerURLIfNone} from '../util.js';

import {BrowsingContext} from './BrowsingContext.js';
import {HTTPResponse} from './HTTPResponse.js';
import {Page} from './Page.js';
import {
  MAIN_SANDBOX,
  PUPPETEER_SANDBOX,
  SandboxChart,
  Sandbox,
} from './Sandbox.js';

/**
 * Puppeteer's Frame class could be viewed as a BiDi BrowsingContext implementation
 * @internal
 */
export class Frame extends BaseFrame {
  #page: Page;
  #context: BrowsingContext;
  sandboxes: SandboxChart;
  override _id: string;

  constructor(
    page: Page,
    context: BrowsingContext,
    timeoutSettings: TimeoutSettings,
    parentId?: string | null
  ) {
    super();
    this.#page = page;
    this.#context = context;
    this._id = this.#context.id;
    this._parentId = parentId ?? undefined;

    const puppeteerRealm = context.createSandboxRealm(UTILITY_WORLD_NAME);
    this.sandboxes = {
      [MAIN_SANDBOX]: new Sandbox(context, timeoutSettings),
      [PUPPETEER_SANDBOX]: new Sandbox(puppeteerRealm, timeoutSettings),
    };

    puppeteerRealm.setFrame(this);
    context.setFrame(this);
  }

  override mainRealm(): Sandbox {
    return this.sandboxes[MAIN_SANDBOX];
  }

  override isolatedRealm(): Sandbox {
    return this.sandboxes[PUPPETEER_SANDBOX];
  }

  override page(): Page {
    return this.#page;
  }

  override name(): string {
    return this._name || '';
  }

  override url(): string {
    return this.#context.url;
  }

  override parentFrame(): Frame | null {
    return this.#page.frame(this._parentId ?? '');
  }

  override childFrames(): Frame[] {
    return this.#page.childFrames(this.#context.id);
  }

  override async evaluateHandle<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>> {
    return this.#context.evaluateHandle(pageFunction, ...args);
  }

  override async evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>> {
    return this.#context.evaluate(pageFunction, ...args);
  }

  override async goto(
    url: string,
    options?:
      | {
          referer?: string | undefined;
          referrerPolicy?: string | undefined;
          timeout?: number | undefined;
          waitUntil?:
            | PuppeteerLifeCycleEvent
            | PuppeteerLifeCycleEvent[]
            | undefined;
        }
      | undefined
  ): Promise<HTTPResponse | null> {
    const navigationId = await this.#context.goto(url, options);
    return this.#page.getNavigationResponse(navigationId);
  }

  override setContent(
    html: string,
    options: {
      timeout?: number;
      waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
    }
  ): Promise<void> {
    return this.#context.setContent(html, options);
  }

  override content(): Promise<string> {
    return this.#context.content();
  }

  override title(): Promise<string> {
    return this.#context.title();
  }

  context(): BrowsingContext {
    return this.#context;
  }

  override $<Selector extends string>(
    selector: Selector
  ): Promise<ElementHandle<NodeFor<Selector>> | null> {
    return this.sandboxes[MAIN_SANDBOX].$(selector);
  }

  override $$<Selector extends string>(
    selector: Selector
  ): Promise<Array<ElementHandle<NodeFor<Selector>>>> {
    return this.sandboxes[MAIN_SANDBOX].$$(selector);
  }

  override $eval<
    Selector extends string,
    Params extends unknown[],
    Func extends EvaluateFuncWith<NodeFor<Selector>, Params> = EvaluateFuncWith<
      NodeFor<Selector>,
      Params
    >
  >(
    selector: Selector,
    pageFunction: string | Func,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>> {
    pageFunction = withSourcePuppeteerURLIfNone(this.$eval.name, pageFunction);
    return this.sandboxes[MAIN_SANDBOX].$eval(selector, pageFunction, ...args);
  }

  override $$eval<
    Selector extends string,
    Params extends unknown[],
    Func extends EvaluateFuncWith<
      Array<NodeFor<Selector>>,
      Params
    > = EvaluateFuncWith<Array<NodeFor<Selector>>, Params>
  >(
    selector: Selector,
    pageFunction: string | Func,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>> {
    pageFunction = withSourcePuppeteerURLIfNone(this.$$eval.name, pageFunction);
    return this.sandboxes[MAIN_SANDBOX].$$eval(selector, pageFunction, ...args);
  }

  override $x(expression: string): Promise<Array<ElementHandle<Node>>> {
    return this.sandboxes[MAIN_SANDBOX].$x(expression);
  }

  dispose(): void {
    this.#context.dispose();
  }
}
