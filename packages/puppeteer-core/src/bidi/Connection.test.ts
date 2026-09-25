/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import {assert} from 'chai';

import type {ConnectionTransport} from '../common/ConnectionTransport.js';
import {createIncrementalIdGenerator} from '../util/incremental-id-generator.js';

import {BidiConnection} from './Connection.js';

describe('WebDriver BiDi Connection', () => {
  class TestConnectionTransport implements ConnectionTransport {
    sent: string[] = [];
    closed = false;

    send(message: string) {
      this.sent.push(message);
    }

    close(): void {
      this.closed = true;
    }
  }

  it('should work', async () => {
    const transport = new TestConnectionTransport();
    const connection = new BidiConnection(
      'ws://127.0.0.1',
      transport,
      createIncrementalIdGenerator(),
      0,
      undefined,
      () => {
        return undefined;
      },
    );
    const responsePromise = connection.send('session.new', {
      capabilities: {},
    });
    assert.deepEqual(transport.sent, [
      `{"id":1,"method":"session.new","params":{"capabilities":{}}}`,
    ]);
    const id = JSON.parse(transport.sent[0]!).id;
    const rawResponse = {
      id,
      type: 'success',
      result: {ready: false, message: 'already connected'},
    };
    (transport as ConnectionTransport).onmessage?.(JSON.stringify(rawResponse));
    const response = await responsePromise;
    assert.deepEqual<unknown>(response, rawResponse);
    connection.dispose();
    assert.ok(transport.closed);
  });
});
