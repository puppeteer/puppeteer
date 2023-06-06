import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';
import ProtocolMapping from 'devtools-protocol/types/protocol-mapping.js';

import {WaitForOptions} from '../../api/Page.js';
import PuppeteerUtil from '../../injected/injected.js';
import {assert} from '../../util/assert.js';
import {stringifyFunction} from '../../util/Function.js';
import {ProtocolError, TimeoutError} from '../Errors.js';
import {EventEmitter} from '../EventEmitter.js';
import {PuppeteerLifeCycleEvent} from '../LifecycleWatcher.js';
import {scriptInjector} from '../ScriptInjector.js';
import {TimeoutSettings} from '../TimeoutSettings.js';
import {EvaluateFunc, HandleFor} from '../types.js';
import {
  PuppeteerURL,
  getPageContent,
  getSourcePuppeteerURLIfAvailable,
  isString,
  setPageContent,
  waitWithTimeout,
} from '../util.js';

import {Connection} from './Connection.js';
import {ElementHandle} from './ElementHandle.js';
import {JSHandle} from './JSHandle.js';
import {BidiSerializer} from './Serializer.js';
import {createEvaluationError} from './utils.js';

const SOURCE_URL_REGEX = /^[\040\t]*\/\/[@#] sourceURL=\s*(\S*?)\s*$/m;

const getSourceUrlComment = (url: string) => {
  return `//# sourceURL=${url}`;
};

/**
 * @internal
 */
const lifeCycleToSubscribedEvent = new Map<PuppeteerLifeCycleEvent, string>([
  ['load', 'browsingContext.load'],
  ['domcontentloaded', 'browsingContext.domContentLoaded'],
]);

/**
 * @internal
 */
const lifeCycleToReadinessState = new Map<
  PuppeteerLifeCycleEvent,
  Bidi.BrowsingContext.ReadinessState
>([
  ['load', 'complete'],
  ['domcontentloaded', 'interactive'],
]);

/**
 * @internal
 */
export class BrowsingContext extends EventEmitter {
  connection: Connection;
  #timeoutSettings: TimeoutSettings;
  #id: string;
  #url = 'about:blank';

  constructor(
    connection: Connection,
    timeoutSettings: TimeoutSettings,
    info: Bidi.BrowsingContext.Info
  ) {
    super();
    this.connection = connection;
    this.#timeoutSettings = timeoutSettings;
    this.#id = info.context;
  }

  #puppeteerUtil?: Promise<JSHandle<PuppeteerUtil>>;
  get puppeteerUtil(): Promise<JSHandle<PuppeteerUtil>> {
    const promise = Promise.resolve() as Promise<unknown>;
    scriptInjector.inject(script => {
      if (this.#puppeteerUtil) {
        void this.#puppeteerUtil.then(handle => {
          void handle.dispose();
        });
      }
      this.#puppeteerUtil = promise.then(() => {
        return this.evaluateHandle(script) as Promise<JSHandle<PuppeteerUtil>>;
      });
    }, !this.#puppeteerUtil);
    return this.#puppeteerUtil as Promise<JSHandle<PuppeteerUtil>>;
  }

  get url(): string {
    return this.#url;
  }

  get id(): string {
    return this.#id;
  }

  async goto(
    url: string,
    options: {
      referer?: string;
      referrerPolicy?: string;
      timeout?: number;
      waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
    } = {}
  ): Promise<string | null> {
    const {
      waitUntil = 'load',
      timeout = this.#timeoutSettings.navigationTimeout(),
    } = options;

    const readinessState = lifeCycleToReadinessState.get(
      getWaitUntilSingle(waitUntil)
    ) as Bidi.BrowsingContext.ReadinessState;

    try {
      const {result} = await waitWithTimeout(
        this.connection.send('browsingContext.navigate', {
          url: url,
          context: this.#id,
          wait: readinessState,
        }),
        'Navigation',
        timeout
      );
      this.#url = result.url;

      return result.navigation;
    } catch (error) {
      if (error instanceof ProtocolError) {
        error.message += ` at ${url}`;
      } else if (error instanceof TimeoutError) {
        error.message = 'Navigation timeout of ' + timeout + ' ms exceeded';
      }
      throw error;
    }
  }

  async reload(options: WaitForOptions = {}): Promise<void> {
    const {
      waitUntil = 'load',
      timeout = this.#timeoutSettings.navigationTimeout(),
    } = options;

    const readinessState = lifeCycleToReadinessState.get(
      getWaitUntilSingle(waitUntil)
    ) as Bidi.BrowsingContext.ReadinessState;

    await waitWithTimeout(
      this.connection.send('browsingContext.reload', {
        context: this.#id,
        wait: readinessState,
      }),
      'Navigation',
      timeout
    );
  }

  async evaluateHandle<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>> {
    return this.#evaluate(false, pageFunction, ...args);
  }

  async evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>> {
    return this.#evaluate(true, pageFunction, ...args);
  }

  async #evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    returnByValue: true,
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>>;
  async #evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    returnByValue: false,
    pageFunction: Func | string,
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>>;
  async #evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
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
        target: {context: this.#id},
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
            return BidiSerializer.serialize(arg, this);
          })
        ),
        target: {context: this.#id},
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
      : getBidiHandle(this, result.result);
  }

  async setContent(
    html: string,
    options: {
      timeout?: number;
      waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
    }
  ): Promise<void> {
    const {
      waitUntil = 'load',
      timeout = this.#timeoutSettings.navigationTimeout(),
    } = options;

    const waitUntilEvent = lifeCycleToSubscribedEvent.get(
      getWaitUntilSingle(waitUntil)
    ) as string;

    await Promise.all([
      setPageContent(this, html),
      waitWithTimeout(
        new Promise<void>(resolve => {
          this.once(waitUntilEvent, () => {
            resolve();
          });
        }),
        waitUntilEvent,
        timeout
      ),
    ]);
  }

  async content(): Promise<string> {
    return await this.evaluate(getPageContent);
  }

  async sendCDPCommand(
    method: keyof ProtocolMapping.Commands,
    params: object = {}
  ): Promise<unknown> {
    const session = await this.connection.send('cdp.getSession', {
      context: this.#id,
    });
    // TODO: remove any once chromium-bidi types are updated.
    const sessionId = (session.result as any).cdpSession;
    return await this.connection.send('cdp.sendCommand', {
      cdpMethod: method,
      cdpParams: params,
      cdpSession: sessionId,
    });
  }

  dispose(): void {
    this.removeAllListeners();
    this.connection.unregisterBrowsingContexts(this.#id);
  }

  title(): Promise<string> {
    return this.evaluate(() => {
      return document.title;
    });
  }
}

/**
 * @internal
 */
export function getBidiHandle(
  context: BrowsingContext,
  result: Bidi.CommonDataTypes.RemoteValue
): JSHandle | ElementHandle<Node> {
  if (result.type === 'node' || result.type === 'window') {
    return new ElementHandle(context, result);
  }
  return new JSHandle(context, result);
}

/**
 * @internal
 */
export function getWaitUntilSingle(
  event: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[]
): Extract<PuppeteerLifeCycleEvent, 'load' | 'domcontentloaded'> {
  if (Array.isArray(event) && event.length > 1) {
    throw new Error('BiDi support only single `waitUntil` argument');
  }
  const waitUntilSingle = Array.isArray(event)
    ? (event.find(lifecycle => {
        return lifecycle === 'domcontentloaded' || lifecycle === 'load';
      }) as PuppeteerLifeCycleEvent)
    : event;

  if (
    waitUntilSingle === 'networkidle0' ||
    waitUntilSingle === 'networkidle2'
  ) {
    throw new Error(`BiDi does not support 'waitUntil' ${waitUntilSingle}`);
  }

  assert(waitUntilSingle, `Invalid waitUntil option ${waitUntilSingle}`);

  return waitUntilSingle;
}
