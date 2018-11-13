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

      expect(await page.accessibility.snapshot()).toEqual({
        role: 'WebArea',
        name: 'Accessibility Test',
        children: [
          {role: 'text', name: 'Hello World'},
          {role: 'heading', name: 'Inputs', level: 1},
          {role: 'textbox', name: 'Empty input', focused: true},
          {role: 'textbox', name: 'readonly input', readonly: true},
          {role: 'textbox', name: 'disabled input', disabled: true},
          {role: 'textbox', name: 'Input with whitespace', value: '  '},
          {role: 'textbox', name: '', value: 'value only'},
          {role: 'textbox', name: 'placeholder', value: 'and a value'},
          {role: 'textbox', name: 'placeholder', value: 'and a value', description: 'This is a description!'},
          {role: 'combobox', name: '', value: 'First Option', children: [
            {role: 'menuitem', name: 'First Option', selected: true},
            {role: 'menuitem', name: 'Second Option'}]}]
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
    describe('filtering children of leaf nodes', function() {
      it('should not report text nodes inside controls', async function({page}) {
        await page.setContent(`
        <div role="tablist">
          <div role="tab" aria-selected="true"><b>Tab1</b></div>
          <div role="tab">Tab2</div>
        </div>`);
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

      it('rich text editable fields should have children', async function({page}) {
        await page.setContent(`
        <div contenteditable="true">
          Edit this image: <img src="fakeimage.png" alt="my fake image">
        </div>`);
        const snapshot = await page.accessibility.snapshot();
        expect(snapshot.children[0]).toEqual({
          role: 'GenericContainer',
          name: '',
          value: 'Edit this image: ',
          children: [{
            role: 'text',
            name: 'Edit this image:'
          }, {
            role: 'img',
            name: 'my fake image'
          }]
        });
      });
      it('rich text editable fields with role should have children', async function({page}) {
        await page.setContent(`
        <div contenteditable="true" role='textbox'>
          Edit this image: <img src="fakeimage.png" alt="my fake image">
        </div>`);
        const snapshot = await page.accessibility.snapshot();
        expect(snapshot.children[0]).toEqual({
          role: 'textbox',
          name: '',
          value: 'Edit this image: ',
          children: [{
            role: 'text',
            name: 'Edit this image:'
          }, {
            role: 'img',
            name: 'my fake image'
          }]
        });
      });
      it('plain text field with role should not have children', async function({page}) {
        await page.setContent(`
        <div contenteditable="plaintext-only" role='textbox'>Edit this image:<img src="fakeimage.png" alt="my fake image"></div>`);
        const snapshot = await page.accessibility.snapshot();
        expect(snapshot.children[0]).toEqual({
          role: 'textbox',
          name: '',
          value: 'Edit this image:'
        });
      });
      it('plain text field without role should not have content', async function({page}) {
        await page.setContent(`
        <div contenteditable="plaintext-only">Edit this image:<img src="fakeimage.png" alt="my fake image"></div>`);
        const snapshot = await page.accessibility.snapshot();
        expect(snapshot.children[0]).toEqual({
          role: 'GenericContainer',
          name: ''
        });
      });
      it('plain text field with tabindex and without role should not have content', async function({page}) {
        await page.setContent(`
        <div contenteditable="plaintext-only" tabIndex=0>Edit this image:<img src="fakeimage.png" alt="my fake image"></div>`);
        const snapshot = await page.accessibility.snapshot();
        expect(snapshot.children[0]).toEqual({
          role: 'GenericContainer',
          name: ''
        });
      });
      it('non editable textbox with role and tabIndex and label should not have children', async function({page}) {
        await page.setContent(`
        <div role="textbox" tabIndex=0 aria-checked="true" aria-label="my favorite textbox">
          this is the inner content
          <img alt="yo" src="fakeimg.png">
        </div>`);
        const snapshot = await page.accessibility.snapshot();
        expect(snapshot.children[0]).toEqual({
          role: 'textbox',
          name: 'my favorite textbox',
          value: 'this is the inner content '
        });
      });
      it('checkbox with and tabIndex and label should not have children', async function({page}) {
        await page.setContent(`
        <div role="checkbox" tabIndex=0 aria-checked="true" aria-label="my favorite checkbox">
          this is the inner content
          <img alt="yo" src="fakeimg.png">
        </div>`);
        const snapshot = await page.accessibility.snapshot();
        expect(snapshot.children[0]).toEqual({
          role: 'checkbox',
          name: 'my favorite checkbox',
          checked: true
        });
      });
      it('checkbox without label should not have children', async function({page}) {
        await page.setContent(`
        <div role="checkbox" aria-checked="true">
          this is the inner content
          <img alt="yo" src="fakeimg.png">
        </div>`);
        const snapshot = await page.accessibility.snapshot();
        expect(snapshot.children[0]).toEqual({
          role: 'checkbox',
          name: 'this is the inner content yo',
          checked: true
        });
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
