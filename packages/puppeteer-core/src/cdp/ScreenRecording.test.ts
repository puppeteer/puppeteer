/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {PassThrough, Writable} from 'node:stream';
import {describe, it} from 'node:test';

import expect from 'expect';

import {CDPSession, CDPSessionEvent} from '../api/CDPSession.js';
import {Page} from '../api/Page.js';
import type {Connection} from '../cdp/Connection.js';
import {asyncDisposeSymbol} from '../util/disposable.js';

import {CdpScreenRecording} from './ScreenRecording.js';

class MockCDPSession extends CDPSession {
  commands: Array<{method: string; params?: unknown}> = [];
  readChunks: Array<{data: string; base64Encoded?: boolean; eof: boolean}> = [];
  startResponse: {stream?: string} = {stream: 'stream-1'};
  stopResponse: {stream?: string} = {};

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
  override async send(method: string, params?: unknown): Promise<unknown> {
    this.commands.push({method, params});
    switch (method) {
      case 'Page.startScreenRecording':
        return this.startResponse;
      case 'Page.stopScreenRecording':
        return this.stopResponse;
      case 'IO.read':
        return (
          this.readChunks.shift() ?? {data: '', base64Encoded: false, eof: true}
        );
      case 'IO.close':
        return {};
      default:
        return {};
    }
  }

  override async detach(): Promise<void> {}
}

// @ts-expect-error no need to implement all methods
class MockPage extends Page {
  mockClient: MockCDPSession;

  constructor(client: MockCDPSession) {
    super(() => {
      return undefined;
    });
    this.mockClient = client;
  }

  override mainFrame(): any {
    return {
      client: this.mockClient,
    };
  }

  override createScreenRecording(options: any): any {
    return new CdpScreenRecording(this as any, options, this.logger);
  }
}

describe('ScreenRecording', () => {
  it('should start screen recording and read all chunks on stop', async () => {
    const client = new MockCDPSession();
    client.startResponse = {stream: 'stream-1'};
    client.readChunks = [
      {
        data: Buffer.from('chunk1').toString('base64'),
        base64Encoded: true,
        eof: false,
      },
      {
        data: Buffer.from('chunk2').toString('base64'),
        base64Encoded: true,
        eof: true,
      },
    ];

    const page = new MockPage(client);
    const recording = await page.record({
      audio: true,
      maxWidth: 1920,
      maxHeight: 1080,
      frameRate: 60,
    });

    expect(client.commands[0]).toEqual({
      method: 'Page.startScreenRecording',
      params: {
        audio: true,
        maxWidth: 1920,
        maxHeight: 1080,
        frameRate: 60,
      },
    });

    const chunks: Buffer[] = [];
    const dest = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(Buffer.from(chunk));
        callback();
      },
    });

    recording.pipe(dest);
    await recording.stop();

    expect(Buffer.concat(chunks).toString()).toBe('chunk1chunk2');
    expect(client.commands).toContainEqual({
      method: 'Page.stopScreenRecording',
      params: undefined,
    });
    expect(client.commands).toContainEqual({
      method: 'IO.close',
      params: {handle: 'stream-1'},
    });
  });

  it('should support fps as alias for frameRate', async () => {
    const client = new MockCDPSession();
    const page = new MockPage(client);
    const recording = await page.record({
      fps: 24,
    });

    expect(client.commands[0]).toEqual({
      method: 'Page.startScreenRecording',
      params: {
        audio: undefined,
        maxWidth: undefined,
        maxHeight: undefined,
        frameRate: 24,
      },
    });

    await recording.stop();
  });

  it('should validate options', async () => {
    const client = new MockCDPSession();
    const page = new MockPage(client);

    await expect(page.record({maxWidth: 0})).rejects.toThrow(
      '`maxWidth` must be greater than 0.',
    );
    await expect(page.record({maxWidth: -10})).rejects.toThrow(
      '`maxWidth` must be greater than 0.',
    );
    await expect(page.record({maxHeight: 0})).rejects.toThrow(
      '`maxHeight` must be greater than 0.',
    );
    await expect(page.record({maxHeight: -10})).rejects.toThrow(
      '`maxHeight` must be greater than 0.',
    );
    await expect(page.record({frameRate: 0})).rejects.toThrow(
      '`frameRate` must be greater than 0.',
    );
    await expect(page.record({frameRate: -5})).rejects.toThrow(
      '`frameRate` must be greater than 0.',
    );
    await expect(page.record({fps: 0})).rejects.toThrow(
      '`fps` must be greater than 0.',
    );
    await expect(page.record({fps: -5})).rejects.toThrow(
      '`fps` must be greater than 0.',
    );
  });

  it('should support stream handle returned from startScreenRecording', async () => {
    const client = new MockCDPSession();
    client.startResponse = {stream: 'stream-start'};
    client.stopResponse = {};
    client.readChunks = [
      {
        data: Buffer.from('hello').toString('base64'),
        base64Encoded: true,
        eof: true,
      },
    ];

    const page = new MockPage(client);
    const recording = await page.record();

    const chunks: Buffer[] = [];
    const dest = new PassThrough();
    dest.on('data', chunk => {
      chunks.push(Buffer.from(chunk));
    });

    recording.pipe(dest);
    await recording.stop();

    expect(Buffer.concat(chunks).toString()).toBe('hello');
    expect(client.commands).toContainEqual({
      method: 'IO.close',
      params: {handle: 'stream-start'},
    });
  });

  it('should support async iteration', async () => {
    const client = new MockCDPSession();
    client.startResponse = {stream: 'stream-iter'};
    client.readChunks = [
      {
        data: Buffer.from('chunkA').toString('base64'),
        base64Encoded: true,
        eof: false,
      },
      {
        data: Buffer.from('chunkB').toString('base64'),
        base64Encoded: true,
        eof: true,
      },
    ];

    const page = new MockPage(client);
    const recording = await page.record();

    const stopPromise = recording.stop();

    const received: Uint8Array[] = [];
    for await (const chunk of recording) {
      received.push(chunk);
    }
    await stopPromise;

    expect(Buffer.concat(received).toString()).toBe('chunkAchunkB');
  });

  it('should support pipeTo with WritableStream', async () => {
    const client = new MockCDPSession();
    client.startResponse = {stream: 'stream-web'};
    client.readChunks = [
      {
        data: Buffer.from('web-stream-data').toString('base64'),
        base64Encoded: true,
        eof: true,
      },
    ];

    const page = new MockPage(client);
    const recording = await page.record();

    const chunks: Uint8Array[] = [];
    const writableStream = new WritableStream<Uint8Array>({
      write(chunk) {
        chunks.push(chunk);
      },
    });

    const pipePromise = recording.pipe(writableStream);
    await recording.stop();
    await pipePromise;

    expect(Buffer.concat(chunks).toString()).toBe('web-stream-data');
  });

  it('should stop on client disconnection', async () => {
    const client = new MockCDPSession();
    const page = new MockPage(client);
    const recording = await page.record();

    client.emit(CDPSessionEvent.Disconnected, undefined);
    // Calling stop again should be a no-op
    await recording.stop();

    expect(
      client.commands.filter(c => {
        return c.method === 'Page.stopScreenRecording';
      }).length,
    ).toBe(1);
  });

  it('should support asyncDisposeSymbol', async () => {
    const client = new MockCDPSession();
    const page = new MockPage(client);
    const recording = await page.record();

    await recording[asyncDisposeSymbol]();

    expect(
      client.commands.filter(c => {
        return c.method === 'Page.stopScreenRecording';
      }).length,
    ).toBe(1);
  });
});
