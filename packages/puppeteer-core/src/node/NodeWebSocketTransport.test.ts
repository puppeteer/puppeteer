/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {describe, it, beforeEach, afterEach} from 'node:test';

import expect from 'expect';
import type {WebSocket} from 'ws';
import {WebSocketServer} from 'ws';

import {NodeWebSocketTransport} from './NodeWebSocketTransport.js';

describe('NodeWebSocketTransport', () => {
  let wss: WebSocketServer;
  let transport: NodeWebSocketTransport;
  let connection: WebSocket;

  beforeEach(async () => {
    wss = new WebSocketServer({port: 8080});
    wss.on('connection', c => {
      connection = c;
    });
    transport = await NodeWebSocketTransport.create(
      'ws://127.0.0.1:8080',
      undefined,
      () => {
        return undefined;
      },
    );
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

  describe('keepAlive', () => {
    let keepAliveWss: WebSocketServer;
    let keepAliveTransport: NodeWebSocketTransport | undefined;

    afterEach(() => {
      keepAliveTransport?.close();
      keepAliveTransport = undefined;
      keepAliveWss?.close();
    });

    it('closes the transport when the peer stops answering pings', async () => {
      // autoPong: false makes the server behave like a peer that is gone but
      // never sent a TCP FIN, which is the case `close` alone cannot detect.
      keepAliveWss = new WebSocketServer({port: 8081, autoPong: false});
      keepAliveTransport = await NodeWebSocketTransport.create(
        'ws://127.0.0.1:8081',
        undefined,
        () => {
          return undefined;
        },
        {keepAlive: true, keepAliveIntervalMs: 50},
      );

      const closed = new Promise<void>(resolve => {
        keepAliveTransport!.onclose = resolve;
      });
      // Resolves only if the missing pong is detected; the test times out
      // otherwise, which is exactly the reported bug.
      await closed;
    });

    it('stays open while the peer answers pings', async () => {
      keepAliveWss = new WebSocketServer({port: 8082});
      keepAliveTransport = await NodeWebSocketTransport.create(
        'ws://127.0.0.1:8082',
        undefined,
        () => {
          return undefined;
        },
        {keepAlive: true, keepAliveIntervalMs: 50},
      );

      let closed = false;
      keepAliveTransport.onclose = () => {
        closed = true;
      };
      await new Promise(resolve => {
        return setTimeout(resolve, 300);
      });
      expect(closed).toBe(false);
    });

    it('does not ping when keepAlive is not enabled', async () => {
      keepAliveWss = new WebSocketServer({port: 8083, autoPong: false});
      let pings = 0;
      keepAliveWss.on('connection', c => {
        c.on('ping', () => {
          pings++;
        });
      });
      keepAliveTransport = await NodeWebSocketTransport.create(
        'ws://127.0.0.1:8083',
        undefined,
        () => {
          return undefined;
        },
      );

      let closed = false;
      keepAliveTransport.onclose = () => {
        closed = true;
      };
      await new Promise(resolve => {
        return setTimeout(resolve, 300);
      });
      expect(pings).toBe(0);
      expect(closed).toBe(false);
    });
  });
});
