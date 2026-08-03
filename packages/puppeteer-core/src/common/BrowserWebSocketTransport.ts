/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type {ConnectionTransport} from './ConnectionTransport.js';
import {debugCatchError} from './util.js';

/**
 * @internal
 */
export class BrowserWebSocketTransport implements ConnectionTransport {
  static create(url: string): Promise<BrowserWebSocketTransport> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);

      ws.addEventListener('open', () => {
        return resolve(new BrowserWebSocketTransport(ws));
      });
      ws.addEventListener('error', reject);
    });
  }

  #ws: WebSocket;
  onmessage?: (message: string) => void;
  onclose?: () => void;

  #closed = false;

  constructor(ws: WebSocket) {
    this.#ws = ws;
    this.#ws.addEventListener('message', event => {
      if (this.onmessage) {
        this.onmessage.call(null, event.data);
      }
    });
    this.#ws.addEventListener('close', () => {
      this.#handleClose();
    });
    // Transport errors leave CDP callbacks hanging unless we close the
    // connection (see #13054). Log then tear down like a normal close.
    this.#ws.addEventListener('error', event => {
      debugCatchError(event);
      this.#handleClose();
    });
  }

  #handleClose(): void {
    if (this.#closed) {
      return;
    }
    this.#closed = true;
    if (this.onclose) {
      this.onclose.call(null);
    }
  }

  send(message: string): void {
    try {
      this.#ws.send(message);
    } catch (error) {
      debugCatchError(error);
      this.#handleClose();
      throw error;
    }
  }

  close(): void {
    this.#ws.close();
  }
}
