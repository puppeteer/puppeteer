import {CDPSession, Connection as CDPPPtrConnection} from '../Connection.js';
import {Connection as BidiPPtrConnection} from './Connection.js';
/**
 * @internal
 */
import {Bidi, BidiMapper} from '../../../third_party/chromium-bidi/index.js';

/**
 * @internal
 */
import type {ProtocolMapping} from 'devtools-protocol/types/protocol-mapping.js';

/**
 * @internal
 */
type CdpEvents = {
  [Property in keyof ProtocolMapping.Events]: ProtocolMapping.Events[Property][0];
};

/**
 * @internal
 */
export async function connectBiDiOverCDP(
  cdp: CDPPPtrConnection
): Promise<BidiPPtrConnection> {
  const transportBiDi = new NoOpTransport();

  const cdpConnection = new CDPConnectionAdapter(cdp);

  let disposed = false;
  const pptrTransport = {
    send(message: string): void {
      if (disposed) {
        return;
      }
      transportBiDi.emitMessage(JSON.parse(message));
    },
    close(): void {
      disposed = true;
      bidiServer.close();
      cdp.dispose();
      cdpConnection.close();
    },
    onmessage(_message: string): void {},
  };

  transportBiDi.on('bidiResponse', (message: object) => {
    if (disposed) {
      return;
    }
    pptrTransport.onmessage(JSON.stringify(message));
  });

  const pptrBiDiConnection = new BidiPPtrConnection(pptrTransport);

  const bidiServer = await BidiMapper.BidiServer.createAndStart(
    transportBiDi,
    cdpConnection as any,
    ''
  );
  return pptrBiDiConnection;
}

/**
 * @internal
 */
class CDPConnectionAdapter {
  #cdp: CDPPPtrConnection;
  #adapters = new Map<CDPSession, CDPClientAdapter>();
  #browser: CDPClientConnectionAdapter;

  constructor(cdp: CDPPPtrConnection) {
    this.#cdp = cdp;
    this.#browser = new CDPClientConnectionAdapter(cdp);
  }

  browserClient(): CDPClientConnectionAdapter {
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
 * @internal
 */
class CDPClientAdapter extends BidiMapper.EventEmitter<CdpEvents> {
  #client: CDPSession;
  #closed = false;

  constructor(client: CDPSession) {
    super();
    this.#client = client;
    this.#client.on('*', (...args: any[]) => {
      this.emit(args[0], args[1]);
    });
  }

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
    this.#closed = true;
  }
}

/**
 * @internal
 */
class CDPClientConnectionAdapter extends BidiMapper.EventEmitter<CdpEvents> {
  #closed = false;
  #client: CDPPPtrConnection;

  constructor(client: CDPPPtrConnection) {
    super();
    this.#client = client;
    this.#client.on('*', (...args: any[]) => {
      this.emit(args[0], args[1]);
    });
  }

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
    this.#closed = true;
  }
}
/**
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
