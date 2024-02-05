/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';
import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping.js';

import {CDPSession} from '../api/CDPSession.js';
import type {Connection as CdpConnection} from '../cdp/Connection.js';
import {TargetCloseError, UnsupportedOperation} from '../common/Errors.js';
import type {EventType} from '../common/EventEmitter.js';
import {debugError} from '../common/util.js';
import {Deferred} from '../util/Deferred.js';

import type {BidiConnection} from './Connection.js';
import {BidiRealm} from './Realm.js';

/**
 * @internal
 */
export const cdpSessions = new Map<string, CdpSessionWrapper>();

/**
 * @internal
 */
export class CdpSessionWrapper extends CDPSession {
  #context: BrowsingContext;
  #sessionId = Deferred.create<string>();
  #detached = false;

  constructor(context: BrowsingContext, sessionId?: string) {
    super();
    this.#context = context;
    if (!this.#context.supportsCdp()) {
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

  override connection(): CdpConnection | undefined {
    return undefined;
  }

  override async send<T extends keyof ProtocolMapping.Commands>(
    method: T,
    ...paramArgs: ProtocolMapping.Commands[T]['paramsType']
  ): Promise<ProtocolMapping.Commands[T]['returnType']> {
    if (!this.#context.supportsCdp()) {
      throw new UnsupportedOperation(
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
    if (!this.#detached && this.#context.supportsCdp()) {
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
    this.#cdpSession = new CdpSessionWrapper(this, undefined);

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
