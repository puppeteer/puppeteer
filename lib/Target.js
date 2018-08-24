const {Page} = require('./Page');
const {helper} = require('./helper');

class Target {
  /**
   * @param {!Protocol.Target.TargetInfo} targetInfo
   * @param {!Puppeteer.BrowserContext} browserContext
   * @param {!function():!Promise<!Puppeteer.CDPSession>} sessionFactory
   * @param {boolean} ignoreHTTPSErrors
   * @param {?Puppeteer.Viewport} defaultViewport
   * @param {!Puppeteer.TaskQueue} screenshotTaskQueue
   */
  constructor(targetInfo, browserContext, sessionFactory, ignoreHTTPSErrors, defaultViewport, screenshotTaskQueue) {
    this._targetInfo = targetInfo;
    this._browserContext = browserContext;
    this._targetId = targetInfo.targetId;
    this._sessionFactory = sessionFactory;
    this._ignoreHTTPSErrors = ignoreHTTPSErrors;
    this._defaultViewport = defaultViewport;
    this._screenshotTaskQueue = screenshotTaskQueue;
    /** @type {?Promise<!Puppeteer.Page>} */
    this._pagePromise = null;
    this._initializedPromise = new Promise(fulfill => this._initializedCallback = fulfill);
    this._isClosedPromise = new Promise(fulfill => this._closedCallback = fulfill);
    this._isInitialized = this._targetInfo.type !== 'page' || this._targetInfo.url !== '';
    if (this._isInitialized)
      this._initializedCallback(true);
  }

  /**
   * @return {!Promise<!Puppeteer.CDPSession>}
   */
  createCDPSession() {
    return this._sessionFactory();
  }

  /**
   * @return {!Promise<?Page>}
   */
  async page() {
    if ((this._targetInfo.type === 'page' || this._targetInfo.type === 'background_page') && !this._pagePromise) {
      this._pagePromise = this._sessionFactory()
          .then(client => Page.create(client, this, this._ignoreHTTPSErrors, this._defaultViewport, this._screenshotTaskQueue));
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
   * @return {"page"|"background_page"|"service_worker"|"other"|"browser"}
   */
  type() {
    const type = this._targetInfo.type;
    if (type === 'page' || type === 'background_page' || type === 'service_worker' || type === 'browser')
      return type;
    return 'other';
  }

  /**
   * @return {!Puppeteer.Browser}
   */
  browser() {
    return this._browserContext.browser();
  }

  /**
   * @return {!Puppeteer.BrowserContext}
   */
  browserContext() {
    return this._browserContext;
  }

  /**
   * @return {?Puppeteer.Target}
   */
  opener() {
    const { openerId } = this._targetInfo;
    if (!openerId)
      return null;
    return this.browser()._targets.get(openerId);
  }

  /**
   * @param {!Protocol.Target.TargetInfo} targetInfo
   */
  _targetInfoChanged(targetInfo) {
    this._targetInfo = targetInfo;

    if (!this._isInitialized && (this._targetInfo.type !== 'page' || this._targetInfo.url !== '')) {
      this._isInitialized = true;
      this._initializedCallback(true);
      return;
    }
  }
}

helper.tracePublicAPI(Target);

module.exports = {Target};
