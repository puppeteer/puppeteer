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
const debugProtocol = require('debug')('puppeteer:protocol');
const debugSession = require('debug')('puppeteer:session');

const EventEmitter = require('events');
const WebSocket = require('ws');

class Connection extends EventEmitter {
  /**
   * @param {number} port
   * @param {!WebSocket} ws
   * @param {number=} delay
   */
  constructor(ws, delay) {
    super();
    this._lastId = 0;
    /** @type {!Map<number, {resolve: function, reject: function, method: string}>}*/
    this._callbacks = new Map();
    this._delay = delay || 0;

    this._ws = ws;
    this._ws.on('message', this._onMessage.bind(this));
    this._ws.on('close', this._onClose.bind(this));
    /** @type {!Map<string, !Session>}*/
    this._sessions = new Map();
  }

  /**
   * @param {string} method
   * @param {!Object=} params
   * @return {!Promise<?Object>}
   */
  send(method, params = {}) {
    let id = ++this._lastId;
    let message = JSON.stringify({id, method, params});
    debugProtocol('SEND ► ' + message);
    this._ws.send(message);
    return new Promise((resolve, reject) => {
      this._callbacks.set(id, {resolve, reject, method});
    });
  }

  /**
   * @param {string} message
   */
  async _onMessage(message) {
    if (this._delay)
      await new Promise(f => setTimeout(f, this._delay));
    debugProtocol('◀ RECV ' + message);
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
      if (object.method === 'Target.receivedMessageFromTarget') {
        const session = this._sessions.get(object.params.sessionId);
        if (session)
          session._onMessage(object.params.message);
      } else if (object.method === 'Target.detachedFromTarget') {
        const session = this._sessions.get(object.params.sessionId);
        if (session)
          session._onClosed();
        this._sessions.delete(object.params.sessionId);
      } else {
        this.emit(object.method, object.params);
      }
    }
  }

  _onClose() {
    this._ws.removeAllListeners();
    for (let callback of this._callbacks.values())
      callback.reject(new Error(`Protocol error (${callback.method}): Target closed.`));
    this._callbacks.clear();
    for (let session of this._sessions.values())
      session._onClosed();
    this._sessions.clear();
  }

  /**
   * @return {!Promise}
   */
  dispose() {
    this._onClose();
    this._ws.close();
  }

  /**
   * @param {string} targetId
   * @return {!Promise<!Session>}
   */
  async createSession(targetId) {
    const {sessionId} = await this.send('Target.attachToTarget', {targetId});
    const session = new Session(this, targetId, sessionId);
    this._sessions.set(sessionId, session);
    return session;
  }

  /**
   * @param {number} port
   * @param {number=} delay
   * @return {!Promise<!Connection>}
   */
  static async create(port, targetId, delay) {
    const url = `ws://localhost:${port}${targetId}`;
    return new Promise((resolve, reject) => {
      let ws = new WebSocket(url, { perMessageDeflate: false });
      ws.on('open', () => resolve(new Connection(ws, delay)));
      ws.on('error', reject);
    });
  }
}

class Session extends EventEmitter {
  /**
   * @param {!Connection} connection
   * @param {string} targetId
   * @param {string} sessionId
   */
  constructor(connection, targetId, sessionId) {
    super();
    this._lastId = 0;
    /** @type {!Map<number, {resolve: function, reject: function, method: string}>}*/
    this._callbacks = new Map();
    this._connection = connection;
    this._targetId = targetId;
    this._sessionId = sessionId;
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
    debugSession('SEND ► ' + message);
    this._connection.send('Target.sendMessageToTarget', {sessionId: this._sessionId, message}).catch(e => {
      // The response from target might have been already dispatched.
      if (!this._callbacks.has(id))
        return;
      let callback = this._callbacks.get(id);
      this._callbacks.delete(object.id);
      callback.reject(e);
    });
    return new Promise((resolve, reject) => {
      this._callbacks.set(id, {resolve, reject, method});
    });
  }

  /**
   * @param {string} message
   */
  _onMessage(message) {
    debugSession('◀ RECV ' + message);
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

  /**
   * @return {!Promise}
   */
  async dispose() {
    await this._connection.send('Target.closeTarget', {targetId: this._targetId});
  }

  _onClosed() {
    for (let callback of this._callbacks.values())
      callback.reject(new Error(`Protocol error (${callback.method}): Target closed.`));
    this._callbacks.clear();
  }
}

module.exports = Connection;
