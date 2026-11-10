/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {describe, it} from 'node:test';

import type {Protocol} from 'devtools-protocol';
import expect from 'expect';

import {CDPSession, CDPSessionEvent} from '../api/CDPSession.js';
import type {Connection} from '../cdp/Connection.js';
import {TargetCloseError} from '../common/Errors.js';
import {Deferred} from '../util/Deferred.js';

import {createResponseBodyStream} from './ResponseBodyStream.js';

class MockCDPSession extends CDPSession {
  streamResponse = Deferred.create<{bufferedData: string}>();

  override id(): string {
    return 'mock-id';
  }

  override connection(): Connection | undefined {
    return undefined;
  }

  override get detached(): boolean {
    return false;
  }

  // @ts-expect-error mock implementation
  override async send(method: string): Promise<unknown> {
    if (method === 'Network.streamResourceContent') {
      return await this.streamResponse.valueOrThrow();
    }
    return {};
  }

  override async detach(): Promise<void> {}

  dataReceived(requestId: string, text: string): void {
    this.emit('Network.dataReceived', {
      requestId,
      data: Buffer.from(text).toString('base64'),
    } as Protocol.Network.DataReceivedEvent);
  }

  loadingFinished(requestId: string): void {
    this.emit('Network.loadingFinished', {
      requestId,
    } as Protocol.Network.LoadingFinishedEvent);
  }

  loadingFailed(requestId: string, errorText: string): void {
    this.emit('Network.loadingFailed', {
      requestId,
      errorText,
    } as Protocol.Network.LoadingFailedEvent);
  }
}

function createStream(
  client: MockCDPSession,
  requestId: string,
): Promise<ReadableStream<Uint8Array>> {
  return createResponseBodyStream(client as unknown as CDPSession, requestId);
}

function base64(text: string): string {
  return Buffer.from(text).toString('base64');
}

async function readAll(stream: ReadableStream<Uint8Array>): Promise<string> {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString();
}

describe('createResponseBodyStream', () => {
  it('should enqueue buffered data and then received data', async () => {
    const client = new MockCDPSession();
    client.streamResponse.resolve({bufferedData: base64('a')});
    const stream = await createStream(client, '1');

    client.dataReceived('1', 'b');
    client.loadingFinished('1');
    expect(await readAll(stream)).toBe('ab');
  });

  it('should enqueue events received before the buffered data after it', async () => {
    const client = new MockCDPSession();
    const streamPromise = createStream(client, '1');

    client.dataReceived('1', 'b');
    client.loadingFinished('1');
    client.streamResponse.resolve({bufferedData: base64('a')});
    expect(await readAll(await streamPromise)).toBe('ab');
  });

  it('should ignore events for other requests', async () => {
    const client = new MockCDPSession();
    client.streamResponse.resolve({bufferedData: ''});
    const stream = await createStream(client, '1');

    client.dataReceived('2', 'x');
    client.loadingFinished('2');
    client.dataReceived('1', 'a');
    client.loadingFinished('1');
    expect(await readAll(stream)).toBe('a');
  });

  it('should error the stream if loading fails', async () => {
    const client = new MockCDPSession();
    client.streamResponse.resolve({bufferedData: ''});
    const stream = await createStream(client, '1');

    client.loadingFailed('1', 'net::ERR_FAILED');
    await expect(readAll(stream)).rejects.toThrow(
      'Loading failed: net::ERR_FAILED',
    );
    expect(client.listenerCount('Network.dataReceived')).toBe(0);
  });

  it('should error the stream if the session is closed', async () => {
    const client = new MockCDPSession();
    client.streamResponse.resolve({bufferedData: ''});
    const stream = await createStream(client, '1');

    client.emit(CDPSessionEvent.Disconnected, undefined);
    await expect(readAll(stream)).rejects.toBeInstanceOf(TargetCloseError);
  });

  it('should remove listeners when the stream is cancelled', async () => {
    const client = new MockCDPSession();
    client.streamResponse.resolve({bufferedData: ''});
    const stream = await createStream(client, '1');
    expect(client.listenerCount('Network.dataReceived')).toBe(1);

    await stream.cancel();
    expect(client.listenerCount('Network.dataReceived')).toBe(0);
    expect(client.listenerCount('Network.loadingFinished')).toBe(0);
    expect(client.listenerCount('Network.loadingFailed')).toBe(0);
    expect(client.listenerCount(CDPSessionEvent.Disconnected)).toBe(0);
  });

  it('should remove listeners if streamResourceContent fails', async () => {
    const client = new MockCDPSession();
    client.streamResponse.reject(new Error('failed'));

    await expect(createStream(client, '1')).rejects.toThrow('failed');
    expect(client.listenerCount('Network.dataReceived')).toBe(0);
  });
});
