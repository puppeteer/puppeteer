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
import type {Protocol} from 'devtools-protocol';

import type {CDPSession} from '../api/CDPSession.js';
import type {Realm} from '../api/Realm.js';
import {WebWorker} from '../api/WebWorker.js';
import type {ConsoleMessageType} from '../common/ConsoleMessage.js';
import {TimeoutSettings} from '../common/TimeoutSettings.js';
import {debugError} from '../common/util.js';

import {ExecutionContext} from './ExecutionContext.js';
import {IsolatedWorld} from './IsolatedWorld.js';
import {CdpJSHandle} from './JSHandle.js';

/**
 * @internal
 */
export type ConsoleAPICalledCallback = (
  eventType: ConsoleMessageType,
  handles: CdpJSHandle[],
  trace?: Protocol.Runtime.StackTrace
) => void;

/**
 * @internal
 */
export type ExceptionThrownCallback = (
  event: Protocol.Runtime.ExceptionThrownEvent
) => void;

/**
 * @internal
 */
export class CdpWebWorker extends WebWorker {
  #world: IsolatedWorld;
  #client: CDPSession;

  constructor(
    client: CDPSession,
    url: string,
    consoleAPICalled: ConsoleAPICalledCallback,
    exceptionThrown: ExceptionThrownCallback
  ) {
    super(url);
    this.#client = client;
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
            return new CdpJSHandle(this.#world, object);
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

  mainRealm(): Realm {
    return this.#world;
  }

  get client(): CDPSession {
    return this.#client;
  }
}
