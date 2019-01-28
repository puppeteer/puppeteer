/**
 * Copyright 2018 Google Inc. All rights reserved.
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
const {Socket} = require('net');

/**
 * @implements {Puppeteer.ConnectionTransport}
 * @internal
 */
class FirefoxTransport {
  /**
   * @param {number} port
   * @return {Promise<FirefoxTransport>}
   */
  static async create(port) {
    const socket = new Socket();
    try {
      await new Promise((resolve, reject) => {
        socket.once('connect', resolve);
        socket.once('error', reject);
        socket.connect({
          port,
          host: 'localhost'
        });
      });
    } catch (e) {
      socket.destroy();
      throw e;
    }
    return new FirefoxTransport(socket);
  }

  /**
   * @param {Socket} socket
   */
  constructor(socket) {
    this._socket = socket;
    this._socket.once('close', had_error => {
      if (this.onclose)
        this.onclose.call(null);
    });
    this._dispatchQueue = new DispatchQueue(this);
    let buffer = Buffer.from('');
    socket.on('data', async data => {
      buffer = Buffer.concat([buffer, data]);
      while (true) {
        const bufferString = buffer.toString();
        const seperatorIndex = bufferString.indexOf(':');
        if (seperatorIndex === -1)
          return;
        const length = parseInt(bufferString.substring(0, seperatorIndex), 10);
        if (buffer.length < length + seperatorIndex)
          return;
        const message = buffer.slice(seperatorIndex + 1, seperatorIndex + 1 + length).toString();
        buffer = buffer.slice(seperatorIndex + 1 + length);
        this._dispatchQueue.enqueue(message);
      }
    });
    // Silently ignore all errors - we don't know what to do with them.
    this._socket.on('error', () => {});
    this.onmessage = null;
    this.onclose = null;
  }

  /**
   * @param {string} message
   */
  send(message) {
    this._socket.write(Buffer.byteLength(message) + ':' + message);
  }

  close() {
    this._socket.destroy();
  }
}

// We want to dispatch all "message" events in separate tasks
// to make sure all message-related promises are resolved first
// before dispatching next message.
//
// We cannot just use setTimeout() in Node.js here like we would
// do in Browser - see https://github.com/nodejs/node/issues/23773
// Thus implement a dispatch queue that enforces new tasks manually.
/**
 * @internal
 */
class DispatchQueue {
  constructor(transport) {
    this._transport = transport;

    this._timeoutId = null;
    this._queue = [];
    this._dispatch = this._dispatch.bind(this);
  }

  enqueue(message) {
    this._queue.push(message);
    if (!this._timeoutId)
      this._timeoutId = setTimeout(this._dispatch, 0);
  }

  _dispatch() {
    const message = this._queue.shift();
    if (this._queue.length)
      this._timeoutId = setTimeout(this._dispatch, 0)
    else
      this._timeoutId = null;

    if (this._transport.onmessage)
      this._transport.onmessage.call(null, message);
  }
}

module.exports = FirefoxTransport;
