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

const preprocessor = require('.');
const SourceFactory = require('../SourceFactory');
const factory = new SourceFactory();
const VERSION = require('../../../package.json').version;

const {TestRunner, Reporter, Matchers}  = require('../../testrunner/');
const runner = new TestRunner();
new Reporter(runner);

const {describe, xdescribe, fdescribe} = runner;
const {it, fit, xit} = runner;
const {beforeAll, beforeEach, afterAll, afterEach} = runner;
const {expect} = new Matchers();

describe('preprocessor', function() {
  it('should throw for unknown command', function() {
    const source = factory.createForTest('doc.md', getCommand('unknownCommand()'));
    const messages = preprocessor([source]);
    expect(source.hasUpdatedText()).toBe(false);
    expect(messages.length).toBe(1);
    expect(messages[0].type).toBe('error');
    expect(messages[0].text).toContain('Unknown command');
  });
  describe('gen:version', function() {
    it('should work', function() {
      const source = factory.createForTest('doc.md', `Puppeteer v${getCommand('version')}`);
      const messages = preprocessor([source]);
      expect(messages.length).toBe(1);
      expect(messages[0].type).toBe('warning');
      expect(messages[0].text).toContain('doc.md');
      expect(source.text()).toBe(`Puppeteer v${getCommand('version', VERSION)}`);
    });
    it('should tolerate different writing', function() {
      const source = factory.createForTest('doc.md', `Puppeteer v<!--   gEn:version (  ) -->WHAT
<!--     GEN:stop   -->`);
      preprocessor([source]);
      expect(source.text()).toBe(`Puppeteer v<!--   gEn:version (  ) -->${VERSION}<!--     GEN:stop   -->`);
    });
    it('should not tolerate missing gen:stop', function() {
      const source = factory.createForTest('doc.md', `<!--GEN:version-->`);
      const messages = preprocessor([source]);
      expect(source.hasUpdatedText()).toBe(false);
      expect(messages.length).toBe(1);
      expect(messages[0].type).toBe('error');
      expect(messages[0].text).toContain(`Failed to find 'gen:stop'`);
    });
  });
});

runner.run();

function getCommand(name, body = '') {
  return `<!--gen:${name}-->${body}<!--gen:stop-->`;
}
