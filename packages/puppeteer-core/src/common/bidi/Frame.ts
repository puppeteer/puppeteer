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

import {Frame, throwIfDetached} from '../../api/Frame.js';
import {Deferred} from '../../util/Deferred.js';
import {CDPSession} from '../Connection.js';
import {UTILITY_WORLD_NAME} from '../FrameManager.js';
import {PuppeteerLifeCycleEvent} from '../LifecycleWatcher.js';
import {TimeoutSettings} from '../TimeoutSettings.js';
import {Awaitable} from '../types.js';
import {waitForEvent} from '../util.js';

import {
  BrowsingContext,
  getWaitUntilSingle,
  lifeCycleToSubscribedEvent,
} from './BrowsingContext.js';
import {ExposeableFunction} from './ExposedFunction.js';
import {HTTPResponse} from './HTTPResponse.js';
import {BidiPage} from './Page.js';
import {
  MAIN_SANDBOX,
  PUPPETEER_SANDBOX,
  Sandbox,
  SandboxChart,
} from './Sandbox.js';

/**
 * Puppeteer's Frame class could be viewed as a BiDi BrowsingContext implementation
 * @internal
 */
export class BidiFrame extends Frame {
  #page: BidiPage;
  #context: BrowsingContext;
  #timeoutSettings: TimeoutSettings;
  #abortDeferred = Deferred.create<Error>();
  #disposed = false;
  sandboxes: SandboxChart;
  override _id: string;

  constructor(
    page: BidiPage,
    context: BrowsingContext,
    timeoutSettings: TimeoutSettings,
    parentId?: string | null
  ) {
    super();
    this.#page = page;
    this.#context = context;
    this.#timeoutSettings = timeoutSettings;
    this._id = this.#context.id;
    this._parentId = parentId ?? undefined;

    this.sandboxes = {
      [MAIN_SANDBOX]: new Sandbox(undefined, this, context, timeoutSettings),
      [PUPPETEER_SANDBOX]: new Sandbox(
        UTILITY_WORLD_NAME,
        this,
        context.createRealmForSandbox(),
        timeoutSettings
      ),
    };
  }

  override get client(): CDPSession {
    return this.context().cdpSession;
  }

  override mainRealm(): Sandbox {
    return this.sandboxes[MAIN_SANDBOX];
  }

  override isolatedRealm(): Sandbox {
    return this.sandboxes[PUPPETEER_SANDBOX];
  }

  override page(): BidiPage {
    return this.#page;
  }

  override url(): string {
    return this.#context.url;
  }

  override parentFrame(): BidiFrame | null {
    return this.#page.frame(this._parentId ?? '');
  }

  override childFrames(): BidiFrame[] {
    return this.#page.childFrames(this.#context.id);
  }

  @throwIfDetached
  override async goto(
    url: string,
    options?: {
      referer?: string;
      referrerPolicy?: string;
      timeout?: number;
      waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
    }
  ): Promise<HTTPResponse | null> {
    const navigationId = await this.#context.goto(url, {
      ...options,
      timeout: options?.timeout ?? this.#timeoutSettings.navigationTimeout(),
    });
    return this.#page.getNavigationResponse(navigationId);
  }

  @throwIfDetached
  override setContent(
    html: string,
    options: {
      timeout?: number;
      waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
    }
  ): Promise<void> {
    return this.#context.setContent(html, {
      ...options,
      timeout: options?.timeout ?? this.#timeoutSettings.navigationTimeout(),
    });
  }

  context(): BrowsingContext {
    return this.#context;
  }

  @throwIfDetached
  override async waitForNavigation(
    options: {
      timeout?: number;
      waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
    } = {}
  ): Promise<HTTPResponse | null> {
    const {
      waitUntil = 'load',
      timeout = this.#timeoutSettings.navigationTimeout(),
    } = options;

    const waitUntilEvent = lifeCycleToSubscribedEvent.get(
      getWaitUntilSingle(waitUntil)
    ) as string;

    const [info] = await Deferred.race([
      // TODO(lightning00blade): Should also keep tack of
      // navigationAborted and navigationFailed
      Promise.all([
        waitForEvent<Bidi.BrowsingContext.NavigationInfo>(
          this.#context,
          waitUntilEvent,
          () => {
            return true;
          },
          timeout,
          this.#abortDeferred.valueOrThrow()
        ),
        waitForEvent(
          this.#context,
          Bidi.ChromiumBidi.BrowsingContext.EventNames.NavigationStarted,
          () => {
            return true;
          },
          timeout,
          this.#abortDeferred.valueOrThrow()
        ),
      ]),
      waitForEvent<Bidi.BrowsingContext.NavigationInfo>(
        this.#context,
        Bidi.ChromiumBidi.BrowsingContext.EventNames.FragmentNavigated,
        () => {
          return true;
        },
        timeout,
        this.#abortDeferred.valueOrThrow()
      ).then(info => {
        return [info, undefined];
      }),
    ]);

    return this.#page.getNavigationResponse(info.navigation);
  }

  override get detached(): boolean {
    return this.#disposed;
  }

  [Symbol.dispose](): void {
    if (this.#disposed) {
      return;
    }
    this.#disposed = true;
    this.#abortDeferred.reject(new Error('Frame detached'));
    this.#context.dispose();
    this.sandboxes[MAIN_SANDBOX][Symbol.dispose]();
    this.sandboxes[PUPPETEER_SANDBOX][Symbol.dispose]();
  }

  #exposedFunctions = new Map<string, ExposeableFunction<never[], unknown>>();
  override async exposeFunction<Args extends unknown[], Ret>(
    name: string,
    apply: (...args: Args) => Awaitable<Ret>
  ): Promise<void> {
    if (this.#exposedFunctions.has(name)) {
      throw new Error(
        `Failed to add page binding with name ${name}: globalThis['${name}'] already exists!`
      );
    }
    const exposeable = new ExposeableFunction(this, name, apply);
    this.#exposedFunctions.set(name, exposeable);
    try {
      await exposeable.expose();
    } catch (error) {
      this.#exposedFunctions.delete(name);
      throw error;
    }
  }
}
