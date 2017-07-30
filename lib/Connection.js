/**
 * Copyright 2017 Google Inc. All rights reserved.
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
let debug = require('debug')('puppeteer:protocol');

let EventEmitter = require('events');
let WebSocket = require('ws');
let http = require('http');
const COMMAND_TIMEOUT = 10000;

class Connection extends EventEmitter {
  /**
   * @param {number} port
   * @param {string} targetId
   * @param {!WebSocket} ws
   */
  constructor(port, targetId, ws) {
    super();
    this._port = port;
    this._targetId = targetId;
    this._lastId = 0;
    /** @type {!Map<number, {resolve: function, reject: function, method: string}>}*/
    this._callbacks = new Map();

    this._ws = ws;
    this._ws.on('message', this._onMessage.bind(this));
    this._ws.on('close', this._onClose.bind(this));
  }

  /**
   * @return {string}
   */
  targetId() {
    return this._targetId;
  }

  /**
   * @param {string} method
   * @param {!Object=} params
   * @return {!Promise<?Object>}
   */
  send(method, params = {}) {
    let id = ++this._lastId;
    let message = JSON.stringify({id, method, params});
    debug('SEND ► ' + message);
    this._ws.send(message);
    return new Promise((resolve, reject) => {
      this._callbacks.set(id, {resolve, reject, method});
    });
  }

  /**
   * @param {string} message
   */
  _onMessage(message) {
    debug('◀ RECV ' + message);
    let object = JSON.parse(message);
    if (object.id && this._callbacks.has(object.id)) {
      let callback = this._callbacks.get(object.id);
      this._callbacks.delete(object.id);
      if (object.error)
        callback.reject(new Error(`Protocol error (${callback.method}): ${object.error.message} ${object.error.data}`));
      else
        callback.resolve(object.result);
    } else {
      console.assert(!object.id);
      this.emit(object.method, object.params);
    }
  }

  _onClose() {
    this._ws.removeAllListeners();
    this._ws.close();
    for (let callback of this._callbacks.values())
      callback.reject(new Error(`Protocol error (${callback.method}): Target closed.`));
  }

  /**
   * @return {!Promise}
   */
  async dispose() {
    await runJsonCommand(this._port, `close/${this._targetId}`);
  }

  /**
   * @param {number} port
   * @return {!Promise<!Connection>}
   */
  static async create(port) {
    let newTab = await runJsonCommand(port, 'new');
    let url = newTab.webSocketDebuggerUrl;

    return new Promise((resolve, reject) => {
      let ws = new WebSocket(url, { perMessageDeflate: false });
      ws.on('open', () => resolve(new Connection(port, newTab.id, ws)));
      ws.on('error', reject);
    });
  }

  /**
   * @param {number} port
   * @return {!Promise<!Object>}
   */
  static version(port) {
    return runJsonCommand(port, 'version');
  }
}

/**
 * @param {number} port
 * @param {string} command
 * @return {!Promise<!Object>}
 */
function runJsonCommand(port, command) {
  let request = http.get({
    hostname: 'localhost',
    port: port,
    path: '/json/' + command
  }, onResponse);
  request.setTimeout(COMMAND_TIMEOUT, onTimeout);
  let resolve, reject;
  return new Promise((res, rej) => { resolve = res; reject = rej; });

  function onResponse(response) {
    let data = '';
    response.on('data', chunk => data += chunk);
    response.on('end', () => {
      if (response.statusCode !== 200) {
        reject(new Error(`Protocol JSON API error (${command}), status: ${response.statusCode}`));
        return;
      }
      // In the case of 'close' & 'activate' Chromium returns a string rather than JSON: goo.gl/7v27xD
      if (data === 'Target is closing' || data === 'Target activated') {
        resolve({message: data});
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
  }

  function onTimeout() {
    request.abort();
    // Reject on error with code specifically indicating timeout in connection setup.
    reject(new Error('Timeout waiting for initial Debugger Protocol connection.'));
  }
}

module.exports = Connection;
