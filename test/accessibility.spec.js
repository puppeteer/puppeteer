/**
 * Copyright 2018 Google Inc. All rights reserved.
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

module.exports.addTests = function({testRunner, expect}) {
  const {describe, xdescribe, fdescribe} = testRunner;
  const {it, fit, xit} = testRunner;
  const {beforeAll, beforeEach, afterAll, afterEach} = testRunner;

  describe('Accessibility', function() {
    it('should work', async function({page, server}) {
      // await page.goto(server.PREFIX + '/playground.html');
      await page.setContent(`
      <head>
        <title>Accessibility Test</title>
      </head>
      <body>
      <div>Hello World</div>
      <h1>Inputs</h1>
      <input placeholder="Empty input" />
      <input placeholder="readonly input" readonly />
      <input placeholder="disabled input" disabled />
      <input aria-label="Input with whitespace" value="  " />
      <input value="value only" />
      <input aria-placeholder="placeholder" value="and a value" />
      <div aria-hidden="true" id="desc">This is a description!</div>
      <input aria-placeholder="placeholder" value="and a value" aria-describedby="desc" />
      <select>
        <option>First Option</option>
        <option>Second Option</option>
      </select>
      </body>`);
      expect(await page.accessibility.snapshot()).toBe(`[WebArea] name="Accessibility Test"
  [text] name="Hello World"
  [heading] name="Inputs" level=1
  [textbox] name="Empty input"
  [textbox] name="readonly input" readonly
  [textbox] name="disabled input" disabled
  [textbox] name="Input with whitespace" value="  "
  [textbox] value="value only"
  [textbox] name="placeholder" value="and a value"
  [textbox] name="placeholder" value="and a value" description="This is a description!"
  [combobox] value="First Option"`);
    });
  });
};
