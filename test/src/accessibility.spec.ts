/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';

import expect from 'expect';
import type {SerializedAXNode} from 'puppeteer-core/internal/cdp/Accessibility.js';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';
import {attachFrame, html, htmlRaw} from './utils.js';

describe('Accessibility', function () {
  setupTestBrowserHooks();

  it('should work', async () => {
    const {page} = await getTestState();

    await page.setContent(
      htmlRaw`
        <!DOCTYPE html>
        <html lang="en">
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
          <input
            aria-placeholder="placeholder"
            value="and a value"
            aria-describedby="desc"
          />
          <select>
            <option>First Option</option>
            <option>Second Option</option>
          </select>
          <a href="https://example.com">example</a>
        </body>`,
    );

    await page.focus('[placeholder="Empty input"]');
    expect(await page.accessibility.snapshot()).toMatchObject({
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
          expanded: false,
          children: [
            {role: 'option', name: 'First Option', selected: true},
            {role: 'option', name: 'Second Option'},
          ],
        },
        {
          name: 'example',
          role: 'link',
          url: 'https://example.com/',
        },
      ],
    });
  });

  it('should work for showcase', async () => {
    const {page, server} = await getTestState();
    await page.goto(server.PREFIX + '/a11y/landmarks.html');
    const snapshot = await page.accessibility.snapshot();
    expect(snapshot).toMatchObject({
      role: 'RootWebArea',
      name: 'HTML Elements Showcase',
      children: [
        {
          role: 'banner',
          name: '',
          children: [
            {
              role: 'heading',
              name: 'HTML Elements Showcase',
              level: 1,
            },
            {
              role: 'navigation',
              name: '',
              children: [
                {
                  role: 'link',
                  name: 'Forms',
                  children: [
                    {
                      role: 'StaticText',
                      name: 'Forms',
                    },
                  ],
                },
                {
                  role: 'link',
                  name: 'Media',
                  children: [
                    {
                      role: 'StaticText',
                      name: 'Media',
                    },
                  ],
                },
                {
                  role: 'link',
                  name: 'Interactive',
                  children: [
                    {
                      role: 'StaticText',
                      name: 'Interactive',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          role: 'main',
          name: '',
          children: [
            {
              role: 'search',
              name: '',
            },
          ],
        },
        {
          role: 'complementary',
          name: '',
          children: [
            {
              role: 'StaticText',
              name: 'complementary',
            },
          ],
        },
        {
          role: 'contentinfo',
          name: '',
          children: [
            {
              role: 'StaticText',
              name: 'contentinfo',
            },
          ],
        },
      ],
    });
  });

  it('should report uninteresting nodes', async () => {
    const {page} = await getTestState();

    await page.setContent(html`<textarea>hi</textarea>`);
    await page.focus('textarea');
    expect(
      findFocusedNode(
        await page.accessibility.snapshot({interestingOnly: false}),
      ),
    ).toMatchObject({
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
    });
  });
  it('get snapshots while the tree is re-calculated', async () => {
    // see https://github.com/puppeteer/puppeteer/issues/9404
    const {page} = await getTestState();

    await page.setContent(
      htmlRaw`<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta http-equiv="X-UA-Compatible" content="IE=edge" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />
            <title>Accessible name + aria-expanded puppeteer bug</title>
            <style>
              [aria-expanded='false'] + * {
                display: none;
              }
            </style>
          </head>
          <body>
            <button hidden>Show</button>
            <p>Some content</p>
            <script>
              const button = document.querySelector('button');
              button.removeAttribute('hidden');
              button.setAttribute('aria-expanded', 'false');
              button.addEventListener('click', function () {
                button.setAttribute(
                  'aria-expanded',
                  button.getAttribute('aria-expanded') !== 'true',
                );
                if (button.getAttribute('aria-expanded') == 'true') {
                  button.textContent = 'Hide';
                } else {
                  button.textContent = 'Show';
                }
              });
            </script>
          </body>
        </html>`,
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
      html`<div
        tabindex="-1"
        aria-roledescription="foo"
        >Hi</div
      >`,
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
      html`<a
        href=""
        role="slider"
        aria-orientation="vertical"
        >11</a
      >`,
    );
    const snapshot = await page.accessibility.snapshot();
    assert(snapshot);
    assert(snapshot.children);
    assert(snapshot.children[0]);
    expect(snapshot.children[0]!.orientation).toEqual('vertical');
  });
  it('autocomplete', async () => {
    const {page} = await getTestState();

    await page.setContent(
      html`<input
        type="number"
        aria-autocomplete="list"
      />`,
    );
    const snapshot = await page.accessibility.snapshot();
    assert(snapshot);
    assert(snapshot.children);
    assert(snapshot.children[0]);
    expect(snapshot.children[0]!.autocomplete).toEqual('list');
  });
  it('multiselectable', async () => {
    const {page} = await getTestState();

    await page.setContent(
      html`<div
        role="grid"
        tabindex="-1"
        aria-multiselectable="true"
      >
        hey
      </div>`,
    );
    const snapshot = await page.accessibility.snapshot();
    assert(snapshot);
    assert(snapshot.children);
    assert(snapshot.children[0]);
    expect(snapshot.children[0]!.multiselectable).toEqual(true);
  });

  describe('iframes', () => {
    it('should not include iframe data if not requested', async () => {
      const {page, server} = await getTestState();
      await attachFrame(page, 'frame1', server.EMPTY_PAGE);
      const frame1 = page.frames()[1];
      await frame1!.evaluate(() => {
        const button = document.createElement('button');
        button.innerText = 'value1';
        document.body.appendChild(button);
      });
      const snapshot = await page.accessibility.snapshot({
        interestingOnly: true,
      });
      expect(snapshot).toMatchObject({
        role: 'RootWebArea',
        name: '',
      });
    });

    it('same-origin iframe (interesting only)', async () => {
      const {page, server} = await getTestState();
      await attachFrame(page, 'frame1', server.EMPTY_PAGE);
      const frame1 = page.frames()[1];
      await frame1!.evaluate(() => {
        const button = document.createElement('button');
        button.innerText = 'value1';
        document.body.appendChild(button);
      });
      const snapshot = await page.accessibility.snapshot({
        interestingOnly: true,
        includeIframes: true,
      });
      expect(snapshot).toMatchObject({
        role: 'RootWebArea',
        name: '',
        children: [
          {
            role: 'Iframe',
            name: '',
            children: [
              {
                role: 'RootWebArea',
                name: '',
                children: [
                  {
                    role: 'button',
                    name: 'value1',
                  },
                ],
              },
            ],
          },
        ],
      });
    });

    it('cross-origin iframe (interesting only)', async () => {
      const {page, server} = await getTestState();
      await attachFrame(
        page,
        'frame1',
        server.CROSS_PROCESS_PREFIX + '/empty.html',
      );
      const frame1 = page.frames()[1];
      await frame1!.evaluate(() => {
        const button = document.createElement('button');
        button.innerText = 'value1';
        document.body.appendChild(button);
      });
      const snapshot = await page.accessibility.snapshot({
        interestingOnly: true,
        includeIframes: true,
      });
      expect(snapshot).toMatchObject({
        role: 'RootWebArea',
        name: '',
        children: [
          {
            role: 'Iframe',
            name: '',
            children: [
              {
                role: 'RootWebArea',
                name: '',
                children: [
                  {
                    role: 'button',
                    name: 'value1',
                  },
                ],
              },
            ],
          },
        ],
      });
    });

    it('same-origin iframe (all nodes)', async () => {
      const {page, server} = await getTestState();
      await attachFrame(page, 'frame1', server.EMPTY_PAGE);
      const frame1 = page.frames()[1];
      await frame1!.evaluate(() => {
        const button = document.createElement('button');
        button.innerText = 'value1';
        document.body.appendChild(button);
      });
      const snapshot = await page.accessibility.snapshot({
        interestingOnly: false,
        includeIframes: true,
      });
      expect(snapshot).toMatchObject({
        role: 'RootWebArea',
        name: '',
        children: [
          {
            role: 'none',
            children: [
              {
                role: 'generic',
                name: '',
                children: [
                  {
                    role: 'Iframe',
                    name: '',
                    children: [
                      {
                        role: 'RootWebArea',
                        name: '',
                        children: [
                          {
                            role: 'none',
                            children: [
                              {
                                role: 'generic',
                                name: '',
                                children: [
                                  {
                                    role: 'button',
                                    name: 'value1',
                                    children: [
                                      {
                                        role: 'StaticText',
                                        name: 'value1',
                                        children: [
                                          {
                                            role: 'InlineTextBox',
                                          },
                                        ],
                                      },
                                    ],
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });
    });
  });

  it('keyshortcuts', async () => {
    const {page} = await getTestState();

    await page.setContent(
      html`<div
        role="grid"
        tabindex="-1"
        aria-keyshortcuts="foo"
        >hey</div
      >`,
    );
    const snapshot = await page.accessibility.snapshot();
    assert(snapshot);
    assert(snapshot.children);
    assert(snapshot.children[0]);
    expect(snapshot.children[0]!.keyshortcuts).toEqual('foo');
  });
  describe('filtering children of leaf nodes', function () {
    it('should not report text nodes inside controls', async () => {
      const {page} = await getTestState();

      await page.setContent(
        html` <div role="tablist">
          <div
            role="tab"
            aria-selected="true"
            ><b>Tab1</b></div
          >
          <div role="tab">Tab2</div>
        </div>`,
      );

      expect(await page.accessibility.snapshot()).toMatchObject({
        role: 'RootWebArea',
        name: 'My test page',
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
      });
    });
    it('rich text editable fields should have children', async () => {
      const {page} = await getTestState();

      await page.setContent(
        html` <div contenteditable="true">
          Edit this image:
          <img
            src="fakeimage.png"
            alt="my fake image"
          />
        </div>`,
      );
      const snapshot = await page.accessibility.snapshot();
      assert(snapshot);
      assert(snapshot.children);
      expect(snapshot.children[0]).toMatchObject({
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
      });
    });
    it('rich text editable fields with role should have children', async () => {
      const {page} = await getTestState();

      await page.setContent(
        html` <div
          contenteditable="true"
          role="textbox"
        >
          Edit this image:
          <img
            src="fakeimage.png"
            alt="my fake image"
          />
        </div>`,
      );
      // Image node should not be exposed in contenteditable elements. See https://crbug.com/1324392.
      const snapshot = await page.accessibility.snapshot();
      assert(snapshot);
      assert(snapshot.children);
      expect(snapshot.children[0]).toMatchObject({
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
      });
    });

    // Firefox does not support contenteditable="plaintext-only".
    describe('plaintext contenteditable', function () {
      it('plain text field with role should not have children', async () => {
        const {page} = await getTestState();

        await page.setContent(
          html`<div
            contenteditable="plaintext-only"
            role="textbox"
            >Edit this image:<img
              src="fakeimage.png"
              alt="my fake image"
          /></div>`,
        );
        const snapshot = await page.accessibility.snapshot();
        assert(snapshot);
        assert(snapshot.children);
        expect(snapshot.children[0]).toMatchObject({
          role: 'textbox',
          name: '',
          value: 'Edit this image:',
          multiline: true,
        });
      });
    });
    it('non editable textbox with role and tabIndex and label should not have children', async () => {
      const {page} = await getTestState();

      await page.setContent(
        html`<div
          role="textbox"
          tabindex="0"
          aria-checked="true"
          aria-label="my favorite textbox"
        >
          this is the inner content
          <img
            alt="yo"
            src="fakeimg.png"
          />
        </div>`,
      );

      const snapshot = await page.accessibility.snapshot();
      assert(snapshot);
      assert(snapshot.children);
      expect(snapshot.children[0]).toMatchObject({
        role: 'textbox',
        name: 'my favorite textbox',
        value: 'this is the inner content ',
      });
    });
    it('checkbox with and tabIndex and label should not have children', async () => {
      const {page} = await getTestState();

      await page.setContent(
        html` <div
          role="checkbox"
          tabindex="0"
          aria-checked="true"
          aria-label="my favorite checkbox"
        >
          this is the inner content
          <img
            alt="yo"
            src="fakeimg.png"
          />
        </div>`,
      );
      const snapshot = await page.accessibility.snapshot();
      assert(snapshot);
      assert(snapshot.children);
      expect(snapshot.children[0]).toMatchObject({
        role: 'checkbox',
        name: 'my favorite checkbox',
        checked: true,
      });
    });
    it('checkbox without label should not have children', async () => {
      const {page} = await getTestState();

      await page.setContent(
        html`<div
          role="checkbox"
          aria-checked="true"
        >
          this is the inner content
          <img
            alt="yo"
            src="fakeimg.png"
          />
        </div>`,
      );
      const snapshot = await page.accessibility.snapshot();
      assert(snapshot);
      assert(snapshot.children);
      expect(snapshot.children[0]).toMatchObject({
        role: 'checkbox',
        name: 'this is the inner content yo',
        checked: true,
      });
    });

    describe('root option', function () {
      it('should work a button', async () => {
        const {page} = await getTestState();

        await page.setContent(html`<button>My Button</button>`);

        using button = (await page.$('button'))!;
        expect(await page.accessibility.snapshot({root: button})).toMatchObject(
          {
            role: 'button',
            name: 'My Button',
          },
        );
      });
      it('should work an input', async () => {
        const {page} = await getTestState();

        await page.setContent(
          html`<input
            title="My Input"
            value="My Value"
          />`,
        );

        using input = (await page.$('input'))!;
        expect(await page.accessibility.snapshot({root: input})).toMatchObject({
          role: 'textbox',
          name: 'My Input',
          value: 'My Value',
        });
      });
      it('should work a menu', async () => {
        const {page} = await getTestState();

        await page.setContent(html`
          <div
            role="menu"
            title="My Menu"
          >
            <div role="menuitem">First Item</div>
            <div role="menuitem">Second Item</div>
            <div role="menuitem">Third Item</div>
          </div>
        `);

        using menu = (await page.$('div[role="menu"]'))!;
        expect(await page.accessibility.snapshot({root: menu})).toMatchObject({
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

        await page.setContent(html`<button>My Button</button>`);
        using button = (await page.$('button'))!;
        await page.$eval('button', button => {
          return button.remove();
        });
        expect(await page.accessibility.snapshot({root: button})).toEqual(null);
      });
      it('should support the interestingOnly option', async () => {
        const {page} = await getTestState();

        await page.setContent(
          html`<div><button>My Button</button></div
            ><div class="uninteresting"></div>`,
        );
        using div = (await page.$('div.uninteresting'))!;
        expect(await page.accessibility.snapshot({root: div})).toEqual(null);
        using divWithButton = (await page.$('div'))!;
        expect(
          await page.accessibility.snapshot({root: divWithButton}),
        ).toMatchObject({
          name: 'My Button',
          role: 'button',
        });
        expect(
          await page.accessibility.snapshot({
            root: divWithButton,
            interestingOnly: false,
          }),
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
      it('should work with nested button inside h1 with interestingOnly:true', async () => {
        const {page} = await getTestState();

        await page.setContent(html`
          <main>
            <h2>
              <button>My Button</button>
            </h2>
          </main>
        `);

        using button = (await page.$('button'))!;
        expect(await page.accessibility.snapshot({root: button})).toMatchObject(
          {
            role: 'button',
            name: 'My Button',
          },
        );
      });
    });

    describe('elementHandle()', () => {
      it('should get an ElementHandle from a snapshot item', async () => {
        const {page} = await getTestState();

        await page.setContent(html`<button>My Button</button>`);

        using button = (await page.$('button'))!;
        const snapshot = await page.accessibility.snapshot({root: button});
        expect(snapshot).toMatchObject({
          role: 'button',
          name: 'My Button',
        });

        using buttonHandle = await snapshot!.elementHandle();
        expect(
          await buttonHandle?.evaluate(button => {
            return button.innerHTML;
          }),
        ).toEqual('My Button');
      });

      it('should get the parent ElementHandle from a text node accessibility node', async () => {
        const {page} = await getTestState();

        await page.setContent(html`<div><b>Hello, </b> world!</div>`);
        using div = (await page.$('div'))!;

        const parentSnapshot = await page.accessibility.snapshot({
          root: div,
          interestingOnly: false,
        });
        expect(parentSnapshot).toMatchObject({
          role: 'generic',
          name: '',
          children: [
            {role: 'StaticText', name: 'Hello, '},
            {role: 'StaticText', name: 'world!'},
          ],
        });

        using textNode = (await div.evaluateHandle(el => {
          return el.lastChild!;
        }))!;
        const snapshot = await page.accessibility.snapshot({root: textNode});
        expect(snapshot).toMatchObject({
          role: 'StaticText',
          name: 'world!',
        });

        // Get the element handle from the text node.
        // This should be the parent's handle, not the text node's.
        using parentNodeHandle = await parentSnapshot!.elementHandle();
        using textNodeHandle = await snapshot!.elementHandle();
        expect(parentNodeHandle).toEqual(textNodeHandle);

        expect(
          await textNodeHandle?.evaluate(button => {
            return button.innerHTML;
          }),
        ).toEqual('<b>Hello, </b> world!');
      });
    });

    it('should not report Document as leaf node', async () => {
      const {page} = await getTestState();

      await page.setContent(
        html`<main><span>Hello</span><div> </div><div>World</div></main>`,
      );

      const snapshot = await page.accessibility.snapshot();
      expect(snapshot).toMatchObject({
        role: 'RootWebArea',
        name: 'My test page',
        children: [
          {
            name: '',
            role: 'main',
            children: [
              {
                name: 'Hello',
                role: 'StaticText',
              },
              {
                name: 'World',
                role: 'StaticText',
              },
            ],
          },
        ],
      });
    });
  });

  function findFocusedNode(
    node: SerializedAXNode | null,
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
