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
const Source = require('../../Source');
const mdBuilder = require('../MDBuilder');
const jsBuilder = require('../JSBuilder');
const expect = require('expect')
const GoldenUtils = require('../../../../test/golden-utils');

const testUtils = require('../../../../test/utils')


describe('DocLint Public API', function() {
  let browser;
  let page;

  before(async function() {
    browser = await puppeteer.launch();
    page = await browser.newPage();
  });

  after(async function() {
    await browser.close();
  });

  describe('checkPublicAPI', function() {
    it('diff-classes', testLint('diff-classes'));
    it('diff-methods', testLint('diff-methods'));
    it('diff-properties', testLint('diff-properties'));
    it('diff-arguments', testLint('diff-arguments'));
    it('diff-events', testLint('diff-events'));
    it('check-duplicates', testLint('check-duplicates'));
    it('check-sorting', testLint('check-sorting'));
    it('check-returns', testLint('check-returns'));
    it('js-builder-common', testJSBuilder('js-builder-common'));
    it('js-builder-inheritance', testJSBuilder('js-builder-inheritance'));
    it('md-builder-common', testMDBuilder('md-builder-common'));
  });

  function testLint(testName) {
    return async () => {
      const dirPath = path.join(__dirname, testName);
      testUtils.extendExpectWithToBeGolden(dirPath, dirPath)

      const mdSources = await Source.readdir(dirPath, '.md');
      const jsSources = await Source.readdir(dirPath, '.js');
      const messages = await checkPublicAPI(page, mdSources, jsSources);
      const errors = messages.map(message => message.text);
      expect(errors.join('\n')).toBeGolden('result.txt');
    }
  }

  function testMDBuilder(testName) {
    return async () => {
      const dirPath = path.join(__dirname, testName);
      testUtils.extendExpectWithToBeGolden(dirPath, dirPath);

      const sources = await Source.readdir(dirPath, '.md');
      const { documentation } = await mdBuilder(page, sources);
      expect(serialize(documentation)).toBeGolden('result.txt');
    }
  }

  function testJSBuilder(testName) {
    return async () => {
      const dirPath = path.join(__dirname, testName);
      testUtils.extendExpectWithToBeGolden(dirPath, dirPath);

      const sources = await Source.readdir(dirPath, '.js');
      const { documentation } = await jsBuilder(sources);
      expect(serialize(documentation)).toBeGolden('result.txt');
    }
  }

  /**
  * @param {import('../Documentation')} doc
  */
  function serialize(doc) {
    const result = {
      classes: doc.classesArray.map(cls => ({
        name: cls.name,
        members: cls.membersArray.map(serializeMember)
      }))
    };
    return JSON.stringify(result, null, 2);
  }
  /**
  * @param {import('../Documentation').Member} member
  */
  function serializeMember(member) {
    return {
      name: member.name,
      type: serializeType(member.type),
      kind: member.kind,
      args: member.argsArray.length ? member.argsArray.map(serializeMember) : undefined
    }
  }
  /**
  * @param {import('../Documentation').Type} type
  */
  function serializeType(type) {
    if (!type)
      return undefined;
    return {
      name: type.name,
      properties: type.properties.length ? type.properties.map(serializeMember) : undefined
    }
  }
  })
