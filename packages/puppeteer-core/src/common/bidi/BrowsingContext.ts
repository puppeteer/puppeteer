import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';
import ProtocolMapping from 'devtools-protocol/types/protocol-mapping.js';

import {WaitForOptions} from '../../api/Page.js';
import {assert} from '../../util/assert.js';
import {Deferred} from '../../util/Deferred.js';
import {Connection as CDPConnection, CDPSession} from '../Connection.js';
import {ProtocolError, TargetCloseError, TimeoutError} from '../Errors.js';
import {PuppeteerLifeCycleEvent} from '../LifecycleWatcher.js';
import {setPageContent, waitWithTimeout} from '../util.js';

import {Connection} from './Connection.js';
import {Realm} from './Realm.js';
import {debugError} from './utils.js';

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
  ['load', Bidi.BrowsingContext.ReadinessState.Complete],
  ['domcontentloaded', Bidi.BrowsingContext.ReadinessState.Interactive],
]);

/**
 * @internal
 */
export const cdpSessions = new Map<string, CDPSessionWrapper>();

/**
 * @internal
 */
export class CDPSessionWrapper extends CDPSession {
  #context: BrowsingContext;
  #sessionId = Deferred.create<string>();
  #detached = false;

  constructor(context: BrowsingContext, sessionId?: string) {
    super();
    this.#context = context;
    if (!this.#context.supportsCDP()) {
      return;
    }
    if (sessionId) {
      this.#sessionId.resolve(sessionId);
      cdpSessions.set(sessionId, this);
    } else {
      context.connection
        .send('cdp.getSession', {
          context: context.id,
        })
        .then(session => {
          this.#sessionId.resolve(session.result.session!);
          cdpSessions.set(session.result.session!, this);
        })
        .catch(err => {
          this.#sessionId.reject(err);
        });
    }
  }

  override connection(): CDPConnection | undefined {
    return undefined;
  }

  override async send<T extends keyof ProtocolMapping.Commands>(
    method: T,
    ...paramArgs: ProtocolMapping.Commands[T]['paramsType']
  ): Promise<ProtocolMapping.Commands[T]['returnType']> {
    if (!this.#context.supportsCDP()) {
      throw new Error(
        'CDP support is required for this feature. The current browser does not support CDP.'
      );
    }
    if (this.#detached) {
      throw new TargetCloseError(
        `Protocol error (${method}): Session closed. Most likely the page has been closed.`
      );
    }
    const session = await this.#sessionId.valueOrThrow();
    const {result} = await this.#context.connection.send('cdp.sendCommand', {
      method: method,
      params: paramArgs[0],
      session,
    });
    return result.result;
  }

  override async detach(): Promise<void> {
    cdpSessions.delete(this.id());
    if (!this.#detached && this.#context.supportsCDP()) {
      await this.#context.cdpSession.send('Target.detachFromTarget', {
        sessionId: this.id(),
      });
    }
    this.#detached = true;
  }

  override id(): string {
    const val = this.#sessionId.value();
    return val instanceof Error || val === undefined ? '' : val;
  }
}

/**
 * Internal events that the BrowsingContext class emits.
 *
 * @internal
 */
export const BrowsingContextEmittedEvents = {
  /**
   * Emitted on the top-level context, when a descendant context is created.
   */
  Created: Symbol('BrowsingContext.created'),
  /**
   * Emitted on the top-level context, when a descendant context or the
   * top-level context itself is destroyed.
   */
  Destroyed: Symbol('BrowsingContext.destroyed'),
} as const;

/**
 * @internal
 */
export class BrowsingContext extends Realm {
  #id: string;
  #url: string;
  #cdpSession: CDPSession;
  #parent?: string | null;
  #browserName = '';

  constructor(
    connection: Connection,
    info: Bidi.BrowsingContext.Info,
    browserName: string
  ) {
    super(connection);
    this.#id = info.context;
    this.#url = info.url;
    this.#parent = info.parent;
    this.#browserName = browserName;
    this.#cdpSession = new CDPSessionWrapper(this, undefined);

    this.on('browsingContext.domContentLoaded', this.#updateUrl.bind(this));
    this.on('browsingContext.fragmentNavigated', this.#updateUrl.bind(this));
    this.on('browsingContext.load', this.#updateUrl.bind(this));
  }

  supportsCDP(): boolean {
    return !this.#browserName.toLowerCase().includes('firefox');
  }

  #updateUrl(info: Bidi.BrowsingContext.NavigationInfo) {
    this.#url = info.url;
  }

  createRealmForSandbox(): Realm {
    return new Realm(this.connection);
  }

  get url(): string {
    return this.#url;
  }

  get id(): string {
    return this.#id;
  }

  get parent(): string | undefined | null {
    return this.#parent;
  }

  get cdpSession(): CDPSession {
    return this.#cdpSession;
  }

  async goto(
    url: string,
    options: {
      referer?: string;
      referrerPolicy?: string;
      timeout: number;
      waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
    }
  ): Promise<string | null> {
    const {waitUntil = 'load', timeout} = options;

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

  async reload(options: WaitForOptions & {timeout: number}): Promise<void> {
    const {waitUntil = 'load', timeout} = options;

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
      timeout: number;
      waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
    }
  ): Promise<void> {
    const {waitUntil = 'load', timeout} = options;

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

  async sendCDPCommand<T extends keyof ProtocolMapping.Commands>(
    method: T,
    ...paramArgs: ProtocolMapping.Commands[T]['paramsType']
  ): Promise<ProtocolMapping.Commands[T]['returnType']> {
    return await this.#cdpSession.send(method, ...paramArgs);
  }

  title(): Promise<string> {
    return this.evaluate(() => {
      return document.title;
    });
  }

  dispose(): void {
    this.removeAllListeners();
    this.connection.unregisterBrowsingContexts(this.#id);
    void this.#cdpSession.detach().catch(debugError);
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
