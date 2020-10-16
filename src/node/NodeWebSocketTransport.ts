/**
 * Copyright 2018 Google Inc. All rights reserved.
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
import { ConnectionTransport } from '../common/ConnectionTransport.js';
import NodeWebSocket from 'ws';

export class NodeWebSocketTransport implements ConnectionTransport {
  static create(url: string): Promise<NodeWebSocketTransport> {
    return new Promise((resolve, reject) => {
      const ws = new NodeWebSocket(url, [], {
        perMessageDeflate: false,
        maxPayload: 256 * 1024 * 1024, // 256Mb
      });

      ws.addEventListener('open', () =>
        resolve(new NodeWebSocketTransport(ws))
      );
      ws.addEventListener('error', reject);
    });
  }

  private _ws: NodeWebSocket;
  onmessage?: (message: string) => void;
  onclose?: () => void;

  constructor(ws: NodeWebSocket) {
    this._ws = ws;
    this._ws.addEventListener('message', (event) => {
      if (this.onmessage) this.onmessage.call(null, event.data);
    });
    this._ws.addEventListener('close', () => {
      if (this.onclose) this.onclose.call(null);
    });
    // Silently ignore all errors - we don't know what to do with them.
    this._ws.addEventListener('error', () => {});
    this.onmessage = null;
    this.onclose = null;
  }

  send(message: string): void {
    this._ws.send(message);
  }

  close(): void {
    this._ws.close();
  }
}
