import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import PuppeteerUtil from '../../injected/injected.js';
import {stringifyFunction} from '../../util/Function.js';
import {EventEmitter} from '../EventEmitter.js';
import {scriptInjector} from '../ScriptInjector.js';
import {EvaluateFunc, HandleFor} from '../types.js';
import {
  PuppeteerURL,
  getSourcePuppeteerURLIfAvailable,
  isString,
} from '../util.js';

import {Connection} from './Connection.js';
import {ElementHandle} from './ElementHandle.js';
import {Frame} from './Frame.js';
import {JSHandle} from './JSHandle.js';
import {BidiSerializer} from './Serializer.js';
import {createEvaluationError} from './utils.js';

export const SOURCE_URL_REGEX = /^[\040\t]*\/\/[@#] sourceURL=\s*(\S*?)\s*$/m;

export const getSourceUrlComment = (url: string): string => {
  return `//# sourceURL=${url}`;
};

export class Realm extends EventEmitter {
  connection: Connection;
  #frame!: Frame;
  #id: string;
  #sandbox?: string;

  constructor(connection: Connection, id: string, sandbox?: string) {
    super();
    this.connection = connection;
    this.#id = id;
    this.#sandbox = sandbox;
  }

  get target(): Bidi.Script.Target {
    return {
      context: this.#id,
      sandbox: this.#sandbox,
    };
  }

  setFrame(frame: Frame): void {
    this.#frame = frame;
  }

  protected internalPuppeteerUtil?: Promise<JSHandle<PuppeteerUtil>>;
  get puppeteerUtil(): Promise<JSHandle<PuppeteerUtil>> {
    const promise = Promise.resolve() as Promise<unknown>;
    scriptInjector.inject(script => {
      if (this.internalPuppeteerUtil) {
        void this.internalPuppeteerUtil.then(handle => {
          void handle.dispose();
        });
      }
      this.internalPuppeteerUtil = promise.then(() => {
        return this.evaluateHandle(script) as Promise<JSHandle<PuppeteerUtil>>;
      });
    }, !this.internalPuppeteerUtil);
    return this.internalPuppeteerUtil as Promise<JSHandle<PuppeteerUtil>>;
  }

  async evaluateHandle<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>,
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>> {
    return this.#evaluate(false, pageFunction, ...args);
  }

  async evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>,
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>> {
    return this.#evaluate(true, pageFunction, ...args);
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

    let responsePromise;
    const resultOwnership = returnByValue ? 'none' : 'root';
    if (isString(pageFunction)) {
      const expression = SOURCE_URL_REGEX.test(pageFunction)
        ? pageFunction
        : `${pageFunction}\n${sourceUrlComment}\n`;

      responsePromise = this.connection.send('script.evaluate', {
        expression,
        target: this.target,
        resultOwnership,
        awaitPromise: true,
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
            return BidiSerializer.serialize(arg, this as any);
          })
        ),
        target: this.target,
        resultOwnership,
        awaitPromise: true,
      });
    }

    const {result} = await responsePromise;

    if ('type' in result && result.type === 'exception') {
      throw createEvaluationError(result.exceptionDetails);
    }

    return returnByValue
      ? BidiSerializer.deserialize(result.result)
      : getBidiHandle(this as any, result.result, this.#frame);
  }
}

/**
 * @internal
 */
export function getBidiHandle(
  realmOrContext: Realm,
  result: Bidi.CommonDataTypes.RemoteValue,
  frame: Frame
): JSHandle | ElementHandle<Node> {
  if (result.type === 'node' || result.type === 'window') {
    return new ElementHandle(realmOrContext, result, frame);
  }
  return new JSHandle(realmOrContext, result);
}
