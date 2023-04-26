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

import {HTTPResponse} from '../../api/HTTPResponse.js';
import {WaitForOptions} from '../../api/Page.js';
import {assert} from '../../util/assert.js';
import {stringifyFunction} from '../../util/Function.js';
import {ProtocolMapping} from '../Connection.js';
import {ProtocolError, TimeoutError} from '../Errors.js';
import {EventEmitter} from '../EventEmitter.js';
import {PuppeteerLifeCycleEvent} from '../LifecycleWatcher.js';
import {TimeoutSettings} from '../TimeoutSettings.js';
import {EvaluateFunc, HandleFor} from '../types.js';
import {isString, setPageContent, waitWithTimeout} from '../util.js';

import {Connection} from './Connection.js';
import {ElementHandle} from './ElementHandle.js';
import {JSHandle} from './JSHandle.js';
import {BidiSerializer} from './Serializer.js';

/**
 * @internal
 */
const lifeCycleToReadinessState = new Map<
  PuppeteerLifeCycleEvent,
  Bidi.BrowsingContext.ReadinessState
>([
  ['load', 'complete'],
  ['domcontentloaded', 'interactive'],
]);

/**
 * @internal
 */
const lifeCycleToSubscribedEvent = new Map<PuppeteerLifeCycleEvent, string>([
  ['load', 'browsingContext.load'],
  ['domcontentloaded', 'browsingContext.domContentLoaded'],
]);

/**
 * @internal
 */
export class Context extends EventEmitter {
  #connection: Connection;
  #url: string;
  _contextId: string;
  _timeoutSettings = new TimeoutSettings();

  constructor(connection: Connection, result: Bidi.BrowsingContext.Info) {
    super();
    this.#connection = connection;
    this._contextId = result.context;
    this.#url = result.url;
  }

  get connection(): Connection {
    return this.#connection;
  }

  get id(): string {
    return this._contextId;
  }

  async evaluateHandle<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>> {
    return this.#evaluate(false, pageFunction, ...args);
  }

  async evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>> {
    return this.#evaluate(true, pageFunction, ...args);
  }

  async #evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    returnByValue: true,
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>>;
  async #evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    returnByValue: false,
    pageFunction: Func | string,
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>>;
  async #evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    returnByValue: boolean,
    pageFunction: Func | string,
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>> | Awaited<ReturnType<Func>>> {
    let responsePromise;
    const resultOwnership = returnByValue ? 'none' : 'root';
    if (isString(pageFunction)) {
      responsePromise = this.#connection.send('script.evaluate', {
        expression: pageFunction,
        target: {context: this._contextId},
        resultOwnership,
        awaitPromise: true,
      });
    } else {
      responsePromise = this.#connection.send('script.callFunction', {
        functionDeclaration: stringifyFunction(pageFunction),
        arguments: await Promise.all(
          args.map(arg => {
            return BidiSerializer.serialize(arg, this);
          })
        ),
        target: {context: this._contextId},
        resultOwnership,
        awaitPromise: true,
      });
    }

    const {result} = await responsePromise;

    if ('type' in result && result.type === 'exception') {
      throw new Error(result.exceptionDetails.text);
    }

    return returnByValue
      ? BidiSerializer.deserialize(result.result)
      : getBidiHandle(this, result.result);
  }

  async goto(
    url: string,
    options: WaitForOptions & {
      referer?: string | undefined;
      referrerPolicy?: string | undefined;
    } = {}
  ): Promise<HTTPResponse | null> {
    const {
      waitUntil = 'load',
      timeout = this._timeoutSettings.navigationTimeout(),
    } = options;

    const readinessState = lifeCycleToReadinessState.get(
      getWaitUntilSingle(waitUntil)
    ) as Bidi.BrowsingContext.ReadinessState;

    try {
      const response = await waitWithTimeout(
        this.connection.send('browsingContext.navigate', {
          url: url,
          context: this.id,
          wait: readinessState,
        }),
        'Navigation',
        timeout
      );
      this.#url = response.result.url;

      return null;
    } catch (error) {
      if (error instanceof ProtocolError) {
        error.message += ` at ${url}`;
      } else if (error instanceof TimeoutError) {
        error.message = 'Navigation timeout of ' + timeout + ' ms exceeded';
      }
      throw error;
    }
  }

  url(): string {
    return this.#url;
  }

  async setContent(
    html: string,
    options: WaitForOptions | undefined = {}
  ): Promise<void> {
    const {
      waitUntil = 'load',
      timeout = this._timeoutSettings.navigationTimeout(),
    } = options;

    const waitUntilCommand = lifeCycleToSubscribedEvent.get(
      getWaitUntilSingle(waitUntil)
    ) as string;

    await Promise.all([
      setPageContent(this, html),
      waitWithTimeout(
        new Promise<void>(resolve => {
          this.once(waitUntilCommand, () => {
            resolve();
          });
        }),
        waitUntilCommand,
        timeout
      ),
    ]);
  }

  async sendCDPCommand(
    method: keyof ProtocolMapping.Commands,
    params: object = {}
  ): Promise<unknown> {
    const session = await this.#connection.send('cdp.getSession', {
      context: this._contextId,
    });
    // TODO: remove any once chromium-bidi types are updated.
    const sessionId = (session.result as any).cdpSession;
    return await this.#connection.send('cdp.sendCommand', {
      cdpMethod: method,
      cdpParams: params,
      cdpSession: sessionId,
    });
  }
}

/**
 * @internal
 */
function getWaitUntilSingle(
  event: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[]
): Extract<PuppeteerLifeCycleEvent, 'load' | 'domcontentloaded'> {
  if (Array.isArray(event) && event.length > 1) {
    throw new Error('BiDi support only single `waitUntil` argument');
  }
  const waitUntilSingle = Array.isArray(event)
    ? (event.find(lifecycle => {
        return lifecycle === 'domcontentloaded' || lifecycle === 'load';
      }) as PuppeteerLifeCycleEvent)
    : event;

  if (
    waitUntilSingle === 'networkidle0' ||
    waitUntilSingle === 'networkidle2'
  ) {
    throw new Error(`BiDi does not support 'waitUntil' ${waitUntilSingle}`);
  }

  assert(waitUntilSingle, `Invalid waitUntil option ${waitUntilSingle}`);

  return waitUntilSingle;
}

/**
 * @internal
 */
export function getBidiHandle(
  context: Context,
  result: Bidi.CommonDataTypes.RemoteValue
): JSHandle | ElementHandle<Node> {
  if (result.type === 'node' || result.type === 'window') {
    return new ElementHandle(context, result);
  }
  return new JSHandle(context, result);
}
