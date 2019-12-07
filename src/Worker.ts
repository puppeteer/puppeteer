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

import {EventEmitter} from 'events';
import {debugError} from './helper';
import {ExecutionContext} from './ExecutionContext';
import {JSHandle} from './JSHandle';
import { CDPSession } from './Connection';
import { JSEvalable, EvaluateFn, SerializableOrJSHandle, EvaluateFnReturnType } from './types';
import { Protocol } from './protocol';

export class Worker extends EventEmitter implements JSEvalable {
  _client: CDPSession
  _url: string
  _executionContextPromise: Promise<ExecutionContext>
  _executionContextCallback!: (context: ExecutionContext) => void

  constructor(client: CDPSession, url: string, consoleAPICalled: (name: string, args: Array<JSHandle>, stack?: Protocol.Runtime.StackTrace) => void, exceptionThrown: (details: Protocol.Runtime.ExceptionDetails) => void) {
    super();
    this._client = client;
    this._url = url;
    this._executionContextPromise = new Promise<ExecutionContext>(x => this._executionContextCallback = x);
    let jsHandleFactory: (remoteObject: Protocol.Runtime.RemoteObject) => JSHandle;
    this._client.once('Runtime.executionContextCreated', async event => {
      jsHandleFactory = remoteObject => new JSHandle(executionContext, client, remoteObject);
      const executionContext = new ExecutionContext(client, event.context, undefined);
      this._executionContextCallback(executionContext);
    });
    // This might fail if the target is closed before we recieve all execution contexts.
    this._client.send('Runtime.enable', {}).catch(debugError);

    this._client.on('Runtime.consoleAPICalled', event => consoleAPICalled(event.type, event.args.map(jsHandleFactory), event.stackTrace));
    this._client.on('Runtime.exceptionThrown', exception => exceptionThrown(exception.exceptionDetails));
  }

  url(): string {
    return this._url;
  }

  async executionContext(): Promise<ExecutionContext> {
    return this._executionContextPromise;
  }

  async evaluate<V extends EvaluateFn<any>>(pageFunction: V, ...args: SerializableOrJSHandle[]): Promise<EvaluateFnReturnType<V>> {
    return (await this._executionContextPromise).evaluate(pageFunction, ...args);
  }

  async evaluateHandle<V extends EvaluateFn<any>>(
    pageFunction: V,
    ...args: SerializableOrJSHandle[]
  ): Promise<JSHandle<EvaluateFnReturnType<V>>> {
    return (await this._executionContextPromise).evaluateHandle(pageFunction, ...args);
  }
}
