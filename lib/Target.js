const Page = require('./Page');
const {helper} = require('./helper');

class Target {
  /**
   * @param {!Puppeteer.TargetInfo} targetInfo
   * @param {!function():!Promise<!Puppeteer.CDPSession>} sessionFactory
   * @param {boolean} ignoreHTTPSErrors
   * @param {boolean} setDefaultViewport
   * @param {!Puppeteer.TaskQueue} screenshotTaskQueue
   */
  constructor(targetInfo, sessionFactory, ignoreHTTPSErrors, setDefaultViewport, screenshotTaskQueue) {
    this._targetInfo = targetInfo;
    this._targetId = targetInfo.targetId;
    this._sessionFactory = sessionFactory;
    this._ignoreHTTPSErrors = ignoreHTTPSErrors;
    this._setDefaultViewport = setDefaultViewport;
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
    if (this._targetInfo.type === 'page' && !this._pagePromise) {
      this._pagePromise = this._sessionFactory()
          .then(client => Page.create(client, this, this._ignoreHTTPSErrors, this._setDefaultViewport, this._screenshotTaskQueue));
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
   * @return {"page"|"service_worker"|"other"|"browser"}
   */
  type() {
    const type = this._targetInfo.type;
    if (type === 'page' || type === 'service_worker' || type === 'browser')
      return type;
    return 'other';
  }

  /**
   * @param {!Puppeteer.TargetInfo} targetInfo
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

module.exports = Target;