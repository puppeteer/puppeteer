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

let http = require('http');
let url = require('url');
let fs = require('fs');
let path = require('path');
let mime = require('mime');
let WebSocketServer = require('websocket').server;

class StaticServer {
  /**
   * @param {string} dirPath
   * @param {number} port
   */
  constructor(dirPath, port) {
    this._server = http.createServer(this._onRequest.bind(this));
    this._wsServer = new WebSocketServer({httpServer: this._server});
    this._wsServer.on('request', this._onWebSocketRequest.bind(this));
    this._server.listen(port);
    this._dirPath = dirPath;
  }

  stop() {
    this._server.close();
  }

  _finishFileRequest(response, pathName) {
    fs.readFile(pathName, function(err, data) {
      if (err) {
        response.statusCode = 404;
        response.end(`File not found: ${pathName}`);
        return;
      }
      response.setHeader('Content-Type', mime.lookup(pathName));
      response.end(data);
    });
  }

  _onRequest(request, response) {
    const parsedUrl = url.parse(request.url);
    let pathName = parsedUrl.path;
    if (pathName === '/')
      pathName = '/index.html';
    pathName = path.join(this._dirPath, pathName.substring(1));
    if (parsedUrl.query && /delay=\d/.test(parsedUrl.query)) {
      const delay = Number(parsedUrl.query.match(/delay=(\d+)/)[1]);
      setTimeout(() => this._finishFileRequest(response, pathName), delay);
    } else {
      this._finishFileRequest(response, pathName);
    }
  }

  _onWebSocketRequest(request) {
    request.accept();
  }
}

module.exports = StaticServer;
