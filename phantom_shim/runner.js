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
var path = require('path');
var fs = require('fs');
var Phantom = require('./Phantom');
var FileSystem = require('./FileSystem');
var System = require('./System');
var WebPage = require('./WebPage');
var WebServer = require('./WebServer');
var child_process = require('child_process');
var Browser = require('..').Browser;
var version = require('../package.json').version;
var argv = require('minimist')(process.argv.slice(2), {
  alias: { v: 'version' },
  boolean: ['headless'],
  default: {'headless': true },
});

if (argv.version) {
  console.log('Puppeteer v' + version);
  return;
}

if (argv['ssl-certificates-path']) {
  console.error('Flag --ssl-certificates-path is not supported.');
  process.exit(1);
  return;
}

var scriptArguments = argv._;
if (!scriptArguments.length) {
  console.log(__filename.split('/').pop() + ' [scriptfile]');
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
  args: ['--no-sandbox']
});

var context = createPhantomContext(browser, scriptPath, argv);
var scriptContent = fs.readFileSync(scriptPath, 'utf8');
vm.runInContext(scriptContent, context);

/**
 * @param {!Browser} browser
 * @param {string} scriptPath
 * @param {!Array<string>} argv
 * @return {!Object}
 */
function createPhantomContext(browser, scriptPath, argv) {
  var context = {};
  context.setInterval = setInterval;
  context.setTimeout = setTimeout;
  context.clearInterval = clearInterval;
  context.clearTimeout = clearTimeout;

  context.phantom = Phantom.create(context, scriptPath);
  context.console = console;
  context.window = context;
  context.WebPage = options => new WebPage(browser, scriptPath, options);

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
  var bootstrapPath = path.join(__dirname, '..', 'third_party', 'phantomjs', 'bootstrap.js');
  var bootstrapCode = fs.readFileSync(bootstrapPath, 'utf8');
  vm.runInContext(bootstrapCode, context, {
    filename: 'bootstrap.js'
  })(nativeExports);
  return context;
}

