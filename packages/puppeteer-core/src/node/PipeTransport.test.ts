/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {Readable, Writable} from 'node:stream';
import {describe, it, beforeEach, afterEach} from 'node:test';

import expect from 'expect';

import {PipeTransport} from './PipeTransport.js';

describe('PipeTransport', () => {
  let transport: PipeTransport;
  let myReadable: Readable;

  async function waitForNextMessage() {
    return await new Promise<string>(res => {
      transport.onmessage = message => {
        res(message);
      };
    });
  }

  function waitForNumberOfMessages(count: number): Promise<string[]> {
    const messages: string[] = [];
    return new Promise<string[]>(resolve => {
      transport.onmessage = (message: string) => {
        messages.push(message);
        if (messages.length === count) {
          resolve(messages);
        }
      };
    });
  }

  beforeEach(() => {
    const myWritable = new Writable({
      write(_chunk: string, _encoding: string, callback) {
        callback();
      },
      writev(_chunks: any[], callback) {
        callback();
      },
    });
    myReadable = new Readable({
      read() {
        // No-op as we will push data manually.
      },
    });
    transport = new PipeTransport(myWritable, myReadable);
  });

  afterEach(() => {
    transport.close();
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
    myReadable.push('m1\0');
    myReadable.push('m2\0');
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

  describe('message handling', () => {
    it('should work with message with ending', async () => {
      let message = waitForNextMessage();
      myReadable.push('m1\0');

      expect(await message).toBe('m1');
      message = waitForNextMessage();
      myReadable.push('m2\0');
      expect(await message).toBe('m2');
    });

    it('should work for messages ending in multiple lines', async () => {
      const message = waitForNextMessage();
      myReadable.push('Hello wor');
      myReadable.push('ld!\0');

      expect(await message).toBe('Hello world!');
    });

    it('should work with messages continuing from previous one', async () => {
      let message = waitForNextMessage();
      myReadable.push('Hello wor');
      myReadable.push('ld!\0I started in ');

      expect(await message).toBe('Hello world!');
      message = waitForNextMessage();
      myReadable.push('the previous message\0');
      expect(await message).toBe('I started in the previous message');
    });
    it('should work with multiple messages in a single line', async () => {
      const messagesPromise = waitForNumberOfMessages(3);
      myReadable.push('First\0Second\0Third\0');

      const messages = await messagesPromise;
      expect(messages).toHaveLength(3);

      expect(messages[0]).toBe('First');
      expect(messages[1]).toBe('Second');
      expect(messages[2]).toBe('Third');
    });
  });
});
