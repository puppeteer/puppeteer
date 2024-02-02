/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {EventEmitter, type EventType} from '../common/EventEmitter.js';
import {scriptInjector} from '../common/ScriptInjector.js';
import type {EvaluateFunc, HandleFor} from '../common/types.js';
import {
  PuppeteerURL,
  SOURCE_URL_REGEX,
  getSourcePuppeteerURLIfAvailable,
  getSourceUrlComment,
  isString,
} from '../common/util.js';
import type PuppeteerUtil from '../injected/injected.js';
import {disposeSymbol} from '../util/disposable.js';
import {stringifyFunction} from '../util/Function.js';

import type {BidiConnection} from './Connection.js';
import {BidiDeserializer} from './Deserializer.js';
import {BidiElementHandle} from './ElementHandle.js';
import {BidiJSHandle} from './JSHandle.js';
import type {Sandbox} from './Sandbox.js';
import {BidiSerializer} from './Serializer.js';
import {createEvaluationError} from './util.js';

/**
 * @internal
 */
export class BidiRealm extends EventEmitter<Record<EventType, any>> {
  readonly connection: BidiConnection;

  #id!: string;
  #sandbox!: Sandbox;

  constructor(connection: BidiConnection) {
    super();
    this.connection = connection;
  }

  get target(): Bidi.Script.Target {
    return {
      context: this.#sandbox.environment._id,
      sandbox: this.#sandbox.name,
    };
  }

  handleRealmDestroyed = async (
    params: Bidi.Script.RealmDestroyed['params']
  ): Promise<void> => {
    if (params.realm === this.#id) {
      // Note: The Realm is destroyed, so in theory the handle should be as
      // well.
      this.internalPuppeteerUtil = undefined;
      this.#sandbox.environment.clearDocumentHandle();
    }
  };

  handleRealmCreated = (params: Bidi.Script.RealmCreated['params']): void => {
    if (
      params.type === 'window' &&
      params.context === this.#sandbox.environment._id &&
      params.sandbox === this.#sandbox.name
    ) {
      this.#id = params.realm;
      void this.#sandbox.taskManager.rerunAll();
    }
  };

  setSandbox(sandbox: Sandbox): void {
    this.#sandbox = sandbox;
    this.connection.on(
      Bidi.ChromiumBidi.Script.EventNames.RealmCreated,
      this.handleRealmCreated
    );
    this.connection.on(
      Bidi.ChromiumBidi.Script.EventNames.RealmDestroyed,
      this.handleRealmDestroyed
    );
  }

  protected internalPuppeteerUtil?: Promise<BidiJSHandle<PuppeteerUtil>>;
  get puppeteerUtil(): Promise<BidiJSHandle<PuppeteerUtil>> {
    const promise = Promise.resolve() as Promise<unknown>;
    scriptInjector.inject(script => {
      if (this.internalPuppeteerUtil) {
        void this.internalPuppeteerUtil.then(handle => {
          void handle.dispose();
        });
      }
      this.internalPuppeteerUtil = promise.then(() => {
        return this.evaluateHandle(script) as Promise<
          BidiJSHandle<PuppeteerUtil>
        >;
      });
    }, !this.internalPuppeteerUtil);
    return this.internalPuppeteerUtil as Promise<BidiJSHandle<PuppeteerUtil>>;
  }

  async evaluateHandle<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>,
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>> {
    return await this.#evaluate(false, pageFunction, ...args);
  }

  async evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>,
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>> {
    return await this.#evaluate(true, pageFunction, ...args);
  }

  async #evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>,
  >(
    returnByValue: true,
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>>;
  async #evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>,
  >(
    returnByValue: false,
    pageFunction: Func | string,
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>>;
  async #evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>,
  >(
    returnByValue: boolean,
    pageFunction: Func | string,
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>> | Awaited<ReturnType<Func>>> {
    const sourceUrlComment = getSourceUrlComment(
      getSourcePuppeteerURLIfAvailable(pageFunction)?.toString() ??
        PuppeteerURL.INTERNAL_URL
    );

    const sandbox = this.#sandbox;

    let responsePromise;
    const resultOwnership = returnByValue
      ? Bidi.Script.ResultOwnership.None
      : Bidi.Script.ResultOwnership.Root;
    const serializationOptions: Bidi.Script.SerializationOptions = returnByValue
      ? {}
      : {
          maxObjectDepth: 0,
          maxDomDepth: 0,
        };
    if (isString(pageFunction)) {
      const expression = SOURCE_URL_REGEX.test(pageFunction)
        ? pageFunction
        : `${pageFunction}\n${sourceUrlComment}\n`;

      responsePromise = this.connection.send('script.evaluate', {
        expression,
        target: this.target,
        resultOwnership,
        awaitPromise: true,
        userActivation: true,
        serializationOptions,
      });
    } else {
      let functionDeclaration = stringifyFunction(pageFunction);
      functionDeclaration = SOURCE_URL_REGEX.test(functionDeclaration)
        ? functionDeclaration
        : `${functionDeclaration}\n${sourceUrlComment}\n`;
      responsePromise = this.connection.send('script.callFunction', {
        functionDeclaration,
        arguments: args.length
          ? await Promise.all(
              args.map(arg => {
                return BidiSerializer.serialize(sandbox, arg);
              })
            )
          : [],
        target: this.target,
        resultOwnership,
        awaitPromise: true,
        userActivation: true,
        serializationOptions,
      });
    }

    const {result} = await responsePromise;

    if ('type' in result && result.type === 'exception') {
      throw createEvaluationError(result.exceptionDetails);
    }

    return returnByValue
      ? BidiDeserializer.deserialize(result.result)
      : createBidiHandle(sandbox, result.result);
  }

  [disposeSymbol](): void {
    this.connection.off(
      Bidi.ChromiumBidi.Script.EventNames.RealmCreated,
      this.handleRealmCreated
    );
    this.connection.off(
      Bidi.ChromiumBidi.Script.EventNames.RealmDestroyed,
      this.handleRealmDestroyed
    );
  }
}

/**
 * @internal
 */
export function createBidiHandle(
  sandbox: Sandbox,
  result: Bidi.Script.RemoteValue
): BidiJSHandle<unknown> | BidiElementHandle<Node> {
  if (result.type === 'node' || result.type === 'window') {
    return new BidiElementHandle(sandbox, result);
  }
  return new BidiJSHandle(sandbox, result);
}
