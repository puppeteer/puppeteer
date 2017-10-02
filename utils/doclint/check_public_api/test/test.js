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
const mdBuilder = require('../MDBuilder');
const jsBuilder = require('../JSBuilder');
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

describe('checkPublicAPI', function() {
  it('diff-classes', SX(testLint));
  it('diff-methods', SX(testLint));
  it('diff-properties', SX(testLint));
  it('diff-arguments', SX(testLint));
  it('diff-events', SX(testLint));
  it('check-duplicates', SX(testLint));
  it('check-sorting', SX(testLint));
  it('check-returns', SX(testLint));
  it('js-builder-common', SX(testJSBuilder));
  it('js-builder-inheritance', SX(testJSBuilder));
  it('md-builder-common', SX(testMDBuilder));
});

async function testLint() {
  const dirPath = path.join(__dirname, specName);
  GoldenUtils.addMatchers(jasmine, dirPath, dirPath);
  const factory = new SourceFactory();
  const mdSources = await factory.readdir(dirPath, '.md');
  const jsSources = await factory.readdir(dirPath, '.js');
  const messages = await checkPublicAPI(page, mdSources, jsSources);
  const errors = messages.map(message => message.text);
  expect(errors.join('\n')).toBeGolden('result.txt');
}

async function testMDBuilder() {
  const dirPath = path.join(__dirname, specName);
  GoldenUtils.addMatchers(jasmine, dirPath, dirPath);
  const factory = new SourceFactory();
  const sources = await factory.readdir(dirPath, '.md');
  const {documentation} = await mdBuilder(page, sources);
  expect(serialize(documentation)).toBeGolden('result.txt');
}

async function testJSBuilder() {
  const dirPath = path.join(__dirname, specName);
  GoldenUtils.addMatchers(jasmine, dirPath, dirPath);
  const factory = new SourceFactory();
  const sources = await factory.readdir(dirPath, '.js');
  const {documentation} = await jsBuilder(sources);
  expect(serialize(documentation)).toBeGolden('result.txt');
}

function serialize(doc) {
  const result = {classes: []};
  for (let cls of doc.classesArray) {
    const classJSON = {
      name: cls.name,
      members: []
    };
    result.classes.push(classJSON);
    for (let member of cls.membersArray) {
      classJSON.members.push({
        name: member.name,
        type: member.type,
        hasReturn: member.hasReturn,
        async: member.async,
        args: member.argsArray.map(arg => arg.name)
      });
    }
  }
  return JSON.stringify(result, null, 2);
}

// Since Jasmine doesn't like async functions, they should be wrapped
// in a SX function.
function SX(fun) {
  return done => Promise.resolve(fun()).then(done).catch(done.fail);
}
