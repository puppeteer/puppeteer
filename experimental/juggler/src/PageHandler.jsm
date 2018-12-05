"use strict";

const {Helper} = ChromeUtils.import('chrome://juggler/content/Helper.js');

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
const XUL_NS = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';
const FRAME_SCRIPT = "chrome://juggler/content/content/ContentSession.js";
const helper = new Helper();

class PageHandler {
  constructor(chromeSession, tab) {
    this._pageId = helper.generateId();
    this._chromeSession = chromeSession;
    this._tab = tab;
    this._browser = tab.linkedBrowser;
    this._enabled = false;
    this.QueryInterface = ChromeUtils.generateQI([
      Ci.nsIWebProgressListener,
      Ci.nsISupportsWeakReference,
    ]);
    this._browser.addProgressListener(this, Ci.nsIWebProgress.NOTIFY_LOCATION);
    this._dialogs = new Map();

    // First navigation always happens to about:blank - do not report it.
    this._skipNextNavigation = true;
  }

  async setViewport({viewport}) {
    if (viewport) {
      const {width, height} = viewport;
      this._browser.style.setProperty('min-width', width + 'px');
      this._browser.style.setProperty('min-height', height + 'px');
      this._browser.style.setProperty('max-width', width + 'px');
      this._browser.style.setProperty('max-height', height + 'px');
    } else {
      this._browser.style.removeProperty('min-width');
      this._browser.style.removeProperty('min-height');
      this._browser.style.removeProperty('max-width');
      this._browser.style.removeProperty('max-height');
    }
    const dimensions = this._browser.getBoundingClientRect();
    await Promise.all([
      this._contentSession.send('setViewport', {
        deviceScaleFactor: viewport ? viewport.deviceScaleFactor : 0,
        isMobile: viewport && viewport.isMobile,
        hasTouch: viewport && viewport.hasTouch,
      }),
      this._contentSession.send('awaitViewportDimensions', {
        width: dimensions.width,
        height: dimensions.height
      }),
    ]);
  }

  _initializeDialogEvents() {
    this._browser.addEventListener('DOMWillOpenModalDialog', async (event) => {
      // wait for the dialog to be actually added to DOM.
      await Promise.resolve();
      this._updateModalDialogs();
    });
    this._browser.addEventListener('DOMModalDialogClosed', (event) => {
      this._updateModalDialogs();
    });
    this._updateModalDialogs();
  }

  _updateModalDialogs() {
    const elements = new Set(this._browser.parentNode.getElementsByTagNameNS(XUL_NS, "tabmodalprompt"));
    for (const dialog of this._dialogs.values()) {
      if (!elements.has(dialog.element())) {
        this._dialogs.delete(dialog.id());
        this._chromeSession.emitEvent('Page.dialogClosed', {
          pageId: this._pageId,
          dialogId: dialog.id(),
        });
      } else {
        elements.delete(dialog.element());
      }
    }
    for (const element of elements) {
      const dialog = Dialog.createIfSupported(element);
      if (!dialog)
        continue;
      this._dialogs.set(dialog.id(), dialog);
      this._chromeSession.emitEvent('Page.dialogOpened', {
        pageId: this._pageId,
        dialogId: dialog.id(),
        type: dialog.type(),
        message: dialog.message(),
        defaultValue: dialog.defaultValue(),
      });
    }
  }

  onLocationChange(aWebProgress, aRequest, aLocation) {
    if (this._skipNextNavigation) {
      this._skipNextNavigation = false;
      return;
    }
    this._chromeSession.emitEvent('Browser.tabNavigated', {
      pageId: this._pageId,
      url: aLocation.spec
    });
  }

  url() {
    return this._browser.currentURI.spec;
  }

  tab() {
    return this._tab;
  }

  id() {
    return this._pageId;
  }

  async enable() {
    if (this._enabled)
      return;
    this._enabled = true;
    this._initializeDialogEvents();
    this._contentSession = new ContentSession(this._chromeSession, this._browser, this._pageId);
    await this._contentSession.send('enable');
  }

  async screenshot(options) {
    return await this._contentSession.send('screenshot', options);
  }

  async getBoundingBox(options) {
    return await this._contentSession.send('getBoundingBox', options);
  }

  async getContentQuads(options) {
    return await this._contentSession.send('getContentQuads', options);
  }

  /**
   * @param {{frameId: string, url: string}} options
   */
  async navigate(options) {
    return await this._contentSession.send('navigate', options);
  }

  /**
   * @param {{frameId: string, url: string}} options
   */
  async goBack(options) {
    return await this._contentSession.send('goBack', options);
  }

  /**
   * @param {{frameId: string, url: string}} options
   */
  async goForward(options) {
    return await this._contentSession.send('goForward', options);
  }

  /**
   * @param {{frameId: string, url: string}} options
   */
  async reload(options) {
    return await this._contentSession.send('reload', options);
  }

  /**
   * @param {{functionText: String, frameId: String}} options
   * @return {!Promise<*>}
   */
  async evaluate(options) {
    return await this._contentSession.send('evaluate', options);
  }

  async getObjectProperties(options) {
    return await this._contentSession.send('getObjectProperties', options);
  }

  async addScriptToEvaluateOnNewDocument(options) {
    return await this._contentSession.send('addScriptToEvaluateOnNewDocument', options);
  }

  async removeScriptToEvaluateOnNewDocument(options) {
    return await this._contentSession.send('removeScriptToEvaluateOnNewDocument', options);
  }

  async disposeObject(options) {
    return await this._contentSession.send('disposeObject', options);
  }

  async dispatchKeyEvent(options) {
    return await this._contentSession.send('dispatchKeyEvent', options);
  }

  async dispatchMouseEvent(options) {
    return await this._contentSession.send('dispatchMouseEvent', options);
  }

  async insertText(options) {
    return await this._contentSession.send('insertText', options);
  }

  async handleDialog({dialogId, accept, promptText}) {
    const dialog = this._dialogs.get(dialogId);
    if (!dialog)
      throw new Error('Failed to find dialog with id = ' + dialogId);
    if (accept)
      dialog.accept(promptText);
    else
      dialog.dismiss();
  }

  dispose() {
    this._browser.removeProgressListener(this);
    if (this._contentSession) {
      this._contentSession.dispose();
      this._contentSession = null;
    }
  }
}

class ContentSession {
  constructor(chromeSession, browser, pageId) {
    this._chromeSession = chromeSession;
    this._browser = browser;
    this._pageId = pageId;
    this._messageId = 0;
    this._pendingMessages = new Map();
    this._sessionId = helper.generateId();
    this._browser.messageManager.sendAsyncMessage('juggler:create-content-session', this._sessionId);
    this._eventListeners = [
      helper.addMessageListener(this._browser.messageManager, this._sessionId, {
        receiveMessage: message => this._onMessage(message)
      }),
    ];
  }

  dispose() {
    helper.removeListeners(this._eventListeners);
    for (const {resolve, reject} of this._pendingMessages.values())
      reject(new Error('Page closed.'));
    this._pendingMessages.clear();
  }

  /**
   * @param {string} methodName
   * @param {*} params
   * @return {!Promise<*>}
   */
  send(methodName, params) {
    const id = ++this._messageId;
    const promise = new Promise((resolve, reject) => {
      this._pendingMessages.set(id, {resolve, reject});
    });
    this._browser.messageManager.sendAsyncMessage(this._sessionId, {id, methodName, params});
    return promise;
  }

  _onMessage({data}) {
    if (data.id) {
      let id = data.id;
      const {resolve, reject} = this._pendingMessages.get(data.id);
      this._pendingMessages.delete(data.id);
      if (data.error)
        reject(new Error(data.error));
      else
        resolve(data.result);
    } else {
      const {
        eventName,
        params = {}
      } = data;
      params.pageId = this._pageId;
      this._chromeSession.emitEvent(eventName, params);
    }
  }
}

class Dialog {
  static createIfSupported(element) {
    const type = element.Dialog.args.promptType;
    switch (type) {
      case 'alert':
      case 'prompt':
      case 'confirm':
        return new Dialog(element, type);
      case 'confirmEx':
        return new Dialog(element, 'beforeunload');
      default:
        return null;
    };
  }

  constructor(element, type) {
    this._id = helper.generateId();
    this._type = type;
    this._element = element;
  }

  id() {
    return this._id;
  }

  message() {
    return this._element.ui.infoBody.textContent;
  }

  type() {
    return this._type;
  }

  element() {
    return this._element;
  }

  dismiss() {
    if (this._element.ui.button1)
      this._element.ui.button1.click();
    else
      this._element.ui.button0.click();
  }

  defaultValue() {
    return this._element.ui.loginTextbox.value;
  }

  accept(promptValue) {
    if (typeof promptValue === 'string' && this._type === 'prompt')
      this._element.ui.loginTextbox.value = promptValue;
    this._element.ui.button0.click();
  }
}

var EXPORTED_SYMBOLS = ['PageHandler'];
this.PageHandler = PageHandler;
