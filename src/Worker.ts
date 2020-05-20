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
import { EventEmitter } from 'events';
import { debugError } from './helper';
import { ExecutionContext } from './ExecutionContext';
import { JSHandle } from './JSHandle';
import { CDPSession } from './Connection';
import Protocol from './protocol';

type ConsoleAPICalledCallback = (
  eventType: string,
  handles: JSHandle[],
  trace: Protocol.Runtime.StackTrace
) => void;
type ExceptionThrownCallback = (
  details: Protocol.Runtime.ExceptionDetails
) => void;
type JSHandleFactory = (obj: Protocol.Runtime.RemoteObject) => JSHandle;

export class Worker extends EventEmitter {
  _client: CDPSession;
  _url: string;
  _executionContextPromise: Promise<ExecutionContext>;
  _executionContextCallback: (value: ExecutionContext) => void;

  constructor(
    client: CDPSession,
    url: string,
    consoleAPICalled: ConsoleAPICalledCallback,
    exceptionThrown: ExceptionThrownCallback
  ) {
    super();
    this._client = client;
    this._url = url;
    this._executionContextPromise = new Promise<ExecutionContext>(
      (x) => (this._executionContextCallback = x)
    );

    let jsHandleFactory: JSHandleFactory;
    this._client.once('Runtime.executionContextCreated', async (event) => {
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      jsHandleFactory = (remoteObject) =>
        new JSHandle(executionContext, client, remoteObject);
      const executionContext = new ExecutionContext(
        client,
        event.context,
        null
      );
      this._executionContextCallback(executionContext);
    });

    // This might fail if the target is closed before we recieve all execution contexts.
    this._client.send('Runtime.enable', {}).catch(debugError);
    this._client.on('Runtime.consoleAPICalled', (event) =>
      consoleAPICalled(
        event.type,
        event.args.map(jsHandleFactory),
        event.stackTrace
      )
    );
    this._client.on('Runtime.exceptionThrown', (exception) =>
      exceptionThrown(exception.exceptionDetails)
    );
  }

  url(): string {
    return this._url;
  }

  async executionContext(): Promise<ExecutionContext> {
    return this._executionContextPromise;
  }

  async evaluate<ReturnType extends any>(
    pageFunction: Function | string,
    ...args: any[]
  ): Promise<ReturnType> {
    return (await this._executionContextPromise).evaluate<ReturnType>(
      pageFunction,
      ...args
    );
  }

  async evaluateHandle(
    pageFunction: Function | string,
    ...args: any[]
  ): Promise<JSHandle> {
    return (await this._executionContextPromise).evaluateHandle(
      pageFunction,
      ...args
    );
  }
}
