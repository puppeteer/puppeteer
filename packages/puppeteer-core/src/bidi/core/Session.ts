/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {EventEmitter} from '../../common/EventEmitter.js';
import {debugError} from '../../common/util.js';
import {
  bubble,
  inertIfDisposed,
  throwIfDisposed,
} from '../../util/decorators.js';
import {DisposableStack, disposeSymbol} from '../../util/disposable.js';

import {Browser} from './Browser.js';
import type {BidiEvents, Commands, Connection} from './Connection.js';

// TODO: Once Chrome supports session.status properly, uncomment this block.
// const MAX_RETRIES = 5;

/**
 * @internal
 */
export class Session
  extends EventEmitter<BidiEvents & {ended: {reason: string}}>
  implements Connection<BidiEvents & {ended: {reason: string}}>
{
  static async from(
    connection: Connection,
    capabilities: Bidi.Session.CapabilitiesRequest
  ): Promise<Session> {
    // Wait until the session is ready.
    //
    // TODO: Once Chrome supports session.status properly, uncomment this block
    // and remove `getBiDiConnection` in BrowserConnector.

    // let status = {message: '', ready: false};
    // for (let i = 0; i < MAX_RETRIES; ++i) {
    //   status = (await connection.send('session.status', {})).result;
    //   if (status.ready) {
    //     break;
    //   }
    //   // Backoff a little bit each time.
    //   await new Promise(resolve => {
    //     return setTimeout(resolve, (1 << i) * 100);
    //   });
    // }
    // if (!status.ready) {
    //   throw new Error(status.message);
    // }

    let result;
    try {
      result = (
        await connection.send('session.new', {
          capabilities,
        })
      ).result;
    } catch (err) {
      // Chrome does not support session.new.
      debugError(err);
      result = {
        sessionId: '',
        capabilities: {
          acceptInsecureCerts: false,
          browserName: '',
          browserVersion: '',
          platformName: '',
          setWindowRect: false,
          webSocketUrl: '',
          userAgent: '',
        },
      } satisfies Bidi.Session.NewResult;
    }

    const session = new Session(connection, result);
    await session.#initialize();
    return session;
  }

  // keep-sorted start
  #reason: string | undefined;
  readonly #disposables = new DisposableStack();
  readonly #info: Bidi.Session.NewResult;
  readonly browser!: Browser;
  @bubble()
  accessor connection: Connection;
  // keep-sorted end

  private constructor(connection: Connection, info: Bidi.Session.NewResult) {
    super();
    // keep-sorted start
    this.#info = info;
    this.connection = connection;
    // keep-sorted end
  }

  async #initialize(): Promise<void> {
    // SAFETY: We use `any` to allow assignment of the readonly property.
    (this as any).browser = await Browser.from(this);

    const browserEmitter = this.#disposables.use(this.browser);
    browserEmitter.once('closed', ({reason}) => {
      this.dispose(reason);
    });

    // TODO: Currently, some implementations do not emit navigationStarted event
    // for fragment navigations (as per spec) and some do. This could emits a
    // synthetic navigationStarted to work around this inconsistency.
    const seen = new WeakSet();
    this.on('browsingContext.fragmentNavigated', info => {
      if (seen.has(info)) {
        return;
      }
      seen.add(info);
      this.emit('browsingContext.navigationStarted', info);
      this.emit('browsingContext.fragmentNavigated', info);
    });
  }

  // keep-sorted start block=yes
  get capabilities(): Bidi.Session.NewResult['capabilities'] {
    return this.#info.capabilities;
  }
  get disposed(): boolean {
    return this.ended;
  }
  get ended(): boolean {
    return this.#reason !== undefined;
  }
  get id(): string {
    return this.#info.sessionId;
  }
  // keep-sorted end

  @inertIfDisposed
  private dispose(reason?: string): void {
    this.#reason = reason;
    this[disposeSymbol]();
  }

  /**
   * Currently, there is a 1:1 relationship between the session and the
   * session. In the future, we might support multiple sessions and in that
   * case we always needs to make sure that the session for the right session
   * object is used, so we implement this method here, although it's not defined
   * in the spec.
   */
  @throwIfDisposed<Session>(session => {
    // SAFETY: By definition of `disposed`, `#reason` is defined.
    return session.#reason!;
  })
  async send<T extends keyof Commands>(
    method: T,
    params: Commands[T]['params']
  ): Promise<{result: Commands[T]['returnType']}> {
    return await this.connection.send(method, params);
  }

  @throwIfDisposed<Session>(session => {
    // SAFETY: By definition of `disposed`, `#reason` is defined.
    return session.#reason!;
  })
  async subscribe(
    events: [string, ...string[]],
    contexts?: [string, ...string[]]
  ): Promise<void> {
    await this.send('session.subscribe', {
      events,
      contexts,
    });
  }

  @throwIfDisposed<Session>(session => {
    // SAFETY: By definition of `disposed`, `#reason` is defined.
    return session.#reason!;
  })
  async end(): Promise<void> {
    try {
      await this.send('session.end', {});
    } finally {
      this.dispose(`Session already ended.`);
    }
  }

  [disposeSymbol](): void {
    this.#reason ??=
      'Session already destroyed, probably because the connection broke.';
    this.emit('ended', {reason: this.#reason});

    this.#disposables.dispose();
    super[disposeSymbol]();
  }
}
