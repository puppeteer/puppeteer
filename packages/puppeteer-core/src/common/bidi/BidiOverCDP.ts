import {CDPSession, Connection as CDPPPtrConnection} from '../Connection.js';
import {Connection as BidiPPtrConnection} from './Connection.js';
import {Bidi, BidiMapper} from '../../../third_party/chromium-bidi/index.js';
import type {ProtocolMapping} from 'devtools-protocol/types/protocol-mapping.js';
import {Handler} from '../EventEmitter.js';

type CdpEvents = {
  [Property in keyof ProtocolMapping.Events]: ProtocolMapping.Events[Property][0];
};

/**
 * @internal
 */
export async function connectBidiOverCDP(
  cdp: CDPPPtrConnection
): Promise<BidiPPtrConnection> {
  const transportBiDi = new NoOpTransport();
  const cdpConnectionAdapter = new CDPConnectionAdapter(cdp);
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
      // The method is overriden by the Connection.
    },
  };
  transportBiDi.on('bidiResponse', (message: object) => {
    // Forwards a BiDi event sent by BidiServer to Puppeteer.
    pptrTransport.onmessage(JSON.stringify(message));
  });
  const pptrBiDiConnection = new BidiPPtrConnection(pptrTransport);
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
class CDPConnectionAdapter {
  #cdp: CDPPPtrConnection;
  #adapters = new Map<CDPSession, CDPClientAdapter<CDPSession>>();
  #browser: CDPClientAdapter<CDPPPtrConnection>;

  constructor(cdp: CDPPPtrConnection) {
    this.#cdp = cdp;
    this.#browser = new CDPClientAdapter(cdp);
  }

  browserClient(): CDPClientAdapter<CDPPPtrConnection> {
    return this.#browser;
  }

  getCdpClient(id: string) {
    const session = this.#cdp.session(id);
    if (!session) {
      throw new Error('Unknonw CDP session with id' + id);
    }
    if (!this.#adapters.has(session)) {
      const adapter = new CDPClientAdapter(session);
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
 * Wrapper on top of CDPSession/CDPConnection to satisify CDP interface that
 * BidiServer needs.
 *
 * @internal
 */
class CDPClientAdapter<
  T extends Pick<CDPPPtrConnection, 'send' | 'on' | 'off'>
> extends BidiMapper.EventEmitter<CdpEvents> {
  #closed = false;
  #client: T;

  constructor(client: T) {
    super();
    this.#client = client;
    this.#client.on('*', this.#forwardMessage as Handler<any>);
  }

  #forwardMessage = (
    method: keyof ProtocolMapping.Events,
    event: ProtocolMapping.Events[keyof ProtocolMapping.Events]
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
  #onMessage: (message: Bidi.Message.RawCommandRequest) => Promise<void> =
    async (_m: Bidi.Message.RawCommandRequest): Promise<void> => {
      return;
    };

  emitMessage(message: Bidi.Message.RawCommandRequest) {
    this.#onMessage(message);
  }

  setOnMessage(
    onMessage: (message: Bidi.Message.RawCommandRequest) => Promise<void>
  ): void {
    this.#onMessage = onMessage;
  }

  async sendMessage(message: Bidi.Message.OutgoingMessage): Promise<void> {
    this.emit('bidiResponse', message);
  }

  close() {
    this.#onMessage = async (
      _m: Bidi.Message.RawCommandRequest
    ): Promise<void> => {
      return;
    };
  }
}
