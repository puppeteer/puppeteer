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
});
