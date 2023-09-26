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

import {
  type Observable,
  firstValueFrom,
  from,
  fromEvent,
  merge,
  raceWith,
  switchMap,
} from '../../third_party/rxjs/rxjs.js';
import type {CDPSession} from '../api/CDPSession.js';
import {
  Frame,
  type GoToOptions,
  type WaitForOptions,
  throwIfDetached,
} from '../api/Frame.js';
import type {PuppeteerLifeCycleEvent} from '../cdp/LifecycleWatcher.js';
import {ProtocolError, TimeoutError} from '../common/Errors.js';
import type {TimeoutSettings} from '../common/TimeoutSettings.js';
import type {Awaitable} from '../common/types.js';
import {
  UTILITY_WORLD_NAME,
  setPageContent,
  waitWithTimeout,
} from '../common/util.js';
import {timeout} from '../common/util.js';
import {Deferred} from '../util/Deferred.js';
import {disposeSymbol} from '../util/disposable.js';

import {
  getWaitUntilSingle,
  lifeCycleToSubscribedEvent,
  type BrowsingContext,
} from './BrowsingContext.js';
import {ExposeableFunction} from './ExposedFunction.js';
import type {BidiHTTPResponse} from './HTTPResponse.js';
import type {BidiPage} from './Page.js';
import {
  MAIN_SANDBOX,
  PUPPETEER_SANDBOX,
  Sandbox,
  type SandboxChart,
} from './Sandbox.js';

/**
 * @internal
 */
export const lifeCycleToReadinessState = new Map<
  PuppeteerLifeCycleEvent,
  Bidi.BrowsingContext.ReadinessState
>([
  ['load', Bidi.BrowsingContext.ReadinessState.Complete],
  ['domcontentloaded', Bidi.BrowsingContext.ReadinessState.Interactive],
]);

/**
 * Puppeteer's Frame class could be viewed as a BiDi BrowsingContext implementation
 * @internal
 */
export class BidiFrame extends Frame {
  #page: BidiPage;
  #context: BrowsingContext;
  #timeoutSettings: TimeoutSettings;
  #abortDeferred = Deferred.create<never>();
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
    options: GoToOptions = {}
  ): Promise<BidiHTTPResponse | null> {
    const {
      waitUntil = 'load',
      timeout = this.#timeoutSettings.navigationTimeout(),
    } = options;

    const readinessState = lifeCycleToReadinessState.get(
      getWaitUntilSingle(waitUntil)
    ) as Bidi.BrowsingContext.ReadinessState;

    try {
      const {result} = await waitWithTimeout(
        this.#context.connection.send('browsingContext.navigate', {
          url: url,
          context: this._id,
          wait: readinessState,
        }),
        'Navigation',
        timeout
      );

      return this.#page.getNavigationResponse(result.navigation);
    } catch (error) {
      if (error instanceof ProtocolError) {
        error.message += ` at ${url}`;
      } else if (error instanceof TimeoutError) {
        error.message = 'Navigation timeout of ' + timeout + ' ms exceeded';
      }
      throw error;
    }
  }

  @throwIfDetached
  override async setContent(
    html: string,
    options: WaitForOptions = {}
  ): Promise<void> {
    const {
      waitUntil = 'load',
      timeout = this.#timeoutSettings.navigationTimeout(),
    } = options;

    const waitUntilEvent = lifeCycleToSubscribedEvent.get(
      getWaitUntilSingle(waitUntil)
    ) as string;

    await Promise.all([
      setPageContent(this, html),
      waitWithTimeout(
        new Promise<void>(resolve => {
          this.#context.once(waitUntilEvent, () => {
            resolve();
          });
        }),
        waitUntilEvent,
        timeout
      ),
    ]);
  }

  context(): BrowsingContext {
    return this.#context;
  }

  @throwIfDetached
  override async waitForNavigation(
    options: WaitForOptions = {}
  ): Promise<BidiHTTPResponse | null> {
    const {
      waitUntil = 'load',
      timeout: ms = this.#timeoutSettings.navigationTimeout(),
    } = options;

    const waitUntilEvent = lifeCycleToSubscribedEvent.get(
      getWaitUntilSingle(waitUntil)
    ) as string;

    const info = await firstValueFrom(
      merge(
        fromEvent(
          this.#context,
          Bidi.ChromiumBidi.BrowsingContext.EventNames.NavigationStarted
        ).pipe(
          switchMap(() => {
            return fromEvent(
              this.#context,
              waitUntilEvent
            ) as Observable<Bidi.BrowsingContext.NavigationInfo>;
          })
        ),
        fromEvent(
          this.#context,
          Bidi.ChromiumBidi.BrowsingContext.EventNames.FragmentNavigated
        ) as Observable<Bidi.BrowsingContext.NavigationInfo>
      ).pipe(raceWith(timeout(ms), from(this.#abortDeferred.valueOrThrow())))
    );

    return this.#page.getNavigationResponse(info.navigation);
  }

  override get detached(): boolean {
    return this.#disposed;
  }

  [disposeSymbol](): void {
    if (this.#disposed) {
      return;
    }
    this.#disposed = true;
    this.#abortDeferred.reject(new Error('Frame detached'));
    this.#context.dispose();
    this.sandboxes[MAIN_SANDBOX][disposeSymbol]();
    this.sandboxes[PUPPETEER_SANDBOX][disposeSymbol]();
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
