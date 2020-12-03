/**
 * Copyright 2020 Google Inc. All rights reserved.
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

'use strict';

const puppeteer = require('..');
const WebSocketServer = require('websocket').server;

const uuid = require('uuid').v4;
const http = require('http');

const port = process.env.PORT || 8080;

const server = http.createServer(function (request, response) {
  console.log((new Date()) + ' Received request for ' + request.url);
  response.writeHead(404);
  response.end();
});
server.listen(port, function () {
  console.log(`${new Date()} Server is listening on port ${port}`);
});

const wsServer = new WebSocketServer({
  httpServer: server,
  // You should not use autoAcceptConnections for production
  // applications, as it defeats all standard cross-origin protection
  // facilities built into the protocol and the browser.  You should
  // *always* verify the connection's origin and decide whether or not
  // to accept it.
  autoAcceptConnections: false
});

function originIsAllowed(origin) {
  console.log("origin: ", origin);
  return true;
}

const sessions = {};

wsServer.on('request', function (request) {
  if (!originIsAllowed(request.origin)) {
    // Make sure we only accept requests from an allowed origin
    request.reject();
    console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
    return;
  }

  try {
    var connection = request.accept();
  } catch (e) {
    console.log("Connection rejected: ", e);
    console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
    return;
   }

  console.log((new Date()) + ' Connection accepted.');
  connection.on('message', async function (message) {
    console.log('message: ', message);
    if (message.type === 'utf8' ) {
      console.log('Received Message: ' + message.utf8Data);

      let parsedMessage;
      try {
        parsedMessage = JSON.parse(message.utf8Data);
      } catch (e) {
        console.log("Cannot parse JSON: ", e);
        connection.sendUTF("Didn't get ya (");
        return;
      }

      const messageId = parsedMessage.id;
      let sessionID = parsedMessage.sessionID;
      let pageID = parsedMessage.pageID;

      const response = {};
      if (!!messageId) {
        response.id = messageId;
      }
      if (!!sessionID) {
        response.sessionID = sessionID;
      }
      if (!!pageID) {
        response.pageID = pageID;
      }

      let browser, page;
      switch (parsedMessage.method) {
        case "launch":
          browser = await puppeteer.launch({ headless: false });

          sessionID = uuid();
          sessions[sessionID] = {
            browser: browser,
            pages: {}
          };
          response.sessionID = sessionID;
          break;
        case "newPage":
          if (!(sessionID in sessions)) {
            response.message = 'missing sessionID';
            break;
          }

          browser = sessions[sessionID].browser;
          page = await browser.newPage();

          pageID = uuid();
          sessions[sessionID].pages[pageID] = page;

          response.pageID = pageID;
          response.message = 'done';
          break;
        case "goto":
          if (!(sessionID in sessions)) {
            response.message = 'missing sessionID';
            break;
          }
          if (!(pageID in sessions[sessionID].pages)) {
            response.message = 'missing sessionID';
            break;
          }
          let params = parsedMessage.params;
          if (!params) {
            response.message = 'missing params';
            break;
          }
          if (!params.url) {
            response.message = 'missing params.url';
            break;
          }

          page = sessions[sessionID].pages[pageID];
          await page.goto(params.url);
          response.message = 'done';
          break;
        case "screenshot":
          if (!(sessionID in sessions)) {
            response.message = 'missing sessionID';
            break;
          }
          if (!(pageID in sessions[sessionID].pages)) {
            response.message = 'missing sessionID';
            break;
          }

          page = sessions[sessionID].pages[pageID];
          let screenshot = await page.screenshot({ encoding: 'base64'});
          response.screenshot = screenshot;
          response.message = 'done';
          break;
        default:
          response.message = 'unknown method `' + parsedMessage.method+'`';
      }

      const responseStr = JSON.stringify(response);

      console.log('Sent response: ' + responseStr);

      connection.sendUTF(responseStr);
    } else {
      connection.sendUTF("Didn't get ya (");
    }
  });
  connection.on('close', function (reasonCode, description) {
    console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
  });
});
