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

import {BrowserContext as BrowserContextBase} from '../../api/BrowserContext.js';
import {Page as PageBase} from '../../api/Page.js';
import {Connection} from './Connection.js';
import {Page} from './Page.js';

/**
 * @internal
 */
export class BrowserContext extends BrowserContextBase {
  #connection: Connection;

  constructor(connection: Connection) {
    super();
    this.#connection = connection;
  }

  override async newPage(): Promise<PageBase> {
    const result = await this.#connection.send('browsingContext.create', {
      type: 'tab',
    });
    return new Page(this.#connection, result.result.context);
  }

  override async close(): Promise<void> {}
}
