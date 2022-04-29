import type WebSocket from 'ws';
import { debug } from '../common/Debug.js';
const debugProtocolSend = debug('puppeteer:bidi:SEND ►');
const debugProtocolReceive = debug('puppeteer:bidi:RECV ◀');

let nextId = 1;

export class BiDiSession {
  #connection: WebSocket;

  #initResolver = (value: void): void => {};

  #initPromise = new Promise((resolve) => {
    this.#initResolver = resolve;
  });

  #callbacks = new Map();

  constructor() {
    import('ws').then((WebSocket) => {
      this.#connection = new WebSocket.default('ws://localhost:8081');
      this.#connection.on('open', () => this.#initResolver());
      this.#connection.on('message', this.onMessage.bind(this));
    });
  }

  async ready() {
    await this.#initPromise;
  }

  onMessage(message: any) {
    debugProtocolReceive(message);
    const parsed = JSON.parse(message);
    const id = parsed.id;
    if (!this.#callbacks.has(id)) {
      throw new Error('No callback for a response');
    }
    delete parsed.id;
    this.#callbacks.get(id)(parsed.result);
  }

  async send(method: string, params: unknown) {
    const currentId = nextId;
    nextId++;
    const value = JSON.stringify({
      method,
      params,
      id: currentId,
    });
    this.#connection.send(value);
    debugProtocolSend(value);
    let resolver: any;
    const p = new Promise((resolve) => {
      resolver = resolve;
    });
    this.#callbacks.set(currentId, resolver);
    return p;
  }
}
