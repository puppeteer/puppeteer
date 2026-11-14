/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {afterEach, describe, it} from 'node:test';

import expect from 'expect';

import type {ConnectionTransport} from '../common/ConnectionTransport.js';
import {createIncrementalIdGenerator} from '../util/incremental-id-generator.js';

import {Connection} from './Connection.js';

interface SentCommand {
  id: number;
  method: string;
  params?: {targetId?: string};
}

/**
 * Records the commands a {@link Connection} sends and lets a test reply to
 * them in place of the browser.
 */
class MockTransport implements ConnectionTransport {
  onmessage?: (message: string) => void;
  onclose?: () => void;
  readonly sent: SentCommand[] = [];
  closed = false;

  send(message: string): void {
    this.sent.push(JSON.parse(message));
  }

  close(): void {
    this.closed = true;
  }

  /**
   * Completes a `Target.attachToTarget` command the way Chrome does: the
   * `Target.attachedToTarget` event first, then the command response.
   */
  acceptAttach(command: SentCommand, sessionId: string): void {
    this.#receive({
      method: 'Target.attachedToTarget',
      params: {
        sessionId,
        targetInfo: {targetId: command.params?.targetId, type: 'page'},
        waitingForDebugger: false,
      },
    });
    this.#receive({id: command.id, result: {sessionId}});
  }

  rejectAttach(command: SentCommand): void {
    this.#receive({
      id: command.id,
      error: {code: -32602, message: 'No target with given id found'},
    });
  }

  #receive(message: object): void {
    this.onmessage?.(JSON.stringify(message));
  }
}

describe('Connection', () => {
  const targetId = 'target-id';
  const connections: Connection[] = [];

  function createConnection(): {
    connection: Connection;
    transport: MockTransport;
  } {
    const transport = new MockTransport();
    const connection = new Connection(
      'ws://127.0.0.1',
      transport,
      0,
      undefined,
      false,
      createIncrementalIdGenerator(),
      () => {
        return undefined;
      },
    );
    connections.push(connection);
    return {connection, transport};
  }

  afterEach(() => {
    // Rejects anything a failed test left pending, so its timers don't keep
    // the process alive.
    for (const connection of connections.splice(0)) {
      connection.dispose();
    }
  });

  describe('isAutoAttached', () => {
    it('should report the target as auto-attached again after a manual attach is rejected', async () => {
      const {connection, transport} = createConnection();

      const attach = connection._createSession({targetId}, false);
      expect(connection.isAutoAttached(targetId)).toBe(false);

      transport.rejectAttach(transport.sent[0]!);
      await expect(attach).rejects.toThrow('No target with given id found');

      expect(connection.isAutoAttached(targetId)).toBe(true);
    });

    it('should not let an emulated attach clear a pending manual attach', async () => {
      const {connection, transport} = createConnection();

      const manual = connection._createSession({targetId}, false);
      const emulated = connection._createSession({targetId}, true);
      const [manualCommand, emulatedCommand] = transport.sent;

      transport.acceptAttach(emulatedCommand!, 'emulated-session');
      await emulated;
      expect(connection.isAutoAttached(targetId)).toBe(false);

      transport.acceptAttach(manualCommand!, 'manual-session');
      await manual;
      expect(connection.isAutoAttached(targetId)).toBe(true);
    });
  });
});
