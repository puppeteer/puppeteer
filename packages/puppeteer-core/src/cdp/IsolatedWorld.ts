/**
 * @license
 * Copyright 2019 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {Protocol} from 'devtools-protocol';

import type {CDPSession} from '../api/CDPSession.js';
import type {ElementHandle} from '../api/ElementHandle.js';
import type {JSHandle} from '../api/JSHandle.js';
import {Realm} from '../api/Realm.js';
import type {TimeoutSettings} from '../common/TimeoutSettings.js';
import type {EvaluateFunc, HandleFor} from '../common/types.js';
import {withSourcePuppeteerURLIfNone} from '../common/util.js';
import {Deferred} from '../util/Deferred.js';
import {disposeSymbol} from '../util/disposable.js';

import {CdpElementHandle} from './ElementHandle.js';
import {ExecutionContext} from './ExecutionContext.js';
import type {CdpFrame} from './Frame.js';
import type {MAIN_WORLD, PUPPETEER_WORLD} from './IsolatedWorlds.js';
import {CdpJSHandle} from './JSHandle.js';
import type {CdpWebWorker} from './WebWorker.js';

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
  #context = Deferred.create<ExecutionContext>();

  readonly #frameOrWorker: CdpFrame | CdpWebWorker;

  constructor(
    frameOrWorker: CdpFrame | CdpWebWorker,
    timeoutSettings: TimeoutSettings
  ) {
    super(timeoutSettings);
    this.#frameOrWorker = frameOrWorker;
  }

  get environment(): CdpFrame | CdpWebWorker {
    return this.#frameOrWorker;
  }

  get client(): CDPSession {
    return this.#frameOrWorker.client;
  }

  clearContext(): void {
    // The message has to match the CDP message expected by the WaitTask class.
    this.#context?.reject(new Error('Execution context was destroyed'));
    this.#context = Deferred.create();
    if ('clearDocumentHandle' in this.#frameOrWorker) {
      this.#frameOrWorker.clearDocumentHandle();
    }
  }

  setContext(context: ExecutionContext): void {
    const existingContext = this.#context.value();
    if (existingContext instanceof ExecutionContext) {
      existingContext[disposeSymbol]();
    }
    this.#context.resolve(context);
    void this.taskManager.rerunAll();
  }

  hasContext(): boolean {
    return this.#context.resolved();
  }

  #executionContext(): Promise<ExecutionContext> {
    if (this.disposed) {
      throw new Error(
        `Execution context is not available in detached frame "${this.environment.url()}" (are you trying to evaluate?)`
      );
    }
    if (this.#context === null) {
      throw new Error(`Execution content promise is missing`);
    }
    return this.#context.valueOrThrow();
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
    const context = await this.#executionContext();
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
    let context = this.#context.value();
    if (!context || !(context instanceof ExecutionContext)) {
      context = await this.#executionContext();
    }
    return await context.evaluate(pageFunction, ...args);
  }

  override async adoptBackendNode(
    backendNodeId?: Protocol.DOM.BackendNodeId
  ): Promise<JSHandle<Node>> {
    const executionContext = await this.#executionContext();
    const {object} = await this.client.send('DOM.resolveNode', {
      backendNodeId: backendNodeId,
      executionContextId: executionContext._contextId,
    });
    return this.createCdpHandle(object) as JSHandle<Node>;
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

  /**
   * @internal
   */
  createCdpHandle(
    remoteObject: Protocol.Runtime.RemoteObject
  ): JSHandle | ElementHandle<Node> {
    if (remoteObject.subtype === 'node') {
      return new CdpElementHandle(this, remoteObject);
    }
    return new CdpJSHandle(this, remoteObject);
  }

  [disposeSymbol](): void {
    const existingContext = this.#context.value();
    if (existingContext instanceof ExecutionContext) {
      existingContext[disposeSymbol]();
    }
    super[disposeSymbol]();
  }
}
