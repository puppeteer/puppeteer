#!/usr/bin/env node
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
var fs = require('fs');
var path = require('path');
var Browser = require('./lib/Browser');
var argv = require('minimist')(process.argv.slice(2), {
    alias: { v: 'version' },
    boolean: ['headless'],
    default: {'headless': true },
});

if (argv.version) {
    console.log('Puppeteer v' + require('./package.json').version);
    return;
}

if (argv['ssl-certificates-path']) {
    console.error('Flag --ssl-certificates-path is not currently supported.\nMore information at https://github.com/aslushnikov/puppeteer/issues/1');
    process.exit(1);
    return;
}

var scriptArguments = argv._;
if (!scriptArguments.length) {
    console.log('puppeteer [scriptfile]');
    return;
}

var scriptPath = path.resolve(process.cwd(), scriptArguments[0]);
if (!fs.existsSync(scriptPath)) {
    console.error(`script not found: ${scriptPath}`);
    process.exit(1);
    return;
}

var browser = new Browser({
        remoteDebuggingPort: 9229,
        headless: argv.headless,
});

var PhatomJs = require('./phantomjs');
var context = PhatomJs.createContext(browser, scriptPath, argv);
var scriptContent = fs.readFileSync(scriptPath, 'utf8');
vm.runInContext(scriptContent, context);
