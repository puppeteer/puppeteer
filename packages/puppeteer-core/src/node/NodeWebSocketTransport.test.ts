/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {describe, it, beforeEach, afterEach} from 'node:test';

import expect from 'expect';
import type NodeWebSocket from 'ws';
import type {WebSocket} from 'ws';
import {WebSocketServer} from 'ws';

import {getCapturedLogs, setLogCapture} from '../common/Debug.js';

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
    transport = await NodeWebSocketTransport.create('ws://127.0.0.1:8080');
  });

  afterEach(() => {
    transport.close();
    wss.close();
    setLogCapture(false);
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

  it('should log WebSocket errors for debugging', () => {
    const ws = new EventTarget() as unknown as NodeWebSocket;
    new NodeWebSocketTransport(ws);

    setLogCapture(true);
    (ws as unknown as EventTarget).dispatchEvent(new Event('error'));

    expect(getCapturedLogs()).toHaveLength(1);
    expect(getCapturedLogs()[0]).toContain('puppeteer:error');
  });
});
