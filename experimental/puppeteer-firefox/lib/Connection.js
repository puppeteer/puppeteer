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
const {assert} = require('./helper');
const {Events} = require('./Events');
const debugProtocol = require('debug')('puppeteer:protocol');
const EventEmitter = require('events');

class Connection extends EventEmitter {
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
    this._transport.onmessage = this._onMessage.bind(this);
    this._transport.onclose = this._onClose.bind(this);
    /** @type {!Map<string, !JugglerSession>}*/
    this._sessions = new Map();
    this._closed = false;
  }

  /**
   * @param {!JugglerSession} session
   * @return {!Connection}
   */
  static fromSession(session) {
    return session._connection;
  }

  /**
   * @param {string} sessionId
   * @return {?JugglerSession}
   */
  session(sessionId) {
    return this._sessions.get(sessionId) || null;
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
    const id = this._rawSend({method, params});
    return new Promise((resolve, reject) => {
      this._callbacks.set(id, {resolve, reject, error: new Error(), method});
    });
  }

  /**
   * @param {*} message
   * @return {number}
   */
  _rawSend(message) {
    const id = ++this._lastId;
    message = JSON.stringify(Object.assign({}, message, {id}));
    debugProtocol('SEND ► ' + message);
    this._transport.send(message);
    return id;
  }

  /**
   * @param {string} message
   */
  async _onMessage(message) {
    if (this._delay)
      await new Promise(f => setTimeout(f, this._delay));
    debugProtocol('◀ RECV ' + message);
    const object = JSON.parse(message);
    if (object.method === 'Target.attachedToTarget') {
      const sessionId = object.params.sessionId;
      const session = new JugglerSession(this, object.params.targetInfo.type, sessionId);
      this._sessions.set(sessionId, session);
    } else if (object.method === 'Browser.detachedFromTarget') {
      const session = this._sessions.get(object.params.sessionId);
      if (session) {
        session._onClosed();
        this._sessions.delete(object.params.sessionId);
      }
    }
    if (object.sessionId) {
      const session = this._sessions.get(object.sessionId);
      if (session)
        session._onMessage(object);
    } else if (object.id) {
      const callback = this._callbacks.get(object.id);
      // Callbacks could be all rejected if someone has called `.dispose()`.
      if (callback) {
        this._callbacks.delete(object.id);
        if (object.error)
          callback.reject(createProtocolError(callback.error, callback.method, object));
        else
          callback.resolve(object.result);
      }
    } else {
      this.emit(object.method, object.params);
    }
  }

  _onClose() {
    if (this._closed)
      return;
    this._closed = true;
    this._transport.onmessage = null;
    this._transport.onclose = null;
    for (const callback of this._callbacks.values())
      callback.reject(rewriteError(callback.error, `Protocol error (${callback.method}): Target closed.`));
    this._callbacks.clear();
    for (const session of this._sessions.values())
      session._onClosed();
    this._sessions.clear();
    this.emit(Events.Connection.Disconnected);
  }

  dispose() {
    this._onClose();
    this._transport.close();
  }

  /**
   * @param {string} targetId
   * @return {!Promise<!JugglerSession>}
   */
  async createSession(targetId) {
    const {sessionId} = await this.send('Target.attachToTarget', {targetId});
    return this._sessions.get(sessionId);
  }
}

class JugglerSession extends EventEmitter {
  /**
   * @param {!Connection} connection
   * @param {string} targetType
   * @param {string} sessionId
   */
  constructor(connection, targetType, sessionId) {
    super();
    /** @type {!Map<number, {resolve: function, reject: function, error: !Error, method: string}>}*/
    this._callbacks = new Map();
    this._connection = connection;
    this._targetType = targetType;
    this._sessionId = sessionId;
  }

  /**
   * @param {string} method
   * @param {!Object=} params
   * @return {!Promise<?Object>}
   */
  send(method, params = {}) {
    if (!this._connection)
      return Promise.reject(new Error(`Protocol error (${method}): Session closed. Most likely the ${this._targetType} has been closed.`));
    const id = this._connection._rawSend({sessionId: this._sessionId, method, params});
    return new Promise((resolve, reject) => {
      this._callbacks.set(id, {resolve, reject, error: new Error(), method});
    });
  }

  /**
   * @param {{id?: number, method: string, params: Object, error: {message: string, data: any}, result?: *}} object
   */
  _onMessage(object) {
    if (object.id && this._callbacks.has(object.id)) {
      const callback = this._callbacks.get(object.id);
      this._callbacks.delete(object.id);
      if (object.error)
        callback.reject(createProtocolError(callback.error, callback.method, object));
      else
        callback.resolve(object.result);
    } else {
      assert(!object.id);
      this.emit(object.method, object.params);
    }
  }

  async detach() {
    if (!this._connection)
      throw new Error(`Session already detached. Most likely the ${this._targetType} has been closed.`);
    await this._connection.send('Target.detachFromTarget',  {sessionId: this._sessionId});
  }

  _onClosed() {
    for (const callback of this._callbacks.values())
      callback.reject(rewriteError(callback.error, `Protocol error (${callback.method}): Target closed.`));
    this._callbacks.clear();
    this._connection = null;
    this.emit(Events.JugglerSession.Disconnected);
  }
}

/**
 * @param {!Error} error
 * @param {string} method
 * @param {{error: {message: string, data: any}}} object
 * @return {!Error}
 */
function createProtocolError(error, method, object) {
  let message = `Protocol error (${method}): ${object.error.message}`;
  if ('data' in object.error)
    message += ` ${object.error.data}`;
  return rewriteError(error, message);
}

/**
 * @param {!Error} error
 * @param {string} message
 * @return {!Error}
 */
function rewriteError(error, message) {
  error.message = message;
  return error;
}

module.exports = {Connection, JugglerSession};
