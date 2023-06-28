import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';
import ProtocolMapping from 'devtools-protocol/types/protocol-mapping.js';

import {WaitForOptions} from '../../api/Page.js';
import {assert} from '../../util/assert.js';
import {Deferred} from '../../util/Deferred.js';
import type {CDPSession, Connection as CDPConnection} from '../Connection.js';
import {ProtocolError, TimeoutError} from '../Errors.js';
import {EventEmitter} from '../EventEmitter.js';
import {PuppeteerLifeCycleEvent} from '../LifecycleWatcher.js';
import {TimeoutSettings} from '../TimeoutSettings.js';
import {getPageContent, setPageContent, waitWithTimeout} from '../util.js';

import {Connection} from './Connection.js';
import {Realm} from './Realm.js';

/**
 * @internal
 */
export const lifeCycleToSubscribedEvent = new Map<
  PuppeteerLifeCycleEvent,
  string
>([
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
export class CDPSessionWrapper extends EventEmitter implements CDPSession {
  #context: BrowsingContext;
  #sessionId = Deferred.create<string>();

  constructor(context: BrowsingContext) {
    super();
    this.#context = context;
    context.connection
      .send('cdp.getSession', {
        context: context.id,
      })
      .then(session => {
        this.#sessionId.resolve(session.result.session!);
      })
      .catch(err => {
        this.#sessionId.reject(err);
      });
  }

  connection(): CDPConnection | undefined {
    return undefined;
  }
  async send<T extends keyof ProtocolMapping.Commands>(
    method: T,
    ...paramArgs: ProtocolMapping.Commands[T]['paramsType']
  ): Promise<ProtocolMapping.Commands[T]['returnType']> {
    const session = await this.#sessionId.valueOrThrow();
    const result = await this.#context.connection.send('cdp.sendCommand', {
      method: method,
      params: paramArgs[0],
      session,
    });
    return result.result;
  }

  detach(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  id(): string {
    const val = this.#sessionId.value();
    return val instanceof Error || val === undefined ? '' : val;
  }
}

/**
 * @internal
 */
export class BrowsingContext extends Realm {
  #timeoutSettings: TimeoutSettings;
  #id: string;
  #url: string;
  #cdpSession: CDPSession;

  constructor(
    connection: Connection,
    timeoutSettings: TimeoutSettings,
    info: Bidi.BrowsingContext.Info
  ) {
    super(connection, info.context);
    this.connection = connection;
    this.#timeoutSettings = timeoutSettings;
    this.#id = info.context;
    this.#url = info.url;
    this.#cdpSession = new CDPSessionWrapper(this);

    this.on(
      'browsingContext.fragmentNavigated',
      (info: Bidi.BrowsingContext.NavigationInfo) => {
        this.#url = info.url;
      }
    );
  }

  createSandboxRealm(sandbox: string): Realm {
    return new Realm(this.connection, this.#id, sandbox);
  }

  get url(): string {
    return this.#url;
  }

  get id(): string {
    return this.#id;
  }

  get cdpSession(): CDPSession {
    return this.#cdpSession;
  }

  navigated(url: string): void {
    this.#url = url;
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

  async sendCDPCommand<T extends keyof ProtocolMapping.Commands>(
    method: T,
    ...paramArgs: ProtocolMapping.Commands[T]['paramsType']
  ): Promise<ProtocolMapping.Commands[T]['returnType']> {
    return this.#cdpSession.send(method, ...paramArgs);
  }

  title(): Promise<string> {
    return this.evaluate(() => {
      return document.title;
    });
  }

  dispose(): void {
    this.removeAllListeners();
    this.connection.unregisterBrowsingContexts(this.#id);
  }
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
