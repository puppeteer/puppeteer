/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {PassThrough, Writable} from 'node:stream';
import {afterEach, beforeEach, describe, it} from 'node:test';

import expect from 'expect';

import {EventEmitter} from '../common/EventEmitter.js';
import {environment} from '../environment.js';
import {asyncDisposeSymbol} from '../util/disposable.js';

import {BidiPage} from './Page.js';
import {BidiScreenRecording} from './ScreenRecording.js';

class MockBrowsingContext extends EventEmitter<any> {
  commands: Array<{method: string; params?: unknown}> = [];
  startResponse: {screencast: string; path: string} = {
    screencast: 'screencast-1',
    path: '/tmp/screencast.mp4',
  };
  stopResponse: {path: string; error?: string} = {
    path: '/tmp/screencast.mp4',
  };

  async startScreencast(params: any): Promise<any> {
    this.commands.push({method: 'browsingContext.startScreencast', params});
    return this.startResponse;
  }

  async stopScreencast(screencast: string): Promise<any> {
    this.commands.push({
      method: 'browsingContext.stopScreencast',
      params: {screencast},
    });
    return this.stopResponse;
  }
}

// @ts-expect-error mock implementation
class MockBidiPage extends BidiPage {
  mockContext: MockBrowsingContext;

  constructor(context: MockBrowsingContext) {
    super(
      {
        browser: () => {
          return {cdpSupported: false};
        },
      } as any,
      {
        id: 'mock-id',
        defaultRealm: new EventEmitter(),
        createWindowRealm: () => {
          return new EventEmitter();
        },
        children: [],
        on() {},
      } as any,
      (() => {
        return undefined;
      }) as any,
    );
    this.mockContext = context;
  }

  override mainFrame(): any {
    return {
      browsingContext: this.mockContext,
      client: {
        once() {},
      },
    };
  }

  override createScreenRecording(options: any): any {
    return new BidiScreenRecording(this as any, options, this.logger);
  }
}

describe('BidiScreenRecording', () => {
  let originalReadFile: typeof environment.value.readFile;

  beforeEach(() => {
    originalReadFile = environment.value.readFile;
  });

  afterEach(() => {
    environment.value.readFile = originalReadFile;
  });

  it('should start screen recording and read file on stop', async () => {
    const context = new MockBrowsingContext();
    const page = new MockBidiPage(context);

    environment.value.readFile = (async () => {
      return Buffer.from('video-data');
    }) as any;

    const recording = await page.record({
      audio: true,
      maxWidth: 1920,
      maxHeight: 1080,
      frameRate: 60,
    });

    expect(context.commands[0]).toEqual({
      method: 'browsingContext.startScreencast',
      params: {
        audio: true,
        video: {
          width: 1920,
          height: 1080,
          frameRate: 60,
        },
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

    expect(Buffer.concat(chunks).toString()).toBe('video-data');
    expect(context.commands).toContainEqual({
      method: 'browsingContext.stopScreencast',
      params: {screencast: 'screencast-1'},
    });
  });

  it('should support fps as alias for frameRate', async () => {
    const context = new MockBrowsingContext();
    const page = new MockBidiPage(context);

    environment.value.readFile = (async () => {
      return Buffer.from('');
    }) as any;

    const recording = await page.record({
      fps: 24,
    });

    expect(context.commands[0]).toEqual({
      method: 'browsingContext.startScreencast',
      params: {
        audio: undefined,
        video: {
          width: undefined,
          height: undefined,
          frameRate: 24,
        },
      },
    });

    await recording.stop();
  });

  it('should validate options', async () => {
    const context = new MockBrowsingContext();
    const page = new MockBidiPage(context);

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

  it('should support path returned from stopScreencast', async () => {
    const context = new MockBrowsingContext();
    context.startResponse = {screencast: 'screencast-start', path: ''};
    context.stopResponse = {path: '/tmp/from-stop.mp4'};

    let readPath = '';
    environment.value.readFile = (async (path: string) => {
      readPath = path;
      return Buffer.from('hello');
    }) as any;

    const page = new MockBidiPage(context);
    const recording = await page.record();

    const chunks: Buffer[] = [];
    const dest = new PassThrough();
    dest.on('data', chunk => {
      chunks.push(Buffer.from(chunk));
    });

    recording.pipe(dest);
    await recording.stop();

    expect(readPath).toBe('/tmp/from-stop.mp4');
    expect(Buffer.concat(chunks).toString()).toBe('hello');
    expect(context.commands).toContainEqual({
      method: 'browsingContext.stopScreencast',
      params: {screencast: 'screencast-start'},
    });
  });

  it('should support async iteration', async () => {
    const context = new MockBrowsingContext();
    const page = new MockBidiPage(context);

    environment.value.readFile = (async () => {
      return Buffer.from('chunkA');
    }) as any;

    const recording = await page.record();

    const stopPromise = recording.stop();

    const received: Uint8Array[] = [];
    for await (const chunk of recording) {
      received.push(chunk);
    }
    await stopPromise;

    expect(Buffer.concat(received).toString()).toBe('chunkA');
  });

  it('should support pipeTo with WritableStream', async () => {
    const context = new MockBrowsingContext();
    const page = new MockBidiPage(context);

    environment.value.readFile = (async () => {
      return Buffer.from('web-stream-data');
    }) as any;

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

  it('should stop on browsing context closed', async () => {
    const context = new MockBrowsingContext();
    const page = new MockBidiPage(context);

    environment.value.readFile = (async () => {
      return Buffer.from('');
    }) as any;

    const recording = await page.record();

    context.emit('closed', undefined);
    // Calling stop again should be a no-op
    await recording.stop();

    expect(
      context.commands.filter(c => {
        return c.method === 'browsingContext.stopScreencast';
      }).length,
    ).toBe(1);
  });

  it('should support asyncDisposeSymbol', async () => {
    const context = new MockBrowsingContext();
    const page = new MockBidiPage(context);

    environment.value.readFile = (async () => {
      return Buffer.from('');
    }) as any;

    const recording = await page.record();

    await recording[asyncDisposeSymbol]();

    expect(
      context.commands.filter(c => {
        return c.method === 'browsingContext.stopScreencast';
      }).length,
    ).toBe(1);
  });
});
