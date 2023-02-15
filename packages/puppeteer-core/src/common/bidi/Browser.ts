/**
 * Copyright 2022 Google Inc. All rights reserved.
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

import {ChildProcess} from 'child_process';

import {
  Browser as BrowserBase,
  BrowserCloseCallback,
  BrowserContextOptions,
} from '../../api/Browser.js';
import {BrowserContext as BrowserContextBase} from '../../api/BrowserContext.js';

import {BrowserContext} from './BrowserContext.js';
import {Connection} from './Connection.js';

/**
 * @internal
 */
export class Browser extends BrowserBase {
  /**
   * @internal
   */
  static async create(opts: Options): Promise<Browser> {
    // TODO: await until the connection is established.
    try {
      // TODO: Add 'session.new' to BiDi types
      (await opts.connection.send('session.new' as any, {})) as unknown as {
        sessionId: string;
      };
    } catch {}
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
    this.#connection.dispose();
    await this.#closeCallback?.call(null);
  }

  override isConnected(): boolean {
    return !this.#connection.closed;
  }

  override process(): ChildProcess | null {
    return this.#process ?? null;
  }

  override async createIncognitoBrowserContext(
    _options?: BrowserContextOptions
  ): Promise<BrowserContextBase> {
    return new BrowserContext(this.#connection);
  }
}

interface Options {
  process?: ChildProcess;
  closeCallback?: BrowserCloseCallback;
  connection: Connection;
}
