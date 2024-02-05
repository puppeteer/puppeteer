/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';
import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping.js';

import type {CDPSession} from '../api/CDPSession.js';
import type {EventType} from '../common/EventEmitter.js';
import {debugError} from '../common/util.js';

import {BidiCdpSession} from './CDPSession.js';
import type {BidiConnection} from './Connection.js';
import {BidiRealm} from './Realm.js';

/**
 * Internal events that the BrowsingContext class emits.
 *
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace BrowsingContextEvent {
  /**
   * Emitted on the top-level context, when a descendant context is created.
   */
  export const Created = Symbol('BrowsingContext.created');
  /**
   * Emitted on the top-level context, when a descendant context or the
   * top-level context itself is destroyed.
   */
  export const Destroyed = Symbol('BrowsingContext.destroyed');
}

/**
 * @internal
 */
export interface BrowsingContextEvents extends Record<EventType, unknown> {
  [BrowsingContextEvent.Created]: BrowsingContext;
  [BrowsingContextEvent.Destroyed]: BrowsingContext;
}

/**
 * @internal
 */
export class BrowsingContext extends BidiRealm {
  #id: string;
  #url: string;
  #cdpSession: CDPSession;
  #parent?: string | null;
  #browserName = '';

  constructor(
    connection: BidiConnection,
    info: Bidi.BrowsingContext.Info,
    browserName: string
  ) {
    super(connection);
    this.#id = info.context;
    this.#url = info.url;
    this.#parent = info.parent;
    this.#browserName = browserName;
    this.#cdpSession = new BidiCdpSession(this, undefined);

    this.on('browsingContext.domContentLoaded', this.#updateUrl.bind(this));
    this.on('browsingContext.fragmentNavigated', this.#updateUrl.bind(this));
    this.on('browsingContext.load', this.#updateUrl.bind(this));
  }

  supportsCdp(): boolean {
    return !this.#browserName.toLowerCase().includes('firefox');
  }

  #updateUrl(info: Bidi.BrowsingContext.NavigationInfo) {
    this.#url = info.url;
  }

  createRealmForSandbox(): BidiRealm {
    return new BidiRealm(this.connection);
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

  async sendCdpCommand<T extends keyof ProtocolMapping.Commands>(
    method: T,
    ...paramArgs: ProtocolMapping.Commands[T]['paramsType']
  ): Promise<ProtocolMapping.Commands[T]['returnType']> {
    return await this.#cdpSession.send(method, ...paramArgs);
  }

  dispose(): void {
    this.removeAllListeners();
    this.connection.unregisterBrowsingContexts(this.#id);
    void this.#cdpSession.detach().catch(debugError);
  }
}
