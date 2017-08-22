/**
 * Copyright 2017 Google Inc. All rights reserved.
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

const http = require('http');
const await = require('./utilities').await;

class WebServer {
  constructor() {
    this._server = http.createServer();
    this.objectName = 'WebServer';
    this.listenOnPort = this.listen;
    this.newRequest = function(req, res) { };
    Object.defineProperty(this, 'port', {
      get: () => {
        if (!this._server.listening)
          return '';
        return this._server.address().port + '';
      },
      enumerable: true,
      configurable: false
    });
  }

  close() {
    this._server.close();
  }

  /**
     * @param {nubmer} port
     * @return {boolean}
     */
  listen(port, callback) {
    if (this._server.listening)
      return false;
    this.newRequest = callback;
    this._server.listen(port);
    const errorPromise = new Promise(x => this._server.once('error', x));
    const successPromise = new Promise(x => this._server.once('listening', x));
    await(Promise.race([errorPromise, successPromise]));
    if (!this._server.listening)
      return false;

    this._server.on('request', (req, res) => {
      res.close = res.end.bind(res);
      const headers = res.getHeaders();
      res.headers = [];
      for (const key in headers) {
        res.headers.push({
          name: key,
          value: headers[key]
        });
      }
      res.header = res.getHeader;
      res.setHeaders = headers => {
        for (const key in headers)
          res.setHeader(key, headers[key]);
      };
      Object.defineProperty(res, 'statusCode', {
        enumerable: true,
        configurable: true,
        writable: true,
        value: res.statusCode
      });
      this.newRequest.call(null, req, res);
    });
    return true;
  }
}

module.exports = WebServer;
