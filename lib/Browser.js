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
const Page = require('./Page');
const EventEmitter = require('events');

class Browser extends EventEmitter {
  /**
   * @param {!Puppeteer.Connection} connection
   * @param {!Object=} options
   * @param {(function():Promise)=} closeCallback
   */
  constructor(connection, options = {}, closeCallback) {
    super();
    this._ignoreHTTPSErrors = !!options.ignoreHTTPSErrors;
    this._appMode = !!options.appMode;
    this._screenshotTaskQueue = new TaskQueue();
    this._connection = connection;
    this._closeCallback = closeCallback || new Function();
    /** @type {Map<string, Target>} */
    this._targets = new Map();
    this._connection.on('Target.targetCreated', this._targetCreated.bind(this));
    this._connection.on('Target.targetDestroyed', this._targetDestroyed.bind(this));
    this._connection.on('Target.targetInfoChanged', this._targetInfoChanged.bind(this));
  }

  /**
   * @param {!Puppeteer.Connection} connection
   * @param {boolean} ignoreHTTPSErrors
   * @param {function()=} closeCallback
   */
  static async create(connection, ignoreHTTPSErrors, closeCallback) {
    const browser =  new Browser(connection, ignoreHTTPSErrors, closeCallback);
    await connection.send('Target.setDiscoverTargets', {discover: true});
    return browser;
  }

  /**
   * @param {{targetInfo: Target.TargetInfo}} event
   */
  _targetCreated(event) {
    this._ensureTargetForInfo(event.targetInfo)._mightHaveBeenCreated();
  }

  /**
   * @param {{targetId: string}} event
   */
  _targetDestroyed(event) {
    const target = this._targets.get(event.targetId);
    this._targets.delete(event.targetId);
    if (target._wasCreated)
      this.emit(Browser.Events.TargetDestroyed, target);
  }

  /**
   * @param {{targetInfo: Target.TargetInfo}} event
   */
  _targetInfoChanged(event) {
    const target = this._ensureTargetForInfo(event.targetInfo);
    const previousURL = target._targetInfo.url;
    target._targetInfo = event.targetInfo;
    if (target._mightHaveBeenCreated())
      return;
    if (previousURL !== event.targetInfo.url)
      this.emit(Browser.Events.TargetChanged, target);
  }

  /**
   * @param {!Target.TargetInfo} targetInfo
   * @return {?Target}
   */
  _ensureTargetForInfo(targetInfo) {
    if (!this._targets.has(targetInfo.targetId)) {
      const target = new Target(this, targetInfo);
      this._targets.set(targetInfo.targetId, target);
    }
    return this._targets.get(targetInfo.targetId);
  }

  /**
   * @return {string}
   */
  wsEndpoint() {
    return this._connection.url();
  }

  /**
   * @return {!Promise<!Page>}
   */
  async newPage() {
    const {targetId} = await this._connection.send('Target.createTarget', {url: 'about:blank'});
    const {targetInfo} = await this._connection.send('Target.getTargetInfo', {targetId});
    const page = await this._ensureTargetForInfo(targetInfo).page();
    await page.goto('about:blank');
    return page;
  }

  /**
   * @return {!Array<!Target>}
   */
  targets() {
    return Array.from(this._targets.values()).filter(target => target._wasCreated);
  }

  /**
   * @return {!Promise<!Array<!Page>>}
   */
  async pages() {
    const pages = await Promise.all(this.targets().map(target => target.page()));
    return pages.filter(page => !!page);
  }

  /**
   * @return {!Promise<string>}
   */
  async version() {
    const version = await this._connection.send('Browser.getVersion');
    return version.product;
  }

  async close() {
    await this._closeCallback.call(null);
    this.disconnect();
  }

  disconnect() {
    this._connection.dispose();
  }
}

/** @enum {string} */
Browser.Events = {
  TargetCreated: 'targetcreated',
  TargetDestroyed: 'targetdestroyed',
  TargetChanged: 'targetchanged'
};

helper.tracePublicAPI(Browser);

class TaskQueue {
  constructor() {
    this._chain = Promise.resolve();
  }

  /**
   * @param {function()} task
   * @return {!Promise}
   */
  postTask(task) {
    const result = this._chain.then(task);
    this._chain = result.catch(() => {});
    return result;
  }
}

class Target {
  /**
   * @param {Browser} browser
   * @param {!Target.TargetInfo} targetInfo
   */
  constructor(browser, targetInfo) {
    this._browser = browser;
    this._targetInfo = targetInfo;
    /** @type {?Promise<!Page>} */
    this._pagePromise = null;
  }

  /**
   * @return {Promise<?Page>}
   */
  async page() {
    if (this._targetInfo.type === 'page' && !this._pagePromise) {
      this._pagePromise = this._browser._connection.createSession(this._targetInfo.targetId)
          .then(client => Page.create(client, this._browser._ignoreHTTPSErrors, this._browser._appMode, this._browser._screenshotTaskQueue));
    }
    return this._pagePromise;
  }

  /**
   * @return {string}
   */
  url() {
    return this._targetInfo.url;
  }

  /**
   * @return {"page"|"service_worker"|"other"}
   */
  type() {
    const type = this._targetInfo.type;
    if (type === 'page' || type === 'service_worker')
      return type;
    return 'other';
  }

  /**
   * @return {boolean}
   */
  _mightHaveBeenCreated() {
    if (this._wasCreated)
      return false;
    // Don't work with pages that aren't fully initialized
    if (this._targetInfo.type === 'page' && this._targetInfo.url === '')
      return false;
    this._wasCreated = true;
    this._browser.emit(Browser.Events.TargetCreated, this);
    return true;
  }
}
helper.tracePublicAPI(Target);

/**
 * @typedef {Object} Target.TargetInfo
 * @property {string} type
 * @property {string} targetId
 * @property {string} title
 * @property {string} url
 * @property {boolean} attached
 */

module.exports = { Browser, TaskQueue };
