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

// eslint-disable-next-line import/extensions
const puppeteer = require('../..');
const path = require('path');
const Source = require('./Source.js');

const PROJECT_DIR = path.join(__dirname, '..', '..');
const VERSION = require(path.join(PROJECT_DIR, 'package.json')).version;

const RED_COLOR = '\x1b[31m';
const BLUE_COLOR = '\x1b[34m';
const YELLOW_COLOR = '\x1b[33m';
const RESET_COLOR = '\x1b[0m';

const IS_RELEASE = Boolean(process.env.IS_RELEASE);

run();

async function run() {
  const startTime = Date.now();

  /** @type {!Array<!Message>} */
  const messages = [];
  let changedFiles = false;

  if (IS_RELEASE) {
    const versions = await Source.readFile(
      path.join(PROJECT_DIR, 'versions.js')
    );
    versions.setText(
      versions.text().replace(`, 'NEXT'],`, `, 'v${VERSION}'],`)
    );
    await versions.save();
  }

  // Documentation checks.
  const readme = await Source.readFile(path.join(PROJECT_DIR, 'README.md'));
  const contributing = await Source.readFile(
    path.join(PROJECT_DIR, 'CONTRIBUTING.md')
  );
  const api = await Source.readFile(path.join(PROJECT_DIR, 'docs', 'api.md'));
  const troubleshooting = await Source.readFile(
    path.join(PROJECT_DIR, 'docs', 'troubleshooting.md')
  );
  const mdSources = [readme, api, troubleshooting, contributing];

  const preprocessor = require('./preprocessor/index.js');
  messages.push(
    ...(await preprocessor.runCommands(mdSources, VERSION, IS_RELEASE))
  );
  messages.push(
    ...(await preprocessor.ensureReleasedAPILinks(
      [readme],
      VERSION,
      IS_RELEASE
    ))
  );

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const checkPublicAPI = require('./check_public_api/index.js');
  const tsSources = [
    /* Source.readdir doesn't deal with nested directories well.
     * Rather than invest time here when we're going to remove this Doc tooling soon
     * we'll just list the directories manually.
     */
    ...(await Source.readdir(path.join(PROJECT_DIR, 'src'), 'ts')),
    ...(await Source.readdir(path.join(PROJECT_DIR, 'src', 'common'), 'ts')),
    ...(await Source.readdir(path.join(PROJECT_DIR, 'src', 'node'), 'ts')),
  ];

  const tsSourcesNoDefinitions = tsSources.filter(
    (source) => !source.filePath().endsWith('.d.ts')
  );

  const jsSources = [
    ...(await Source.readdir(path.join(PROJECT_DIR, 'lib'))),
    ...(await Source.readdir(path.join(PROJECT_DIR, 'lib', 'cjs'))),
    ...(await Source.readdir(
      path.join(PROJECT_DIR, 'lib', 'cjs', 'puppeteer', 'common')
    )),
    ...(await Source.readdir(
      path.join(PROJECT_DIR, 'lib', 'cjs', 'puppeteer', 'node')
    )),
  ];
  const allSrcCode = [...jsSources, ...tsSourcesNoDefinitions];
  messages.push(...(await checkPublicAPI(page, mdSources, allSrcCode)));

  await browser.close();

  for (const source of mdSources) {
    if (!source.hasUpdatedText()) continue;
    await source.save();
    changedFiles = true;
  }

  // Report results.
  const errors = messages.filter((message) => message.type === 'error');
  if (errors.length) {
    console.log('DocLint Failures:');
    for (let i = 0; i < errors.length; ++i) {
      const text = errors[i].text.split('\n').join('\n      ');
      console.log(`  ${i + 1}) ${RED_COLOR}${text}${RESET_COLOR}`);
    }
  }
  const warnings = messages.filter((message) => message.type === 'warning');
  if (warnings.length) {
    console.log('DocLint Warnings:');
    for (let i = 0; i < warnings.length; ++i) {
      const text = warnings[i].text.split('\n').join('\n      ');
      console.log(`  ${i + 1}) ${YELLOW_COLOR}${text}${RESET_COLOR}`);
    }
  }
  const info = messages.filter((message) => message.type === 'info');
  if (info.length) {
    console.log('DocLint Info:');
    for (let i = 0; i < info.length; i++) {
      const text = info[i].text.split('\n').join('\n      ');
      console.log(`  ${i + 1}) ${BLUE_COLOR}${text}${RESET_COLOR}`);
    }
  }
  if (changedFiles) {
    console.log(`${BLUE_COLOR}Some files were updated.${RESET_COLOR}`);
  }

  console.log(
    `${info.length} info, ${errors.length} failures, ${warnings.length} warnings.`
  );

  const clearExit = errors.length + warnings.length === 0;
  if (!clearExit && !process.env.GITHUB_ACTIONS) {
    console.log(
      '\nIs your lib/ directory up to date? You might need to `npm run build:tsc`.\n'
    );
  }

  const runningTime = Date.now() - startTime;
  console.log(`DocLint Finished in ${runningTime / 1000} seconds`);
  process.exit(clearExit || IS_RELEASE ? 0 : 1);
}
