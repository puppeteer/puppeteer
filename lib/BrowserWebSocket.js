/* global WebSocket */

const EventEmitter = require('events');

module.exports = class BrowserWebSocket extends EventEmitter {
  constructor(url) {
    super();
    this._ws = new WebSocket(url);
    this._ws.addEventListener('open', event => this.emit('open'));
    this._ws.addEventListener('close', event => this.emit('close'));
    this._ws.addEventListener('error', event => this.emit('error', new Error(event.message)));
    this._ws.addEventListener('message', event => this.emit('message', event.data));
  }

  send(message) {
    this._ws.send(message);
  }

  close() {
    this._ws.close();
  }
};
