"use strict";
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;

const {Helper} = ChromeUtils.import('chrome://juggler/content/Helper.js');
const {NetUtil} = ChromeUtils.import('resource://gre/modules/NetUtil.jsm');

const helper = new Helper();

class PageAgent {
  constructor(session, runtimeAgent, frameTree, scrollbarManager) {
    this._session = session;
    this._runtime = runtimeAgent;
    this._frameTree = frameTree;
    this._scrollbarManager = scrollbarManager;

    this._frameToExecutionContext = new Map();
    this._scriptsToEvaluateOnNewDocument = new Map();

    this._eventListeners = [];
    this._enabled = false;

    const docShell = frameTree.mainFrame().docShell();
    this._initialDPPX = docShell.contentViewer.overrideDPPX;
    this._customScrollbars = null;
  }

  async awaitViewportDimensions({width, height}) {
    const win = this._frameTree.mainFrame().domWindow();
    if (win.innerWidth === width && win.innerHeight === height)
      return;
    await new Promise(resolve => {
      const listener = helper.addEventListener(win, 'resize', () => {
        if (win.innerWidth === width && win.innerHeight === height) {
          helper.removeListeners([listener]);
          resolve();
        }
      });
    });
  }

  async setViewport({deviceScaleFactor, isMobile, hasTouch}) {
    const docShell = this._frameTree.mainFrame().docShell();
    docShell.contentViewer.overrideDPPX = deviceScaleFactor || this._initialDPPX;
    docShell.deviceSizeIsPageSize = isMobile;
    docShell.touchEventsOverride = hasTouch ? Ci.nsIDocShell.TOUCHEVENTS_OVERRIDE_ENABLED : Ci.nsIDocShell.TOUCHEVENTS_OVERRIDE_NONE;
    this._scrollbarManager.setFloatingScrollbars(isMobile);
  }

  addScriptToEvaluateOnNewDocument({script}) {
    const scriptId = helper.generateId();
    this._scriptsToEvaluateOnNewDocument.set(scriptId, script);
    return {scriptId};
  }

  removeScriptToEvaluateOnNewDocument({scriptId}) {
    this._scriptsToEvaluateOnNewDocument.delete(scriptId);
  }

  enable() {
    if (this._enabled)
      return;

    this._enabled = true;
    this._eventListeners = [
      helper.addObserver(this._consoleAPICalled.bind(this),  "console-api-log-event"),
      helper.addEventListener(this._session.mm(), 'DOMContentLoaded', this._onDOMContentLoaded.bind(this)),
      helper.addEventListener(this._session.mm(), 'pageshow', this._onLoad.bind(this)),
      helper.addEventListener(this._session.mm(), 'DOMWindowCreated', this._onDOMWindowCreated.bind(this)),
      helper.addEventListener(this._session.mm(), 'error', this._onError.bind(this)),
      helper.on(this._frameTree, 'frameattached', this._onFrameAttached.bind(this)),
      helper.on(this._frameTree, 'framedetached', this._onFrameDetached.bind(this)),
      helper.on(this._frameTree, 'navigationstarted', this._onNavigationStarted.bind(this)),
      helper.on(this._frameTree, 'navigationcommitted', this._onNavigationCommitted.bind(this)),
      helper.on(this._frameTree, 'navigationaborted', this._onNavigationAborted.bind(this)),
      helper.on(this._frameTree, 'samedocumentnavigation', this._onSameDocumentNavigation.bind(this)),
    ];

    // Dispatch frameAttached events for all initial frames
    for (const frame of this._frameTree.frames()) {
      this._onFrameAttached(frame);
      if (frame.url())
        this._onNavigationCommitted(frame);
      if (frame.pendingNavigationId())
        this._onNavigationStarted(frame);
    }
  }

  _onDOMContentLoaded(event) {
    const docShell = event.target.ownerGlobal.docShell;
    const frame = this._frameTree.frameForDocShell(docShell);
    if (!frame)
      return;
    this._session.emitEvent('Page.eventFired', {
      frameId: frame.id(),
      name: 'DOMContentLoaded',
    });
  }

  _onError(errorEvent) {
    const docShell = errorEvent.target.ownerGlobal.docShell;
    const frame = this._frameTree.frameForDocShell(docShell);
    if (!frame)
      return;
    this._session.emitEvent('Page.uncaughtError', {
      frameId: frame.id(),
      message: errorEvent.message,
      stack: errorEvent.error.stack
    });
  }

  _onLoad(event) {
    const docShell = event.target.ownerGlobal.docShell;
    const frame = this._frameTree.frameForDocShell(docShell);
    if (!frame)
      return;
    this._session.emitEvent('Page.eventFired', {
      frameId: frame.id(),
      name: 'load'
    });
  }

  _onNavigationStarted(frame) {
    this._session.emitEvent('Page.navigationStarted', {
      frameId: frame.id(),
      navigationId: frame.pendingNavigationId(),
      url: frame.pendingNavigationURL(),
    });
  }

  _onNavigationAborted(frame, navigationId, errorText) {
    this._session.emitEvent('Page.navigationAborted', {
      frameId: frame.id(),
      navigationId,
      errorText,
    });
  }

  _onSameDocumentNavigation(frame) {
    this._session.emitEvent('Page.sameDocumentNavigation', {
      frameId: frame.id(),
      url: frame.url(),
    });
  }

  _onNavigationCommitted(frame) {
    const context = this._frameToExecutionContext.get(frame);
    if (context) {
      this._runtime.destroyExecutionContext(context);
      this._frameToExecutionContext.delete(frame);
    }
    this._session.emitEvent('Page.navigationCommitted', {
      frameId: frame.id(),
      navigationId: frame.lastCommittedNavigationId(),
      url: frame.url(),
      name: frame.name(),
    });
  }

  _onDOMWindowCreated(event) {
    if (!this._scriptsToEvaluateOnNewDocument.size)
      return;
    const docShell = event.target.ownerGlobal.docShell;
    const frame = this._frameTree.frameForDocShell(docShell);
    if (!frame)
      return;
    const executionContext = this._ensureExecutionContext(frame);
    for (const script of this._scriptsToEvaluateOnNewDocument.values()) {
      try {
        let result = executionContext.evaluateScript(script);
        if (result && result.objectId)
          executionContext.disposeObject(result.objectId);
      } catch (e) {
      }
    }
  }

  _onFrameAttached(frame) {
    this._session.emitEvent('Page.frameAttached', {
      frameId: frame.id(),
      parentFrameId: frame.parentFrame() ? frame.parentFrame().id() : undefined,
    });
  }

  _onFrameDetached(frame) {
    this._session.emitEvent('Page.frameDetached', {
      frameId: frame.id(),
    });
  }

  _ensureExecutionContext(frame) {
    let executionContext = this._frameToExecutionContext.get(frame);
    if (!executionContext) {
      executionContext = this._runtime.createExecutionContext(frame.domWindow());
      this._frameToExecutionContext.set(frame, executionContext);
    }
    return executionContext;
  }

  dispose() {
    helper.removeListeners(this._eventListeners);
  }

  _consoleAPICalled({wrappedJSObject}, topic, data) {
    const levelToType = {
      'dir': 'dir',
      'log': 'log',
      'debug': 'debug',
      'info': 'info',
      'error': 'error',
      'warn': 'warning',
      'dirxml': 'dirxml',
      'table': 'table',
      'trace': 'trace',
      'clear': 'clear',
      'group': 'startGroup',
      'groupCollapsed': 'startGroupCollapsed',
      'groupEnd': 'endGroup',
      'assert': 'assert',
      'profile': 'profile',
      'profileEnd': 'profileEnd',
      'count': 'count',
      'countReset': 'countReset',
      'time': null,
      'timeLog': 'timeLog',
      'timeEnd': 'timeEnd',
      'timeStamp': 'timeStamp',
    };
    const type = levelToType[wrappedJSObject.level];
    if (!type) return;
    let messageFrame = null;
    for (const frame of this._frameTree.frames()) {
      const domWindow = frame.domWindow();
      if (domWindow && domWindow.windowUtils.currentInnerWindowID === wrappedJSObject.innerID) {
        messageFrame = frame;
        break;
      }
    }
    if (!messageFrame)
      return;
    const executionContext = this._ensureExecutionContext(messageFrame);
    const args = wrappedJSObject.arguments.map(arg => executionContext.rawValueToRemoteObject(arg));
    this._session.emitEvent('Page.consoleAPICalled', {args, type, frameId: messageFrame.id()});
  }

  async navigate({frameId, url}) {
    try {
      const uri = NetUtil.newURI(url);
    } catch (e) {
      throw new Error(`Invalid url: "${url}"`);
    }
    const frame = this._frameTree.frame(frameId);
    const docShell = frame.docShell();
    docShell.loadURI(url, Ci.nsIWebNavigation.LOAD_FLAGS_NONE, null /* referrer */, null /* postData */, null /* headers */);
    return {navigationId: frame.pendingNavigationId(), navigationURL: frame.pendingNavigationURL()};
  }

  async reload({frameId, url}) {
    const frame = this._frameTree.frame(frameId);
    const docShell = frame.docShell();
    docShell.reload(Ci.nsIWebNavigation.LOAD_FLAGS_NONE);
    return {navigationId: frame.pendingNavigationId(), navigationURL: frame.pendingNavigationURL()};
  }

  async goBack({frameId, url}) {
    const frame = this._frameTree.frame(frameId);
    const docShell = frame.docShell();
    if (!docShell.canGoBack)
      return {navigationId: null, navigationURL: null};
    docShell.goBack();
    return {navigationId: frame.pendingNavigationId(), navigationURL: frame.pendingNavigationURL()};
  }

  async goForward({frameId, url}) {
    const frame = this._frameTree.frame(frameId);
    const docShell = frame.docShell();
    if (!docShell.canGoForward)
      return {navigationId: null, navigationURL: null};
    docShell.goForward();
    return {navigationId: frame.pendingNavigationId(), navigationURL: frame.pendingNavigationURL()};
  }

  async disposeObject({frameId, objectId}) {
    const frame = this._frameTree.frame(frameId);
    if (!frame)
      throw new Error('Failed to find frame with id = ' + frameId);
    const executionContext = this._ensureExecutionContext(frame);
    return executionContext.disposeObject(objectId);
  }

  getContentQuads({objectId, frameId}) {
    const frame = this._frameTree.frame(frameId);
    if (!frame)
      throw new Error('Failed to find frame with id = ' + frameId);
    const executionContext = this._ensureExecutionContext(frame);
    const unsafeObject = executionContext.unsafeObject(objectId);
    if (!unsafeObject.getBoxQuads)
      throw new Error('RemoteObject is not a node');
    const quads = unsafeObject.getBoxQuads({relativeTo: this._frameTree.mainFrame().domWindow().document}).map(quad => {
      return {
        p1: {x: quad.p1.x, y: quad.p1.y},
        p2: {x: quad.p2.x, y: quad.p2.y},
        p3: {x: quad.p3.x, y: quad.p3.y},
        p4: {x: quad.p4.x, y: quad.p4.y},
      };
    });
    return {quads};
  }

  async getBoundingBox({frameId, objectId}) {
    const frame = this._frameTree.frame(frameId);
    if (!frame)
      throw new Error('Failed to find frame with id = ' + frameId);
    const executionContext = this._ensureExecutionContext(frame);
    const unsafeObject = executionContext.unsafeObject(objectId);
    if (!unsafeObject.getBoxQuads)
      throw new Error('RemoteObject is not a node');
    const quads = unsafeObject.getBoxQuads({relativeTo: this._frameTree.mainFrame().domWindow().document});
    if (!quads.length)
      return null;
    let x1 = Infinity;
    let y1 = Infinity;
    let x2 = -Infinity;
    let y2 = -Infinity;
    for (const quad of quads) {
      const boundingBox = quad.getBounds();
      x1 = Math.min(boundingBox.x, x1);
      y1 = Math.min(boundingBox.y, y1);
      x2 = Math.max(boundingBox.x + boundingBox.width, x2);
      y2 = Math.max(boundingBox.y + boundingBox.height, y2);
    }
    return {x: x1 + frame.domWindow().scrollX, y: y1 + frame.domWindow().scrollY, width: x2 - x1, height: y2 - y1};
  }

  async evaluate({frameId, functionText, args, script, returnByValue}) {
    const frame = this._frameTree.frame(frameId);
    if (!frame)
      throw new Error('Failed to find frame with id = ' + frameId);
    const executionContext = this._ensureExecutionContext(frame);
    const exceptionDetails = {};
    let result = null;
    if (script)
      result = await executionContext.evaluateScript(script, exceptionDetails);
    else
      result = await executionContext.evaluateFunction(functionText, args, exceptionDetails);
    if (!result)
      return {exceptionDetails};
    let isNode = undefined;
    if (returnByValue)
      result = executionContext.ensureSerializedToValue(result);
    return {result};
  }

  async getObjectProperties({frameId, objectId}) {
    const frame = this._frameTree.frame(frameId);
    if (!frame)
      throw new Error('Failed to find frame with id = ' + frameId);
    const executionContext = this._ensureExecutionContext(frame);
    return {properties: executionContext.getObjectProperties(objectId)};
  }

  async screenshot({mimeType, fullPage, frameId, objectId, clip}) {
    const content = this._session.mm().content;
    if (clip) {
      const data = takeScreenshot(content, clip.x, clip.y, clip.width, clip.height, mimeType);
      return {data};
    }
    if (fullPage) {
      const rect = content.document.documentElement.getBoundingClientRect();
      const width = content.innerWidth + content.scrollMaxX - content.scrollMinX;
      const height = content.innerHeight + content.scrollMaxY - content.scrollMinY;
      const data = takeScreenshot(content, 0, 0, width, height, mimeType);
      return {data};
    }
    const data = takeScreenshot(content, content.scrollX, content.scrollY, content.innerWidth, content.innerHeight, mimeType);
    return {data};
  }

  async dispatchKeyEvent({type, keyCode, code, key, repeat, location}) {
    const frame = this._frameTree.mainFrame();
    const tip = frame.textInputProcessor();
    let keyEvent = new (frame.domWindow().KeyboardEvent)("", {
      key,
      code,
      location,
      repeat,
      keyCode
    });
    const flags = 0;
    if (type === 'keydown')
      tip.keydown(keyEvent, flags);
    else if (type === 'keyup')
      tip.keyup(keyEvent, flags);
    else
      throw new Error(`Unknown type ${type}`);
  }

  async dispatchMouseEvent({type, x, y, button, clickCount, modifiers, buttons}) {
    const frame = this._frameTree.mainFrame();
    frame.domWindow().windowUtils.sendMouseEvent(
      type,
      x,
      y,
      button,
      clickCount,
      modifiers,
      false /*aIgnoreRootScrollFrame*/,
      undefined /*pressure*/,
      undefined /*inputSource*/,
      undefined /*isDOMEventSynthesized*/,
      undefined /*isWidgetEventSynthesized*/,
      buttons);
    if (type === 'mousedown' && button === 2) {
      frame.domWindow().windowUtils.sendMouseEvent(
        'contextmenu',
        x,
        y,
        button,
        clickCount,
        modifiers,
        false /*aIgnoreRootScrollFrame*/,
        undefined /*pressure*/,
        undefined /*inputSource*/,
        undefined /*isDOMEventSynthesized*/,
        undefined /*isWidgetEventSynthesized*/,
        buttons);
    }
  }

  async insertText({text}) {
    const frame = this._frameTree.mainFrame();
    frame.textInputProcessor().commitCompositionWith(text);
  }
}

function takeScreenshot(win, left, top, width, height, mimeType) {
  const MAX_SKIA_DIMENSIONS = 32767;

  const scale = win.devicePixelRatio;
  const canvasWidth = width * scale;
  const canvasHeight = height * scale;

  if (canvasWidth > MAX_SKIA_DIMENSIONS || canvasHeight > MAX_SKIA_DIMENSIONS)
    throw new Error('Cannot take screenshot larger than ' + MAX_SKIA_DIMENSIONS);

  const canvas = win.document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  let ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  ctx.drawWindow(win, left, top, width, height, 'rgb(255,255,255)', ctx.DRAWWINDOW_DRAW_CARET);
  const dataURL = canvas.toDataURL(mimeType);
  return dataURL.substring(dataURL.indexOf(',') + 1);
};

var EXPORTED_SYMBOLS = ['PageAgent'];
this.PageAgent = PageAgent;

