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

import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {
  Browser as BrowserBase,
  BrowserCloseCallback,
  BrowserContextOptions,
} from '../../api/Browser.js';
import {BrowserContext as BrowserContextBase} from '../../api/BrowserContext.js';
import {Viewport} from '../PuppeteerViewport.js';

import {BrowserContext} from './BrowserContext.js';
import {Connection} from './Connection.js';

/**
 * @internal
 */
export class Browser extends BrowserBase {
  static async create(opts: Options): Promise<Browser> {
    // TODO: await until the connection is established.
    try {
      await opts.connection.send('session.new', {});
    } catch {}
    await opts.connection.send('session.subscribe', {
      events: [
        'browsingContext.contextCreated',
      ] as Bidi.Session.SubscribeParametersEvent[],
    });
    return new Browser(opts);
  }

  #process?: ChildProcess;
  #closeCallback?: BrowserCloseCallback;
  #connection: Connection;
  #defaultViewport: Viewport | null;

  constructor(opts: Options) {
    super();
    this.#process = opts.process;
    this.#closeCallback = opts.closeCallback;
    this.#connection = opts.connection;
    this.#defaultViewport = opts.defaultViewport;
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
    return new BrowserContext(this.#connection, {
      defaultViewport: this.#defaultViewport,
    });
  }
}

interface Options {
  process?: ChildProcess;
  closeCallback?: BrowserCloseCallback;
  connection: Connection;
  defaultViewport: Viewport | null;
}
