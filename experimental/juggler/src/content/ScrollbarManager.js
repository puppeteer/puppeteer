const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;
const Cc = Components.classes;

const {Helper} = ChromeUtils.import('chrome://juggler/content/Helper.js');
const {Services} = ChromeUtils.import("resource://gre/modules/Services.jsm");

const HIDDEN_SCROLLBARS = Services.io.newURI('chrome://juggler/content/content/hidden-scrollbars.css');
const FLOATING_SCROLLBARS = Services.io.newURI('chrome://juggler/content/content/floating-scrollbars.css');

const isHeadless = Cc["@mozilla.org/gfx/info;1"].getService(Ci.nsIGfxInfo).isHeadless;
const helper = new Helper();

class ScrollbarManager {
  constructor(mm, docShell) {
    this._docShell = docShell;
    this._customScrollbars = null;

    if (isHeadless)
      this._setCustomScrollbars(HIDDEN_SCROLLBARS);

    this._eventListeners = [
      helper.addEventListener(mm, 'DOMWindowCreated', this._onDOMWindowCreated.bind(this)),
    ];
  }

  setFloatingScrollbars(enabled) {
    if (this._customScrollbars === HIDDEN_SCROLLBARS)
      return;
    this._setCustomScrollbars(enabled ? FLOATING_SCROLLBARS : null);
  }

  _setCustomScrollbars(customScrollbars) {
    if (this._customScrollbars === customScrollbars)
      return;
    if (this._customScrollbars)
      this._docShell.domWindow.windowUtils.removeSheet(this._customScrollbars, this._docShell.domWindow.AGENT_SHEET);
    this._customScrollbars = customScrollbars;
    if (this._customScrollbars)
      this._docShell.domWindow.windowUtils.loadSheet(this._customScrollbars, this._docShell.domWindow.AGENT_SHEET);
  }

  dispose() {
    this._setCustomScrollbars(null);
    helper.removeListeners(this._eventListeners);
  }

  _onDOMWindowCreated(event) {
    const docShell = event.target.ownerGlobal.docShell;
    if (this._customScrollbars)
      docShell.domWindow.windowUtils.loadSheet(this._customScrollbars, docShell.domWindow.AGENT_SHEET);
  }
}

var EXPORTED_SYMBOLS = ['ScrollbarManager'];
this.ScrollbarManager = ScrollbarManager;

