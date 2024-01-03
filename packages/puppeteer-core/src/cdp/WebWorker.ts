/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
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
