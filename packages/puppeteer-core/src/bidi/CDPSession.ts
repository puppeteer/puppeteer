/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping.js';

import {CDPSession} from '../api/CDPSession.js';
import type {Connection as CdpConnection} from '../cdp/Connection.js';
import {TargetCloseError, UnsupportedOperation} from '../common/Errors.js';
import {Deferred} from '../util/Deferred.js';

import type {BrowsingContext} from './BrowsingContext.js';

/**
 * @internal
 */

export const cdpSessions = new Map<string, BidiCdpSession>();

/**
 * @internal
 */
export class BidiCdpSession extends CDPSession {
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
    params?: ProtocolMapping.Commands[T]['paramsType'][0]
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
      params: params,
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
