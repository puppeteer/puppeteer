/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {EventEmitter} from '../../common/EventEmitter.js';
import {debugError} from '../../common/util.js';
import {throwIfDisposed} from '../../util/decorators.js';
import type {BidiEvents} from '../Connection.js';

import Browser from './Browser.js';
import type Connection from './Connection.js';
import type {Commands} from './Connection.js';

const MAX_RETRIES = 5;

/**
 * @internal
 */
export default class Session
  extends EventEmitter<BidiEvents & {ended: {reason: string}}>
  implements Connection<BidiEvents & {ended: {reason: string}}>
{
  static async from(
    connection: Connection,
    capabilities: Bidi.Session.CapabilitiesRequest
  ): Promise<Session> {
    // Wait until the session is ready.
    let status = {message: '', ready: false};
    for (let i = 0; i < MAX_RETRIES; ++i) {
      status = (await connection.send('session.status', {})).result;
      if (status.ready) {
        break;
      }
      // Backoff a little bit each time.
      await new Promise(resolve => {
        return setTimeout(resolve, (1 << i) * 100);
      });
    }
    if (!status.ready) {
      throw new Error(status.message);
    }

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
          browserName: 'chrome',
          browserVersion: '',
          platformName: '',
          setWindowRect: false,
          webSocketUrl: '',
        },
      };
    }

    const session = new Session(connection, result);
    await session.#initialize();
    return session;
  }

  readonly #connection: Connection;

  readonly #info: Bidi.Session.NewResult;
  readonly browser!: Browser;

  #reason: string | undefined;

  private constructor(connection: Connection, info: Bidi.Session.NewResult) {
    super();
    this.#connection = connection;
    this.#info = info;
  }

  async #initialize(): Promise<void> {
    // ///////////////////////
    // Connection listeners //
    // ///////////////////////
    this.#connection.pipeTo(this);

    // //////////////////////////////
    // Asynchronous initialization //
    // //////////////////////////////
    // SAFETY: We use `any` to allow assignment of the readonly property.
    (this as any).browser = await Browser.from(this);

    // //////////////////
    // Child listeners //
    // //////////////////
    this.browser.once('closed', ({reason}) => {
      this.#reason = reason;
      this.emit('ended', {reason});
      this.removeAllListeners();
    });
  }

  get disposed(): boolean {
    return this.#reason !== undefined;
  }

  get id(): string {
    return this.#info.sessionId;
  }

  get capabilities(): Bidi.Session.NewResult['capabilities'] {
    return this.#info.capabilities;
  }

  pipeTo<Events extends BidiEvents>(emitter: EventEmitter<Events>): void {
    this.#connection.pipeTo(emitter);
  }

  /**
   * Currently, there is a 1:1 relationship between the session and the
   * session. In the future, we might support multiple sessions and in that
   * case we always needs to make sure that the session for the right session
   * object is used, so we implement this method here, although it's not defined
   * in the spec.
   */
  @throwIfDisposed((session: Session) => {
    // SAFETY: By definition of `disposed`, `#reason` is defined.
    return session.#reason!;
  })
  async send<T extends keyof Commands>(
    method: T,
    params: Commands[T]['params']
  ): Promise<{result: Commands[T]['returnType']}> {
    return await this.#connection.send(method, params);
  }

  @throwIfDisposed((session: Session) => {
    // SAFETY: By definition of `disposed`, `#reason` is defined.
    return session.#reason!;
  })
  async subscribe(events: string[]): Promise<void> {
    await this.send('session.subscribe', {
      events,
    });
  }

  @throwIfDisposed((session: Session) => {
    // SAFETY: By definition of `disposed`, `#reason` is defined.
    return session.#reason!;
  })
  async end(): Promise<void> {
    await this.send('session.end', {});
    this.#reason = `Session (${this.id}) has already ended.`;
    this.emit('ended', {reason: this.#reason});
    this.removeAllListeners();
  }
}
