/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type {AddressInfo} from 'node:net';
import {describe, it, beforeEach, afterEach} from 'node:test';

import expect from 'expect';
import type {WebSocket} from 'ws';
import {WebSocketServer} from 'ws';

import {Deferred} from '../util/Deferred.js';

import {NodeWebSocketTransport} from './NodeWebSocketTransport.js';

describe('NodeWebSocketTransport', () => {
  let wss: WebSocketServer;
  let transport: NodeWebSocketTransport;
  let connection: WebSocket;

  beforeEach(async () => {
    ({wss, transport, connection} = await getTestTransport());
  });

  afterEach(() => {
    transport.close();
    wss.close();
  });

  it('should dispatch messages in order handling microtasks for each message first', async () => {
    const log: string[] = [];
    const result = new Promise<void>(resolve => {
      transport.onmessage = message => {
        log.push('message received ' + message);
        return Promise.resolve().then(() => {
          log.push('microtask1 ' + message);
          return Promise.resolve().then(() => {
            log.push('microtask2 ' + message);
            if (log.length === 6) {
              resolve();
            }
          });
        });
      };
    });
    connection.send('m1');
    connection.send('m2');
    await result;
    expect(log).toEqual([
      'message received m1',
      'microtask1 m1',
      'microtask2 m1',
      'message received m2',
      'microtask1 m2',
      'microtask2 m2',
    ]);
  });

  it('should use the custom maxPayload', async () => {
    transport.close();
    wss.close();

    ({wss, transport, connection} = await getTestTransport(8));

    const payload = 'x'.repeat(64);
    const closePromise = waitForClose(transport);
    connection.send(payload);
    await closePromise;
    wss.close();

    ({wss, transport, connection} = await getTestTransport(128));

    await new Promise<void>(resolve => {
      transport.onmessage = message => {
        expect(message).toBe(payload);
        resolve();
      };
      connection.send(payload);
    });
  });
});

async function getTestTransport(maxPayload?: number): Promise<{
  wss: WebSocketServer;
  transport: NodeWebSocketTransport;
  connection: WebSocket;
}> {
  const wss = new WebSocketServer({port: 0});
  const connectionPromise = new Promise<WebSocket>(resolve => {
    wss.on('connection', resolve);
  });
  const {port} = wss.address() as AddressInfo;
  const transport = await NodeWebSocketTransport.create(
    `ws://127.0.0.1:${port}`,
    undefined,
    maxPayload,
  );
  const connection = await connectionPromise;
  return {wss, transport, connection};
}

async function waitForClose(transport: NodeWebSocketTransport): Promise<void> {
  const closeDeferred = Deferred.create<void>({
    message: 'Timed out waiting for web socket to close',
    timeout: 1000,
  });
  transport.onclose = () => {
    closeDeferred.resolve();
  };
  await closeDeferred.valueOrThrow();
}
