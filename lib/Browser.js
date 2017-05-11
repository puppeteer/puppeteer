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

var CDP = require('chrome-remote-interface');
var http = require('http');
var path = require('path');
var removeRecursive = require('rimraf').sync;
var Page = require('./Page');
var childProcess = require('child_process');
var Downloader = require('./Downloader');

var CHROME_PROFILE_PATH = path.resolve(__dirname, '..', '.dev_profile');
var browserId = 0;

var DEFAULT_ARGS = [
    '--disable-background-timer-throttling',
    '--no-first-run',
];

class Browser {
    /**
     * @param {(!Object|undefined)} options
     */
    constructor(options) {
        options = options || {};
        ++browserId;
        this._userDataDir = CHROME_PROFILE_PATH + browserId;
        this._remoteDebuggingPort = 9229;
        if (typeof options.remoteDebuggingPort === 'number')
            this._remoteDebuggingPort = options.remoteDebuggingPort;
        this._chromeArguments = DEFAULT_ARGS.concat([
            `--user-data-dir=${this._userDataDir}`,
            `--remote-debugging-port=${this._remoteDebuggingPort}`,
        ]);
        if (typeof options.headless !== 'boolean' || options.headless) {
            this._chromeArguments.push(...[
                `--headless`,
                `--disable-gpu`,
            ]);
        }
        if (typeof options.executablePath === 'string') {
            this._chromeExecutable = options.executablePath;
        } else {
            var chromiumRevision = require('../package.json').puppeteer.chromium_revision;
            this._chromeExecutable = Downloader.executablePath(chromiumRevision);
        }
        if (Array.isArray(options.args))
            this._chromeArguments.push(...options.args);
        this._chromeProcess = null;
        this._tabSymbol = Symbol('Browser.TabSymbol');
    }

    /**
     * @return {!Promise<!Page>}
     */
    async newPage() {
        await this._ensureChromeIsRunning();
        if (!this._chromeProcess || this._chromeProcess.killed)
            throw new Error('ERROR: this chrome instance is not alive any more!');
        var tab = await CDP.New({port: this._remoteDebuggingPort});
        var client = await CDP({tab: tab, port: this._remoteDebuggingPort});
        var page = await Page.create(this, client);
        page[this._tabSymbol] = tab;
        return page;
    }

    /**
     * @param {!Page} page
     */
    async closePage(page) {
        if (!this._chromeProcess || this._chromeProcess.killed)
            throw new Error('ERROR: this chrome instance is not running');
        var tab = page[this._tabSymbol];
        if (!tab)
            throw new Error('ERROR: page does not belong to this chrome instance');
        await CDP.Close({id: tab.id, port: this._remoteDebuggingPort});
    }

    /**
     * @return {string}
     */
    async version() {
        await this._ensureChromeIsRunning();
        var version = await CDP.Version({port: this._remoteDebuggingPort});
        return version.Browser;
    }

    async _ensureChromeIsRunning() {
        if (this._chromeProcess)
            return;
        this._chromeProcess = childProcess.spawn(this._chromeExecutable, this._chromeArguments, {});
        // Cleanup as processes exit.
        process.on('exit', () => this._chromeProcess.kill());
        this._chromeProcess.on('exit', () => removeRecursive(this._userDataDir));

        await waitForChromeResponsive(this._remoteDebuggingPort);
    }

    close() {
        if (!this._chromeProcess)
            return;
        this._chromeProcess.kill();
    }
}

module.exports = Browser;

function waitForChromeResponsive(remoteDebuggingPort) {
    var fulfill;
    var promise = new Promise(x => fulfill = x);
    var options = {
        method: 'GET',
        host: 'localhost',
        port: remoteDebuggingPort,
        path: '/json/list'
    };
    var probeTimeout = 100;
    var probeAttempt = 1;
    sendRequest();
    return promise;

    function sendRequest() {
        var req = http.request(options, res => {
            fulfill()
        });
        req.on('error', e => setTimeout(sendRequest, probeTimeout));
        req.end();
    }
}
