import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import PuppeteerUtil from '../../injected/injected.js';
import {stringifyFunction} from '../../util/Function.js';
import {EventEmitter} from '../EventEmitter.js';
import {scriptInjector} from '../ScriptInjector.js';
import {EvaluateFunc, HandleFor} from '../types.js';
import {
  PuppeteerURL,
  debugError,
  getSourcePuppeteerURLIfAvailable,
  isString,
} from '../util.js';

import {Connection} from './Connection.js';
import {BidiElementHandle} from './ElementHandle.js';
import {BidiJSHandle} from './JSHandle.js';
import {Sandbox} from './Sandbox.js';
import {BidiSerializer} from './Serializer.js';
import {createEvaluationError} from './utils.js';

export const SOURCE_URL_REGEX = /^[\040\t]*\/\/[@#] sourceURL=\s*(\S*?)\s*$/m;

export const getSourceUrlComment = (url: string): string => {
  return `//# sourceURL=${url}`;
};

export class Realm extends EventEmitter {
  readonly connection: Connection;
  readonly #id: string;

  #sandbox!: Sandbox;

  constructor(connection: Connection, id: string) {
    super();
    this.connection = connection;
    this.#id = id;
  }

  get target(): Bidi.Script.Target {
    return {
      context: this.#id,
      sandbox: this.#sandbox.name,
    };
  }

  setSandbox(sandbox: Sandbox): void {
    this.#sandbox = sandbox;

    // TODO: Tack correct realm similar to BrowsingContexts
    this.connection.on(Bidi.ChromiumBidi.Script.EventNames.RealmCreated, () => {
      void this.#sandbox.taskManager.rerunAll();
    });
    // TODO(jrandolf): We should try to find a less brute-force way of doing
    // this.
    this.connection.on(
      Bidi.ChromiumBidi.Script.EventNames.RealmDestroyed,
      async () => {
        const promise = this.internalPuppeteerUtil;
        this.internalPuppeteerUtil = undefined;
        try {
          await (await promise)?.dispose();
        } catch (error) {
          debugError(error);
        }
      }
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
        arguments: await Promise.all(
          args.map(arg => {
            return BidiSerializer.serialize(sandbox, arg);
          })
        ),
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
      ? BidiSerializer.deserialize(result.result)
      : createBidiHandle(sandbox, result.result);
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
