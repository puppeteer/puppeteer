/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type {ConnectionTransport} from './ConnectionTransport.js';
import {DEBUG_PREFIXES, type Logger} from './Debug.js';

/**
 * @internal
 */
export class BrowserWebSocketTransport implements ConnectionTransport {
  static create(
    url: string,
    _headers: Record<string, string> | undefined,
    logger: Logger,
    // Accepted so this stays call-compatible with NodeWebSocketTransport, which
    // BrowserConnector picks between at runtime. The keep-alive options are
    // Node-only: the browser WebSocket API exposes no ping frame.
    _options?: {keepAlive?: boolean; keepAliveIntervalMs?: number},
  ): Promise<BrowserWebSocketTransport> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);

      ws.addEventListener('open', () => {
        return resolve(new BrowserWebSocketTransport(ws, logger));
      });
      ws.addEventListener('error', reject);
    });
  }

  #ws: WebSocket;
  #logger: Logger;
  onmessage?: (message: string) => void;
  onclose?: () => void;

  constructor(ws: WebSocket, logger: Logger) {
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
    this.#ws.addEventListener('error', () => {
      this.#logger?.(DEBUG_PREFIXES.error);
    });
  }

  send(message: string): void {
    this.#ws.send(message);
  }

  close(): void {
    this.#ws.close();
  }
}
