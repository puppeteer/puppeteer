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
const {NetworkManager} = require('./NetworkManager');

class Worker extends EventEmitter {
  /**
   * @param {Puppeteer.CDPSession} client
   * @param {string} url
   * @param {function(!string, !Array<!JSHandle>)} consoleAPICalled
   */
  constructor(client, url, consoleAPICalled) {
    super();
    this._client = client;
    this._url = url;
    this._executionContextPromise = new Promise(x => this._executionContextCallback = x);
    this._networkManager = new NetworkManager(client, null);
    /** @type {function(!Protocol.Runtime.RemoteObject):!JSHandle} */
    let jsHandleFactory;
    this._client.once('Runtime.executionContextCreated', async event => {
      jsHandleFactory = remoteObject => new JSHandle(executionContext, client, remoteObject);
      const executionContext = new ExecutionContext(client, event.context, jsHandleFactory, null);
      this._executionContextCallback(executionContext);
    });

    this._client.on('Runtime.consoleAPICalled', event => consoleAPICalled(event.type, event.args.map(jsHandleFactory)));

    this._networkManager.on(NetworkManager.Events.Request, event => this.emit(Worker.Events.Request, event));
    this._networkManager.on(NetworkManager.Events.Response, event => this.emit(Worker.Events.Response, event));
    this._networkManager.on(NetworkManager.Events.RequestFailed, event => this.emit(Worker.Events.RequestFailed, event));
    this._networkManager.on(NetworkManager.Events.RequestFinished, event => this.emit(Worker.Events.RequestFinished, event));

    // This might fail if the target is closed before we recieve all execution contexts.
    Promise.all([
      client.send('Network.enable', {}),
      client.send('Runtime.enable', {}),
    ]).catch(debugError);
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

  /**
   * @param {function()|string} pageFunction
   * @param {!Array<*>} args
   * @return {!Promise<*>}
   */
  async evaluate(pageFunction, ...args) {
    return (await this._executionContextPromise).evaluate(pageFunction, ...args);
  }

  /**
   * @param {function()|string} pageFunction
   * @param {!Array<*>} args
   * @return {!Promise<!JSHandle>}
   */
  async evaluateHandle(pageFunction, ...args) {
    return (await this._executionContextPromise).evaluateHandle(pageFunction, ...args);
  }
}

Worker.Events = {
  Request: 'request',
  Response: 'response',
  RequestFailed: 'requestfailed',
  RequestFinished: 'requestfinished',
};

module.exports = Worker;
helper.tracePublicAPI(Worker);
