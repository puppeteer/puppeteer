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

let COPY_INPUT = `
<!-- gen:copy("test") -->Heyo!<!-- gen:stop -->
<!-- gen:paste("test") --><!-- gen:stop -->
`;
let COPY_EXPECTED = `
<!-- gen:copy("test") -->Heyo!<!-- gen:stop -->
<!-- gen:paste("test") -->
<!-- Text below is automatically copied from "gen:copy("test")" -->Heyo!<!-- gen:stop -->
`;

describe('preprocessor', function() {
  it('should throw for unknown command', function() {
    let source = factory.createForTest('doc.md', getCommand('unknownCommand()'));
    let messages = preprocessor([source]);
    expect(source.hasUpdatedText()).toBe(false);
    expect(messages.length).toBe(1);
    expect(messages[0].type).toBe('error');
    expect(messages[0].text).toContain('Unknown command');
  });
  describe('gen:version', function() {
    it('should work', function() {
      let source = factory.createForTest('doc.md', `Puppeteer v${getCommand('version')}`);
      let messages = preprocessor([source]);
      expect(messages.length).toBe(1);
      expect(messages[0].type).toBe('warning');
      expect(messages[0].text).toContain('doc.md');
      expect(source.text()).toBe(`Puppeteer v${getCommand('version', VERSION)}`);
    });
    it('should tolerate different writing', function() {
      let source = factory.createForTest('doc.md', `Puppeteer v<!--   gEn:version (  ) -->WHAT
<!--     GEN:stop   -->`);
      preprocessor([source]);
      expect(source.text()).toBe(`Puppeteer v<!--   gEn:version (  ) -->${VERSION}<!--     GEN:stop   -->`);
    });
    it('should not tolerate missing gen:stop', function() {
      let source = factory.createForTest('doc.md', `<!--GEN:version-->`);
      let messages = preprocessor([source]);
      expect(source.hasUpdatedText()).toBe(false);
      expect(messages.length).toBe(1);
      expect(messages[0].type).toBe('error');
      expect(messages[0].text).toContain(`Failed to find 'gen:stop'`);
    });
  });
  describe('gen:copy', function() {
    it('should work', function() {
      let source = factory.createForTest('doc.md', COPY_INPUT);
      preprocessor([source]);
      expect(source.hasUpdatedText()).toBe(true);
      expect(source.text()).toBe(COPY_EXPECTED);
    });
    it('should throw if copy does not have argument', function() {
      let source = factory.createForTest('doc.md', getCommand('copy()'));
      let messages = preprocessor([source]);
      expect(source.hasUpdatedText()).toBe(false);
      expect(messages.length).toBe(1);
      expect(messages[0].type).toBe('error');
      expect(messages[0].text).toContain('should have argument');
    });
    it('should throw if copyId is not used', function() {
      let source = factory.createForTest('doc.md', getCommand('copy(command-id)'));
      let messages = preprocessor([source]);
      expect(source.hasUpdatedText()).toBe(false);
      expect(messages.length).toBe(1);
      expect(messages[0].type).toBe('error');
      expect(messages[0].text).toContain('unused copy id');
    });
    it('should throw if duplicate copy id', function() {
      const copyCmd = getCommand('copy(foo)');
      let source = factory.createForTest('doc.md', copyCmd + copyCmd);
      let messages = preprocessor([source]);
      messages.sort();
      expect(source.hasUpdatedText()).toBe(false);
      expect(messages.length).toBe(2);
      expect(messages[0].type).toBe('error');
      expect(messages[0].text).toContain('re-define copy id');
    });
  });
  describe('gen:paste', function() {
    it('should throw if paste does not have argument', function() {
      let source = factory.createForTest('doc.md', getCommand('paste()'));
      let messages = preprocessor([source]);
      expect(source.hasUpdatedText()).toBe(false);
      expect(messages.length).toBe(1);
      expect(messages[0].type).toBe('error');
      expect(messages[0].text).toContain('should have argument');
    });
    it('should throw if copyId is not defined', function() {
      let source = factory.createForTest('doc.md', getCommand('paste(bar)'));
      let messages = preprocessor([source]);
      expect(source.hasUpdatedText()).toBe(false);
      expect(messages.length).toBe(1);
      expect(messages[0].type).toBe('error');
      expect(messages[0].text).toContain('unknown copy id');
    });
  });
});

function getCommand(name, body = '') {
  return `<!--gen:${name}-->${body}<!--gen:stop-->`;
}
