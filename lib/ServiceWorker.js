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
    /** @type {?string} */
    this._versionId = null;
    /** @type {string} */
    this._status = 'new';
    this._running = false;

    /** @type {!Map<!string, !Puppeteer.Target>} */
    this._clients = new Map();

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
   * @return {!Array<!Puppeteer.Target>}
   */
  clients() {
    return Array.from(this._clients.values());
  }

  /**
   * @return {boolean}
   */
  isRunning() {
    return this._running;
  }

  /**
   * @return {string}
   */
  status() {
    return this._status;
  }

  /**
   * @param {!Protocol.ServiceWorker.ServiceWorkerVersion} version
   */
  _updateVersionInfo(version) {
    if (this._versionId !== version.versionId)
      this._versionId = version.versionId;
    if (this._status !== this._statusToState(version.status)) {
      this._status = this._statusToState(version.status);
      if (this._status === 'installing')
        this.emit(ServiceWorker.Events.Installing, this);
      else if (this._status === 'waiting')
        this.emit(ServiceWorker.Events.Waiting, this);
      else if (this._status === 'active')
        this.emit(ServiceWorker.Events.Active, this);
      else if (this._status === 'redundant')
        this.emit(ServiceWorker.Events.Redundant, this);
    }
    if ((this._running && version.runningStatus !== 'running') || (!this._running && version.runningStatus === 'running'))
      this._running = version.runningStatus === 'running';
    for (const [targetId, client] of Array.from(this._clients)) {
      if (version.controlledClients.indexOf(targetId) < 0) {
        this.emit(ServiceWorker.Events.ClientDetached, client);
        this._clients.delete(targetId);
      }
    }
    for (const targetId of version.controlledClients) {
      if (!this._clients.has(targetId)) {
        const client = this._target.browser()._targets.get(targetId);
        this._clients.set(targetId, client);
        this.emit(ServiceWorker.Events.ClientAttached, client);
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

ServiceWorker.Events = {
  Request: 'request',
  Response: 'response',
  RequestFailed: 'requestfailed',
  RequestFinished: 'requestfinished',
  Detached: 'detached',
  Installing: 'installing',
  Waiting: 'waiting',
  Active: 'active',
  Redundant: 'redundant',
  ClientAttached: 'clientattached',
  ClientDetached: 'clientdetached',
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
  async _onWorkerRegistrationUpdated(event) {
    for (const payload of event.registrations) {
      const registration = this._registrationIdToRegistration.get(payload.registrationId);
      if (payload.isDeleted) {
        if (!registration)
          return;

        this.emit(ServiceWorkerManager.Events.Unregistered, registration);
        this._registrationIdToRegistration.delete(payload.registrationId);
        await registration._delete();
        return;
      }

      if (!registration) {
        const registration = new ServiceWorkerRegistration(this._client, this._page._target._browserContext, payload);
        registration.on(ServiceWorkerRegistration.Events.Installing, event => this.emit(ServiceWorkerManager.Events.Installing, event));
        registration.on(ServiceWorkerRegistration.Events.Waiting, event => this.emit(ServiceWorkerManager.Events.Waiting, event));
        registration.on(ServiceWorkerRegistration.Events.Active, event => this.emit(ServiceWorkerManager.Events.Active, event));
        registration.on(ServiceWorkerRegistration.Events.Redundant, event => this.emit(ServiceWorkerManager.Events.Redundant, event));
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
      if (!registration || !version.targetId)
        return;

      await registration._updateVersionInfo(version);
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

class ServiceWorkerRegistration extends EventEmitter {
  /**
   * @param {!Puppeteer.CDPSession} client
   * @param {!Puppeteer.BrowserContext} browserContext
   * @param {!Protocol.ServiceWorker.ServiceWorkerRegistration} registration
   */
  constructor(client, browserContext, registration) {
    super();
    this._client = client;
    this._browserContext = browserContext;
    this._registration = registration;
    /** @type {!Map<string, !ServiceWorker>} */
    this._targetIdToServiceWorker = new Map();
  }

  async skipWaiting() {
    await this._client.send('ServiceWorker.skipWaiting', {scopeURL: this._registration.scopeURL});
  }

  async unregister() {
    await this._client.send('ServiceWorker.unregister', {scopeURL: this._registration.scopeURL});
  }

  /**
   * @param {!string} tag
   * @param {!string} origin
   * @param {!boolean=} lastChance
   */
  async sync(tag, origin, lastChance = false) {
    await this._client.send('ServiceWorker.dispatchSyncEvent', {
      tag,
      lastChance,
      origin,
      registrationId: this._registration.registrationId,
    });
  }

  /**
   * @param {!string} data
   * @param {!string} origin
   */
  async push(data, origin) {
    await this._client.send('ServiceWorker.deliverPushMessage', {
      data,
      origin,
      registrationId: this._registration.registrationId,
    });
  }

  /**
   * @return {?ServiceWorker}
   */
  installing() {
    return this._findServiceWorker(serviceWorker => serviceWorker.status() === 'installing');
  }

  /**
   * @return {?ServiceWorker}
   */
  waiting() {
    return this._findServiceWorker(serviceWorker => serviceWorker.status() === 'waiting');
  }

  /**
   * @return {?ServiceWorker}
   */
  active() {
    return this._findServiceWorker(serviceWorker => serviceWorker.status() === 'active');
  }

  /**
   * @param {!function(!ServiceWorker): !boolean} predicate
   * @return {?ServiceWorker}
   */
  _findServiceWorker(predicate) {
    const serviceWorker = Array.from(this._targetIdToServiceWorker.values()).find(predicate);
    if (serviceWorker)
      return serviceWorker;

    return null;
  }

  /**
   * @return {string}
   */
  scope() {
    return this._registration.scopeURL;
  }

  /**
   * @return {!Puppeteer.BrowserContext}
   */
  browserContext() {
    return this._browserContext;
  }

  async _delete() {
    await Promise.all(Array.from(this._targetIdToServiceWorker.values()).map(serviceWorker => serviceWorker.detach()));
  }

  /**
   * @param {!Protocol.ServiceWorker.ServiceWorkerVersion} version
   */
  async _updateVersionInfo(version) {
    let serviceWorker = this._targetIdToServiceWorker.get(version.targetId);
    if (!serviceWorker) {
      const target = await this._browserContext.waitForTarget(target => target._targetId === version.targetId);
      serviceWorker = await target.serviceWorker();
      serviceWorker.on(ServiceWorker.Events.Installing, event => this.emit(ServiceWorkerRegistration.Events.Installing, event));
      serviceWorker.on(ServiceWorker.Events.Waiting, event => this.emit(ServiceWorkerRegistration.Events.Waiting, event));
      serviceWorker.on(ServiceWorker.Events.Active, event => this.emit(ServiceWorkerRegistration.Events.Active, event));
      serviceWorker.on(ServiceWorker.Events.Redundant, event => this.emit(ServiceWorkerRegistration.Events.Redundant, event));
      this._targetIdToServiceWorker.set(target._targetId, serviceWorker);
    }
    serviceWorker._updateVersionInfo(version);
  }
}

ServiceWorkerRegistration.Events = {
  Installing: 'installing',
  Waiting: 'waiting',
  Active: 'active',
  Redundant: 'redundant',
};

helper.tracePublicAPI(ServiceWorker);
helper.tracePublicAPI(ServiceWorkerRegistration);

module.exports = {ServiceWorker, ServiceWorkerManager, ServiceWorkerRegistration};
