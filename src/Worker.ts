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
import EventEmitter from 'events';
import {debugError} from './helper';
import {ExecutionContext} from './ExecutionContext';
import {JSHandle} from './JSHandle';

class Worker extends EventEmitter {
  _client: CDPSession
  _url: string
  /**
   * @param {Puppeteer.CDPSession} client
   * @param {string} url
   * @param {function(string, !Array<!JSHandle>, Protocol.Runtime.StackTrace=):void} consoleAPICalled
   * @param {function(!Protocol.Runtime.ExceptionDetails):void} exceptionThrown
   */
  constructor(client: CDPSession, url: string, consoleAPICalled: function(string, Array<JSHandle>, Protocol.Runtime.StackTrace=):void, exceptionThrown: function(Protocol.Runtime.ExceptionDetails):void) {
    super();
    this._client = client;
    this._url = url;
    this._executionContextPromise = new Promise(x => this._executionContextCallback = x);
    /** @type {function(!Protocol.Runtime.RemoteObject):!JSHandle} */
    let jsHandleFactory;
    this._client.once('Runtime.executionContextCreated', async event => {
      jsHandleFactory = remoteObject => new JSHandle(executionContext, client, remoteObject);
      const executionContext = new ExecutionContext(client, event.context, null);
      this._executionContextCallback(executionContext);
    });
    // This might fail if the target is closed before we recieve all execution contexts.
    this._client.send('Runtime.enable', {}).catch(debugError);

    this._client.on('Runtime.consoleAPICalled', event => consoleAPICalled(event.type, event.args.map(jsHandleFactory), event.stackTrace));
    this._client.on('Runtime.exceptionThrown', exception => exceptionThrown(exception.exceptionDetails));
  }

  /**
   * @return {string}
   */
  url(): string {
    return this._url;
  }

  /**
   * @return {!Promise<ExecutionContext>}
   */
  async executionContext(): Promise<ExecutionContext> {
    return this._executionContextPromise;
  }

  /**
   * @param {Function|string} pageFunction
   * @param {!Array<*>} args
   * @return {!Promise<*>}
   */
  async evaluate(pageFunction: Function|string, ...args: Array<any>): Promise<any> {
    return (await this._executionContextPromise).evaluate(pageFunction, ...args);
  }

  /**
   * @param {Function|string} pageFunction
   * @param {!Array<*>} args
   * @return {!Promise<!JSHandle>}
   */
  async evaluateHandle(pageFunction: Function|string, ...args: Array<any>): Promise<JSHandle> {
    return (await this._executionContextPromise).evaluateHandle(pageFunction, ...args);
  }
}

export {Worker};
