"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToBrowser = void 0;
const Browser_js_1 = require("./Browser.js");
const assert_js_1 = require("./assert.js");
const helper_js_1 = require("../common/helper.js");
const Connection_js_1 = require("./Connection.js");
const fetch_js_1 = require("./fetch.js");
const environment_js_1 = require("../environment.js");
const getWebSocketTransportClass = async () => {
    return environment_js_1.isNode
        ? (await Promise.resolve().then(() => __importStar(require('../node/NodeWebSocketTransport.js')))).NodeWebSocketTransport
        : (await Promise.resolve().then(() => __importStar(require('./BrowserWebSocketTransport.js'))))
            .BrowserWebSocketTransport;
};
/**
 * Users should never call this directly; it's called when calling
 * `puppeteer.connect`.
 * @internal
 */
const connectToBrowser = async (options) => {
    const { browserWSEndpoint, browserURL, ignoreHTTPSErrors = false, defaultViewport = { width: 800, height: 600 }, transport, slowMo = 0, } = options;
    assert_js_1.assert(Number(!!browserWSEndpoint) + Number(!!browserURL) + Number(!!transport) ===
        1, 'Exactly one of browserWSEndpoint, browserURL or transport must be passed to puppeteer.connect');
    let connection = null;
    if (transport) {
        connection = new Connection_js_1.Connection('', transport, slowMo);
    }
    else if (browserWSEndpoint) {
        const WebSocketClass = await getWebSocketTransportClass();
        const connectionTransport = await WebSocketClass.create(browserWSEndpoint);
        connection = new Connection_js_1.Connection(browserWSEndpoint, connectionTransport, slowMo);
    }
    else if (browserURL) {
        const connectionURL = await getWSEndpoint(browserURL);
        const WebSocketClass = await getWebSocketTransportClass();
        const connectionTransport = await WebSocketClass.create(connectionURL);
        connection = new Connection_js_1.Connection(connectionURL, connectionTransport, slowMo);
    }
    const { browserContextIds } = await connection.send('Target.getBrowserContexts');
    return Browser_js_1.Browser.create(connection, browserContextIds, ignoreHTTPSErrors, defaultViewport, null, () => connection.send('Browser.close').catch(helper_js_1.debugError));
};
exports.connectToBrowser = connectToBrowser;
async function getWSEndpoint(browserURL) {
    const endpointURL = new URL('/json/version', browserURL);
    const fetch = await fetch_js_1.getFetch();
    try {
        const result = await fetch(endpointURL.toString(), {
            method: 'GET',
        });
        if (!result.ok) {
            throw new Error(`HTTP ${result.statusText}`);
        }
        const data = await result.json();
        return data.webSocketDebuggerUrl;
    }
    catch (error) {
        error.message =
            `Failed to fetch browser webSocket URL from ${endpointURL}: ` +
                error.message;
        throw error;
    }
}
//# sourceMappingURL=BrowserConnector.js.map