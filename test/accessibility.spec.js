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
    it('should work', async function({page}) {
      await page.setContent(`
      <head>
        <title>Accessibility Test</title>
      </head>
      <body>
        <div>Hello World</div>
        <h1>Inputs</h1>
        <input placeholder="Empty input" autofocus />
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

      expect(await page.accessibility.snapshot()).toEqual(
          { role: 'WebArea',
            name: 'Accessibility Test',
            children:
            [ { role: 'text', name: 'Hello World' },
              { role: 'heading', name: 'Inputs', level: 1 },
              { role: 'textbox', name: 'Empty input', focused: true },
              { role: 'textbox', name: 'readonly input', readonly: true },
              { role: 'textbox', name: 'disabled input', disabled: true },
              { role: 'textbox', name: 'Input with whitespace', value: '  ' },
              { role: 'textbox', name: '', value: 'value only' },
              { role: 'textbox', name: 'placeholder', value: 'and a value' },
              { role: 'textbox', name: 'placeholder', value: 'and a value', description: 'This is a description!' },
              { role: 'combobox', name: '', value: 'First Option' } ] }
      );
    });
    it('should only report children of an expanded select', async function({page}) {
      await page.setContent(`
      <select autofocus>
        <option>First Option</option>
        <option>Second Option</option>
      </select>`);

      expect(findFocusedNode(await page.accessibility.snapshot())).toEqual({
        role: 'combobox',
        name: '',
        value: 'First Option',
        focused: true
      });

      await page.click('select');

      expect(findFocusedNode(await page.accessibility.snapshot())).toEqual({
        role: 'combobox',
        name: '',
        value: 'First Option',
        expanded: true,
        focused: true,
        children: [
          { role: 'menuitem', name: 'First Option', selected: true },
          { role: 'menuitem', name: 'Second Option' }
        ]
      });
    });
    it('should report uninteresting nodes', async function({page}) {
      await page.setContent(`<textarea autofocus>hi</textarea>`);

      expect(findFocusedNode(await page.accessibility.snapshot({interestingOnly: false}))).toEqual({
        role: 'textbox',
        name: '',
        value: 'hi',
        focused: true,
        multiline: true,
        children: [{
          role: 'GenericContainer',
          name: '',
          children: [{
            role: 'text', name: 'hi'
          }]
        }]
      });
    });
    it('should not report text nodes inside controls', async function({page}) {
      await page.setContent(`
      <div role="tablist">
        <div role="tab" aria-selected="true"><b>Tab1</b></div>
        <div role="tab">Tab2</div>
      </div>`);
      console.log(JSON.stringify(await page.accessibility.snapshot(), undefined, 2));
      expect(await page.accessibility.snapshot()).toEqual({
        role: 'WebArea',
        name: '',
        children: [{
          role: 'tab',
          name: 'Tab1',
          selected: true
        }, {
          role: 'tab',
          name: 'Tab2'
        }]
      });
    });

    function findFocusedNode(node) {
      if (node.focused)
        return node;
      for (const child of node.children || []) {
        const focusedChild = findFocusedNode(child);
        if (focusedChild)
          return focusedChild;
      }
      return null;
    }
  });
};
