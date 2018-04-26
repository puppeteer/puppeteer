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
const Source = require('../Source');
const {TestRunner, Reporter, Matchers}  = require('../../testrunner/');
const runner = new TestRunner();
new Reporter(runner);

const {describe, xdescribe, fdescribe} = runner;
const {it, fit, xit} = runner;
const {beforeAll, beforeEach, afterAll, afterEach} = runner;
const {expect} = new Matchers();

describe('preprocessor', function() {
  it('should throw for unknown command', function() {
    const source = new Source('doc.md', `
      <!-- gen:unknown-command -->something<!-- gen:stop -->
    `);
    const messages = preprocessor([source], '1.1.1');
    expect(source.hasUpdatedText()).toBe(false);
    expect(messages.length).toBe(1);
    expect(messages[0].type).toBe('error');
    expect(messages[0].text).toContain('Unknown command');
  });
  describe('gen:version', function() {
    it('should work', function() {
      const source = new Source('doc.md', `
        Puppeteer <!-- gen:version -->XXX<!-- gen:stop -->
      `);
      const messages = preprocessor([source], '1.2.0');
      expect(messages.length).toBe(1);
      expect(messages[0].type).toBe('warning');
      expect(messages[0].text).toContain('doc.md');
      expect(source.text()).toBe(`
        Puppeteer <!-- gen:version -->v1.2.0<!-- gen:stop -->
      `);
    });
    it('should work for *-post versions', function() {
      const source = new Source('doc.md', `
        Puppeteer <!-- gen:version -->XXX<!-- gen:stop -->
      `);
      const messages = preprocessor([source], '1.2.0-post');
      expect(messages.length).toBe(1);
      expect(messages[0].type).toBe('warning');
      expect(messages[0].text).toContain('doc.md');
      expect(source.text()).toBe(`
        Puppeteer <!-- gen:version -->Tip-Of-Tree<!-- gen:stop -->
      `);
    });
    it('should tolerate different writing', function() {
      const source = new Source('doc.md', `Puppeteer v<!--   gEn:version -->WHAT
<!--     GEN:stop   -->`);
      preprocessor([source], '1.1.1');
      expect(source.text()).toBe(`Puppeteer v<!--   gEn:version -->v1.1.1<!--     GEN:stop   -->`);
    });
    it('should not tolerate missing gen:stop', function() {
      const source = new Source('doc.md', `<!--GEN:version-->`);
      const messages = preprocessor([source], '1.2.0');
      expect(source.hasUpdatedText()).toBe(false);
      expect(messages.length).toBe(1);
      expect(messages[0].type).toBe('error');
      expect(messages[0].text).toContain(`Failed to find 'gen:stop'`);
    });
  });
  describe('gen:empty-if-release', function() {
    it('should clear text when release version', function() {
      const source = new Source('doc.md', `
        <!-- gen:empty-if-release -->XXX<!-- gen:stop -->
      `);
      const messages = preprocessor([source], '1.1.1');
      expect(messages.length).toBe(1);
      expect(messages[0].type).toBe('warning');
      expect(messages[0].text).toContain('doc.md');
      expect(source.text()).toBe(`
        <!-- gen:empty-if-release --><!-- gen:stop -->
      `);
    });
    it('should keep text when non-release version', function() {
      const source = new Source('doc.md', `
        <!-- gen:empty-if-release -->XXX<!-- gen:stop -->
      `);
      const messages = preprocessor([source], '1.1.1-post');
      expect(messages.length).toBe(0);
      expect(source.text()).toBe(`
        <!-- gen:empty-if-release -->XXX<!-- gen:stop -->
      `);
    });
  });
  describe('gen:empty-if-release', function() {
    it('should work with non-release version', function() {
      const source = new Source('doc.md', `
        <!-- gen:last-released-api -->XXX<!-- gen:stop -->
      `);
      const messages = preprocessor([source], '1.3.0-post');
      expect(messages.length).toBe(1);
      expect(messages[0].type).toBe('warning');
      expect(messages[0].text).toContain('doc.md');
      expect(source.text()).toBe(`
        <!-- gen:last-released-api -->[API](https://github.com/GoogleChrome/puppeteer/blob/v1.3.0/docs/api.md)<!-- gen:stop -->
      `);
    });
    it('should work with release version', function() {
      const source = new Source('doc.md', `
        <!-- gen:last-released-api -->XXX<!-- gen:stop -->
      `);
      const messages = preprocessor([source], '1.3.0');
      expect(messages.length).toBe(1);
      expect(messages[0].type).toBe('warning');
      expect(messages[0].text).toContain('doc.md');
      expect(source.text()).toBe(`
        <!-- gen:last-released-api -->[API](https://github.com/GoogleChrome/puppeteer/blob/v1.3.0/docs/api.md)<!-- gen:stop -->
      `);
    });
  });
  it('should work with multiple commands', function() {
    const source = new Source('doc.md', `
      <!-- gen:version -->XXX<!-- gen:stop -->
      <!-- gen:empty-if-release -->YYY<!-- gen:stop -->
      <!-- gen:version -->ZZZ<!-- gen:stop -->
    `);
    const messages = preprocessor([source], '1.1.1');
    expect(messages.length).toBe(1);
    expect(messages[0].type).toBe('warning');
    expect(messages[0].text).toContain('doc.md');
    expect(source.text()).toBe(`
      <!-- gen:version -->v1.1.1<!-- gen:stop -->
      <!-- gen:empty-if-release --><!-- gen:stop -->
      <!-- gen:version -->v1.1.1<!-- gen:stop -->
    `);
  });
});

runner.run();

