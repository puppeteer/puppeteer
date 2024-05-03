/**
 * @license
 * Copyright 2019 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {Protocol} from 'devtools-protocol';

import type {CDPSession} from '../api/CDPSession.js';
import type {JSHandle} from '../api/JSHandle.js';
import {Realm} from '../api/Realm.js';
import type {TimeoutSettings} from '../common/TimeoutSettings.js';
import type {EvaluateFunc, HandleFor} from '../common/types.js';
import {withSourcePuppeteerURLIfNone} from '../common/util.js';
import {DisposableStack, disposeSymbol} from '../util/disposable.js';

import {ExecutionContext} from './ExecutionContext.js';
import type {CdpFrame} from './Frame.js';
import type {MAIN_WORLD, PUPPETEER_WORLD} from './IsolatedWorlds.js';
import type {CdpWebWorker} from './WebWorker.js';
import {EventEmitter} from '../common/EventEmitter.js';
import {CdpElementHandle} from './ElementHandle.js';
import {CdpJSHandle} from './JSHandle.js';
import {ElementHandle} from '../api/ElementHandle.js';

/**
 * @internal
 */
export interface PageBinding {
  name: string;
  pptrFunction: Function;
}

/**
 * @internal
 */
export interface IsolatedWorldChart {
  [key: string]: IsolatedWorld;
  [MAIN_WORLD]: IsolatedWorld;
  [PUPPETEER_WORLD]: IsolatedWorld;
}

/**
 * @internal
 */
export class IsolatedWorld extends Realm {
  #context?: ExecutionContext;

  readonly #frameOrWorker: CdpFrame | CdpWebWorker;
  readonly #disposables = new DisposableStack();
  readonly #emitter = new EventEmitter();

  constructor(
    frameOrWorker: CdpFrame | CdpWebWorker,
    timeoutSettings: TimeoutSettings
  ) {
    super(timeoutSettings);
    this.#frameOrWorker = frameOrWorker;
    this.#disposables.use(this.#emitter);
  }

  get environment(): CdpFrame | CdpWebWorker {
    return this.#frameOrWorker;
  }

  get client(): CDPSession {
    return this.#frameOrWorker.client;
  }

  clearContext(): void {
    // The message has to match the CDP message expected by the WaitTask class.
    this.#context?.[disposeSymbol]();
    this.#context = undefined;
    if ('clearDocumentHandle' in this.#frameOrWorker) {
      this.#frameOrWorker.clearDocumentHandle();
    }
  }

  setContext(context: ExecutionContext): void {
    this.#context = context;
    this.#emitter.emit('context', context);
    void this.taskManager.rerunAll();
  }

  hasContext(): boolean {
    return this.#context !== undefined;
  }

  #executionContext(): ExecutionContext | undefined {
    if (this.disposed) {
      throw new Error(
        `Execution context is not available in detached frame "${this.environment.url()}" (are you trying to evaluate?)`
      );
    }
    return this.#context;
  }

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
    let context = this.#executionContext();
    if (!context) {
      context = await new Promise<ExecutionContext>(resolve =>
        this.#emitter.once('context', context =>
          resolve(context as ExecutionContext)
        )
      );
    }
    return await context.evaluateHandle(pageFunction, ...args);
  }

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
    let context = this.#executionContext();
    if (!context) {
      context = await new Promise<ExecutionContext>(resolve =>
        this.#emitter.once('context', context =>
          resolve(context as ExecutionContext)
        )
      );
    }
    return await context.evaluate(pageFunction, ...args);
  }

  override async adoptBackendNode(
    backendNodeId?: Protocol.DOM.BackendNodeId
  ): Promise<JSHandle<Node>> {
    const executionContext = this.#executionContext();
    if (!executionContext) {
      throw new Error('executionContext is not defined');
    }
    const {object} = await this.client.send('DOM.resolveNode', {
      backendNodeId: backendNodeId,
      executionContextId: executionContext._contextId,
    });
    return createCdpHandle(this, object) as JSHandle<Node>;
  }

  async adoptHandle<T extends JSHandle<Node>>(handle: T): Promise<T> {
    if (handle.realm === this) {
      // If the context has already adopted this handle, clone it so downstream
      // disposal doesn't become an issue.
      return (await handle.evaluateHandle(value => {
        return value;
      })) as unknown as T;
    }
    const nodeInfo = await this.client.send('DOM.describeNode', {
      objectId: handle.id,
    });
    return (await this.adoptBackendNode(nodeInfo.node.backendNodeId)) as T;
  }

  async transferHandle<T extends JSHandle<Node>>(handle: T): Promise<T> {
    if (handle.realm === this) {
      return handle;
    }
    // Implies it's a primitive value, probably.
    if (handle.remoteObject().objectId === undefined) {
      return handle;
    }
    const info = await this.client.send('DOM.describeNode', {
      objectId: handle.remoteObject().objectId,
    });
    const newHandle = (await this.adoptBackendNode(
      info.node.backendNodeId
    )) as T;
    await handle.dispose();
    return newHandle;
  }

  [disposeSymbol](): void {
    super[disposeSymbol]();
    this.#disposables.dispose();
  }
}

/**
 * @internal
 */
export function createCdpHandle(
  realm: IsolatedWorld,
  remoteObject: Protocol.Runtime.RemoteObject
): JSHandle | ElementHandle<Node> {
  if (remoteObject.subtype === 'node') {
    return new CdpElementHandle(realm, remoteObject);
  }
  return new CdpJSHandle(realm, remoteObject);
}
