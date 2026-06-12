/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type {Protocol} from 'devtools-protocol';

import {CDPSessionEvent, type CDPSession} from '../api/CDPSession.js';
import type {Realm} from '../api/Realm.js';
import {TargetType} from '../api/Target.js';
import {
  WebWorker,
  WebWorkerEvent,
  type WebWorkerEvents,
} from '../api/WebWorker.js';
import {EventEmitter} from '../common/EventEmitter.js';
import {ExceptionMessage} from '../common/ExceptionMessage.js';
import {TimeoutSettings} from '../common/TimeoutSettings.js';
import {debugError, debugCatchError} from '../common/util.js';
import type {EvaluateFunc, HandleFor} from '../index-browser.js';
import {Deferred} from '../util/Deferred.js';

import {ExecutionContext} from './ExecutionContext.js';
import {IsolatedWorld} from './IsolatedWorld.js';
import {MAIN_WORLD} from './IsolatedWorlds.js';
import type {NetworkManager} from './NetworkManager.js';
import {createConsoleMessage} from './utils.js';

/**
 * @internal
 */
export type ExceptionThrownCallback = (
  event: Protocol.Runtime.ExceptionThrownEvent,
) => void;

/**
 * @internal
 */
export class CdpWebWorker extends WebWorker {
  #world: IsolatedWorld;
  #client: CDPSession;
  readonly #id: string;
  readonly #targetType: TargetType;
  readonly #emitter: EventEmitter<WebWorkerEvents>;
  #workerLoaded = new Deferred<void>();

  get internalEmitter(): EventEmitter<WebWorkerEvents> {
    return this.#emitter;
  }

  constructor(
    client: CDPSession,
    url: string,
    targetId: string,
    targetType: TargetType,
    exceptionThrown: ExceptionThrownCallback,
    networkManager?: NetworkManager,
  ) {
    super(url);
    this.#id = targetId;
    this.#client = client;
    this.#targetType = targetType;
    this.#world = new IsolatedWorld(this, new TimeoutSettings(), MAIN_WORLD);
    this.#emitter = new EventEmitter<WebWorkerEvents>();

    this.#client.once('Runtime.executionContextCreated', async event => {
      this.#world.setContext(
        new ExecutionContext(client, event.context, this.#world),
      );
    });
    this.#client.once('Inspector.workerScriptLoaded', () => {
      this.#workerLoaded.resolve();
    });

    this.#world.emitter.on('consoleapicalled', async event => {
      try {
        const values = event.args.map(arg => {
          return this.#world.createCdpHandle(arg);
        });

        const noInternalListeners =
          this.#emitter.listenerCount(WebWorkerEvent.Console) === 0;
        const noWorkerListeners =
          this.listenerCount(WebWorkerEvent.Console) === 0;

        if (noInternalListeners && noWorkerListeners) {
          // eslint-disable-next-line max-len -- The comment is long.
          // eslint-disable-next-line @puppeteer/use-using -- These are not owned by this function.
          for (const value of values) {
            void value.dispose().catch(debugCatchError);
          }
          return;
        }

        const consoleMessages = createConsoleMessage(event, values, this.#id);
        this.#emitter.emit(WebWorkerEvent.Console, consoleMessages);
        if (!noWorkerListeners) {
          this.emit(WebWorkerEvent.Console, consoleMessages);
        }
      } catch (err) {
        debugError?.(err);
      }
    });
    this.#client.on('Runtime.exceptionThrown', event => {
      const {exceptionDetails} = event;

      // eslint-disable-next-line max-len -- The comment is long.
      // eslint-disable-next-line @puppeteer/use-using -- These are not owned by this function.
      let exceptionHandle: HandleFor<unknown> | undefined;
      if (exceptionDetails.exception) {
        exceptionHandle = this.#world.createCdpHandle(
          exceptionDetails.exception,
        );
      }

      const locations = exceptionDetails.stackTrace?.callFrames.map(frame => {
        return {
          url: frame.url,
          lineNumber: frame.lineNumber,
          columnNumber: frame.columnNumber,
        };
      }) || [
        {
          url: exceptionDetails.url,
          lineNumber: exceptionDetails.lineNumber,
          columnNumber: exceptionDetails.columnNumber,
        },
      ];

      const exceptionMessage = new ExceptionMessage(
        exceptionDetails.text,
        locations,
        exceptionHandle,
        exceptionDetails.exceptionId,
        exceptionDetails.stackTrace,
        undefined,
      );

      this.#emitter.emit(WebWorkerEvent.Exception, exceptionMessage);
      this.emit(WebWorkerEvent.Exception, exceptionMessage);
      if (exceptionThrown) {
        exceptionThrown(event);
      }
    });
    this.#client.once(CDPSessionEvent.Disconnected, () => {
      this.#world.dispose();
    });

    // This might fail if the target is closed before we receive all execution contexts.
    networkManager
      ?.addClient(this.#client)
      .catch(debugCatchError ?? (() => {}));
    this.#client.send('Runtime.enable').catch(debugCatchError ?? (() => {}));
  }

  mainRealm(): Realm {
    return this.#world;
  }

  get client(): CDPSession {
    return this.#client;
  }

  override async close(): Promise<void> {
    switch (this.#targetType) {
      case TargetType.SERVICE_WORKER: {
        // For service workers we need to close the target and detach to allow
        // the worker to stop.
        await this.client.connection()?.send('Target.closeTarget', {
          targetId: this.#id,
        });
        await this.client.connection()?.send('Target.detachFromTarget', {
          sessionId: this.client.id(),
        });
        break;
      }
      case TargetType.SHARED_WORKER: {
        await this.client.connection()?.send('Target.closeTarget', {
          targetId: this.#id,
        });
        break;
      }
      default:
        await this.evaluate(() => {
          self.close();
        });
    }
  }

  override async evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>,
  >(func: Func | string, ...args: Params): Promise<Awaited<ReturnType<Func>>> {
    await this.#workerLoaded.valueOrThrow();
    return await super.evaluate(func, ...args);
  }

  override async evaluateHandle<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>,
  >(
    func: Func | string,
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>> {
    await this.#workerLoaded.valueOrThrow();
    return await super.evaluateHandle(func, ...args);
  }
}
