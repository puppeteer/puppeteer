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
const EventEmitter = require('events');
const {helper, debugError} = require('./helper');
const {ExecutionContext, JSHandle} = require('./ExecutionContext');

class Worker extends EventEmitter {
  /**
   * @param {Puppeteer.CDPSession} client
   * @param {string} url
   * @param {function(!Protocol.Log.entryAddedPayload)} logEntryAdded
   */
  constructor(client, url, logEntryAdded) {
    super();
    this._client = client;
    this._url = url;
    this._executionContextPromise = new Promise(x => this._executionContextCallback = x);
    this._client.once('Runtime.executionContextCreated', async event => {
      const jsHandleFactory = remoteObject => new JSHandle(executionContext, client, remoteObject);
      const executionContext = new ExecutionContext(client, event.context, jsHandleFactory, null);
      this._executionContextCallback(executionContext);
    });
    // This might fail if the target is closed before we recieve all execution contexts.
    this._client.send('Runtime.enable', {}).catch(debugError);

    this._client.on('Log.entryAdded', logEntryAdded);
    this._client.send('Log.enable', {}).catch(debugError);
  }

  /**
   * @return {string}
   */
  url() {
    return this._url;
  }

  /**
   * @return {!Promise<ExecutionContext>}
   */
  async executionContext() {
    return this._executionContextPromise;
  }
}

module.exports = Worker;
helper.tracePublicAPI(Worker);
