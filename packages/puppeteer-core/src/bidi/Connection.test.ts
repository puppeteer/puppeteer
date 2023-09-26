/**
 * Copyright 2022 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {describe, it} from 'node:test';

import expect from 'expect';

import type {ConnectionTransport} from '../common/ConnectionTransport.js';

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
    const connection = new BidiConnection('ws://127.0.0.1', transport);
    const responsePromise = connection.send('session.new', {
      capabilities: {},
    });
    expect(transport.sent).toEqual([
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
    expect(response).toEqual(rawResponse);
    connection.dispose();
    expect(transport.closed).toBeTruthy();
  });
});
