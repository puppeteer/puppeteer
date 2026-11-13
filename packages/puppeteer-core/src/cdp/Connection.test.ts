/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import expect from 'expect';

import type {ConnectionTransport} from '../common/ConnectionTransport.js';
import {createIncrementalIdGenerator} from '../util/incremental-id-generator.js';

import {Connection} from './Connection.js';

class TestConnectionTransport implements ConnectionTransport {
  sent: Array<{id: number; method: string; params?: Record<string, unknown>}> =
    [];
  onmessage?: (message: string) => void;
  onclose?: () => void;

  send(message: string): void {
    this.sent.push(JSON.parse(message));
  }

  close(): void {
    this.onclose?.();
  }
}

const noopLogger = () => {
  return undefined;
};

describe('CDP Connection', () => {
  it('reference-counts manual attaches across concurrent _createSession calls', async () => {
    const transport = new TestConnectionTransport();
    const connection = new Connection(
      'ws://127.0.0.1',
      transport,
      0,
      undefined,
      false,
      createIncrementalIdGenerator(),
      noopLogger,
    );

    expect(connection.isAutoAttached('target-1')).toBe(true);

    const session1Promise = connection._createSession(
      {targetId: 'target-1'},
      false,
    );
    const session2Promise = connection._createSession(
      {targetId: 'target-1'},
      false,
    );

    expect(connection.isAutoAttached('target-1')).toBe(false);
    expect(transport.sent).toHaveLength(2);

    const targetInfo = {
      targetId: 'target-1',
      type: 'page',
      title: '',
      url: 'about:blank',
      attached: true,
      canAccessOpener: false,
    };

    transport.onmessage?.(
      JSON.stringify({
        method: 'Target.attachedToTarget',
        params: {
          sessionId: 'session-1',
          targetInfo,
          waitingForDebugger: false,
        },
      }),
    );
    transport.onmessage?.(
      JSON.stringify({
        id: transport.sent[0]!.id,
        result: {sessionId: 'session-1'},
      }),
    );

    const session1 = await session1Promise;
    expect(session1.id()).toBe('session-1');
    // Second manual attach is still pending, so target-1 remains manually attached.
    expect(connection.isAutoAttached('target-1')).toBe(false);

    transport.onmessage?.(
      JSON.stringify({
        method: 'Target.attachedToTarget',
        params: {
          sessionId: 'session-2',
          targetInfo,
          waitingForDebugger: false,
        },
      }),
    );
    transport.onmessage?.(
      JSON.stringify({
        id: transport.sent[1]!.id,
        result: {sessionId: 'session-2'},
      }),
    );

    const session2 = await session2Promise;
    expect(session2.id()).toBe('session-2');
    expect(connection.isAutoAttached('target-1')).toBe(true);

    connection.dispose();
  });

  it('clears manual-attach state when Target.attachToTarget fails', async () => {
    const transport = new TestConnectionTransport();
    const connection = new Connection(
      'ws://127.0.0.1',
      transport,
      0,
      undefined,
      false,
      createIncrementalIdGenerator(),
      noopLogger,
    );

    const sessionPromise = connection._createSession(
      {targetId: 'target-2'},
      false,
    );
    expect(connection.isAutoAttached('target-2')).toBe(false);

    transport.onmessage?.(
      JSON.stringify({
        id: transport.sent[0]!.id,
        error: {code: -32000, message: 'No target with given id'},
      }),
    );

    await expect(sessionPromise).rejects.toThrow('No target with given id');
    expect(connection.isAutoAttached('target-2')).toBe(true);

    connection.dispose();
  });
});
