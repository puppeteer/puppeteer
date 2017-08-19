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

const fs = require('fs');
const rm = require('rimraf').sync;
const path = require('path');
const puppeteer = require('../../../..');
const checkPublicAPI = require('..');
const SourceFactory = require('../../SourceFactory');
const GoldenUtils = require('../../../../test/golden-utils');

const OUTPUT_DIR = path.join(__dirname, 'output');
const GOLDEN_DIR = path.join(__dirname, 'golden');

let browser;
let page;
let specName;

jasmine.getEnv().addReporter({
  specStarted: result => specName = result.description
});

beforeAll(SX(async function() {
  browser = await puppeteer.launch({args: ['--no-sandbox']});
  page = await browser.newPage();
  if (fs.existsSync(OUTPUT_DIR))
    rm(OUTPUT_DIR);
}));

afterAll(SX(async function() {
  await browser.close();
}));

beforeEach(function() {
  GoldenUtils.addMatchers(jasmine, GOLDEN_DIR, OUTPUT_DIR);
});

describe('checkPublicAPI', function() {
  it('01-class-errors', SX(test));
  it('02-method-errors', SX(test));
  it('03-property-errors', SX(test));
  it('04-bad-arguments', SX(test));
  it('05-event-errors', SX(test));
  it('06-duplicates', SX(test));
  it('07-sorting', SX(test));
  it('08-return', SX(test));
});

async function test() {
  const dirPath = path.join(__dirname, specName);
  const factory = new SourceFactory();
  const mdSources = await factory.readdir(dirPath, '.md');
  const jsSources = await factory.readdir(dirPath, '.js');
  const messages = await checkPublicAPI(page, mdSources, jsSources);
  const errors = messages.map(message => message.text);
  expect(errors.join('\n')).toBeGolden(specName + '.txt');
}

// Since Jasmine doesn't like async functions, they should be wrapped
// in a SX function.
function SX(fun) {
  return done => Promise.resolve(fun()).then(done).catch(done.fail);
}
