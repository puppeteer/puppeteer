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

import {Page as PageBase} from '../../api/Page.js';
import {Connection} from './Connection.js';
import type {EvaluateFunc} from '..//types.js';

/**
 * @internal
 */
export class Page extends PageBase {
  #connection: Connection;
  #contextId: string;

  constructor(connection: Connection, contextId: string) {
    super();
    this.#connection = connection;
    this.#contextId = contextId;
  }

  override async close(): Promise<void> {
    await this.#connection.send('browsingContext.close', {
      context: this.#contextId,
    });
  }

  override async evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    pageFunction: Func | string,
    ..._args: Params
  ): Promise<Awaited<ReturnType<Func>>> {
    // TODO: re-use evaluate logic from Execution context.
    const str = `(${pageFunction.toString()})()`;
    const result = (await this.#connection.send('script.evaluate', {
      expression: str,
      target: {context: this.#contextId},
      awaitPromise: true,
    })) as {result: {type: string; value: any}};
    return result.result.value;
  }
}
