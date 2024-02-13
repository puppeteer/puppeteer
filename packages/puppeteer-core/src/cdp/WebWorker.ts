/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type {Protocol} from 'devtools-protocol';

import type {CDPSession} from '../api/CDPSession.js';
import type {Realm} from '../api/Realm.js';
import {TargetType} from '../api/Target.js';
import {WebWorker} from '../api/WebWorker.js';
import {TimeoutSettings} from '../common/TimeoutSettings.js';
import {debugError} from '../common/util.js';

import {ExecutionContext} from './ExecutionContext.js';
import {IsolatedWorld} from './IsolatedWorld.js';
import {CdpJSHandle} from './JSHandle.js';

/**
 * @internal
 */
export type ConsoleAPICalledCallback = (
  eventType: string,
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
  readonly #id: string;
  readonly #targetType: TargetType;

  constructor(
    client: CDPSession,
    url: string,
    targetId: string,
    targetType: TargetType,
    consoleAPICalled: ConsoleAPICalledCallback,
    exceptionThrown: ExceptionThrownCallback
  ) {
    super(url);
    this.#id = targetId;
    this.#client = client;
    this.#targetType = targetType;
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

  override async close(): Promise<void> {
    switch (this.#targetType) {
      case TargetType.SERVICE_WORKER:
      case TargetType.SHARED_WORKER: {
        // For service and shared workers we need to close the target and detach to allow
        // the worker to stop.
        await this.client.connection()?.send('Target.closeTarget', {
          targetId: this.#id,
        });
        await this.client.connection()?.send('Target.detachFromTarget', {
          sessionId: this.client.id(),
        });
        break;
      }
      default:
        await this.evaluate(() => {
          self.close();
        });
    }
  }
}
