/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {afterEach, describe, it} from 'node:test';

import expect from 'expect';

import {CDPSessionEvent} from '../api/CDPSession.js';
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

    it('should reference-count manual attaches across concurrent _createSession calls', async () => {
      const {connection, transport} = createConnection();

      expect(connection.isAutoAttached(targetId)).toBe(true);

      const session1Promise = connection._createSession({targetId}, false);
      const session2Promise = connection._createSession({targetId}, false);

      expect(connection.isAutoAttached(targetId)).toBe(false);
      expect(transport.sent).toHaveLength(2);

      const [firstCommand, secondCommand] = transport.sent;

      transport.acceptAttach(firstCommand!, 'session-1');
      const session1 = await session1Promise;
      expect(session1.id()).toBe('session-1');
      // Second manual attach is still pending, so target remains manually attached.
      expect(connection.isAutoAttached(targetId)).toBe(false);

      transport.acceptAttach(secondCommand!, 'session-2');
      const session2 = await session2Promise;
      expect(session2.id()).toBe('session-2');
      expect(connection.isAutoAttached(targetId)).toBe(true);
    });

    it('should track FIFO order for concurrent emulated auto-attach and manual attach', async () => {
      const {connection, transport} = createConnection();

      const autoAttachPromise = connection._createSession({targetId}, true);
      const manualAttachPromise = connection._createSession({targetId}, false);
      const [autoCommand, manualCommand] = transport.sent;

      // Emulated auto-attach is at the head of the FIFO queue.
      expect(connection.isAutoAttached(targetId)).toBe(true);

      transport.acceptAttach(autoCommand!, 'session-auto');
      await autoAttachPromise;
      // Now the manual attach is at the head of the queue.
      expect(connection.isAutoAttached(targetId)).toBe(false);

      transport.acceptAttach(manualCommand!, 'session-manual');
      await manualAttachPromise;
      expect(connection.isAutoAttached(targetId)).toBe(true);
    });

    it('should clear pending attach state synchronously on disconnect', async () => {
      const {connection} = createConnection();

      const sessionPromise = connection._createSession({targetId}, false);
      expect(connection.isAutoAttached(targetId)).toBe(false);

      let autoAttachedDuringDisconnect = false;
      connection.once(CDPSessionEvent.Disconnected, () => {
        autoAttachedDuringDisconnect = connection.isAutoAttached(targetId);
      });

      connection.dispose();
      expect(autoAttachedDuringDisconnect).toBe(true);
      await expect(sessionPromise).rejects.toThrow();
    });
  });
});
