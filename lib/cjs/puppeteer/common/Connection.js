"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CDPSession = exports.CDPSessionEmittedEvents = exports.Connection = exports.ConnectionEmittedEvents = void 0;
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
const assert_js_1 = require("./assert.js");
const Debug_js_1 = require("./Debug.js");
const debugProtocolSend = Debug_js_1.debug('puppeteer:protocol:SEND ►');
const debugProtocolReceive = Debug_js_1.debug('puppeteer:protocol:RECV ◀');
const EventEmitter_js_1 = require("./EventEmitter.js");
/**
 * Internal events that the Connection class emits.
 *
 * @internal
 */
exports.ConnectionEmittedEvents = {
    Disconnected: Symbol('Connection.Disconnected'),
};
/**
 * @internal
 */
class Connection extends EventEmitter_js_1.EventEmitter {
    constructor(url, transport, delay = 0) {
        super();
        this._lastId = 0;
        this._sessions = new Map();
        this._closed = false;
        this._callbacks = new Map();
        this._url = url;
        this._delay = delay;
        this._transport = transport;
        this._transport.onmessage = this._onMessage.bind(this);
        this._transport.onclose = this._onClose.bind(this);
    }
    static fromSession(session) {
        return session._connection;
    }
    /**
     * @param {string} sessionId
     * @returns {?CDPSession}
     */
    session(sessionId) {
        return this._sessions.get(sessionId) || null;
    }
    url() {
        return this._url;
    }
    send(method, ...paramArgs) {
        // There is only ever 1 param arg passed, but the Protocol defines it as an
        // array of 0 or 1 items See this comment:
        // https://github.com/ChromeDevTools/devtools-protocol/pull/113#issuecomment-412603285
        // which explains why the protocol defines the params this way for better
        // type-inference.
        // So now we check if there are any params or not and deal with them accordingly.
        const params = paramArgs.length ? paramArgs[0] : undefined;
        const id = this._rawSend({ method, params });
        return new Promise((resolve, reject) => {
            this._callbacks.set(id, { resolve, reject, error: new Error(), method });
        });
    }
    _rawSend(message) {
        const id = ++this._lastId;
        const stringifiedMessage = JSON.stringify(Object.assign({}, message, { id }));
        debugProtocolSend(stringifiedMessage);
        this._transport.send(stringifiedMessage);
        return id;
    }
    async _onMessage(message) {
        if (this._delay)
            await new Promise((f) => setTimeout(f, this._delay));
        debugProtocolReceive(message);
        const object = JSON.parse(message);
        if (object.method === 'Target.attachedToTarget') {
            const sessionId = object.params.sessionId;
            const session = new CDPSession(this, object.params.targetInfo.type, sessionId);
            this._sessions.set(sessionId, session);
        }
        else if (object.method === 'Target.detachedFromTarget') {
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
        }
        else if (object.id) {
            const callback = this._callbacks.get(object.id);
            // Callbacks could be all rejected if someone has called `.dispose()`.
            if (callback) {
                this._callbacks.delete(object.id);
                if (object.error)
                    callback.reject(createProtocolError(callback.error, callback.method, object));
                else
                    callback.resolve(object.result);
            }
        }
        else {
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
        this.emit(exports.ConnectionEmittedEvents.Disconnected);
    }
    dispose() {
        this._onClose();
        this._transport.close();
    }
    /**
     * @param {Protocol.Target.TargetInfo} targetInfo
     * @returns {!Promise<!CDPSession>}
     */
    async createSession(targetInfo) {
        const { sessionId } = await this.send('Target.attachToTarget', {
            targetId: targetInfo.targetId,
            flatten: true,
        });
        return this._sessions.get(sessionId);
    }
}
exports.Connection = Connection;
/**
 * Internal events that the CDPSession class emits.
 *
 * @internal
 */
exports.CDPSessionEmittedEvents = {
    Disconnected: Symbol('CDPSession.Disconnected'),
};
/**
 * The `CDPSession` instances are used to talk raw Chrome Devtools Protocol.
 *
 * @remarks
 *
 * Protocol methods can be called with {@link CDPSession.send} method and protocol
 * events can be subscribed to with `CDPSession.on` method.
 *
 * Useful links: {@link https://chromedevtools.github.io/devtools-protocol/ | DevTools Protocol Viewer}
 * and {@link https://github.com/aslushnikov/getting-started-with-cdp/blob/master/README.md | Getting Started with DevTools Protocol}.
 *
 * @example
 * ```js
 * const client = await page.target().createCDPSession();
 * await client.send('Animation.enable');
 * client.on('Animation.animationCreated', () => console.log('Animation created!'));
 * const response = await client.send('Animation.getPlaybackRate');
 * console.log('playback rate is ' + response.playbackRate);
 * await client.send('Animation.setPlaybackRate', {
 *   playbackRate: response.playbackRate / 2
 * });
 * ```
 *
 * @public
 */
class CDPSession extends EventEmitter_js_1.EventEmitter {
    /**
     * @internal
     */
    constructor(connection, targetType, sessionId) {
        super();
        this._callbacks = new Map();
        this._connection = connection;
        this._targetType = targetType;
        this._sessionId = sessionId;
    }
    send(method, ...paramArgs) {
        if (!this._connection)
            return Promise.reject(new Error(`Protocol error (${method}): Session closed. Most likely the ${this._targetType} has been closed.`));
        // See the comment in Connection#send explaining why we do this.
        const params = paramArgs.length ? paramArgs[0] : undefined;
        const id = this._connection._rawSend({
            sessionId: this._sessionId,
            method,
            /* TODO(jacktfranklin@): once this Firefox bug is solved
             * we no longer need the `|| {}` check
             * https://bugzilla.mozilla.org/show_bug.cgi?id=1631570
             */
            params: params || {},
        });
        return new Promise((resolve, reject) => {
            this._callbacks.set(id, { resolve, reject, error: new Error(), method });
        });
    }
    /**
     * @internal
     */
    _onMessage(object) {
        if (object.id && this._callbacks.has(object.id)) {
            const callback = this._callbacks.get(object.id);
            this._callbacks.delete(object.id);
            if (object.error)
                callback.reject(createProtocolError(callback.error, callback.method, object));
            else
                callback.resolve(object.result);
        }
        else {
            assert_js_1.assert(!object.id);
            this.emit(object.method, object.params);
        }
    }
    /**
     * Detaches the cdpSession from the target. Once detached, the cdpSession object
     * won't emit any events and can't be used to send messages.
     */
    async detach() {
        if (!this._connection)
            throw new Error(`Session already detached. Most likely the ${this._targetType} has been closed.`);
        await this._connection.send('Target.detachFromTarget', {
            sessionId: this._sessionId,
        });
    }
    /**
     * @internal
     */
    _onClosed() {
        for (const callback of this._callbacks.values())
            callback.reject(rewriteError(callback.error, `Protocol error (${callback.method}): Target closed.`));
        this._callbacks.clear();
        this._connection = null;
        this.emit(exports.CDPSessionEmittedEvents.Disconnected);
    }
}
exports.CDPSession = CDPSession;
/**
 * @param {!Error} error
 * @param {string} method
 * @param {{error: {message: string, data: any}}} object
 * @returns {!Error}
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
 * @returns {!Error}
 */
function rewriteError(error, message) {
    error.message = message;
    return error;
}
//# sourceMappingURL=Connection.js.map