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

var vm = require('vm');
var path = require('path');
var fs = require('fs');
var Phantom = require('./Phantom');
var FileSystem = require('./FileSystem');
var System = require('./System');
var WebPage = require('./WebPage');
var WebServer = require('./WebServer');
var child_process = require('child_process');

var bootstrapPath = path.join(__dirname, '..', 'third_party', 'phantomjs', 'bootstrap.js');
var bootstrapCode = fs.readFileSync(bootstrapPath, 'utf8');

module.exports = {
    /**
     * @param {!Browser} browser
     * @param {string} scriptPath
     * @param {!Array<string>} argv
     * @return {!Object}
     */
    createContext(browser, scriptPath, argv) {
        var context = {};
        context.setInterval = setInterval;
        context.setTimeout = setTimeout;
        context.clearInterval = clearInterval;
        context.clearTimeout = clearTimeout;

        context.phantom = Phantom.create(context, scriptPath);
        context.console = console;
        context.window = context;
        context.WebPage = (options) => new WebPage(browser, scriptPath, options);

        vm.createContext(context);

        var nativeExports = {
            fs: new FileSystem(),
            system: new System(argv._),
            webpage: {
                create: context.WebPage,
            },
            webserver: {
                create: () => new WebServer(),
            },
            cookiejar: {
                create: () => {},
            },
            child_process: child_process
        };
        vm.runInContext(bootstrapCode, context, {
            filename: 'bootstrap.js'
        })(nativeExports);
        return context;
    }
}

