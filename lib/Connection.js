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
const {helper} = require('./helper');
const debugProtocol = require('debug')('puppeteer:protocol');
const debugSession = require('debug')('puppeteer:session');

const EventEmitter = require('events');
const WebSocket = require('ws');
const Pipe = require('./Pipe');

class Connection extends EventEmitter {
  /**
   * @param {string} url
   * @param {number=} delay
   * @return {!Promise<!Connection>}
   */
  static async createForWebSocket(url, delay = 0) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url, { perMessageDeflate: false });
      ws.on('open', () => resolve(new Connection(url, ws, delay)));
      ws.on('error', reject);
    });
  }

  /**
   * @param {!NodeJS.WritableStream} pipeWrite
   * @param {!NodeJS.ReadableStream} pipeRead
   * @param {number=} delay
   * @return {!Connection}
   */
  static createForPipe(pipeWrite, pipeRead, delay = 0) {
    return new Connection('', new Pipe(pipeWrite, pipeRead), delay);
  }

  /**
   * @param {string} url
   * @param {!Puppeteer.ConnectionTransport} transport
   * @param {number=} delay
   */
  constructor(url, transport, delay = 0) {
    super();
    this._url = url;
    this._lastId = 0;
    /** @type {!Map<number, {resolve: function, reject: function, error: !Error, method: string}>}*/
    this._callbacks = new Map();
    this._delay = delay;

    this._transport = transport;
    this._transport.on('message', this._onMessage.bind(this));
    this._transport.on('close', this._onClose.bind(this));
    /** @type {!Map<string, !CDPSession>}*/
    this._sessions = new Map();
  }

  /**
   * @return {string}
   */
  url() {
    return this._url;
  }

  /**
   * @param {string} method
   * @param {!Object=} params
   * @return {!Promise<?Object>}
   */
  send(method, params = {}) {
    const id = ++this._lastId;
    const message = JSON.stringify({id, method, params});
    debugProtocol('SEND ► ' + message);
    this._transport.send(message);
    return new Promise((resolve, reject) => {
      this._callbacks.set(id, {resolve, reject, error: new Error(), method});
    });
  }

  /**
   * @param {function()} callback
   */
  setClosedCallback(callback) {
    this._closeCallback = callback;
  }

  /**
   * @param {string} message
   */
  async _onMessage(message) {
    if (this._delay)
      await new Promise(f => setTimeout(f, this._delay));
    debugProtocol('◀ RECV ' + message);
    const object = JSON.parse(message);
    if (object.id) {
      const callback = this._callbacks.get(object.id);
      // Callbacks could be all rejected if someone has called `.dispose()`.
      if (callback) {
        this._callbacks.delete(object.id);
        if (object.error)
          callback.reject(rewriteError(callback.error, `Protocol error (${callback.method}): ${object.error.message} ${object.error.data}`));
        else
          callback.resolve(object.result);
      }
    } else {
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
    if (this._closeCallback) {
      this._closeCallback();
      this._closeCallback = null;
    }
    this._transport.removeAllListeners();
    // If transport throws any error at this point of time, we don't care and should swallow it.
    this._transport.on('error', () => {});
    for (const callback of this._callbacks.values())
      callback.reject(rewriteError(callback.error, `Protocol error (${callback.method}): Target closed.`));
    this._callbacks.clear();
    for (const session of this._sessions.values())
      session._onClosed();
    this._sessions.clear();
  }

  dispose() {
    this._onClose();
    this._transport.close();
  }

  /**
   * @param {string} targetId
   * @return {!Promise<!CDPSession>}
   */
  async createSession(targetId) {
    const {sessionId} = await this.send('Target.attachToTarget', {targetId});
    const session = new CDPSession(this, targetId, sessionId);
    this._sessions.set(sessionId, session);
    return session;
  }
}

class CDPSession extends EventEmitter {
  /**
   * @param {!Connection} connection
   * @param {string} targetId
   * @param {string} sessionId
   */
  constructor(connection, targetId, sessionId) {
    super();
    this._lastId = 0;
    /** @type {!Map<number, {resolve: function, reject: function, error: !Error, method: string}>}*/
    this._callbacks = new Map();
    this._connection = connection;
    this._targetId = targetId;
    this._sessionId = sessionId;
  }

  /**
   * @param {string} method
   * @param {!Object=} params
   * @return {!Promise<?Object>}
   */
  send(method, params = {}) {
    if (!this._connection)
      return Promise.reject(new Error(`Protocol error (${method}): Session closed. Most likely the page has been closed.`));
    const id = ++this._lastId;
    const message = JSON.stringify({id, method, params});
    debugSession('SEND ► ' + message);
    this._connection.send('Target.sendMessageToTarget', {sessionId: this._sessionId, message}).catch(e => {
      // The response from target might have been already dispatched.
      if (!this._callbacks.has(id))
        return;
      const callback = this._callbacks.get(id);
      this._callbacks.delete(id);
      callback.reject(rewriteError(callback.error, e && e.message));
    });
    return new Promise((resolve, reject) => {
      this._callbacks.set(id, {resolve, reject, error: new Error(), method});
    });
  }

  /**
   * @param {string} message
   */
  _onMessage(message) {
    debugSession('◀ RECV ' + message);
    const object = JSON.parse(message);
    if (object.id && this._callbacks.has(object.id)) {
      const callback = this._callbacks.get(object.id);
      this._callbacks.delete(object.id);
      if (object.error)
        callback.reject(rewriteError(callback.error, `Protocol error (${callback.method}): ${object.error.message} ${object.error.data}`));
      else
        callback.resolve(object.result);
    } else {
      console.assert(!object.id);
      this.emit(object.method, object.params);
    }
  }

  async detach() {
    await this._connection.send('Target.detachFromTarget',  {sessionId: this._sessionId});
  }

  _onClosed() {
    for (const callback of this._callbacks.values())
      callback.reject(rewriteError(callback.error, `Protocol error (${callback.method}): Target closed.`));
    this._callbacks.clear();
    this._connection = null;
  }
}
helper.tracePublicAPI(CDPSession);

/**
 * @param {!Error} error
 * @param {string} message
 * @return {!Error}
 */
function rewriteError(error, message) {
  error.message = message;
  return error;
}

module.exports = {Connection, CDPSession};
