const {helper} = require('./helper');
const util = require('util');
const EventEmitter = require('events');
const {Events} = require('./Events');

class NetworkManager extends EventEmitter {
  constructor(session) {
    super();
    this._session = session;

    this._requests = new Map();
    this._frameManager = null;

    this._eventListeners = [
      helper.addEventListener(session, 'Page.requestWillBeSent', this._onRequestWillBeSent.bind(this)),
      helper.addEventListener(session, 'Page.responseReceived', this._onResponseReceived.bind(this)),
      helper.addEventListener(session, 'Page.requestFinished', this._onRequestFinished.bind(this)),
    ];
  }

  setFrameManager(frameManager) {
    this._frameManager = frameManager;
  }

  _onRequestWillBeSent(event) {
    const redirected = event.redirectedFrom ? this._requests.get(event.redirectedFrom) : null;
    const frame = redirected ? redirected.frame() : (this._frameManager && event.frameId ? this._frameManager.frame(event.frameId) : null);
    if (!frame)
      return;
    let redirectChain = [];
    if (redirected) {
      redirectChain = redirected._redirectChain;
      redirectChain.push(redirected);
      this._requests.delete(redirected._id);
    }
    const request = new Request(frame, redirectChain, event);
    this._requests.set(request._id, request);
    this.emit(Events.NetworkManager.Request, request);
  }

  _onResponseReceived(event) {
    const request = this._requests.get(event.requestId);
    if (!request)
      return;
    const response = new Response(request, event);
    request._response = response;
    this.emit(Events.NetworkManager.Response, response);
  }

  _onRequestFinished(event) {
    const request = this._requests.get(event.requestId);
    if (!request)
      return;
    // Keep redirected requests in the map for future reference in redirectChain.
    const isRedirected = request.response().status() >= 300 && request.response().status() <= 399;
    if (!isRedirected)
      this._requests.delete(request._id);
    this.emit(Events.NetworkManager.RequestFinished, request);
  }

  dispose() {
    helper.removeEventListeners(this._eventListeners);
  }
}

/**
 *
 * document, stylesheet, image, media, font, script, texttrack, xhr, fetch, eventsource, websocket, manifest, other.
 */
const causeToResourceType = {
  TYPE_INVALID: 'other',
  TYPE_OTHER: 'other',
  TYPE_SCRIPT: 'script',
  TYPE_IMAGE: 'image',
  TYPE_STYLESHEET: 'stylesheet',
  TYPE_OBJECT: 'other',
  TYPE_DOCUMENT: 'document',
  TYPE_SUBDOCUMENT: 'document',
  TYPE_REFRESH: 'document',
  TYPE_XBL: 'other',
  TYPE_PING: 'other',
  TYPE_XMLHTTPREQUEST: 'xhr',
  TYPE_OBJECT_SUBREQUEST: 'other',
  TYPE_DTD: 'other',
  TYPE_FONT: 'font',
  TYPE_MEDIA: 'media',
  TYPE_WEBSOCKET: 'websocket',
  TYPE_CSP_REPORT: 'other',
  TYPE_XSLT: 'other',
  TYPE_BEACON: 'other',
  TYPE_FETCH: 'fetch',
  TYPE_IMAGESET: 'images',
  TYPE_WEB_MANIFEST: 'manifest',
};

class Request {
  constructor(frame, redirectChain, payload) {
    this._frame = frame;
    this._id = payload.requestId;
    this._redirectChain = redirectChain;
    this._url = payload.url;
    this._response = null;
    this._isNavigationRequest = payload.isNavigationRequest;
    this._method = payload.method;
    this._resourceType = causeToResourceType[payload.cause] || 'other';
    this._headers = {};
    for (const {name, value} of payload.headers)
      this._headers[name.toLowerCase()] = value;
  }

  headers() {
    return {...this._headers};
  }

  redirectChain() {
    return this._redirectChain.slice();
  }

  resourceType() {
    return this._resourceType;
  }

  url() {
    return this._url;
  }

  method() {
    return this._method;
  }

  isNavigationRequest() {
    return this._isNavigationRequest;
  }

  frame() {
    return this._frame;
  }

  response() {
    return this._response;
  }
}

class Response {
  constructor(request, payload) {
    this._request = request;
    this._remoteIPAddress = payload.remoteIPAddress;
    this._remotePort = payload.remotePort;
    this._status = payload.status;
    this._statusText = payload.statusText;
    this._headers = {};
    this._securityDetails = payload.securityDetails ? new SecurityDetails(payload.securityDetails) : null;
    for (const {name, value} of payload.headers)
      this._headers[name.toLowerCase()] = value;
  }

  securityDetails() {
    return this._securityDetails;
  }

  headers() {
    return {...this._headers};
  }

  status() {
    return this._status;
  }

  statusText() {
    return this._statusText;
  }

  ok() {
    return this._status >= 200 && this._status <= 299;
  }

  remoteAddress() {
    return {
      ip: this._remoteIPAddress,
      port: this._remotePort,
    };
  }

  frame() {
    return this._request.frame();
  }

  url() {
    return this._request.url();
  }

  request() {
    return this._request;
  }
}

class SecurityDetails {
  /**
   * @param {!Protocol.Network.SecurityDetails} securityPayload
   */
  constructor(securityPayload) {
    this._subjectName = securityPayload['subjectName'];
    this._issuer = securityPayload['issuer'];
    this._validFrom = securityPayload['validFrom'];
    this._validTo = securityPayload['validTo'];
    this._protocol = securityPayload['protocol'];
  }

  /**
   * @return {string}
   */
  subjectName() {
    return this._subjectName;
  }

  /**
   * @return {string}
   */
  issuer() {
    return this._issuer;
  }

  /**
   * @return {number}
   */
  validFrom() {
    return this._validFrom;
  }

  /**
   * @return {number}
   */
  validTo() {
    return this._validTo;
  }

  /**
   * @return {string}
   */
  protocol() {
    return this._protocol;
  }
}


module.exports = {NetworkManager, Request, Response, SecurityDetails};
