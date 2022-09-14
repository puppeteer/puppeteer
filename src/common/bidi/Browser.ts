import {
  Browser as BrowserBase,
  BrowserCloseCallback,
} from '../../api/Browser.js';
import {Connection} from './Connection.js';
import {ChildProcess} from 'child_process';

/**
 * @internal
 */
export class Browser extends BrowserBase {
  /**
   * @internal
   */
  static async create(opts: Options): Promise<Browser> {
    // TODO: await until the connection is established.
    return new Browser(opts);
  }

  #process?: ChildProcess;
  #closeCallback?: BrowserCloseCallback;
  #connection: Connection;

  /**
   * @internal
   */
  constructor(opts: Options) {
    super();
    this.#process = opts.process;
    this.#closeCallback = opts.closeCallback;
    this.#connection = opts.connection;
  }

  override async close(): Promise<void> {
    await this.#closeCallback?.call(null);
    this.#connection.dispose();
  }

  override isConnected(): boolean {
    return !this.#connection.closed;
  }

  override process(): ChildProcess | null {
    return this.#process ?? null;
  }
}

interface Options {
  process?: ChildProcess;
  closeCallback?: BrowserCloseCallback;
  connection: Connection;
}
