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
const WebSocket = require('ws');

/**
 * @implements {!Puppeteer.ConnectionTransport}
 */
class WebSocketTransport {
  /**
   * @param {string} url
   * @return {!Promise<!WebSocketTransport>}
   */
  static create(url) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url, [], { perMessageDeflate: false });
      ws.addEventListener('open', () => resolve(new WebSocketTransport(ws)));
      ws.addEventListener('error', reject);
    });
  }

  /**
   * @param {!WebSocket} ws
   */
  constructor(ws) {
    this._ws = ws;
    this._dispatchQueue = new DispatchQueue(this);
    this._ws.addEventListener('message', event => {
      this._dispatchQueue.enqueue(event.data);
    });
    this._ws.addEventListener('close', event => {
      if (this.onclose)
        this.onclose.call(null);
    });
    // Silently ignore all errors - we don't know what to do with them.
    this._ws.addEventListener('error', () => {});
    this.onmessage = null;
    this.onclose = null;
  }

  /**
   * @param {string} message
   */
  send(message) {
    this._ws.send(message);
  }

  close() {
    this._ws.close();
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

module.exports = WebSocketTransport;
