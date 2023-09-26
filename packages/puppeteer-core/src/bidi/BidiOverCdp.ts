/**
 * Copyright 2023 Google Inc. All rights reserved.
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

import * as BidiMapper from 'chromium-bidi/lib/cjs/bidiMapper/bidiMapper.js';
import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';
import type {ProtocolMapping} from 'devtools-protocol/types/protocol-mapping.js';

import type {CDPEvents, CDPSession} from '../api/CDPSession.js';
import type {Connection as CdpConnection} from '../cdp/Connection.js';
import {TargetCloseError} from '../common/Errors.js';
import type {Handler} from '../common/EventEmitter.js';

import {BidiConnection} from './Connection.js';

/**
 * @internal
 */
export async function connectBidiOverCdp(
  cdp: CdpConnection
): Promise<BidiConnection> {
  const transportBiDi = new NoOpTransport();
  const cdpConnectionAdapter = new CdpConnectionAdapter(cdp);
  const pptrTransport = {
    send(message: string): void {
      // Forwards a BiDi command sent by Puppeteer to the input of the BidiServer.
      transportBiDi.emitMessage(JSON.parse(message));
    },
    close(): void {
      bidiServer.close();
      cdpConnectionAdapter.close();
    },
    onmessage(_message: string): void {
      // The method is overridden by the Connection.
    },
  };
  transportBiDi.on('bidiResponse', (message: object) => {
    // Forwards a BiDi event sent by BidiServer to Puppeteer.
    pptrTransport.onmessage(JSON.stringify(message));
  });
  const pptrBiDiConnection = new BidiConnection(cdp.url(), pptrTransport);
  const bidiServer = await BidiMapper.BidiServer.createAndStart(
    transportBiDi,
    cdpConnectionAdapter,
    ''
  );
  return pptrBiDiConnection;
}

/**
 * Manages CDPSessions for BidiServer.
 * @internal
 */
class CdpConnectionAdapter {
  #cdp: CdpConnection;
  #adapters = new Map<CDPSession, CDPClientAdapter<CDPSession>>();
  #browser: CDPClientAdapter<CdpConnection>;

  constructor(cdp: CdpConnection) {
    this.#cdp = cdp;
    this.#browser = new CDPClientAdapter(cdp);
  }

  browserClient(): CDPClientAdapter<CdpConnection> {
    return this.#browser;
  }

  getCdpClient(id: string) {
    const session = this.#cdp.session(id);
    if (!session) {
      throw new Error('Unknown CDP session with id' + id);
    }
    if (!this.#adapters.has(session)) {
      const adapter = new CDPClientAdapter(session, id, this.#browser);
      this.#adapters.set(session, adapter);
      return adapter;
    }
    return this.#adapters.get(session)!;
  }

  close() {
    this.#browser.close();
    for (const adapter of this.#adapters.values()) {
      adapter.close();
    }
  }
}

/**
 * Wrapper on top of CDPSession/CDPConnection to satisfy CDP interface that
 * BidiServer needs.
 *
 * @internal
 */
class CDPClientAdapter<T extends CDPSession | CdpConnection>
  extends BidiMapper.EventEmitter<CDPEvents>
  implements BidiMapper.CdpClient
{
  #closed = false;
  #client: T;
  sessionId: string | undefined = undefined;
  #browserClient?: BidiMapper.CdpClient;

  constructor(
    client: T,
    sessionId?: string,
    browserClient?: BidiMapper.CdpClient
  ) {
    super();
    this.#client = client;
    this.sessionId = sessionId;
    this.#browserClient = browserClient;
    this.#client.on('*', this.#forwardMessage as Handler<any>);
  }

  browserClient(): BidiMapper.CdpClient {
    return this.#browserClient!;
  }

  #forwardMessage = <T extends keyof CDPEvents>(
    method: T,
    event: CDPEvents[T]
  ) => {
    this.emit(method, event);
  };

  async sendCommand<T extends keyof ProtocolMapping.Commands>(
    method: T,
    ...params: ProtocolMapping.Commands[T]['paramsType']
  ): Promise<ProtocolMapping.Commands[T]['returnType']> {
    if (this.#closed) {
      return;
    }
    try {
      return await this.#client.send(method, ...params);
    } catch (err) {
      if (this.#closed) {
        return;
      }
      throw err;
    }
  }

  close() {
    this.#client.off('*', this.#forwardMessage as Handler<any>);
    this.#closed = true;
  }

  isCloseError(error: any): boolean {
    return error instanceof TargetCloseError;
  }
}

/**
 * This transport is given to the BiDi server instance and allows Puppeteer
 * to send and receive commands to the BiDiServer.
 * @internal
 */
class NoOpTransport
  extends BidiMapper.EventEmitter<any>
  implements BidiMapper.BidiTransport
{
  #onMessage: (message: Bidi.ChromiumBidi.Command) => Promise<void> | void =
    async (_m: Bidi.ChromiumBidi.Command): Promise<void> => {
      return;
    };

  emitMessage(message: Bidi.ChromiumBidi.Command) {
    void this.#onMessage(message);
  }

  setOnMessage(
    onMessage: (message: Bidi.ChromiumBidi.Command) => Promise<void> | void
  ): void {
    this.#onMessage = onMessage;
  }

  async sendMessage(message: Bidi.ChromiumBidi.Message): Promise<void> {
    this.emit('bidiResponse', message);
  }

  close() {
    this.#onMessage = async (_m: Bidi.ChromiumBidi.Command): Promise<void> => {
      return;
    };
  }
}
