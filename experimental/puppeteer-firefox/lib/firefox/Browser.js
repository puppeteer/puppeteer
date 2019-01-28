const {helper} = require('./helper');
const {Page} = require('./Page');
const EventEmitter = require('events');

class Browser extends EventEmitter {
  /**
   * @param {Puppeteer.Connection} connection
   * @param {?Puppeteer.Viewport} defaultViewport
   * @param {?Puppeteer.ChildProcess} process
   * @param {function():void} closeCallback
   */
  constructor(connection, defaultViewport, process, closeCallback) {
    super();
    this._connection = connection;
    this._defaultViewport = defaultViewport;
    this._process = process;
    this._closeCallback = closeCallback;

    /** @type {Map<string, ?Target>} */
    this._pageTargets = new Map();

    this._eventListeners = [
      helper.addEventListener(this._connection, 'Browser.tabOpened', this._onTabOpened.bind(this)),
      helper.addEventListener(this._connection, 'Browser.tabClosed', this._onTabClosed.bind(this)),
      helper.addEventListener(this._connection, 'Browser.tabNavigated', this._onTabNavigated.bind(this)),
    ];
  }

  /**
   * @return {Promise<string>}
   */
  async userAgent() {
    const info = await this._connection.send('Browser.getInfo');
    return info.userAgent;
  }

  /**
   * @return {Promise<string>}
   */
  async version() {
    const info = await this._connection.send('Browser.getInfo');
    return info.version;
  }

  /**
   * @return {?Puppeteer.ChildProcess}
   */
  process() {
    return this._process;
  }

  /**
   * @param {function(Target):boolean} predicate
   * @param {{timeout?: number}=} options
   * @return {Promise<Target>}
   */
  async waitForTarget(predicate, options = {}) {
    const {
      timeout = 30000
    } = options;
    const existingTarget = this.targets().find(predicate);
    if (existingTarget)
      return existingTarget;
    let resolve;
    const targetPromise = new Promise(x => resolve = x);
    this.on(Browser.Events.TargetCreated, check);
    this.on('targetchanged', check);
    try {
      if (!timeout)
        return await targetPromise;
      return await helper.waitWithTimeout(targetPromise, 'target', timeout);
    } finally {
      this.removeListener(Browser.Events.TargetCreated, check);
      this.removeListener('targetchanged', check);
    }

    /**
     * @param {Target} target
     */
    function check(target) {
      if (predicate(target))
        resolve(target);
    }
  }

  async newPage() {
    const {pageId} = await this._connection.send('Browser.newPage');
    const target = this._pageTargets.get(pageId);
    return await target.page();
  }

  async pages() {
    const pageTargets = Array.from(this._pageTargets.values());
    return await Promise.all(pageTargets.map(target => target.page()));
  }

  targets() {
    return Array.from(this._pageTargets.values());
  }

  _onTabOpened({pageId, url}) {
    const target = new Target(this._connection, this, pageId, url);
    this._pageTargets.set(pageId, target);
    this.emit(Browser.Events.TargetCreated, target);
  }

  _onTabClosed({pageId}) {
    const target = this._pageTargets.get(pageId);
    this._pageTargets.delete(pageId);
    this.emit(Browser.Events.TargetDestroyed, target);
  }

  _onTabNavigated({pageId, url}) {
    const target = this._pageTargets.get(pageId);
    target._url = url;
    this.emit(Browser.Events.TargetChanged, target);
  }

  async close() {
    helper.removeEventListeners(this._eventListeners);
    await this._closeCallback();
  }
}

/** @enum {string} */
Browser.Events = {
  TargetCreated: 'targetcreated',
  TargetChanged: 'targetchanged',
  TargetDestroyed: 'targetdestroyed'
}

class Target {
  /**
   *
   * @param {*} connection
   * @param {Browser} browser
   * @param {string} pageId
   * @param {string} url
   */
  constructor(connection, browser, pageId, url) {
    this._browser = browser;
    this._connection = connection;
    this._pageId = pageId;
    /** @type {?Promise<Page>} */
    this._pagePromise = null;
    this._url = url;
  }

  /**
   * @return {"page"|"background_page"|"service_worker"|"other"|"browser"}
   */
  type() {
    return 'page';
  }

  url() {
    return this._url;
  }

  async page() {
    if (!this._pagePromise)
      this._pagePromise = Page.create(this._connection, this, this._pageId, this._browser._defaultViewport);
    return this._pagePromise;
  }

  browser() {
    return this._browser;
  }
}

module.exports = {Browser, Target};
