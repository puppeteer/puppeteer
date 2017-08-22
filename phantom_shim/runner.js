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

const await = require('./utilities').await;
const vm = require('vm');
const path = require('path');
const fs = require('fs');
const Phantom = require('./Phantom');
const FileSystem = require('./FileSystem');
const System = require('./System');
const WebPage = require('./WebPage');
const WebServer = require('./WebServer');
const child_process = require('child_process');
const puppeteer = require('..');
const argv = require('minimist')(process.argv.slice(2), {
  alias: { v: 'version' },
  boolean: ['headless'],
  default: {'headless': true },
});

if (argv.version) {
  console.log('PhantomShim v' + Phantom.version.join('.'));
  return;
}

if (argv['ssl-certificates-path']) {
  console.error('Flag --ssl-certificates-path is not supported.');
  process.exit(1);
  return;
}

const scriptArguments = argv._;
if (!scriptArguments.length) {
  console.log(__filename.split('/').pop() + ' [scriptfile]');
  return;
}

const scriptPath = path.resolve(process.cwd(), scriptArguments[0]);
if (!fs.existsSync(scriptPath)) {
  console.error(`script not found: ${scriptPath}`);
  process.exit(1);
  return;
}

const context = createPhantomContext(argv.headless, scriptPath, argv);
const scriptContent = fs.readFileSync(scriptPath, 'utf8');
vm.runInContext(scriptContent, context);

/**
 * @param {boolean} headless
 * @param {string} scriptPath
 * @param {!Array<string>} argv
 * @return {!Object}
 */
function createPhantomContext(headless, scriptPath, argv) {
  const context = {};
  let browser = null;
  context.setInterval = setInterval;
  context.setTimeout = setTimeout;
  context.clearInterval = clearInterval;
  context.clearTimeout = clearTimeout;

  context.phantom = Phantom.create(context, scriptPath);
  context.console = console;
  context.window = context;
  context.WebPage = options => new WebPage(ensureBrowser(), scriptPath, options);

  vm.createContext(context);

  const nativeExports = {
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
  const bootstrapPath = path.join(__dirname, '..', 'third_party', 'phantomjs', 'bootstrap.js');
  const bootstrapCode = fs.readFileSync(bootstrapPath, 'utf8');
  vm.runInContext(bootstrapCode, context, {
    filename: 'bootstrap.js'
  })(nativeExports);
  return context;

  function ensureBrowser() {
    if (!browser) {
      browser = await(puppeteer.launch({
        headless: argv.headless,
        args: ['--no-sandbox']
      }));
    }
    return browser;
  }
}

