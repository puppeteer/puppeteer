/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {ProtocolMapping} from 'devtools-protocol/types/protocol-mapping.js';

import {
  type CDPEvents,
  CDPSession,
  CDPSessionEvent,
  type CommandOptions,
} from '../api/CDPSession.js';
import {CallbackRegistry} from '../common/CallbackRegistry.js';
import {TargetCloseError} from '../common/Errors.js';
import {assert} from '../util/assert.js';
import {createProtocolErrorMessage} from '../util/ErrorLike.js';

import type {Connection} from './Connection.js';
import type {CdpTarget} from './Target.js';

/**
 * @internal
 */

export class CdpCDPSession extends CDPSession {
  #sessionId: string;
  #targetType: string;
  #callbacks = new CallbackRegistry();
  #connection?: Connection;
  #parentSessionId?: string;
  #target?: CdpTarget;

  /**
   * @internal
   */
  constructor(
    connection: Connection,
    targetType: string,
    sessionId: string,
    parentSessionId: string | undefined
  ) {
    super();
    this.#connection = connection;
    this.#targetType = targetType;
    this.#sessionId = sessionId;
    this.#parentSessionId = parentSessionId;
  }

  /**
   * Sets the {@link CdpTarget} associated with the session instance.
   *
   * @internal
   */
  _setTarget(target: CdpTarget): void {
    this.#target = target;
  }

  /**
   * Gets the {@link CdpTarget} associated with the session instance.
   *
   * @internal
   */
  _target(): CdpTarget {
    assert(this.#target, 'Target must exist');
    return this.#target;
  }

  override connection(): Connection | undefined {
    return this.#connection;
  }

  override parentSession(): CDPSession | undefined {
    if (!this.#parentSessionId) {
      // To make it work in Firefox that does not have parent (tab) sessions.
      return this;
    }
    const parent = this.#connection?.session(this.#parentSessionId);
    return parent ?? undefined;
  }

  override send<T extends keyof ProtocolMapping.Commands>(
    method: T,
    params?: ProtocolMapping.Commands[T]['paramsType'][0],
    options?: CommandOptions
  ): Promise<ProtocolMapping.Commands[T]['returnType']> {
    if (!this.#connection) {
      return Promise.reject(
        new TargetCloseError(
          `Protocol error (${method}): Session closed. Most likely the ${this.#targetType} has been closed.`
        )
      );
    }
    return this.#connection._rawSend(
      this.#callbacks,
      method,
      params,
      this.#sessionId,
      options
    );
  }

  /**
   * @internal
   */
  _onMessage(object: {
    id?: number;
    method: keyof CDPEvents;
    params: CDPEvents[keyof CDPEvents];
    error: {message: string; data: any; code: number};
    result?: any;
  }): void {
    if (object.id) {
      if (object.error) {
        this.#callbacks.reject(
          object.id,
          createProtocolErrorMessage(object),
          object.error.message
        );
      } else {
        this.#callbacks.resolve(object.id, object.result);
      }
    } else {
      assert(!object.id);
      this.emit(object.method, object.params);
    }
  }

  /**
   * Detaches the cdpSession from the target. Once detached, the cdpSession object
   * won't emit any events and can't be used to send messages.
   */
  override async detach(): Promise<void> {
    if (!this.#connection) {
      throw new Error(
        `Session already detached. Most likely the ${this.#targetType} has been closed.`
      );
    }
    await this.#connection.send('Target.detachFromTarget', {
      sessionId: this.#sessionId,
    });
  }

  /**
   * @internal
   */
  _onClosed(): void {
    this.#callbacks.clear();
    this.#connection = undefined;
    this.emit(CDPSessionEvent.Disconnected, undefined);
  }

  /**
   * Returns the session's id.
   */
  override id(): string {
    return this.#sessionId;
  }
}
