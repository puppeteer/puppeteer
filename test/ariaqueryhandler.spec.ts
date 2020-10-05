/**
 * Copyright 2020 Google Inc. All rights reserved.
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

import expect from 'expect';
import {
  getTestState,
  setupTestBrowserHooks,
  setupTestPageAndContextHooks,
  describeChromeOnly,
} from './mocha-utils'; // eslint-disable-line import/extensions

import { ElementHandle } from '../lib/cjs/puppeteer/common/JSHandle.js';

describeChromeOnly('AriaQueryHandler', () => {
  setupTestBrowserHooks();
  setupTestPageAndContextHooks();

  describe('parseAriaSelector', () => {
    beforeEach(async () => {
      const { page } = getTestState();
      await page.setContent(
        '<button id="btn" role="button"> Submit  button   and some spaces  </button>'
      );
    });
    it('should find button', async () => {
      const { page } = getTestState();
      const expectFound = async (button: ElementHandle) => {
        const id = await button.evaluate((button: Element) => button.id);
        expect(id).toBe('btn');
      };
      let button = await page.$(
        'aria/Submit button and some spaces[role="button"]'
      );
      await expectFound(button);
      button = await page.$(
        'aria/  Submit button and some spaces[role="button"]'
      );
      await expectFound(button);
      button = await page.$(
        'aria/Submit button and some spaces  [role="button"]'
      );
      await expectFound(button);
      button = await page.$(
        'aria/Submit  button   and  some  spaces   [  role  =  "button" ] '
      );
      await expectFound(button);
      button = await page.$(
        'aria/[role="button"]Submit button and some spaces'
      );
      await expectFound(button);
      button = await page.$(
        'aria/Submit button [role="button"]and some spaces'
      );
      await expectFound(button);
      button = await page.$(
        'aria/[name="  Submit  button and some  spaces"][role="button"]'
      );
      await expectFound(button);
      button = await page.$(
        'aria/ignored[name="Submit  button and some  spaces"][role="button"]'
      );
      await expectFound(button);
    });
  });

  describe('queryOne', () => {
    it('should find button by role', async () => {
      const { page } = getTestState();
      await page.setContent(
        '<div id="div"><button id="btn" role="button">Submit</button></div>'
      );
      const button = await page.$('aria/[role="button"]');
      const id = await button.evaluate((button: Element) => button.id);
      expect(id).toBe('btn');
    });

    it('should find button by name and role', async () => {
      const { page } = getTestState();
      await page.setContent(
        '<div id="div"><button id="btn" role="button">Submit</button></div>'
      );
      const button = await page.$('aria/Submit[role="button"]');
      const id = await button.evaluate((button: Element) => button.id);
      expect(id).toBe('btn');
    });

    it('should find first matching element', async () => {
      const { page } = getTestState();
      await page.setContent(
        `
        <div role="menu" id="mnu1" aria-label="menu div"></div>
        <div role="menu" id="mnu2" aria-label="menu div"></div>
        `
      );
      const div = await page.$('aria/menu div');
      const id = await div.evaluate((div: Element) => div.id);
      expect(id).toBe('mnu1');
    });

    it('should find by name', async () => {
      const { page } = getTestState();
      await page.setContent(
        `
        <div role="menu" id="mnu1" aria-label="menu-label1">menu div</div>
        <div role="menu" id="mnu2" aria-label="menu-label2">menu div</div>
        `
      );
      const menu = await page.$('aria/menu-label1');
      const id = await menu.evaluate((div: Element) => div.id);
      expect(id).toBe('mnu1');
    });

    it('should find by name', async () => {
      const { page } = getTestState();
      await page.setContent(
        `
        <div role="menu" id="mnu1" aria-label="menu-label1">menu div</div>
        <div role="menu" id="mnu2" aria-label="menu-label2">menu div</div>
        `
      );
      const menu = await page.$('aria/menu-label2');
      const id = await menu.evaluate((div: Element) => div.id);
      expect(id).toBe('mnu2');
    });
  });

  describe('queryAll', () => {
    it('should find menu by name', async () => {
      const { page } = getTestState();
      await page.setContent(
        `
        <div role="menu" id="mnu1" aria-label="menu div"></div>
        <div role="menu" id="mnu2" aria-label="menu div"></div>
        `
      );
      const divs = await page.$$('aria/menu div');
      const ids = await Promise.all(
        divs.map((n) => n.evaluate((div: Element) => div.id))
      );
      expect(ids.join(', ')).toBe('mnu1, mnu2');
    });
  });
  describe('queryAllArray', () => {
    it('$$eval should handle many elements', async () => {
      const { page } = getTestState();
      await page.setContent('');
      await page.evaluate(
        `
        for (var i = 0; i <= 10000; i++) {
            const button = document.createElement('button');
            button.textContent = i;
            document.body.appendChild(button);
        }
        `
      );
      const sum = await page.$$eval('aria/[role="button"]', (buttons) =>
        buttons.reduce((acc, button) => acc + Number(button.textContent), 0)
      );
      expect(sum).toBe(50005000);
    });
  });

  describe('queryOne (Chromium web test)', async () => {
    beforeEach(async () => {
      const { page } = getTestState();
      await page.setContent(
        `
          <h2 id="shown">title</h2>
          <h2 id="hidden" aria-hidden="true">title</h2>
          <div id="node1" aria-labeledby="node2"></div>
          <div id="node2" aria-label="bar"></div>
          <div id="node3" aria-label="foo"></div>
          <div id="node4" class="container">
          <div id="node5" role="button" aria-label="foo"></div>
          <div id="node6" role="button" aria-label="foo"></div>
          <!-- Accessible name not available when element is hidden -->
          <div id="node7" hidden role="button" aria-label="foo"></div>
          <div id="node8" role="button" aria-label="bar"></div>
          </div>
          <button id="node10">text content</button>
          <h1 id="node11">text content</h1>
          <!-- Accessible name not available when role is "presentation" -->
          <h1 id="node12" role="presentation">text content</h1>
          <!-- Elements inside shadow dom should be found -->
          <script>
          const div = document.createElement('div');
          const shadowRoot = div.attachShadow({mode: 'open'});
          const h1 = document.createElement('h1');
          h1.textContent = 'text content';
          h1.id = 'node13';
          shadowRoot.appendChild(h1);
          document.documentElement.appendChild(div);
          </script>
          <img id="node20" src="" alt="Accessible Name">
          <input id="node21" type="submit" value="Accessible Name">
          <label id="node22" for="node23">Accessible Name</label>
          <!-- Accessible name for the <input> is "Accessible Name" -->
          <input id="node23">
          <div id="node24" title="Accessible Name"></div>
          <div role="treeitem" id="node30">
          <div role="treeitem" id="node31">
          <div role="treeitem" id="node32">item1</div>
          <div role="treeitem" id="node33">item2</div>
          </div>
          <div role="treeitem" id="node34">item3</div>
          </div>
          <!-- Accessible name for the <div> is "item1 item2 item3" -->
          <div aria-describedby="node30"></div>
          `
      );
    });
    const getIds = async (elements: ElementHandle[]) =>
      Promise.all(
        elements.map((element) =>
          element.evaluate((element: Element) => element.id)
        )
      );
    it('should find by name "foo"', async () => {
      const { page } = getTestState();
      const found = await page.$$('aria/foo');
      const ids = await getIds(found);
      expect(ids).toEqual(['node3', 'node5', 'node6']);
    });
    it('should find by name "bar"', async () => {
      const { page } = getTestState();
      const found = await page.$$('aria/bar');
      const ids = await getIds(found);
      expect(ids).toEqual(['node1', 'node2', 'node8']);
    });
    it('should find treeitem by name', async () => {
      const { page } = getTestState();
      const found = await page.$$('aria/item1 item2 item3');
      const ids = await getIds(found);
      expect(ids).toEqual(['node30']);
    });
    it('should find by role "button"', async () => {
      const { page } = getTestState();
      const found = await page.$$('aria/[role="button"]');
      const ids = await getIds(found);
      expect(ids).toEqual(['node5', 'node6', 'node8', 'node10', 'node21']);
    });
    it('should find by role "heading"', async () => {
      const { page } = getTestState();
      const found = await page.$$('aria/[role="heading"]');
      const ids = await getIds(found);
      expect(ids).toEqual(['shown', 'hidden', 'node11', 'node13']);
    });
    it('should find both ignored and unignored', async () => {
      const { page } = getTestState();
      const found = await page.$$('aria/title');
      const ids = await getIds(found);
      expect(ids).toEqual(['shown', 'hidden']);
    });
  });
});
