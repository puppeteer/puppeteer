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
  }

  /**
   * @param {!Connection} connection
   * @param {boolean} ignoreHTTPSErrors
   * @param {function()=} closeCallback
   */
  static async create(connection, ignoreHTTPSErrors, closeCallback) {
    const browser =  new Browser(connection, ignoreHTTPSErrors, closeCallback);
    await connection.send('Target.setDiscoverTargets', {discover: true});
    return browser;
  }

  /**
   * @param {{targetInfo: {targetId: string, type:string}}} param0
   */
  async _targetCreated({ targetInfo }) {
    const target = await this._targetForInfo(targetInfo);
    this.emit(Browser.Events.TargetCreated, target);
  }

  /**
   * @param {{targetId: string}} param0
   */
  async _targetDestroyed({targetId}) {
    const target = this._targets.get(targetId);
    if (!target)
      return;
    this._targets.delete(targetId);
    this.emit(Browser.Events.TargetDestroyed, target);
  }

  /**
   * @param {{targetId: string, type: string}} targetInfo
   * @return {Target}
   */
  _targetForInfo(targetInfo) {
    if (!this._targets.has(targetInfo.targetId))
      this._targets.set(targetInfo.targetId, new Target(this, targetInfo.targetId, targetInfo.type));
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
    const page = await this._targetForInfo(targetInfo).page();
    await page.goto('about:blank');
    return page;
  }

  /**
   * @return {Array<Target>}
   */
  targets() {
    return Array.from(this._targets.values());
  }

  /**
   * @return {Array<Pages>}
   */
  pages() {
    return Promise.all(this.targets().map(target => target.page()).filter(page => page));
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
  TargetDestroyed: 'targetdestroyed'
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
   * @param {string} targetId
   * @param {string} type
   */
  constructor(browser, targetId, type) {
    this._browser = browser;
    this._targetId = targetId;
    this._type = type;
    /** @type {Promise<Page>} */
    this._pagePromise = null;
  }

  /**
   * @return {Promise<{targetId: string, type: string, title: string, url: string, attached: boolean, type: string}>}
   */
  async _info() {
    const {targetInfo} = await this._browser._connection.send('Target.getTargetInfo', {targetId: this._targetId});
    return targetInfo;
  }

  /**
   * @return {?Promise<Page>}
   */
  page() {
    if (this._type === 'page' && !this._pagePromise) {
      this._pagePromise = this._browser._connection.createSession(this._targetId)
          .then(client => Page.create(client, this._browser._ignoreHTTPSErrors, this._browser._appMode, this._browser._screenshotTaskQueue));
    }
    return this._pagePromise;
  }

  /**
   * @return {Promise<string>}
   */
  async title() {
    return (await this._info()).title;
  }

  /**
   * @return {Promise<string>}
   */
  async url() {
    return (await this._info()).url;
  }

  type() {
    return this._type;
  }
}
helper.tracePublicAPI(Target);

/**
 * @typedef {Object} Target.targetInfo
 *
 */

module.exports = { Browser, TaskQueue };
