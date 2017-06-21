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

var http = require('http');
var url = require('url');
var fs = require('fs');
var path = require('path');
var mime = require('mime');

class StaticServer {
    /**
     * @param {string} dirPath
     * @param {number} port
     */
    constructor(dirPath, port) {
        this._server = http.createServer(this._onRequest.bind(this));
        this._server.listen(port);
        this._dirPath = dirPath;
    }

    stop() {
        this._server.close();
    }

    _onRequest(request, response) {
        var pathName = url.parse(request.url).path;
        if (pathName === '/')
            pathName = '/index.html';
        pathName = path.join(this._dirPath, pathName.substring(1));
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
}

module.exports = StaticServer;
