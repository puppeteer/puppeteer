/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const CC = Components.Constructor;

const ServerSocket = CC(
    "@mozilla.org/network/server-socket;1",
    "nsIServerSocket",
    "initSpecialConnection");

ChromeUtils.import("resource://gre/modules/Services.jsm");
ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");

const {DebuggerTransport} = ChromeUtils.import("chrome://juggler/content/server/transport.js", {});

const {KeepWhenOffline, LoopbackOnly} = Ci.nsIServerSocket;

this.EXPORTED_SYMBOLS = [
  "TCPConnection",
  "TCPListener",
];

class TCPListener {
  constructor() {
    this._socket = null;
    this._nextConnID = 0;
    this.onconnectioncreated = null;
    this.onconnectionclosed = null;
  }

  start(port) {
    if (this._socket)
      return;
    try {
      const flags = KeepWhenOffline | LoopbackOnly;
      const backlog = 1;
      this._socket = new ServerSocket(port, flags, backlog);
    } catch (e) {
      throw new Error(`Could not bind to port ${port} (${e.name})`);
    }
    this._socket.asyncListen(this);
    return this._socket.port;
  }

  stop() {
    if (!this._socket)
      return;
    // Note that closing the server socket will not close currently active
    // connections.
    this._socket.close();
    this._socket = null;
  }

  onSocketAccepted(serverSocket, clientSocket) {
    const input = clientSocket.openInputStream(0, 0, 0);
    const output = clientSocket.openOutputStream(0, 0, 0);
    const transport = new DebuggerTransport(input, output);

    const connection = new TCPConnection(this._nextConnID++, transport, () => {
      if (this.onconnectionclosed)
        this.onconnectionclosed.call(null, connection);
    });
    transport.ready();
    if (this.onconnectioncreated)
      this.onconnectioncreated.call(null, connection);
  }
}
this.TCPListener = TCPListener;

class TCPConnection {
  constructor(id, transport, closeCallback) {
    this._id = id;
    this._transport = transport;
    // transport hooks are TCPConnection#onPacket
    // and TCPConnection#onClosed
    this._transport.hooks = this;
    this._closeCallback = closeCallback;
    this.onmessage = null;
  }

  send(msg) {
    this._transport.send(msg);
  }

  onClosed() {
    this._closeCallback.call(null);
  }

  async onPacket(data) {
    if (this.onmessage)
      this.onmessage.call(null, data);
  }
}
this.TCPConnection = TCPConnection;
