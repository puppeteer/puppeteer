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

    client.on('Target.attachedToTarget', async event => {
      assert(event.targetInfo.type === 'worker', 'First attaching target should be the inner worker.');
      const session = client._createSession(event.targetInfo.type, event.sessionId);
      await this._attach(session);
    });
  }

  /**
   * @param {!Puppeteer.CDPSession} session
   * @returns {!Promise}
   */
  async _attach(session) {
    await session.send('Network.enable', {});
    const networkManager = new NetworkManager(session);

    networkManager.on(NetworkManager.Events.Request, event => this.emit(ServiceWorker.Events.Request, event));
    networkManager.on(NetworkManager.Events.Response, event => this.emit(ServiceWorker.Events.Response, event));
    networkManager.on(NetworkManager.Events.RequestFailed, event => this.emit(ServiceWorker.Events.RequestFailed, event));
    networkManager.on(NetworkManager.Events.RequestFinished, event => this.emit(ServiceWorker.Events.RequestFinished, event));

    await session.send('Runtime.runIfWaitingForDebugger', {});
  }

  async detach() {
    await this._client.detach();
    this.emit(ServiceWorker.Events.Detached, this);
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
  Detached: 'detached',
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
   * @returns {!Array<!ServiceWorkerRegistration>}
   */
  registrations() {
    return Array.from(this._registrationIdToRegistration.values());
  }

  /**
   * @param {!Protocol.ServiceWorker.workerRegistrationUpdatedPayload} event
   */
  _onWorkerRegistrationUpdated(event) {
    for (const payload of event.registrations) {
      const registration = this._registrationIdToRegistration.get(payload.registrationId);
      if (payload.isDeleted) {
        if (!registration)
          return;

        this.emit(ServiceWorkerManager.Events.Unregistered, registration);
        this._registrationIdToRegistration.delete(payload.registrationId);
        return;
      }

      if (!registration) {
        const registration = new ServiceWorkerRegistration(this._client, this._page, payload);
        this._registrationIdToRegistration.set(payload.registrationId, registration);
        this.emit(ServiceWorkerManager.Events.Registered, registration);
        return;
      }

      registration._registration = payload;
    }
  }

  /**
   * @param {!Protocol.ServiceWorker.workerVersionUpdatedPayload} event
   */
  async _onWorkerVersionUpdated(event) {
    for (const version of event.versions) {
      const registration = this._registrationIdToRegistration.get(version.registrationId);
      if (!registration)
        return;

      const oldVersion = registration._versions.get(version.versionId);
      registration._versions.set(version.versionId, version);

      if (this._statusToState(version.status) !== this._statusToState(oldVersion && oldVersion.status)) {
        switch (this._statusToState(version.status)) {
          case 'installing':
            this.emit(ServiceWorkerManager.Events.Installing, await registration.installing());
            return;
          case 'waiting':
            this.emit(ServiceWorkerManager.Events.Waiting, await registration.waiting());
            return;
          case 'active':
            this.emit(ServiceWorkerManager.Events.Active, await registration.active());
          case 'redundant':
            const serviceWorker = await registration._findServiceWorker(other => other.versionId === version.versionId);
            // If we don't detach from service workers, they will never die.
            await serviceWorker.detach();
            this.emit(ServiceWorkerManager.Events.Redundant, serviceWorker);
        }
      }
    }
  }

  /**
   * @param {!string} status
   * @returns {!string}
   */
  _statusToState(status) {
    switch (status) {
      case 'installing':
        return 'installing';
      case 'installed':
        return 'waiting';
      case 'activating':
      case 'activated':
        return 'active';
      case 'redundant':
        return 'redundant';
      default:
        return 'new';
    }
  }
}

ServiceWorkerManager.Events = {
  Registered: 'registered',
  Unregistered: 'unregistered',
  Installing: 'installing',
  Waiting: 'waiting',
  Active: 'active',
  Redundant: 'redundant',
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
    /** @type {!Map<!string, !Protocol.ServiceWorker.ServiceWorkerVersion>} */
    this._versions = new Map();

    const url = parse(page.url());
    this._origin = url.protocol + '//' + url.host;
  }

  async skipWaiting() {
    await this._client.send('ServiceWorker.skipWaiting', {scopeURL: this._registration.scopeURL});
  }

  async unregister() {
    await this._client.send('ServiceWorker.unregister', {scopeURL: this._registration.scopeURL});
  }

  /**
   * @param {!string} tag
   * @param {!boolean=} lastChance
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
   * @param {!string} data
   */
  async push(data) {
    await this._client.send('ServiceWorker.deliverPushMessage', {
      data,
      origin: this._origin,
      registrationId: this._registration.registrationId,
    });
  }

  /**
   * @returns {!Promise<?ServiceWorker>}
   */
  installing() {
    return this._findServiceWorker(version => version.status === 'installing');
  }

  /**
   * @returns {!Promise<?ServiceWorker>}
   */
  waiting() {
    return this._findServiceWorker(version => version.status === 'installed');
  }

  /**
   * @returns {!Promise<?ServiceWorker>}
   */
  active() {
    return this._findServiceWorker(version => version.status === 'activating' || version.status === 'activated');
  }

  /**
   * @param {!function(!Protocol.ServiceWorker.ServiceWorkerVersion): !boolean} predicate
   * @returns {!Promise<?ServiceWorker>}
   */
  async _findServiceWorker(predicate) {
    const version = Array.from(this._versions.values())
        .filter(version => version.targetId)
        .find(predicate);

    if (!version)
      return null;

    const target = await this._page._target._browserContext.waitForTarget(target => target._targetId === version.targetId);
    return target.serviceWorker();
  }

  /**
   * @returns {string}
   */
  scope() {
    return this._registration.scopeURL;
  }

  /**
   * @returns {!Puppeteer.Page}
   */
  page() {
    return this._page;
  }
}

helper.tracePublicAPI(ServiceWorker);
helper.tracePublicAPI(ServiceWorkerRegistration);

module.exports = {ServiceWorker, ServiceWorkerManager, ServiceWorkerRegistration};
