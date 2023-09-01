/**
 * Copyright 2018 Google Inc. All rights reserved.
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

import {Realm} from '../api/Realm.js';

import {CDPSession} from './Connection.js';
import {ConsoleMessageType} from './ConsoleMessage.js';
import {EventEmitter} from './EventEmitter.js';
import {ExecutionContext} from './ExecutionContext.js';
import {IsolatedWorld} from './IsolatedWorld.js';
import {CDPJSHandle} from './JSHandle.js';
import {TimeoutSettings} from './TimeoutSettings.js';
import {EvaluateFunc, HandleFor} from './types.js';
import {debugError, withSourcePuppeteerURLIfNone} from './util.js';

/**
 * @internal
 */
export type ConsoleAPICalledCallback = (
  eventType: ConsoleMessageType,
  handles: CDPJSHandle[],
  trace: Protocol.Runtime.StackTrace
) => void;

/**
 * @internal
 */
export type ExceptionThrownCallback = (
  event: Protocol.Runtime.ExceptionThrownEvent
) => void;

/**
 * This class represents a
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API | WebWorker}.
 *
 * @remarks
 * The events `workercreated` and `workerdestroyed` are emitted on the page
 * object to signal the worker lifecycle.
 *
 * @example
 *
 * ```ts
 * page.on('workercreated', worker =>
 *   console.log('Worker created: ' + worker.url())
 * );
 * page.on('workerdestroyed', worker =>
 *   console.log('Worker destroyed: ' + worker.url())
 * );
 *
 * console.log('Current workers:');
 * for (const worker of page.workers()) {
 *   console.log('  ' + worker.url());
 * }
 * ```
 *
 * @public
 */
export class WebWorker extends EventEmitter {
  /**
   * @internal
   */
  readonly timeoutSettings = new TimeoutSettings();

  #world: IsolatedWorld;
  #client: CDPSession;
  #url: string;

  /**
   * @internal
   */
  constructor(
    client: CDPSession,
    url: string,
    consoleAPICalled: ConsoleAPICalledCallback,
    exceptionThrown: ExceptionThrownCallback
  ) {
    super();
    this.#client = client;
    this.#url = url;
    this.#world = new IsolatedWorld(this, new TimeoutSettings());

    this.#client.once('Runtime.executionContextCreated', async event => {
      this.#world.setContext(
        new ExecutionContext(client, event.context, this.#world)
      );
    });
    this.#client.on('Runtime.consoleAPICalled', async event => {
      try {
        return consoleAPICalled(
          event.type,
          event.args.map((object: Protocol.Runtime.RemoteObject) => {
            return new CDPJSHandle(this.#world, object);
          }),
          event.stackTrace
        );
      } catch (err) {
        debugError(err);
      }
    });
    this.#client.on('Runtime.exceptionThrown', exceptionThrown);

    // This might fail if the target is closed before we receive all execution contexts.
    this.#client.send('Runtime.enable').catch(debugError);
  }

  /**
   * @internal
   */
  mainRealm(): Realm {
    return this.#world;
  }

  /**
   * The URL of this web worker.
   */
  url(): string {
    return this.#url;
  }

  /**
   * The CDP session client the WebWorker belongs to.
   */
  get client(): CDPSession {
    return this.#client;
  }

  /**
   * If the function passed to the `worker.evaluate` returns a Promise, then
   * `worker.evaluate` would wait for the promise to resolve and return its
   * value. If the function passed to the `worker.evaluate` returns a
   * non-serializable value, then `worker.evaluate` resolves to `undefined`.
   * DevTools Protocol also supports transferring some additional values that
   * are not serializable by `JSON`: `-0`, `NaN`, `Infinity`, `-Infinity`, and
   * bigint literals.
   * Shortcut for `await worker.executionContext()).evaluate(pageFunction, ...args)`.
   *
   * @param pageFunction - Function to be evaluated in the worker context.
   * @param args - Arguments to pass to `pageFunction`.
   * @returns Promise which resolves to the return value of `pageFunction`.
   */
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
    return await this.mainRealm().evaluate(pageFunction, ...args);
  }

  /**
   * The only difference between `worker.evaluate` and `worker.evaluateHandle`
   * is that `worker.evaluateHandle` returns in-page object (JSHandle). If the
   * function passed to the `worker.evaluateHandle` returns a `Promise`, then
   * `worker.evaluateHandle` would wait for the promise to resolve and return
   * its value. Shortcut for
   * `await worker.executionContext()).evaluateHandle(pageFunction, ...args)`
   *
   * @param pageFunction - Function to be evaluated in the page context.
   * @param args - Arguments to pass to `pageFunction`.
   * @returns Promise which resolves to the return value of `pageFunction`.
   */
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
    return await this.mainRealm().evaluateHandle(pageFunction, ...args);
  }
}
