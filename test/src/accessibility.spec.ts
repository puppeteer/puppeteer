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

import assert from 'assert';

import expect from 'expect';
import type {SerializedAXNode} from 'puppeteer-core/internal/cdp/Accessibility.js';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';

describe('Accessibility', function () {
  setupTestBrowserHooks();

  it('should work', async () => {
    const {page, isFirefox} = await getTestState();

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

    await page.focus('[placeholder="Empty input"]');
    const golden = isFirefox
      ? {
          role: 'document',
          name: 'Accessibility Test',
          children: [
            {role: 'text leaf', name: 'Hello World'},
            {role: 'heading', name: 'Inputs', level: 1},
            {role: 'entry', name: 'Empty input', focused: true},
            {role: 'entry', name: 'readonly input', readonly: true},
            {role: 'entry', name: 'disabled input', disabled: true},
            {role: 'entry', name: 'Input with whitespace', value: '  '},
            {role: 'entry', name: '', value: 'value only'},
            {role: 'entry', name: '', value: 'and a value'}, // firefox doesn't use aria-placeholder for the name
            {
              role: 'entry',
              name: '',
              value: 'and a value',
              description: 'This is a description!',
            }, // and here
            {
              role: 'combobox',
              name: '',
              value: 'First Option',
              haspopup: true,
              children: [
                {
                  role: 'combobox option',
                  name: 'First Option',
                  selected: true,
                },
                {role: 'combobox option', name: 'Second Option'},
              ],
            },
          ],
        }
      : {
          role: 'RootWebArea',
          name: 'Accessibility Test',
          children: [
            {role: 'StaticText', name: 'Hello World'},
            {role: 'heading', name: 'Inputs', level: 1},
            {role: 'textbox', name: 'Empty input', focused: true},
            {role: 'textbox', name: 'readonly input', readonly: true},
            {role: 'textbox', name: 'disabled input', disabled: true},
            {role: 'textbox', name: 'Input with whitespace', value: '  '},
            {role: 'textbox', name: '', value: 'value only'},
            {role: 'textbox', name: 'placeholder', value: 'and a value'},
            {
              role: 'textbox',
              name: 'placeholder',
              value: 'and a value',
              description: 'This is a description!',
            },
            {
              role: 'combobox',
              name: '',
              value: 'First Option',
              haspopup: 'menu',
              children: [
                {role: 'menuitem', name: 'First Option', selected: true},
                {role: 'menuitem', name: 'Second Option'},
              ],
            },
          ],
        };
    expect(await page.accessibility.snapshot()).toMatchObject(golden);
  });
  it('should report uninteresting nodes', async () => {
    const {page, isFirefox} = await getTestState();

    await page.setContent(`<textarea>hi</textarea>`);
    await page.focus('textarea');
    const golden = isFirefox
      ? {
          role: 'entry',
          name: '',
          value: 'hi',
          focused: true,
          multiline: true,
          children: [
            {
              role: 'text leaf',
              name: 'hi',
            },
          ],
        }
      : {
          role: 'textbox',
          name: '',
          value: 'hi',
          focused: true,
          multiline: true,
          children: [
            {
              role: 'generic',
              name: '',
              children: [
                {
                  role: 'StaticText',
                  name: 'hi',
                },
              ],
            },
          ],
        };
    expect(
      findFocusedNode(
        await page.accessibility.snapshot({interestingOnly: false})
      )
    ).toMatchObject(golden);
  });
  it('get snapshots while the tree is re-calculated', async () => {
    // see https://github.com/puppeteer/puppeteer/issues/9404
    const {page} = await getTestState();

    await page.setContent(
      `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Accessible name + aria-expanded puppeteer bug</title>
        <style>
          [aria-expanded="false"] + * {
            display: none;
          }
        </style>
      </head>
      <body>
        <button hidden>Show</button>
        <p>Some content</p>
        <script>
          const button = document.querySelector('button');
          button.removeAttribute('hidden')
          button.setAttribute('aria-expanded', 'false');
          button.addEventListener('click', function() {
            button.setAttribute('aria-expanded', button.getAttribute('aria-expanded') !== 'true')
            if (button.getAttribute('aria-expanded') == 'true') {
              button.textContent = 'Hide'
            } else {
              button.textContent = 'Show'
            }
          })
        </script>
      </body>
      </html>`
    );
    async function getAccessibleName(page: any, element: any) {
      return (await page.accessibility.snapshot({root: element})).name;
    }
    using button = await page.$('button');
    expect(await getAccessibleName(page, button)).toEqual('Show');
    await button?.click();
    await page.waitForSelector('aria/Hide');
  });
  it('roledescription', async () => {
    const {page} = await getTestState();

    await page.setContent(
      '<div tabIndex=-1 aria-roledescription="foo">Hi</div>'
    );
    const snapshot = await page.accessibility.snapshot();
    // See https://chromium-review.googlesource.com/c/chromium/src/+/3088862
    assert(snapshot);
    assert(snapshot.children);
    assert(snapshot.children[0]);
    expect(snapshot.children[0]!.roledescription).toBeUndefined();
  });
  it('orientation', async () => {
    const {page} = await getTestState();

    await page.setContent(
      '<a href="" role="slider" aria-orientation="vertical">11</a>'
    );
    const snapshot = await page.accessibility.snapshot();
    assert(snapshot);
    assert(snapshot.children);
    assert(snapshot.children[0]);
    expect(snapshot.children[0]!.orientation).toEqual('vertical');
  });
  it('autocomplete', async () => {
    const {page} = await getTestState();

    await page.setContent('<input type="number" aria-autocomplete="list" />');
    const snapshot = await page.accessibility.snapshot();
    assert(snapshot);
    assert(snapshot.children);
    assert(snapshot.children[0]);
    expect(snapshot.children[0]!.autocomplete).toEqual('list');
  });
  it('multiselectable', async () => {
    const {page} = await getTestState();

    await page.setContent(
      '<div role="grid" tabIndex=-1 aria-multiselectable=true>hey</div>'
    );
    const snapshot = await page.accessibility.snapshot();
    assert(snapshot);
    assert(snapshot.children);
    assert(snapshot.children[0]);
    expect(snapshot.children[0]!.multiselectable).toEqual(true);
  });
  it('keyshortcuts', async () => {
    const {page} = await getTestState();

    await page.setContent(
      '<div role="grid" tabIndex=-1 aria-keyshortcuts="foo">hey</div>'
    );
    const snapshot = await page.accessibility.snapshot();
    assert(snapshot);
    assert(snapshot.children);
    assert(snapshot.children[0]);
    expect(snapshot.children[0]!.keyshortcuts).toEqual('foo');
  });
  describe('filtering children of leaf nodes', function () {
    it('should not report text nodes inside controls', async () => {
      const {page, isFirefox} = await getTestState();

      await page.setContent(`
        <div role="tablist">
          <div role="tab" aria-selected="true"><b>Tab1</b></div>
          <div role="tab">Tab2</div>
        </div>`);
      const golden = isFirefox
        ? {
            role: 'document',
            name: '',
            children: [
              {
                role: 'pagetab',
                name: 'Tab1',
                selected: true,
              },
              {
                role: 'pagetab',
                name: 'Tab2',
              },
            ],
          }
        : {
            role: 'RootWebArea',
            name: '',
            children: [
              {
                role: 'tab',
                name: 'Tab1',
                selected: true,
              },
              {
                role: 'tab',
                name: 'Tab2',
              },
            ],
          };
      expect(await page.accessibility.snapshot()).toEqual(golden);
    });
    it('rich text editable fields should have children', async () => {
      const {page, isFirefox} = await getTestState();

      await page.setContent(`
        <div contenteditable="true">
          Edit this image: <img src="fakeimage.png" alt="my fake image">
        </div>`);
      const golden = isFirefox
        ? {
            role: 'section',
            name: '',
            children: [
              {
                role: 'text leaf',
                name: 'Edit this image:',
              },
              {
                role: 'StaticText',
                name: 'my fake image',
              },
            ],
          }
        : {
            role: 'generic',
            name: '',
            value: 'Edit this image: ',
            children: [
              {
                role: 'StaticText',
                name: 'Edit this image: ',
              },
              {
                role: 'image',
                name: 'my fake image',
              },
            ],
          };
      const snapshot = await page.accessibility.snapshot();
      assert(snapshot);
      assert(snapshot.children);
      expect(snapshot.children[0]).toMatchObject(golden);
    });
    it('rich text editable fields with role should have children', async () => {
      const {page, isFirefox} = await getTestState();

      await page.setContent(`
        <div contenteditable="true" role='textbox'>
          Edit this image: <img src="fakeimage.png" alt="my fake image">
        </div>`);
      // Image node should not be exposed in contenteditable elements. See https://crbug.com/1324392.
      const golden = isFirefox
        ? {
            role: 'entry',
            name: '',
            value: 'Edit this image: my fake image',
            children: [
              {
                role: 'StaticText',
                name: 'my fake image',
              },
            ],
          }
        : {
            role: 'textbox',
            name: '',
            value: 'Edit this image: ',
            multiline: true,
            children: [
              {
                role: 'StaticText',
                name: 'Edit this image: ',
              },
            ],
          };
      const snapshot = await page.accessibility.snapshot();
      assert(snapshot);
      assert(snapshot.children);
      expect(snapshot.children[0]).toMatchObject(golden);
    });

    // Firefox does not support contenteditable="plaintext-only".
    describe('plaintext contenteditable', function () {
      it('plain text field with role should not have children', async () => {
        const {page} = await getTestState();

        await page.setContent(`
          <div contenteditable="plaintext-only" role='textbox'>Edit this image:<img src="fakeimage.png" alt="my fake image"></div>`);
        const snapshot = await page.accessibility.snapshot();
        assert(snapshot);
        assert(snapshot.children);
        expect(snapshot.children[0]).toEqual({
          role: 'textbox',
          name: '',
          value: 'Edit this image:',
          multiline: true,
        });
      });
    });
    it('non editable textbox with role and tabIndex and label should not have children', async () => {
      const {page, isFirefox} = await getTestState();

      await page.setContent(`
        <div role="textbox" tabIndex=0 aria-checked="true" aria-label="my favorite textbox">
          this is the inner content
          <img alt="yo" src="fakeimg.png">
        </div>`);
      const golden = isFirefox
        ? {
            role: 'entry',
            name: 'my favorite textbox',
            value: 'this is the inner content yo',
          }
        : {
            role: 'textbox',
            name: 'my favorite textbox',
            value: 'this is the inner content ',
          };
      const snapshot = await page.accessibility.snapshot();
      assert(snapshot);
      assert(snapshot.children);
      expect(snapshot.children[0]).toEqual(golden);
    });
    it('checkbox with and tabIndex and label should not have children', async () => {
      const {page, isFirefox} = await getTestState();

      await page.setContent(`
        <div role="checkbox" tabIndex=0 aria-checked="true" aria-label="my favorite checkbox">
          this is the inner content
          <img alt="yo" src="fakeimg.png">
        </div>`);
      const golden = isFirefox
        ? {
            role: 'checkbutton',
            name: 'my favorite checkbox',
            checked: true,
          }
        : {
            role: 'checkbox',
            name: 'my favorite checkbox',
            checked: true,
          };
      const snapshot = await page.accessibility.snapshot();
      assert(snapshot);
      assert(snapshot.children);
      expect(snapshot.children[0]).toEqual(golden);
    });
    it('checkbox without label should not have children', async () => {
      const {page, isFirefox} = await getTestState();

      await page.setContent(`
        <div role="checkbox" aria-checked="true">
          this is the inner content
          <img alt="yo" src="fakeimg.png">
        </div>`);
      const golden = isFirefox
        ? {
            role: 'checkbutton',
            name: 'this is the inner content yo',
            checked: true,
          }
        : {
            role: 'checkbox',
            name: 'this is the inner content yo',
            checked: true,
          };
      const snapshot = await page.accessibility.snapshot();
      assert(snapshot);
      assert(snapshot.children);
      expect(snapshot.children[0]).toEqual(golden);
    });

    describe('root option', function () {
      it('should work a button', async () => {
        const {page} = await getTestState();

        await page.setContent(`<button>My Button</button>`);

        using button = (await page.$('button'))!;
        expect(await page.accessibility.snapshot({root: button})).toEqual({
          role: 'button',
          name: 'My Button',
        });
      });
      it('should work an input', async () => {
        const {page} = await getTestState();

        await page.setContent(`<input title="My Input" value="My Value">`);

        using input = (await page.$('input'))!;
        expect(await page.accessibility.snapshot({root: input})).toEqual({
          role: 'textbox',
          name: 'My Input',
          value: 'My Value',
        });
      });
      it('should work a menu', async () => {
        const {page} = await getTestState();

        await page.setContent(`
            <div role="menu" title="My Menu">
              <div role="menuitem">First Item</div>
              <div role="menuitem">Second Item</div>
              <div role="menuitem">Third Item</div>
            </div>
          `);

        using menu = (await page.$('div[role="menu"]'))!;
        expect(await page.accessibility.snapshot({root: menu})).toEqual({
          role: 'menu',
          name: 'My Menu',
          children: [
            {role: 'menuitem', name: 'First Item'},
            {role: 'menuitem', name: 'Second Item'},
            {role: 'menuitem', name: 'Third Item'},
          ],
          orientation: 'vertical',
        });
      });
      it('should return null when the element is no longer in DOM', async () => {
        const {page} = await getTestState();

        await page.setContent(`<button>My Button</button>`);
        using button = (await page.$('button'))!;
        await page.$eval('button', button => {
          return button.remove();
        });
        expect(await page.accessibility.snapshot({root: button})).toEqual(null);
      });
      it('should support the interestingOnly option', async () => {
        const {page} = await getTestState();

        await page.setContent(`<div><button>My Button</button></div>`);
        using div = (await page.$('div'))!;
        expect(await page.accessibility.snapshot({root: div})).toEqual(null);
        expect(
          await page.accessibility.snapshot({
            root: div,
            interestingOnly: false,
          })
        ).toMatchObject({
          role: 'generic',
          name: '',
          children: [
            {
              role: 'button',
              name: 'My Button',
              children: [{role: 'StaticText', name: 'My Button'}],
            },
          ],
        });
      });
    });
  });

  function findFocusedNode(
    node: SerializedAXNode | null
  ): SerializedAXNode | null {
    if (node?.focused) {
      return node;
    }
    for (const child of node?.children || []) {
      const focusedChild = findFocusedNode(child);
      if (focusedChild) {
        return focusedChild;
      }
    }
    return null;
  }
});
