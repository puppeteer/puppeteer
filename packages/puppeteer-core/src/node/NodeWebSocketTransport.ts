/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import NodeWebSocket from 'ws';

import type {ConnectionTransport} from '../common/ConnectionTransport.js';
import {debugCatchError} from '../common/util.js';
import {packageVersion} from '../util/version.js';

/**
 * @internal
 */
export class NodeWebSocketTransport implements ConnectionTransport {
  static create(
    url: string,
    headers?: Record<string, string>,
  ): Promise<NodeWebSocketTransport> {
    return new Promise((resolve, reject) => {
      const ws = new NodeWebSocket(url, [], {
        followRedirects: true,
        perMessageDeflate: false,
        allowSynchronousEvents: false,
        maxPayload: 256 * 1024 * 1024, // 256Mb
        headers: {
          'User-Agent': `Puppeteer ${packageVersion}`,
          ...headers,
        },
      });

      ws.addEventListener('open', () => {
        return resolve(new NodeWebSocketTransport(ws));
      });
      ws.addEventListener('error', reject);
    });
  }

  #ws: NodeWebSocket;
  #closed = false;
  onmessage?: (message: NodeWebSocket.Data) => void;
  onclose?: () => void;

  constructor(ws: NodeWebSocket) {
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
