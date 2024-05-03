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
import type {BindingPayload, EvaluateFunc, HandleFor} from '../common/types.js';
import {debugError, withSourcePuppeteerURLIfNone} from '../common/util.js';
import {DisposableStack, disposeSymbol} from '../util/disposable.js';
import {Mutex} from '../util/Mutex.js';

import type {Binding} from './Binding.js';
import {ExecutionContext} from './ExecutionContext.js';
import type {CdpFrame} from './Frame.js';
import type {MAIN_WORLD, PUPPETEER_WORLD} from './IsolatedWorlds.js';
import {addPageBinding} from './utils.js';
import type {CdpWebWorker} from './WebWorker.js';
import {EventEmitter} from '../common/EventEmitter.js';
import {ElementHandle} from '../puppeteer-core.js';
import {CdpElementHandle} from './ElementHandle.js';
import {CdpJSHandle} from './JSHandle.js';

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
  // Set of bindings that have been registered in the current context.
  #contextBindings = new Set<string>();
  // Contains mapping from functions that should be bound to Puppeteer functions.
  #bindings = new Map<string, Binding>();
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
    this.frameClientUpdated();
  }

  get _bindings(): Map<string, Binding> {
    return this.#bindings;
  }

  get environment(): CdpFrame | CdpWebWorker {
    return this.#frameOrWorker;
  }

  frameClientUpdated(): void {
    this.client.on('Runtime.bindingCalled', this.#onBindingCalled);
  }

  get client(): CDPSession {
    return this.#frameOrWorker.client;
  }

  clearContext(): void {
    // The message has to match the CDP message expected by the WaitTask class.
    this.#context = undefined;
    if ('clearDocumentHandle' in this.#frameOrWorker) {
      this.#frameOrWorker.clearDocumentHandle();
    }
  }

  setContext(context: ExecutionContext): void {
    this.#contextBindings.clear();
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

  // If multiple waitFor are set up asynchronously, we need to wait for the
  // first one to set up the binding in the page before running the others.
  #mutex = new Mutex();
  async _addBindingToContext(
    context: ExecutionContext,
    name: string
  ): Promise<void> {
    if (this.#contextBindings.has(name)) {
      return;
    }

    using _ = await this.#mutex.acquire();
    try {
      await context._client.send(
        'Runtime.addBinding',
        context._contextName
          ? {
              name,
              executionContextName: context._contextName,
            }
          : {
              name,
              executionContextId: context._contextId,
            }
      );

      await context.evaluate(addPageBinding, 'internal', name);

      this.#contextBindings.add(name);
    } catch (error) {
      // We could have tried to evaluate in a context which was already
      // destroyed. This happens, for example, if the page is navigated while
      // we are trying to add the binding
      if (error instanceof Error) {
        // Destroyed context.
        if (error.message.includes('Execution context was destroyed')) {
          return;
        }
        // Missing context.
        if (error.message.includes('Cannot find context with specified id')) {
          return;
        }
      }

      debugError(error);
    }
  }

  #onBindingCalled = async (
    event: Protocol.Runtime.BindingCalledEvent
  ): Promise<void> => {
    let payload: BindingPayload;
    try {
      payload = JSON.parse(event.payload);
    } catch {
      // The binding was either called by something in the page or it was
      // called before our wrapper was initialized.
      return;
    }
    const {type, name, seq, args, isTrivial} = payload;
    if (type !== 'internal') {
      return;
    }
    if (!this.#contextBindings.has(name)) {
      return;
    }

    try {
      let context = this.#executionContext();
      if (!context) {
        context = await new Promise<ExecutionContext>(resolve =>
          this.#emitter.once('context', context =>
            resolve(context as ExecutionContext)
          )
        );
      }
      if (event.executionContextId !== context._contextId) {
        return;
      }

      const binding = this._bindings.get(name);
      await binding?.run(context, seq, args, isTrivial);
    } catch (err) {
      debugError(err);
    }
  };

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
    this.client.off('Runtime.bindingCalled', this.#onBindingCalled);
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
