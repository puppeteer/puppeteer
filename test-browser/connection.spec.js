/**
 * Copyright 2020 Google Inc. All rights reserved.
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
import { Connection } from '../lib/esm/puppeteer/common/Connection.js';
import expect from '../node_modules/expect/build-es5/index.js';

/**
 * A fake transport that echoes the message it got back and pretends to have got a result.
 *
 * In actual pptr code we expect that `result` is returned from the message
 * being sent with some data, so we fake that in the `send` method.
 *
 * We don't define `onmessage` here because Puppeteer's Connection class will
 * define an `onmessage` for us.
 */
class EchoTransport {
  send(message) {
    const object = JSON.parse(message);
    const fakeMessageResult = {
      result: `fake-test-result-${object.method}`,
    };
    this.onmessage(
      JSON.stringify({
        ...object,
        ...fakeMessageResult,
      })
    );
  }

  close() {}
}

describe('Connection', () => {
  it('can be created in the browser and send/receive messages', async () => {
    let receivedOutput = '';
    const connection = new Connection('fake-url', new EchoTransport());

    /**
     * Puppeteer increments a counter from 0 for each
     * message it sends So we have to register a callback for the object with
     * the ID of `1` as the message we send will be the first.
     */
    connection._callbacks.set(1, {
      resolve: (data) => (receivedOutput = data),
    });
    connection.send('Browser.getVersion');
    expect(receivedOutput).toEqual('fake-test-result-Browser.getVersion');
  });
});
