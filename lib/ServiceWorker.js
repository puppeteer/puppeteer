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

const {helper, assert} = require('./helper');
const {NetworkManager} = require('./NetworkManager');
const EventEmitter = require('events');

class ServiceWorker extends EventEmitter {
  /**
   * @param {!Puppeteer.CDPSession} client
   * @param {!Puppeteer.Target} target
   * @return {!Promise<!ServiceWorker>}
   */
  static async create(client, target) {
    const serviceWorker = new ServiceWorker(client, target);

    await Promise.all([
      client.send('Target.setAutoAttach', {autoAttach: true, waitForDebuggerOnStart: true}),
    ]);

    return serviceWorker;
  }

  /**
   * @param {!Puppeteer.CDPSession} client
   * @param {!Puppeteer.Target} target
   */
  constructor(client, target) {
    super();
    this._closed = false;
    this._client = client;
    this._target = target;

    /** @type {!Map<!string, !Puppeteer.Page>} */
    this._pages = new Map();
    this._networkManager = null;
    this._initializedPromise = new Promise(fulfill => {
      client.once('Target.attachedToTarget', async event => {
        assert(event.targetInfo.type === 'worker', 'First attaching target should be the inner worker.');
        const session = client._createSession(event.targetInfo.type, event.sessionId);
        await session.send('Network.enable', {});
        this._networkManager = new NetworkManager(session);

        this._networkManager.on(NetworkManager.Events.Request, event => this.emit(ServiceWorker.Events.Request, event));
        this._networkManager.on(NetworkManager.Events.Response, event => this.emit(ServiceWorker.Events.Response, event));
        this._networkManager.on(NetworkManager.Events.RequestFailed, event => this.emit(ServiceWorker.Events.RequestFailed, event));
        this._networkManager.on(NetworkManager.Events.RequestFinished, event => this.emit(ServiceWorker.Events.RequestFinished, event));

        await session.send('Runtime.runIfWaitingForDebugger', {});
        fulfill();
      });
    });
  }

  /**
   * @return {!Puppeteer.Target}
   */
  target() {
    return this._target;
  }

  /**
   * @return {!Puppeteer.Browser}
   */
  browser() {
    return this._target.browser();
  }

  /**
   * @return {!string}
   */
  url() {
    return this._target.url();
  }

  /**
   * @return {!Array<!Puppeteer.Page>}
   */
  pages() {
    return Array.from(this._pages.values());
  }
}

ServiceWorker.Events = {
  Request: 'request',
  Response: 'response',
  RequestFailed: 'requestfailed',
  RequestFinished: 'requestfinished',
  PageCreated: 'pagecreated',
  PageDestroyed: 'pagedestroyed',
};

helper.tracePublicAPI(ServiceWorker);

module.exports = {ServiceWorker};
