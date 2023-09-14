/**
 * Copyright 2020 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {type ConnectionTransport} from './ConnectionTransport.js';

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

  constructor(ws: WebSocket) {
    this.#ws = ws;
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
    // Silently ignore all errors - we don't know what to do with them.
    this.#ws.addEventListener('error', () => {});
  }

  send(message: string): void {
    this.#ws.send(message);
  }

  close(): void {
    this.#ws.close();
  }
}
