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

const Browser = require('../../lib/Browser');
const path = require('path');
const SourceFactory = require('./SourceFactory');

const PROJECT_DIR = path.join(__dirname, '..', '..');

const RED_COLOR = '\x1b[31m';
const YELLOW_COLOR = '\x1b[33m';
const RESET_COLOR = '\x1b[0m';

run();

async function run() {
  const startTime = Date.now();

  const sourceFactory = new SourceFactory();
  /** @type {!Array<!Message>} */
  const messages = [];

  // Documentation checks.
  {
    const mdSources = await sourceFactory.readdir(path.join(PROJECT_DIR, 'docs'), '.md');
    const jsSources = await sourceFactory.readdir(path.join(PROJECT_DIR, 'lib'), '.js');
    const toc = require('./toc');
    messages.push(...await toc(mdSources));

    const browser = new Browser({args: ['--no-sandbox']});
    const page = await browser.newPage();
    const checkPublicAPI = require('./check_public_api');
    messages.push(...await checkPublicAPI(page, mdSources, jsSources));
    await browser.close();
  }

  // Report results.
  const errors = messages.filter(message => message.type === 'error');
  if (errors.length) {
    console.log('DocLint Failures:');
    for (let i = 0; i < errors.length; ++i) {
      let error = errors[i].text;
      error = error.split('\n').join('\n      ');
      console.log(`  ${i + 1}) ${RED_COLOR}${error}${RESET_COLOR}`);
    }
  }
  const warnings = messages.filter(message => message.type === 'warning');
  if (warnings.length) {
    console.log('DocLint Warnings:');
    for (let i = 0; i < warnings.length; ++i) {
      let warning = warnings[i].text;
      warning = warning.split('\n').join('\n      ');
      console.log(`  ${i + 1}) ${YELLOW_COLOR}${warning}${RESET_COLOR}`);
    }
  }
  await sourceFactory.saveChangedSources();
  console.log(`${errors.length} failures, ${warnings.length} warnings.`);
  const runningTime = Date.now() - startTime;
  console.log(`DocLint Finished in ${runningTime / 1000} seconds`);
  process.exit(errors.length + warnings.length > 0 ? 1 : 0);
}
