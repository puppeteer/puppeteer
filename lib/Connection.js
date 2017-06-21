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

var EventEmitter = require('events');
var WebSocket = require('ws');
var http = require('http');
const COMMAND_TIMEOUT = 10000;

class Connection extends EventEmitter {
  /**
   * @param {number} port
   * @param {string} pageId
   * @param {!WebSocket} ws
   */
  constructor(port, pageId, ws) {
    super();
    this._port = port;
    this._pageId = pageId;
    this._lastId = 0;
    /** @type {!Map<number, {resolve: function(*), reject: function(*), method: string}>}*/
    this._callbacks = new Map();

    this._ws = ws;
    this._ws.on('message', this._onMessage.bind(this));
    this._ws.on('close', this._onClose.bind(this));
  }

  /**
   * @param {string} method
   * @param {(!Object|undefined)} params
   * @return {!Promise<?Object>}
   */
  send(method, params = {}) {
    var id = ++this._lastId;
    var message = JSON.stringify({id, method, params});
    this._ws.send(message);
    return new Promise((resolve, reject) => {
      this._callbacks.set(id, {resolve, reject, method});
    });
  }

  /**
   * @param {string} message
   */
  _onMessage(message) {
    var object = JSON.parse(message);
    if (object.id && this._callbacks.has(object.id)) {
      var callback = this._callbacks.get(object.id);
      this._callbacks.delete(object.id);
      if (object.error)
        callback.reject(new Error(`Protocol error (${callback.method}): ${object.error.message}`));
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
  }

  /**
   * @return {!Promise}
   */
  async dispose() {
    await runJsonCommand(this._port, `close/${this._pageId}`);
  }

  /**
   * @param {number} port
   * @return {!Promise<!Connection>}
   */
  static async create(port) {
    var newTab = await runJsonCommand(port, 'new');
    var url = newTab.webSocketDebuggerUrl;

    return new Promise((resolve, reject) => {
      var ws = new WebSocket(url, { perMessageDeflate: false });
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
  var request = http.get({
    hostname: 'localhost',
    port: port,
    path: '/json/' + command
  }, onResponse);
  request.setTimeout(COMMAND_TIMEOUT, onTimeout);
  var resolve, reject;
  return new Promise((res, rej) => { resolve = res; reject = rej; });

  function onResponse(response) {
    var data = '';
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
