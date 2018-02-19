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

const { helper } = require('./helper');
const Target = require('./Target');
const EventEmitter = require('events');
const TaskQueue = require('./TaskQueue');

class Browser extends EventEmitter {
  /**
   * @param {!Puppeteer.Connection} connection
   * @param {!Object=} options
   * @param {?Puppeteer.ChildProcess} process
   * @param {(function():Promise)=} closeCallback
   */
  constructor(connection, options = {}, process, closeCallback) {
    super();
    this._ignoreHTTPSErrors = !!options.ignoreHTTPSErrors;
    this._appMode = !!options.appMode;
    this._deterministic = options['deterministic'];
    this._process = process;
    this._screenshotTaskQueue = new TaskQueue();
    this._connection = connection;
    this._closeCallback = closeCallback || new Function();
    /** @type {Map<string, Target>} */
    this._targets = new Map();
    this._connection.setClosedCallback(() => {
      this.emit(Browser.Events.Disconnected);
    });
    this._deterministicModeSet = false;
    this._connection.on('Target.targetCreated', this._targetCreated.bind(this));
    this._connection.on('Target.targetDestroyed', this._targetDestroyed.bind(this));
    this._connection.on('Target.targetInfoChanged', this._targetInfoChanged.bind(this));
  }

  /**
   * @return {?Puppeteer.ChildProcess}
   */
  process() {
    return this._process;
  }

  /**
   * @param {!Puppeteer.Connection} connection
   * @param {!Object=} options
   * @param {?Puppeteer.ChildProcess} process
   * @param {function()=} closeCallback
   */
  static async create(connection, options, process, closeCallback) {
    const browser = new Browser(connection, options, process, closeCallback);
    await connection.send('Target.setDiscoverTargets', {discover: true});
    if (options && options.deterministic) {
      // Deterministic mode requires a new enough version of chrome.
      const version = await browser.version();
      const vers = version.split('/');
      if (vers[0] !== 'HeadlessChrome')
        throw new Error('Deterministic mode requires HeadlessChrome.');
      const releaseVersion = vers[1].split('.').map(Number);
      const minVersion = [66, 0, 3356, 0];
      for (let i = 0; i < 4; i++) {
        if (releaseVersion[i] < minVersion[i])
          throw new Error('Deterministic mode requires version ' + minVersion.join('.') + ' or newer of Chrome. Running with version ' + vers[1]);
      }
      // Deterministic mode requires --headless and --deterministic-fetch.
      const cmdline = await connection.send('Browser.getCommandLine');
      if (cmdline.arguments.indexOf('--headless') === -1 || cmdline.arguments.indexOf('--deterministic-fetch') === -1)
        throw new Error('Deterministic mode requires --headless and --deterministic-fetch.');

      // Enable deterministic mode.
      const params = {beginFrameControl: true};
      if (options.deterministic.date)
        params.initialDate = options.deterministic.date.getTime() / 1000;
      await connection.send('HeadlessExperimental.enterDeterministicMode', params);
      browser._deterministicModeSet = true;
    }
    return browser;
  }

  /**
   * @param {{targetInfo: !Puppeteer.TargetInfo}} event
   */
  async _targetCreated(event) {
    const targetInfo = event.targetInfo;
    const target = new Target(targetInfo, () => this._connection.createSession(targetInfo.targetId), this._ignoreHTTPSErrors, this._appMode, this._screenshotTaskQueue, this._deterministic, this._deterministicModeSet);
    console.assert(!this._targets.has(event.targetInfo.targetId), 'Target should not exist before targetCreated');
    this._targets.set(event.targetInfo.targetId, target);
    if (await target._initializedPromise)
      this.emit(Browser.Events.TargetCreated, target);
  }

  /**
   * @param {{targetId: string}} event
   */
  async _targetDestroyed(event) {
    const target = this._targets.get(event.targetId);
    target._initializedCallback(false);
    this._targets.delete(event.targetId);
    target._closedCallback();
    if (await target._initializedPromise)
      this.emit(Browser.Events.TargetDestroyed, target);
  }

  /**
   * @param {{targetInfo: !Puppeteer.TargetInfo}} event
   */
  _targetInfoChanged(event) {
    const target = this._targets.get(event.targetInfo.targetId);
    console.assert(target, 'target should exist before targetInfoChanged');
    const previousURL = target.url();
    const wasInitialized = target._isInitialized;
    target._targetInfoChanged(event.targetInfo);
    if (wasInitialized && previousURL !== target.url())
      this.emit(Browser.Events.TargetChanged, target);
  }

  /**
   * @return {string}
   */
  wsEndpoint() {
    return this._connection.url();
  }

  /**
   * @return {!Promise<!Puppeteer.Page>}
   */
  async newPage() {
    const {targetId} = await this._connection.send('Target.createTarget', {url: 'about:blank'});
    const target = await this._targets.get(targetId);
    console.assert(await target._initializedPromise, 'Failed to create target for page');
    const page = await target.page();
    return page;
  }

  /**
   * @return {!Array<!Target>}
   */
  targets() {
    return Array.from(this._targets.values()).filter(target => target._isInitialized);
  }

  /**
   * @return {!Promise<!Array<!Puppeteer.Page>>}
   */
  async pages() {
    const pages = await Promise.all(this.targets().map(target => target.page()));
    return pages.filter(page => !!page);
  }

  /**
   * @return {!Promise<string>}
   */
  async version() {
    const version = await this._getVersion();
    return version.product;
  }

  /**
   * @return {!Promise<string>}
   */
  async userAgent() {
    const version = await this._getVersion();
    return version.userAgent;
  }

  async close() {
    await this._closeCallback.call(null);
    this.disconnect();
  }

  disconnect() {
    this._connection.dispose();
  }

  /**
   * @return {!Promise<!Object>}
   */
  _getVersion() {
    return this._connection.send('Browser.getVersion');
  }
}

/** @enum {string} */
Browser.Events = {
  TargetCreated: 'targetcreated',
  TargetDestroyed: 'targetdestroyed',
  TargetChanged: 'targetchanged',
  Disconnected: 'disconnected'
};

helper.tracePublicAPI(Browser);

module.exports = Browser;
