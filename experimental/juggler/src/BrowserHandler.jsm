"use strict";

const {Services} = ChromeUtils.import("resource://gre/modules/Services.jsm");
const {PageHandler} = ChromeUtils.import("chrome://juggler/content/PageHandler.jsm");
const {InsecureSweepingOverride} = ChromeUtils.import("chrome://juggler/content/InsecureSweepingOverride.js");

class BrowserHandler {
  constructor(session) {
    this._session = session;
    this._mainWindowPromise = waitForBrowserWindow();
    this._pageHandlers = new Map();
    this._tabsToPageHandlers = new Map();
    this._initializePages();
    this._sweepingOverride = null;
  }

  async setIgnoreHTTPSErrors({enabled}) {
    if (!enabled && this._sweepingOverride) {
      this._sweepingOverride.unregister();
      this._sweepingOverride = null;
      Services.prefs.setBoolPref('security.mixed_content.block_active_content', true);
    } else if (enabled && !this._sweepingOverride) {
      this._sweepingOverride = new InsecureSweepingOverride();
      this._sweepingOverride.register();
      Services.prefs.setBoolPref('security.mixed_content.block_active_content', false);
    }
  }

  async getInfo() {
    const win = await this._mainWindowPromise;
    const version = Components.classes["@mozilla.org/xre/app-info;1"]
                              .getService(Components.interfaces.nsIXULAppInfo)
                              .version;
    const userAgent = Components.classes["@mozilla.org/network/protocol;1?name=http"]
                                .getService(Components.interfaces.nsIHttpProtocolHandler)
                                .userAgent;
    return {version: 'Firefox/' + version, userAgent};
  }

  async _initializePages() {
    const win = await this._mainWindowPromise;
    const tabs = win.gBrowser.tabs;
    for (const tab of win.gBrowser.tabs)
      this._ensurePageHandler(tab);
    win.gBrowser.tabContainer.addEventListener('TabOpen', event => {
      this._ensurePageHandler(event.target);
    });
    win.gBrowser.tabContainer.addEventListener('TabClose', event => {
      this._removePageHandlerForTab(event.target);
    });
  }

  pageForId(pageId) {
    return this._pageHandlers.get(pageId) || null;
  }

  _ensurePageHandler(tab) {
    if (this._tabsToPageHandlers.has(tab))
      return this._tabsToPageHandlers.get(tab);
    const pageHandler = new PageHandler(this._session, tab);
    this._pageHandlers.set(pageHandler.id(), pageHandler);
    this._tabsToPageHandlers.set(tab, pageHandler);
    this._session.emitEvent('Browser.tabOpened', {
      url: pageHandler.url(),
      pageId: pageHandler.id()
    });
    return pageHandler;
  }

  _removePageHandlerForTab(tab) {
    const pageHandler = this._tabsToPageHandlers.get(tab);
    this._tabsToPageHandlers.delete(tab);
    this._pageHandlers.delete(pageHandler.id());
    pageHandler.dispose();
    this._session.emitEvent('Browser.tabClosed', {pageId: pageHandler.id()});
  }

  async newPage() {
    const win = await this._mainWindowPromise;
    const tab = win.gBrowser.addTab('about:blank', {
      triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
    });
    win.gBrowser.selectedTab = tab;
    // Await navigation to about:blank
    await new Promise(resolve => {
      const wpl = {
        onLocationChange: function(aWebProgress, aRequest, aLocation) {
          tab.linkedBrowser.removeProgressListener(wpl);
          resolve();
        },
        QueryInterface: ChromeUtils.generateQI([
          Ci.nsIWebProgressListener,
          Ci.nsISupportsWeakReference,
        ]),
      };
      tab.linkedBrowser.addProgressListener(wpl);
    });
    const pageHandler = this._ensurePageHandler(tab);
    return {pageId: pageHandler.id()};
  }

  async closePage({pageId}) {
    const win = await this._mainWindowPromise;
    const pageHandler = this._pageHandlers.get(pageId);
    await win.gBrowser.removeTab(pageHandler.tab());
  }
}

/**
 * @return {Promise<Ci.nsIDOMChromeWindow>}
 */
async function waitForBrowserWindow() {
  const windowsIt = Services.wm.getEnumerator('navigator:browser');
  if (windowsIt.hasMoreElements())
    return waitForWindowLoaded(windowsIt.getNext().QueryInterface(Ci.nsIDOMChromeWindow));

  let fulfill;
  let promise = new Promise(x => fulfill = x);

  const listener = {
    onOpenWindow: window => {
      if (window instanceof Ci.nsIDOMChromeWindow) {
        Services.wm.removeListener(listener);
        fulfill(waitForWindowLoaded(window));
      }
    },
    onCloseWindow: () => {}
  };
  Services.wm.addListener(listener);
  return promise;

  /**
   * @param {Ci.nsIDOMChromeWindow} window
   * @return {Promise<Ci.nsIDOMChromeWindow>}
   */
  function waitForWindowLoaded(window) {
    if (window.document.readyState === 'complete')
      return window;
    return new Promise(fulfill => {
      window.addEventListener('load', function listener() {
        window.removeEventListener('load', listener);
        fulfill(window);
      });
    });
  }
}

var EXPORTED_SYMBOLS = ['BrowserHandler'];
this.BrowserHandler = BrowserHandler;
