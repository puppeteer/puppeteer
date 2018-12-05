"use strict";
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;

const {Helper} = ChromeUtils.import('chrome://juggler/content/Helper.js');
const {EventEmitter} = ChromeUtils.import('resource://gre/modules/EventEmitter.jsm');

const helper = new Helper();

class FrameTree {
  constructor(rootDocShell) {
    EventEmitter.decorate(this);
    this._docShellToFrame = new Map();
    this._frameIdToFrame = new Map();
    this._mainFrame = this._createFrame(rootDocShell);
    const webProgress = rootDocShell.QueryInterface(Ci.nsIInterfaceRequestor)
                                .getInterface(Ci.nsIWebProgress);
    this.QueryInterface = ChromeUtils.generateQI([
      Ci.nsIWebProgressListener,
      Ci.nsIWebProgressListener2,
      Ci.nsISupportsWeakReference,
    ]);

    const flags = Ci.nsIWebProgress.NOTIFY_STATE_DOCUMENT |
                  Ci.nsIWebProgress.NOTIFY_FRAME_LOCATION;
    this._eventListeners = [
      helper.addObserver(subject => this._onDocShellCreated(subject.QueryInterface(Ci.nsIDocShell)), 'webnavigation-create'),
      helper.addObserver(subject => this._onDocShellDestroyed(subject.QueryInterface(Ci.nsIDocShell)), 'webnavigation-destroy'),
      helper.addProgressListener(webProgress, this, flags),
    ];
  }

  frameForDocShell(docShell) {
    return this._docShellToFrame.get(docShell) || null;
  }

  frame(frameId) {
    return this._frameIdToFrame.get(frameId) || null;
  }

  frames() {
    let result = [];
    collect(this._mainFrame);
    return result;

    function collect(frame) {
      result.push(frame);
      for (const subframe of frame._children)
        collect(subframe);
    }
  }

  mainFrame() {
    return this._mainFrame;
  }

  dispose() {
    helper.removeListeners(this._eventListeners);
  }

  onStateChange(progress, request, flag, status) {
    if (!(request instanceof Ci.nsIChannel))
      return;
    const channel = request.QueryInterface(Ci.nsIChannel);
    const docShell = progress.DOMWindow.docShell;
    const frame = this._docShellToFrame.get(docShell);
    if (!frame) {
      dump(`ERROR: got a state changed event for un-tracked docshell!\n`);
      return;
    }

    const isStart = flag & Ci.nsIWebProgressListener.STATE_START;
    const isTransferring = flag & Ci.nsIWebProgressListener.STATE_TRANSFERRING;
    const isStop = flag & Ci.nsIWebProgressListener.STATE_STOP;

    if (isStart) {
      // Starting a new navigation.
      frame._pendingNavigationId = helper.generateId();
      frame._pendingNavigationURL = channel.URI.spec;
      this.emit(FrameTree.Events.NavigationStarted, frame);
    } else if (isTransferring || (isStop && frame._pendingNavigationId && !status)) {
      // Navigation is committed.
      for (const subframe of frame._children)
        this._detachFrame(subframe);
      const navigationId = frame._pendingNavigationId;
      frame._pendingNavigationId = null;
      frame._pendingNavigationURL = null;
      frame._lastCommittedNavigationId = navigationId;
      frame._url = channel.URI.spec;
      this.emit(FrameTree.Events.NavigationCommitted, frame);
    } else if (isStop && frame._pendingNavigationId && status) {
      // Navigation is aborted.
      const navigationId = frame._pendingNavigationId;
      frame._pendingNavigationId = null;
      frame._pendingNavigationURL = null;
      this.emit(FrameTree.Events.NavigationAborted, frame, navigationId, getErrorStatusText(status));
    }
  }

  onFrameLocationChange(progress, request, location, flags) {
    const docShell = progress.DOMWindow.docShell;
    const frame = this._docShellToFrame.get(docShell);
    const sameDocumentNavigation = !!(flags & Ci.nsIWebProgressListener.LOCATION_CHANGE_SAME_DOCUMENT);
    if (frame && sameDocumentNavigation) {
      frame._url = location.spec;
      this.emit(FrameTree.Events.SameDocumentNavigation, frame);
    }
  }

  _onDocShellCreated(docShell) {
    // Bug 1142752: sometimes, the docshell appears to be immediately
    // destroyed, bailout early to prevent random exceptions.
    if (docShell.isBeingDestroyed())
      return;
    // If this docShell doesn't belong to our frame tree - do nothing.
    let root = docShell;
    while (root.parent)
      root = root.parent;
    if (root === this._mainFrame._docShell)
      this._createFrame(docShell);
  }

  _createFrame(docShell) {
    const parentFrame = this._docShellToFrame.get(docShell.parent) || null;
    const frame = new Frame(this, docShell, parentFrame);
    this._docShellToFrame.set(docShell, frame);
    this._frameIdToFrame.set(frame.id(), frame);
    this.emit(FrameTree.Events.FrameAttached, frame);
    return frame;
  }

  _onDocShellDestroyed(docShell) {
    const frame = this._docShellToFrame.get(docShell);
    if (frame)
      this._detachFrame(frame);
  }

  _detachFrame(frame) {
    // Detach all children first
    for (const subframe of frame._children)
      this._detachFrame(subframe);
    this._docShellToFrame.delete(frame._docShell);
    this._frameIdToFrame.delete(frame.id());
    if (frame._parentFrame)
      frame._parentFrame._children.delete(frame);
    frame._parentFrame = null;
    this.emit(FrameTree.Events.FrameDetached, frame);
  }
}

FrameTree.Events = {
  FrameAttached: 'frameattached',
  FrameDetached: 'framedetached',
  NavigationStarted: 'navigationstarted',
  NavigationCommitted: 'navigationcommitted',
  NavigationAborted: 'navigationaborted',
  SameDocumentNavigation: 'samedocumentnavigation',
};

class Frame {
  constructor(frameTree, docShell, parentFrame) {
    this._frameTree = frameTree;
    this._docShell = docShell;
    this._children = new Set();
    this._frameId = helper.generateId();
    this._parentFrame = null;
    this._url = '';
    if (parentFrame) {
      this._parentFrame = parentFrame;
      parentFrame._children.add(this);
    }

    this._lastCommittedNavigationId = null;
    this._pendingNavigationId = null;
    this._pendingNavigationURL = null;

    this._textInputProcessor = null;
  }

  textInputProcessor() {
    if (!this._textInputProcessor) {
      this._textInputProcessor = Cc["@mozilla.org/text-input-processor;1"].createInstance(Ci.nsITextInputProcessor);
      this._textInputProcessor.beginInputTransactionForTests(this._docShell.DOMWindow);
    }
    return this._textInputProcessor;
  }

  pendingNavigationId() {
    return this._pendingNavigationId;
  }

  pendingNavigationURL() {
    return this._pendingNavigationURL;
  }

  lastCommittedNavigationId() {
    return this._lastCommittedNavigationId;
  }

  docShell() {
    return this._docShell;
  }

  domWindow() {
    return this._docShell.DOMWindow;
  }

  name() {
    const frameElement = this._docShell.domWindow.frameElement;
    let name = '';
    if (frameElement)
      name = frameElement.getAttribute('name') || frameElement.getAttribute('id') || '';
    return name;
  }

  parentFrame() {
    return this._parentFrame;
  }

  id() {
    return this._frameId;
  }

  url() {
    return this._url;
  }
}

function getErrorStatusText(status) {
  if (!status)
    return null;
  for (const key of Object.keys(Cr)) {
    if (Cr[key] === status)
      return key;
  }
  // Security module. The following is taken from
  // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/How_to_check_the_secruity_state_of_an_XMLHTTPRequest_over_SSL
  if ((status & 0xff0000) === 0x5a0000) {
    // NSS_SEC errors (happen below the base value because of negative vals)
    if ((status & 0xffff) < Math.abs(Ci.nsINSSErrorsService.NSS_SEC_ERROR_BASE)) {
      // The bases are actually negative, so in our positive numeric space, we
      // need to subtract the base off our value.
      const nssErr = Math.abs(Ci.nsINSSErrorsService.NSS_SEC_ERROR_BASE) - (status & 0xffff);
      switch (nssErr) {
        case 11:
          return 'SEC_ERROR_EXPIRED_CERTIFICATE';
        case 12:
          return 'SEC_ERROR_REVOKED_CERTIFICATE';
        case 13:
          return 'SEC_ERROR_UNKNOWN_ISSUER';
        case 20:
          return 'SEC_ERROR_UNTRUSTED_ISSUER';
        case 21:
          return 'SEC_ERROR_UNTRUSTED_CERT';
        case 36:
          return 'SEC_ERROR_CA_CERT_INVALID';
        case 90:
          return 'SEC_ERROR_INADEQUATE_KEY_USAGE';
        case 176:
          return 'SEC_ERROR_CERT_SIGNATURE_ALGORITHM_DISABLED';
        default:
          return 'SEC_ERROR_UNKNOWN';
      }
    }
    const sslErr = Math.abs(Ci.nsINSSErrorsService.NSS_SSL_ERROR_BASE) - (status & 0xffff);
    switch (sslErr) {
      case 3:
        return 'SSL_ERROR_NO_CERTIFICATE';
      case 4:
        return 'SSL_ERROR_BAD_CERTIFICATE';
      case 8:
        return 'SSL_ERROR_UNSUPPORTED_CERTIFICATE_TYPE';
      case 9:
        return 'SSL_ERROR_UNSUPPORTED_VERSION';
      case 12:
        return 'SSL_ERROR_BAD_CERT_DOMAIN';
      default:
        return 'SSL_ERROR_UNKNOWN';
    }
  }
  return '<unknown error>';
}

var EXPORTED_SYMBOLS = ['FrameTree'];
this.FrameTree = FrameTree;

