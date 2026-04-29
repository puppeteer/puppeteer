/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {describe, it, afterEach} from 'node:test';

import expect from 'expect';

import {BrowserWebSocketTransport} from './BrowserWebSocketTransport.js';
import {getCapturedLogs, setLogCapture} from './Debug.js';

describe('BrowserWebSocketTransport', () => {
  afterEach(() => {
    setLogCapture(false);
  });

  it('should log WebSocket errors for debugging', () => {
    const ws = new EventTarget() as WebSocket;
    ws.send = () => {};
    ws.close = () => {};

    new BrowserWebSocketTransport(ws);

    setLogCapture(true);
    ws.dispatchEvent(new Event('error'));

    expect(getCapturedLogs()).toHaveLength(1);
    expect(getCapturedLogs()[0]).toContain('puppeteer:error');
  });
});
