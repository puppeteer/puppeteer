/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import type {Awaitable, FlattenHandle} from '../common/types.js';
import {debugError} from '../common/util.js';
import {assert} from '../util/assert.js';
import {Deferred} from '../util/Deferred.js';
import {interpolateFunction, stringifyFunction} from '../util/Function.js';

import type {Connection} from './core/Connection.js';
import {BidiDeserializer} from './Deserializer.js';
import type {BidiFrame} from './Frame.js';
import {BidiSerializer} from './Serializer.js';

type SendArgsChannel<Args> = (value: [id: number, args: Args]) => void;
type SendResolveChannel<Ret> = (
  value: [id: number, resolve: (ret: FlattenHandle<Awaited<Ret>>) => void]
) => void;
type SendRejectChannel = (
  value: [id: number, reject: (error: unknown) => void]
) => void;

interface RemotePromiseCallbacks {
  resolve: Deferred<Bidi.Script.RemoteValue>;
  reject: Deferred<Bidi.Script.RemoteValue>;
}

/**
 * @internal
 */
export class ExposeableFunction<Args extends unknown[], Ret> {
  readonly #frame;

  readonly name;
  readonly #apply;

  readonly #channels;
  readonly #callerInfos = new Map<
    string,
    Map<number, RemotePromiseCallbacks>
  >();

  #preloadScriptId?: Bidi.Script.PreloadScript;

  constructor(
    frame: BidiFrame,
    name: string,
    apply: (...args: Args) => Awaitable<Ret>
  ) {
    this.#frame = frame;
    this.name = name;
    this.#apply = apply;

    this.#channels = {
      args: `__puppeteer__${this.#frame._id}_page_exposeFunction_${this.name}_args`,
      resolve: `__puppeteer__${this.#frame._id}_page_exposeFunction_${this.name}_resolve`,
      reject: `__puppeteer__${this.#frame._id}_page_exposeFunction_${this.name}_reject`,
    };
  }

  async expose(): Promise<void> {
    const connection = this.#connection;
    const channelArguments = this.#channelArguments;

    // TODO(jrandolf): Implement cleanup with removePreloadScript.
    connection.on(
      Bidi.ChromiumBidi.Script.EventNames.Message,
      this.#handleArgumentsMessage
    );
    connection.on(
      Bidi.ChromiumBidi.Script.EventNames.Message,
      this.#handleResolveMessage
    );
    connection.on(
      Bidi.ChromiumBidi.Script.EventNames.Message,
      this.#handleRejectMessage
    );

    const functionDeclaration = stringifyFunction(
      interpolateFunction(
        (
          sendArgs: SendArgsChannel<Args>,
          sendResolve: SendResolveChannel<Ret>,
          sendReject: SendRejectChannel
        ) => {
          let id = 0;
          Object.assign(globalThis, {
            [PLACEHOLDER('name') as string]: function (...args: Args) {
              return new Promise<FlattenHandle<Awaited<Ret>>>(
                (resolve, reject) => {
                  sendArgs([id, args]);
                  sendResolve([id, resolve]);
                  sendReject([id, reject]);
                  ++id;
                }
              );
            },
          });
        },
        {name: JSON.stringify(this.name)}
      )
    );

    const {result} = await connection.send('script.addPreloadScript', {
      functionDeclaration,
      arguments: channelArguments,
      contexts: [this.#frame.page().mainFrame()._id],
    });
    this.#preloadScriptId = result.script;

    await Promise.all(
      this.#frame
        .page()
        .frames()
        .map(async frame => {
          return await connection.send('script.callFunction', {
            functionDeclaration,
            arguments: channelArguments,
            awaitPromise: false,
            target: frame.mainRealm().realm.target,
          });
        })
    );
  }

  #handleArgumentsMessage = async (params: Bidi.Script.MessageParameters) => {
    if (params.channel !== this.#channels.args) {
      return;
    }
    const connection = this.#connection;
    const {callbacks, remoteValue} = this.#getCallbacksAndRemoteValue(params);
    const args = remoteValue.value?.[1];
    assert(args);
    try {
      const result = await this.#apply(...BidiDeserializer.deserialize(args));
      await connection.send('script.callFunction', {
        functionDeclaration: stringifyFunction(([_, resolve]: any, result) => {
          resolve(result);
        }),
        arguments: [
          (await callbacks.resolve.valueOrThrow()) as Bidi.Script.LocalValue,
          BidiSerializer.serialize(result),
        ],
        awaitPromise: false,
        target: {
          realm: params.source.realm,
        },
      });
    } catch (error) {
      try {
        if (error instanceof Error) {
          await connection.send('script.callFunction', {
            functionDeclaration: stringifyFunction(
              (
                [_, reject]: [unknown, (error: Error) => void],
                name: string,
                message: string,
                stack?: string
              ) => {
                const error = new Error(message);
                error.name = name;
                if (stack) {
                  error.stack = stack;
                }
                reject(error);
              }
            ),
            arguments: [
              (await callbacks.reject.valueOrThrow()) as Bidi.Script.LocalValue,
              BidiSerializer.serialize(error.name),
              BidiSerializer.serialize(error.message),
              BidiSerializer.serialize(error.stack),
            ],
            awaitPromise: false,
            target: {
              realm: params.source.realm,
            },
          });
        } else {
          await connection.send('script.callFunction', {
            functionDeclaration: stringifyFunction(
              (
                [_, reject]: [unknown, (error: unknown) => void],
                error: unknown
              ) => {
                reject(error);
              }
            ),
            arguments: [
              (await callbacks.reject.valueOrThrow()) as Bidi.Script.LocalValue,
              BidiSerializer.serialize(error),
            ],
            awaitPromise: false,
            target: {
              realm: params.source.realm,
            },
          });
        }
      } catch (error) {
        debugError(error);
      }
    }
  };

  get #connection(): Connection {
    return this.#frame.page().browser().connection;
  }

  get #channelArguments() {
    return [
      {
        type: 'channel' as const,
        value: {
          channel: this.#channels.args,
          ownership: Bidi.Script.ResultOwnership.Root,
        },
      },
      {
        type: 'channel' as const,
        value: {
          channel: this.#channels.resolve,
          ownership: Bidi.Script.ResultOwnership.Root,
        },
      },
      {
        type: 'channel' as const,
        value: {
          channel: this.#channels.reject,
          ownership: Bidi.Script.ResultOwnership.Root,
        },
      },
    ];
  }

  #handleResolveMessage = (params: Bidi.Script.MessageParameters) => {
    if (params.channel !== this.#channels.resolve) {
      return;
    }
    const {callbacks, remoteValue} = this.#getCallbacksAndRemoteValue(params);
    callbacks.resolve.resolve(remoteValue);
  };

  #handleRejectMessage = (params: Bidi.Script.MessageParameters) => {
    if (params.channel !== this.#channels.reject) {
      return;
    }
    const {callbacks, remoteValue} = this.#getCallbacksAndRemoteValue(params);
    callbacks.reject.resolve(remoteValue);
  };

  #getCallbacksAndRemoteValue(params: Bidi.Script.MessageParameters) {
    const {data, source} = params;
    assert(data.type === 'array');
    assert(data.value);

    const callerIdRemote = data.value[0];
    assert(callerIdRemote);
    assert(callerIdRemote.type === 'number');
    assert(typeof callerIdRemote.value === 'number');

    let bindingMap = this.#callerInfos.get(source.realm);
    if (!bindingMap) {
      bindingMap = new Map();
      this.#callerInfos.set(source.realm, bindingMap);
    }

    const callerId = callerIdRemote.value;
    let callbacks = bindingMap.get(callerId);
    if (!callbacks) {
      callbacks = {
        resolve: new Deferred(),
        reject: new Deferred(),
      };
      bindingMap.set(callerId, callbacks);
    }
    return {callbacks, remoteValue: data};
  }

  [Symbol.dispose](): void {
    void this[Symbol.asyncDispose]().catch(debugError);
  }

  async [Symbol.asyncDispose](): Promise<void> {
    if (this.#preloadScriptId) {
      await this.#connection.send('script.removePreloadScript', {
        script: this.#preloadScriptId,
      });
    }
  }
}
