/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {afterEach, describe, it, mock} from 'node:test';

import {BidiMapper} from 'chromium-bidi';
import expect from 'expect';

import {CDPSessionEvent} from '../api/CDPSession.js';
import {Connection as CdpConnection} from '../cdp/Connection.js';
import type {ConnectionTransport} from '../common/ConnectionTransport.js';
import {Deferred} from '../util/Deferred.js';
import {createIncrementalIdGenerator} from '../util/incremental-id-generator.js';

import {connectBidiOverCdp} from './BidiOverCdp.js';

class TestCdpTransport implements ConnectionTransport {
  onmessage?: (message: string) => void;
  onclose?: () => void;

  send(_message: string): void {}

  close(): void {
    this.onclose?.();
  }
}

const noopLogger = () => {
  return undefined;
};

describe('connectBidiOverCdp', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it('closes BidiServer and BiDi connection if CDP disconnects during startup', async () => {
    const transport = new TestCdpTransport();
    const cdp = new CdpConnection(
      'ws://127.0.0.1',
      transport,
      0,
      undefined,
      false,
      createIncrementalIdGenerator(),
      noopLogger,
    );

    let serverClosed = false;
    const startupDeferred = Deferred.create<BidiMapper.BidiServer>();
    mock.method(BidiMapper.BidiServer, 'createAndStart', () => {
      return startupDeferred.valueOrThrow();
    });

    const connectPromise = connectBidiOverCdp(cdp, noopLogger);

    // Trigger CDP disconnect while createAndStart is still pending.
    transport.onclose?.();

    startupDeferred.resolve({
      close() {
        serverClosed = true;
      },
    } as unknown as BidiMapper.BidiServer);

    const bidiConnection = await connectPromise;
    expect(serverClosed).toBe(true);
    expect(bidiConnection.closed).toBe(true);
  });

  it('handles already-closed CDP connection without starting BidiServer', async () => {
    const transport = new TestCdpTransport();
    const cdp = new CdpConnection(
      'ws://127.0.0.1',
      transport,
      0,
      undefined,
      false,
      createIncrementalIdGenerator(),
      noopLogger,
    );
    cdp.dispose();

    let createCalled = false;
    mock.method(BidiMapper.BidiServer, 'createAndStart', async () => {
      createCalled = true;
      return {close() {}} as unknown as BidiMapper.BidiServer;
    });

    const bidiConnection = await connectBidiOverCdp(cdp, noopLogger);
    expect(createCalled).toBe(false);
    expect(bidiConnection.closed).toBe(true);
    expect(cdp.listenerCount(CDPSessionEvent.Disconnected)).toBe(0);
  });

  it('removes the CDP disconnect listener when createAndStart fails', async () => {
    const transport = new TestCdpTransport();
    const cdp = new CdpConnection(
      'ws://127.0.0.1',
      transport,
      0,
      undefined,
      false,
      createIncrementalIdGenerator(),
      noopLogger,
    );

    mock.method(BidiMapper.BidiServer, 'createAndStart', async () => {
      throw new Error('startup failed');
    });

    await expect(connectBidiOverCdp(cdp, noopLogger)).rejects.toThrow(
      'startup failed',
    );
    expect(cdp.listenerCount(CDPSessionEvent.Disconnected)).toBe(0);
    cdp.dispose();
  });

  it('delivers queued bidiResponse messages before closing on CDP disconnect', async () => {
    const transport = new TestCdpTransport();
    const cdp = new CdpConnection(
      'ws://127.0.0.1',
      transport,
      0,
      undefined,
      false,
      createIncrementalIdGenerator(),
      noopLogger,
    );

    let capturedTransport:
      {sendMessage(message: object): Promise<void>} | undefined;
    mock.method(
      BidiMapper.BidiServer,
      'createAndStart',
      async (bidiTransport: {sendMessage(message: object): Promise<void>}) => {
        capturedTransport = bidiTransport;
        return {close() {}} as unknown as BidiMapper.BidiServer;
      },
    );

    const bidiConnection = await connectBidiOverCdp(cdp, noopLogger);
    const events: string[] = [];
    bidiConnection.on('log.entryAdded', () => {
      events.push('log.entryAdded');
    });
    const closedPromise = new Promise<void>(resolve => {
      bidiConnection.once('closed', () => {
        events.push('closed');
        resolve();
      });
    });

    // Emit a BiDi event and disconnect CDP in the same tick.
    void capturedTransport!.sendMessage({
      type: 'event',
      method: 'log.entryAdded',
      params: {},
    });
    transport.onclose?.();

    await closedPromise;
    expect(events).toEqual(['log.entryAdded', 'closed']);
  });
});
