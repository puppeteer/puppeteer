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
import { EventEmitter } from './EventEmitter.js';
import { debugError } from './helper.js';
import { ExecutionContext } from './ExecutionContext.js';
import { JSHandle } from './JSHandle.js';
import { CDPSession } from './Connection.js';
import { Protocol } from 'devtools-protocol';
import { EvaluateHandleFn, SerializableOrJSHandle } from './EvalTypes.js';

/**
 * @internal
 */
export type ConsoleAPICalledCallback = (
  eventType: string,
  handles: JSHandle[],
  trace: Protocol.Runtime.StackTrace
) => void;

/**
 * @internal
 */
export type ExceptionThrownCallback = (
  details: Protocol.Runtime.ExceptionDetails
) => void;
type JSHandleFactory = (obj: Protocol.Runtime.RemoteObject) => JSHandle;

/**
 * The WebWorker class represents a
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API | WebWorker}.
 *
 * @remarks
 * The events `workercreated` and `workerdestroyed` are emitted on the page
 * object to signal the worker lifecycle.
 *
 * @example
 * ```js
 * page.on('workercreated', worker => console.log('Worker created: ' + worker.url()));
 * page.on('workerdestroyed', worker => console.log('Worker destroyed: ' + worker.url()));
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
  _client: CDPSession;
  _url: string;
  _executionContextPromise: Promise<ExecutionContext>;
  _executionContextCallback: (value: ExecutionContext) => void;

  /**
   *
   * @internal
   */
  constructor(
    client: CDPSession,
    url: string,
    consoleAPICalled: ConsoleAPICalledCallback,
    exceptionThrown: ExceptionThrownCallback
  ) {
    super();
    this._client = client;
    this._url = url;
    this._executionContextPromise = new Promise<ExecutionContext>(
      (x) => (this._executionContextCallback = x)
    );

    let jsHandleFactory: JSHandleFactory;
    this._client.once('Runtime.executionContextCreated', async (event) => {
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      jsHandleFactory = (remoteObject) =>
        new JSHandle(executionContext, client, remoteObject);
      const executionContext = new ExecutionContext(
        client,
        event.context,
        null
      );
      this._executionContextCallback(executionContext);
    });

    // This might fail if the target is closed before we recieve all execution contexts.
    this._client.send('Runtime.enable').catch(debugError);
    this._client.on('Runtime.consoleAPICalled', (event) =>
      consoleAPICalled(
        event.type,
        event.args.map(jsHandleFactory),
        event.stackTrace
      )
    );
    this._client.on('Runtime.exceptionThrown', (exception) =>
      exceptionThrown(exception.exceptionDetails)
    );
  }

  /**
   * @returns The URL of this web worker.
   */
  url(): string {
    return this._url;
  }

  /**
   * Returns the ExecutionContext the WebWorker runs in
   * @returns The ExecutionContext the web worker runs in.
   */
  async executionContext(): Promise<ExecutionContext> {
    return this._executionContextPromise;
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
  async evaluate<ReturnType extends any>(
    pageFunction: Function | string,
    ...args: any[]
  ): Promise<ReturnType> {
    return (await this._executionContextPromise).evaluate<ReturnType>(
      pageFunction,
      ...args
    );
  }

  /**
   * The only difference between `worker.evaluate` and `worker.evaluateHandle`
   * is that `worker.evaluateHandle` returns in-page object (JSHandle). If the
   * function passed to the `worker.evaluateHandle` returns a [Promise], then
   * `worker.evaluateHandle` would wait for the promise to resolve and return
   * its value. Shortcut for
   * `await worker.executionContext()).evaluateHandle(pageFunction, ...args)`
   *
   * @param pageFunction - Function to be evaluated in the page context.
   * @param args - Arguments to pass to `pageFunction`.
   * @returns Promise which resolves to the return value of `pageFunction`.
   */
  async evaluateHandle<HandlerType extends JSHandle = JSHandle>(
    pageFunction: EvaluateHandleFn,
    ...args: SerializableOrJSHandle[]
  ): Promise<JSHandle> {
    return (await this._executionContextPromise).evaluateHandle<HandlerType>(
      pageFunction,
      ...args
    );
  }
}
