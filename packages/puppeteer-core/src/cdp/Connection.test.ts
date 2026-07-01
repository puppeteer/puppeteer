/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import expect from 'expect';

import type {ConnectionTransport} from '../common/ConnectionTransport.js';
import {ConnectionClosedError} from '../common/Errors.js';

import {Connection} from './Connection.js';

describe('Connection', () => {
  it('should expose websocket close details on pending protocol errors', async () => {
    const transport: ConnectionTransport = {
      send: () => {},
      close: () => {},
    };
    const connection = new Connection('ws://example.com', transport);

    const errorPromise = connection.send('Browser.getVersion').catch(error => {
      return error;
    });

    transport.onclose?.({closeCode: 4321, closeMessage: 'proxy unavailable'});

    const error = await errorPromise;
    expect(error).toBeInstanceOf(ConnectionClosedError);
    expect(error.closeCode).toBe(4321);
    expect(error.closeMessage).toBe('proxy unavailable');
  });
});
