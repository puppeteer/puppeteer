/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {EventEmitter} from '../../common/EventEmitter.js';
import {debugError} from '../../common/util.js';
import {throwIfDisposed} from '../../util/decorators.js';

import Browser from './Browser.js';
import type Connection from './Connection.js';

export default class Session extends EventEmitter<{
  /**
   * Emitted when the session has ended.
   */
  ended: {reason: string};
}> {
  // TODO: Update generator to include fully module
  static readonly subscribeModules: string[] = [
    'browsingContext',
    'network',
    'log',
    'script',
  ];
  static readonly subscribeCdpEvents: Bidi.Cdp.EventNames[] = [
    // Coverage
    'cdp.Debugger.scriptParsed',
    'cdp.CSS.styleSheetAdded',
    'cdp.Runtime.executionContextsCleared',
    // Tracing
    'cdp.Tracing.tracingComplete',
    // TODO: subscribe to all CDP events in the future.
    'cdp.Network.requestWillBeSent',
    'cdp.Debugger.scriptParsed',
    'cdp.Page.screencastFrame',
  ];

  static async from(
    connection: Connection,
    capabilities: Bidi.Session.CapabilitiesRequest
  ): Promise<Session> {
    // Wait until the connection is ready.
    while (true) {
      const {result: ready} = await connection.send('session.status', {});
      if (ready) {
        break;
      }
    }

    let result;
    // TODO: await until the connection is established.
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

  readonly connection: Connection;

  readonly #info: Bidi.Session.NewResult;
  readonly browser!: Browser;

  #reason: string | undefined;

  private constructor(connection: Connection, info: Bidi.Session.NewResult) {
    super();
    this.connection = connection;
    this.#info = info;
  }

  async #initialize(): Promise<void> {
    // //////////////////////////////
    // Asynchronous initialization //
    // //////////////////////////////
    // SAFETY: We use `any` to allow assignment of the readonly property.
    (this as any).browser = await Browser.from(this);

    await this.connection.send('session.subscribe', {
      events: this.capabilities.browserName
        .toLocaleLowerCase()
        .includes('firefox')
        ? Session.subscribeModules
        : [...Session.subscribeModules, ...Session.subscribeCdpEvents],
    });

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

  @throwIfDisposed((session: Session) => {
    // SAFETY: By definition of `disposed`, `#reason` is defined.
    return session.#reason!;
  })
  async end(): Promise<void> {
    await this.connection.send('session.end', {});
    this.#reason = `Session (${this.id}) has already ended.`;
    this.emit('ended', {reason: this.#reason});
    this.removeAllListeners();
  }
}
