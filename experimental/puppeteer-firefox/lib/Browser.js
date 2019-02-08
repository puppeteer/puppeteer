const {helper, assert} = require('./helper');
const {Page} = require('./Page');
const {Events} = require('./Events');
const EventEmitter = require('events');

class Browser extends EventEmitter {
  /**
   * @param {!Puppeteer.Connection} connection
   * @param {?Puppeteer.Viewport} defaultViewport
   * @param {?Puppeteer.ChildProcess} process
   * @param {function():void} closeCallback
   */
  static async create(connection, defaultViewport, process, closeCallback) {
    const {browserContextIds} = await connection.send('Browser.getBrowserContexts');
    const browser = new Browser(connection, browserContextIds, defaultViewport, process, closeCallback);
    await connection.send('Browser.enable');
    return browser;
  }

  /**
   * @param {!Puppeteer.Connection} connection
   * @param {!Array<string>} browserContextIds
   * @param {?Puppeteer.Viewport} defaultViewport
   * @param {?Puppeteer.ChildProcess} process
   * @param {function():void} closeCallback
   */
  constructor(connection, browserContextIds, defaultViewport, process, closeCallback) {
    super();
    this._connection = connection;
    this._defaultViewport = defaultViewport;
    this._process = process;
    this._closeCallback = closeCallback;

    /** @type {!Map<string, ?Target>} */
    this._pageTargets = new Map();

    this._defaultContext = new BrowserContext(this._connection, this, null);
    /** @type {!Map<string, !BrowserContext>} */
    this._contexts = new Map();
    for (const browserContextId of browserContextIds)
      this._contexts.set(browserContextId, new BrowserContext(this._connection, this, browserContextId));

    this._eventListeners = [
      helper.addEventListener(this._connection, 'Browser.tabOpened', this._onTabOpened.bind(this)),
      helper.addEventListener(this._connection, 'Browser.tabClosed', this._onTabClosed.bind(this)),
      helper.addEventListener(this._connection, 'Browser.tabNavigated', this._onTabNavigated.bind(this)),
    ];
  }

  /**
   * @return {!BrowserContext}
   */
  async createIncognitoBrowserContext() {
    const {browserContextId} = await this._connection.send('Browser.createBrowserContext');
    const context = new BrowserContext(this._connection, this, browserContextId);
    this._contexts.set(browserContextId, context);
    return context;
  }

  /**
   * @return {!Array<!BrowserContext>}
   */
  browserContexts() {
    return [this._defaultContext, ...Array.from(this._contexts.values())];
  }

  defaultBrowserContext() {
    return this._defaultContext;
  }

  async _disposeContext(browserContextId) {
    await this._connection.send('Browser.removeBrowserContext', {browserContextId});
    this._contexts.delete(browserContextId);
  }

  /**
   * @return {!Promise<string>}
   */
  async userAgent() {
    const info = await this._connection.send('Browser.getInfo');
    return info.userAgent;
  }

  /**
   * @return {!Promise<string>}
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
   * @param {function(!Target):boolean} predicate
   * @param {{timeout?: number}=} options
   * @return {!Promise<!Target>}
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
    this.on(Events.Browser.TargetCreated, check);
    this.on('targetchanged', check);
    try {
      if (!timeout)
        return await targetPromise;
      return await helper.waitWithTimeout(targetPromise, 'target', timeout);
    } finally {
      this.removeListener(Events.Browser.TargetCreated, check);
      this.removeListener('targetchanged', check);
    }

    /**
     * @param {!Target} target
     */
    function check(target) {
      if (predicate(target))
        resolve(target);
    }
  }

  /**
   * @return {Promise<Page>}
   */
  newPage() {
    return this._createPageInContext(this._defaultContext._browserContextId);
  }

  /**
   * @param {?string} browserContextId
   * @return {Promise<Page>}
   */
  async _createPageInContext(browserContextId) {
    const {pageId} = await this._connection.send('Browser.newPage', {
      browserContextId: browserContextId || undefined
    });
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

  _onTabOpened({pageId, url, browserContextId}) {
    const context = browserContextId ? this._contexts.get(browserContextId) : this._defaultContext;
    const target = new Target(this._connection, this, context, pageId, url);
    this._pageTargets.set(pageId, target);
    this.emit(Events.Browser.TargetCreated, target);
    context.emit(Events.BrowserContext.TargetCreated, target);
  }

  _onTabClosed({pageId}) {
    const target = this._pageTargets.get(pageId);
    this._pageTargets.delete(pageId);
    this.emit(Events.Browser.TargetDestroyed, target);
    target.browserContext().emit(Events.BrowserContext.TargetDestroyed, target);
  }

  _onTabNavigated({pageId, url}) {
    const target = this._pageTargets.get(pageId);
    target._url = url;
    this.emit(Events.Browser.TargetChanged, target);
    target.browserContext().emit(Events.BrowserContext.TargetChanged, target);
  }

  async close() {
    helper.removeEventListeners(this._eventListeners);
    await this._closeCallback();
  }
}

class Target {
  /**
   *
   * @param {*} connection
   * @param {!Browser} browser
   * @param {!BrowserContext} context
   * @param {string} pageId
   * @param {string} url
   */
  constructor(connection, browser, context, pageId, url) {
    this._browser = browser;
    this._context = context;
    this._connection = connection;
    this._pageId = pageId;
    /** @type {?Promise<!Page>} */
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

  /**
   * @return {!BrowserContext}
   */
  browserContext() {
    return this._context;
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

class BrowserContext extends EventEmitter {
  /**
   * @param {!Puppeteer.Connection} connection
   * @param {!Browser} browser
   * @param {?string} browserContextId
   */
  constructor(connection, browser, browserContextId) {
    super();
    this._connection = connection;
    this._browser = browser;
    this._browserContextId = browserContextId;
  }

  /**
   * @return {Array<Target>}
   */
  targets() {
    return this._browser.targets().filter(target => target.browserContext() === this);
  }

  /**
   * @return {Promise<Array<Puppeteer.Page>>}
   */
  async pages() {
    const pages = await Promise.all(
        this.targets()
            .filter(target => target.type() === 'page')
            .map(target => target.page())
    );
    return pages.filter(page => !!page);
  }

  /**
   * @param {function(Target):boolean} predicate
   * @param {{timeout?: number}=} options
   * @return {!Promise<Target>}
   */
  waitForTarget(predicate, options) {
    return this._browser.waitForTarget(target => target.browserContext() === this && predicate(target), options);
  }

  /**
   * @return {boolean}
   */
  isIncognito() {
    return !!this._browserContextId;
  }

  newPage() {
    return this._browser._createPageInContext(this._browserContextId);
  }

  /**
   * @return {!Browser}
   */
  browser() {
    return this._browser;
  }

  async close() {
    assert(this._browserContextId, 'Non-incognito contexts cannot be closed!');
    await this._browser._disposeContext(this._browserContextId);
  }
}

module.exports = {Browser, BrowserContext, Target};
