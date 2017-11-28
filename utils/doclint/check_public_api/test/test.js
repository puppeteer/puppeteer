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

const path = require('path');
const puppeteer = require('../../../..');
const checkPublicAPI = require('..');
const SourceFactory = require('../../SourceFactory');
const mdBuilder = require('../MDBuilder');
const jsBuilder = require('../JSBuilder');
const GoldenUtils = require('../../../../test/golden-utils');

const {TestRunner, Reporter, Matchers}  = require('../../../testrunner/');
const runner = new TestRunner();
const reporter = new Reporter(runner);

const {describe, xdescribe, fdescribe} = runner;
const {it, fit, xit} = runner;
const {beforeAll, beforeEach, afterAll, afterEach} = runner;

let browser;
let page;

beforeAll(async function() {
  browser = await puppeteer.launch({args: ['--no-sandbox']});
  page = await browser.newPage();
});

afterAll(async function() {
  await browser.close();
});

describe('checkPublicAPI', function() {
  it('diff-classes', testLint);
  it('diff-methods', testLint);
  it('diff-properties', testLint);
  it('diff-arguments', testLint);
  it('diff-events', testLint);
  it('check-duplicates', testLint);
  it('check-sorting', testLint);
  it('check-returns', testLint);
  it('js-builder-common', testJSBuilder);
  it('js-builder-inheritance', testJSBuilder);
  it('md-builder-common', testMDBuilder);
});

runner.run();

async function testLint(state, test) {
  const dirPath = path.join(__dirname, test.name);
  const {expect} = new Matchers({
    toBeGolden: GoldenUtils.compare.bind(null, dirPath, dirPath)
  });

  const factory = new SourceFactory();
  const mdSources = await factory.readdir(dirPath, '.md');
  const jsSources = await factory.readdir(dirPath, '.js');
  const messages = await checkPublicAPI(page, mdSources, jsSources);
  const errors = messages.map(message => message.text);
  expect(errors.join('\n')).toBeGolden('result.txt');
}

async function testMDBuilder(state, test) {
  const dirPath = path.join(__dirname, test.name);
  const {expect} = new Matchers({
    toBeGolden: GoldenUtils.compare.bind(null, dirPath, dirPath)
  });
  const factory = new SourceFactory();
  const sources = await factory.readdir(dirPath, '.md');
  const {documentation} = await mdBuilder(page, sources);
  expect(serialize(documentation)).toBeGolden('result.txt');
}

async function testJSBuilder(state, test) {
  const dirPath = path.join(__dirname, test.name);
  const {expect} = new Matchers({
    toBeGolden: GoldenUtils.compare.bind(null, dirPath, dirPath)
  });
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

