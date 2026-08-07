/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import NodeWebSocket from 'ws';

import type {ConnectionTransport} from '../common/ConnectionTransport.js';
import {DEBUG_PREFIXES, type Logger} from '../common/Debug.js';
import {packageVersion} from '../util/version.js';

/**
 * @internal
 */
export class NodeWebSocketTransport implements ConnectionTransport {
  static create(
    url: string,
    headers: Record<string, string> | undefined,
    logger: Logger,
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
        return resolve(new NodeWebSocketTransport(ws, logger));
      });
      ws.addEventListener('error', reject);
    });
  }

  #ws: NodeWebSocket;
  #logger: Logger;
  onmessage?: (message: NodeWebSocket.Data) => void;
  onclose?: () => void;

  constructor(ws: NodeWebSocket, logger: Logger) {
    this.#ws = ws;
    this.#logger = logger;
    this.#ws.addEventListener('message', event => {
      if (this.onmessage) {
        this.onmessage.call(null, event.data);
      }
    });
    this.#ws.addEventListener('close', () => {
      if (this.onclose) {
        this.onclose.call(null);
      }
    });
    // Silently log all errors - we don't know what to do with them.
    this.#ws.addEventListener('error', err => {
      this.#logger?.(DEBUG_PREFIXES.error)?.(err);
    });
  }

  send(message: string): void {
    this.#ws.send(message);
  }

  close(): void {
    this.#ws.close();
  }
}
