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
const {parse} = require('url');
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

class ServiceWorkerManager extends EventEmitter {
  /**
   * @param {!Puppeteer.CDPSession} client
   * @param {!Puppeteer.Page} page
   */
  constructor(client, page) {
    super();
    this._client = client;
    this._page = page;
    /** @type {!Map<string, !ServiceWorkerRegistration>} */
    this._registrationIdToRegistration = new Map();

    client.on('ServiceWorker.workerRegistrationUpdated', this._onWorkerRegistrationUpdated.bind(this));
    client.on('ServiceWorker.workerVersionUpdated', this._onWorkerVersionUpdated.bind(this));
  }

  /**
   * @param {!Protocol.ServiceWorker.workerRegistrationUpdatedPayload} event
   */
  _onWorkerRegistrationUpdated(event) {
    for (const payload of event.registrations) {
      let registration = this._registrationIdToRegistration.get(payload.registrationId);
      if (payload.isDeleted) {
        if (!registration)
          return;

        this.emit(ServiceWorkerManager.Events.RegistrationDeleted, registration);
        this._registrationIdToRegistration.delete(payload.registrationId);
        return;
      }

      if (!registration) {
        registration = new ServiceWorkerRegistration(this._client, this._page, payload);
        this._registrationIdToRegistration.set(payload.registrationId, registration);
        this.emit(ServiceWorkerManager.Events.RegistrationCreated, registration);
        return;
      }

      registration._registration = payload;
    }
  }

  /**
   * @param {!Protocol.ServiceWorker.workerVersionUpdatedPayload} event
   */
  _onWorkerVersionUpdated(event) {
    for (const version of event.versions) {
      const registration = this._registrationIdToRegistration.get(version.registrationId);
      if (!registration)
        return;

      const status = registration.status();
      registration._version = version;

      if (registration.status() !== status)
        this.emit(ServiceWorkerManager.Events.StatusChanged, registration);
    }
  }
}

ServiceWorkerManager.Events = {
  RegistrationCreated: 'registrationcreated',
  RegistrationDeleted: 'registrationdeleted',
  StatusChanged: 'statuschanged',
};

class ServiceWorkerRegistration {
  /**
   * @param {!Puppeteer.CDPSession} client
   * @param {!Puppeteer.Page} page
   * @param {!Protocol.ServiceWorker.ServiceWorkerRegistration} registration
   */
  constructor(client, page, registration) {
    this._client = client;
    this._page = page;
    this._registration = registration;
    /** @type {?Protocol.ServiceWorker.ServiceWorkerVersion} */
    this._version = null;

    const url = parse(page.url());
    this._origin = url.protocol + '//' + url.host;
  }

  async skipWaiting() {
    await this._client.send('ServiceWorker.skipWaiting', {scopeURL: this._registration.scopeURL});
  }

  /**
   * @param {string} tag
   * @param {boolean} lastChance
   */
  async sync(tag, lastChance = false) {
    await this._client.send('ServiceWorker.dispatchSyncEvent', {
      tag,
      lastChance,
      origin: this._origin,
      registrationId: this._registration.registrationId,
    });
  }

  /**
   * @param {string} data
   */
  async push(data) {
    await this._client.send('ServiceWorker.deliverPushMessage', {
      data,
      origin: this._origin,
      registrationId: this._registration.registrationId,
    });
  }

  /**
   * @returns {string}
   */
  scope() {
    return this._registration.scopeURL;
  }

  /**
   * @returns {?Protocol.ServiceWorker.ServiceWorkerVersionStatus}
   */
  status() {
    return this._version ? this._version.status : null;
  }

  /**
   * @returns {?Protocol.ServiceWorker.ServiceWorkerVersionRunningStatus}
   */
  runningStatus() {
    return this._version ? this._version.runningStatus : null;
  }

  /**
   * @returns {!Puppeteer.Page}
   */
  page() {
    return this._page;
  }

  /**
   * @returns {?Puppeteer.Target}
   */
  target() {
    if (this._version && this._version.targetId)
      return this._page.browser()._targets.get(this._version.targetId);

    return null;
  }

  /**
   * @returns {!Promise<?ServiceWorker>}
   */
  async serviceWorker() {
    const target = this.target();
    if (target)
      return target.serviceWorker();

    return null;
  }
}

helper.tracePublicAPI(ServiceWorker);
helper.tracePublicAPI(ServiceWorkerRegistration);

module.exports = {ServiceWorker, ServiceWorkerManager, ServiceWorkerRegistration};
