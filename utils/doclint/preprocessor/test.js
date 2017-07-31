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

describe('preprocessor', function() {
  describe('gen:version', function() {
    it('should work', function() {
      let source = factory.createForTest('doc.md', 'Puppeteer v<!--gen:version--><!--gen:stop-->');
      let messages = preprocessor([source]);
      expect(messages.length).toBe(1);
      expect(messages[0].type).toBe('warning');
      expect(messages[0].text).toContain('doc.md');
      expect(source.text()).toBe(`Puppeteer v<!--gen:version-->${VERSION}<!--gen:stop-->`);
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
});

