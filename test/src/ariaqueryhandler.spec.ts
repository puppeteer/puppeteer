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

import assert from 'assert';

import expect from 'expect';
import {TimeoutError} from 'puppeteer';
import type {ElementHandle} from 'puppeteer-core/internal/api/ElementHandle.js';

import {
  getTestState,
  setupTestBrowserHooks,
  setupTestPageAndContextHooks,
} from './mocha-utils.js';
import utils from './utils.js';

describe('AriaQueryHandler', () => {
  setupTestBrowserHooks();
  setupTestPageAndContextHooks();

  describe('parseAriaSelector', () => {
    beforeEach(async () => {
      const {page} = getTestState();
      await page.setContent(
        '<button id="btn" role="button"> Submit  button   and some spaces  </button>'
      );
    });
    it('should find button', async () => {
      const {page} = getTestState();
      const expectFound = async (button: ElementHandle | null) => {
        assert(button);
        const id = await button.evaluate((button: Element) => {
          return button.id;
        });
        expect(id).toBe('btn');
      };
      let button = await page.$(
        'aria/Submit button and some spaces[role="button"]'
      );
      await expectFound(button);
      button = await page.$(
        "aria/Submit button and some spaces[role='button']"
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
        "aria/[name='  Submit  button and some  spaces'][role='button']"
      );
      await expectFound(button);
      button = await page.$(
        'aria/ignored[name="Submit  button and some  spaces"][role="button"]'
      );
      await expectFound(button);
      await expect(page.$('aria/smth[smth="true"]')).rejects.toThrow(
        'Unknown aria attribute "smth" in selector'
      );
    });
  });

  describe('queryOne', () => {
    it('should find button by role', async () => {
      const {page} = getTestState();
      await page.setContent(
        '<div id="div"><button id="btn" role="button">Submit</button></div>'
      );
      const button = (await page.$(
        'aria/[role="button"]'
      )) as ElementHandle<HTMLButtonElement>;
      const id = await button!.evaluate(button => {
        return button.id;
      });
      expect(id).toBe('btn');
    });

    it('should find button by name and role', async () => {
      const {page} = getTestState();
      await page.setContent(
        '<div id="div"><button id="btn" role="button">Submit</button></div>'
      );
      const button = (await page.$(
        'aria/Submit[role="button"]'
      )) as ElementHandle<HTMLButtonElement>;
      const id = await button!.evaluate(button => {
        return button.id;
      });
      expect(id).toBe('btn');
    });

    it('should find first matching element', async () => {
      const {page} = getTestState();
      await page.setContent(
        `
        <div role="menu" id="mnu1" aria-label="menu div"></div>
        <div role="menu" id="mnu2" aria-label="menu div"></div>
        `
      );
      const div = (await page.$(
        'aria/menu div'
      )) as ElementHandle<HTMLDivElement>;
      const id = await div!.evaluate(div => {
        return div.id;
      });
      expect(id).toBe('mnu1');
    });

    it('should find by name', async () => {
      const {page} = getTestState();
      await page.setContent(
        `
        <div role="menu" id="mnu1" aria-label="menu-label1">menu div</div>
        <div role="menu" id="mnu2" aria-label="menu-label2">menu div</div>
        `
      );
      const menu = (await page.$(
        'aria/menu-label1'
      )) as ElementHandle<HTMLDivElement>;
      const id = await menu!.evaluate(div => {
        return div.id;
      });
      expect(id).toBe('mnu1');
    });

    it('should find by name', async () => {
      const {page} = getTestState();
      await page.setContent(
        `
        <div role="menu" id="mnu1" aria-label="menu-label1">menu div</div>
        <div role="menu" id="mnu2" aria-label="menu-label2">menu div</div>
        `
      );
      const menu = (await page.$(
        'aria/menu-label2'
      )) as ElementHandle<HTMLDivElement>;
      const id = await menu!.evaluate(div => {
        return div.id;
      });
      expect(id).toBe('mnu2');
    });
  });

  describe('queryAll', () => {
    it('should find menu by name', async () => {
      const {page} = getTestState();
      await page.setContent(
        `
        <div role="menu" id="mnu1" aria-label="menu div"></div>
        <div role="menu" id="mnu2" aria-label="menu div"></div>
        `
      );
      const divs = (await page.$$('aria/menu div')) as Array<
        ElementHandle<HTMLDivElement>
      >;
      const ids = await Promise.all(
        divs.map(n => {
          return n.evaluate(div => {
            return div.id;
          });
        })
      );
      expect(ids.join(', ')).toBe('mnu1, mnu2');
    });
  });
  describe('queryAllArray', () => {
    it('$$eval should handle many elements', async () => {
      const {page} = getTestState();
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
      const sum = await page.$$eval('aria/[role="button"]', buttons => {
        return buttons.reduce((acc, button) => {
          return acc + Number(button.textContent);
        }, 0);
      });
      expect(sum).toBe(50005000);
    });
  });

  describe('waitForSelector (aria)', function () {
    const addElement = (tag: string) => {
      return document.body.appendChild(document.createElement(tag));
    };

    it('should immediately resolve promise if node exists', async () => {
      const {page, server} = getTestState();
      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(addElement, 'button');
      await page.waitForSelector('aria/[role="button"]');
    });

    it('should work for ElementHandle.waitForSelector', async () => {
      const {page, server} = getTestState();
      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(() => {
        return (document.body.innerHTML = `<div><button>test</button></div>`);
      });
      const element = (await page.$('div'))!;
      await element!.waitForSelector('aria/test');
    });

    it('should persist query handler bindings across reloads', async () => {
      const {page, server} = getTestState();
      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(addElement, 'button');
      await page.waitForSelector('aria/[role="button"]');
      await page.reload();
      await page.evaluate(addElement, 'button');
      await page.waitForSelector('aria/[role="button"]');
    });

    it('should persist query handler bindings across navigations', async () => {
      const {page, server} = getTestState();

      // Reset page but make sure that execution context ids start with 1.
      await page.goto('data:text/html,');
      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(addElement, 'button');
      await page.waitForSelector('aria/[role="button"]');

      // Reset page but again make sure that execution context ids start with 1.
      await page.goto('data:text/html,');
      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(addElement, 'button');
      await page.waitForSelector('aria/[role="button"]');
    });

    it('should work independently of `exposeFunction`', async () => {
      const {page, server} = getTestState();
      await page.goto(server.EMPTY_PAGE);
      await page.exposeFunction('ariaQuerySelector', (a: number, b: number) => {
        return a + b;
      });
      await page.evaluate(addElement, 'button');
      await page.waitForSelector('aria/[role="button"]');
      const result = await page.evaluate('globalThis.ariaQuerySelector(2,8)');
      expect(result).toBe(10);
    });

    it('should work with removed MutationObserver', async () => {
      const {page} = getTestState();

      await page.evaluate(() => {
        // @ts-expect-error This is the point of the test.
        return delete window.MutationObserver;
      });
      const [handle] = await Promise.all([
        page.waitForSelector('aria/anything'),
        page.setContent(`<h1>anything</h1>`),
      ]);
      assert(handle);
      expect(
        await page.evaluate(x => {
          return x.textContent;
        }, handle)
      ).toBe('anything');
    });

    it('should resolve promise when node is added', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const frame = page.mainFrame();
      const watchdog = frame.waitForSelector('aria/[role="heading"]');
      await frame.evaluate(addElement, 'br');
      await frame.evaluate(addElement, 'h1');
      const elementHandle = (await watchdog)!;
      const tagName = await (
        await elementHandle.getProperty('tagName')
      ).jsonValue();
      expect(tagName).toBe('H1');
    });

    it('should work when node is added through innerHTML', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const watchdog = page.waitForSelector('aria/name');
      await page.evaluate(addElement, 'span');
      await page.evaluate(() => {
        return (document.querySelector('span')!.innerHTML =
          '<h3><div aria-label="name"></div></h3>');
      });
      await watchdog;
    });

    it('Page.waitForSelector is shortcut for main frame', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await utils.attachFrame(page, 'frame1', server.EMPTY_PAGE);
      const otherFrame = page.frames()[1];
      const watchdog = page.waitForSelector('aria/[role="button"]');
      await otherFrame!.evaluate(addElement, 'button');
      await page.evaluate(addElement, 'button');
      const elementHandle = await watchdog;
      expect(elementHandle!.frame).toBe(page.mainFrame());
    });

    it('should run in specified frame', async () => {
      const {page, server} = getTestState();

      await utils.attachFrame(page, 'frame1', server.EMPTY_PAGE);
      await utils.attachFrame(page, 'frame2', server.EMPTY_PAGE);
      const frame1 = page.frames()[1];
      const frame2 = page.frames()[2];
      const waitForSelectorPromise = frame2!.waitForSelector(
        'aria/[role="button"]'
      );
      await frame1!.evaluate(addElement, 'button');
      await frame2!.evaluate(addElement, 'button');
      const elementHandle = await waitForSelectorPromise;
      expect(elementHandle!.frame).toBe(frame2);
    });

    it('should throw when frame is detached', async () => {
      const {page, server} = getTestState();

      await utils.attachFrame(page, 'frame1', server.EMPTY_PAGE);
      const frame = page.frames()[1];
      let waitError!: Error;
      const waitPromise = frame!
        .waitForSelector('aria/does-not-exist')
        .catch(error => {
          return (waitError = error);
        });
      await utils.detachFrame(page, 'frame1');
      await waitPromise;
      expect(waitError).toBeTruthy();
      expect(waitError.message).toContain(
        'waitForFunction failed: frame got detached.'
      );
    });

    it('should survive cross-process navigation', async () => {
      const {page, server} = getTestState();

      let imgFound = false;
      const waitForSelector = page
        .waitForSelector('aria/[role="img"]')
        .then(() => {
          return (imgFound = true);
        });
      await page.goto(server.EMPTY_PAGE);
      expect(imgFound).toBe(false);
      await page.reload();
      expect(imgFound).toBe(false);
      await page.goto(server.CROSS_PROCESS_PREFIX + '/grid.html');
      await waitForSelector;
      expect(imgFound).toBe(true);
    });

    it('should wait for visible', async () => {
      const {page} = getTestState();

      let divFound = false;
      const waitForSelector = page
        .waitForSelector('aria/name', {visible: true})
        .then(() => {
          return (divFound = true);
        });
      await page.setContent(
        `<div aria-label='name' style='display: none; visibility: hidden;'>1</div>`
      );
      expect(divFound).toBe(false);
      await page.evaluate(() => {
        return document.querySelector('div')!.style.removeProperty('display');
      });
      expect(divFound).toBe(false);
      await page.evaluate(() => {
        return document
          .querySelector('div')!
          .style.removeProperty('visibility');
      });
      expect(await waitForSelector).toBe(true);
      expect(divFound).toBe(true);
    });

    it('should wait for visible recursively', async () => {
      const {page} = getTestState();

      let divVisible = false;
      const waitForSelector = page
        .waitForSelector('aria/inner', {visible: true})
        .then(() => {
          return (divVisible = true);
        });
      await page.setContent(
        `<div style='display: none; visibility: hidden;'><div aria-label="inner">hi</div></div>`
      );
      expect(divVisible).toBe(false);
      await page.evaluate(() => {
        return document.querySelector('div')!.style.removeProperty('display');
      });
      expect(divVisible).toBe(false);
      await page.evaluate(() => {
        return document
          .querySelector('div')!
          .style.removeProperty('visibility');
      });
      expect(await waitForSelector).toBe(true);
      expect(divVisible).toBe(true);
    });

    it('hidden should wait for visibility: hidden', async () => {
      const {page} = getTestState();

      let divHidden = false;
      await page.setContent(
        `<div role='button' style='display: block;'>text</div>`
      );
      const waitForSelector = page
        .waitForSelector('aria/[role="button"]', {hidden: true})
        .then(() => {
          return (divHidden = true);
        });
      await page.waitForSelector('aria/[role="button"]'); // do a round trip
      expect(divHidden).toBe(false);
      await page.evaluate(() => {
        return document
          .querySelector('div')!
          .style.setProperty('visibility', 'hidden');
      });
      expect(await waitForSelector).toBe(true);
      expect(divHidden).toBe(true);
    });

    it('hidden should wait for display: none', async () => {
      const {page} = getTestState();

      let divHidden = false;
      await page.setContent(
        `<div role='main' style='display: block;'>text</div>`
      );
      const waitForSelector = page
        .waitForSelector('aria/[role="main"]', {hidden: true})
        .then(() => {
          return (divHidden = true);
        });
      await page.waitForSelector('aria/[role="main"]'); // do a round trip
      expect(divHidden).toBe(false);
      await page.evaluate(() => {
        return document
          .querySelector('div')!
          .style.setProperty('display', 'none');
      });
      expect(await waitForSelector).toBe(true);
      expect(divHidden).toBe(true);
    });

    it('hidden should wait for removal', async () => {
      const {page} = getTestState();

      await page.setContent(`<div role='main'>text</div>`);
      let divRemoved = false;
      const waitForSelector = page
        .waitForSelector('aria/[role="main"]', {hidden: true})
        .then(() => {
          return (divRemoved = true);
        });
      await page.waitForSelector('aria/[role="main"]'); // do a round trip
      expect(divRemoved).toBe(false);
      await page.evaluate(() => {
        return document.querySelector('div')!.remove();
      });
      expect(await waitForSelector).toBe(true);
      expect(divRemoved).toBe(true);
    });

    it('should return null if waiting to hide non-existing element', async () => {
      const {page} = getTestState();

      const handle = await page.waitForSelector('aria/non-existing', {
        hidden: true,
      });
      expect(handle).toBe(null);
    });

    it('should respect timeout', async () => {
      const {page} = getTestState();

      const error = await page
        .waitForSelector('aria/[role="button"]', {
          timeout: 10,
        })
        .catch(error => {
          return error;
        });
      expect(error.message).toContain(
        'Waiting for selector `[role="button"]` failed: Waiting failed: 10ms exceeded'
      );
      expect(error).toBeInstanceOf(TimeoutError);
    });

    it('should have an error message specifically for awaiting an element to be hidden', async () => {
      const {page} = getTestState();

      await page.setContent(`<div role='main'>text</div>`);
      const promise = page.waitForSelector('aria/[role="main"]', {
        hidden: true,
        timeout: 10,
      });
      await expect(promise).rejects.toMatchObject({
        message:
          'Waiting for selector `[role="main"]` failed: Waiting failed: 10ms exceeded',
      });
    });

    it('should respond to node attribute mutation', async () => {
      const {page} = getTestState();

      let divFound = false;
      const waitForSelector = page.waitForSelector('aria/zombo').then(() => {
        return (divFound = true);
      });
      await page.setContent(`<div aria-label='notZombo'></div>`);
      expect(divFound).toBe(false);
      await page.evaluate(() => {
        return document
          .querySelector('div')!
          .setAttribute('aria-label', 'zombo');
      });
      expect(await waitForSelector).toBe(true);
    });

    it('should return the element handle', async () => {
      const {page} = getTestState();

      const waitForSelector = page.waitForSelector('aria/zombo');
      await page.setContent(`<div aria-label='zombo'>anything</div>`);
      expect(
        await page.evaluate(x => {
          return x?.textContent;
        }, await waitForSelector)
      ).toBe('anything');
    });

    it('should have correct stack trace for timeout', async () => {
      const {page} = getTestState();

      let error!: Error;
      await page.waitForSelector('aria/zombo', {timeout: 10}).catch(error_ => {
        return (error = error_);
      });
      expect(error!.stack).toContain(
        'Waiting for selector `zombo` failed: Waiting failed: 10ms exceeded'
      );
    });
  });

  describe('queryOne (Chromium web test)', async () => {
    beforeEach(async () => {
      const {page} = getTestState();
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
    const getIds = async (elements: ElementHandle[]) => {
      return Promise.all(
        elements.map(element => {
          return element.evaluate((element: Element) => {
            return element.id;
          });
        })
      );
    };
    it('should find by name "foo"', async () => {
      const {page} = getTestState();
      const found = await page.$$('aria/foo');
      const ids = await getIds(found);
      expect(ids).toEqual(['node3', 'node5', 'node6']);
    });
    it('should find by name "bar"', async () => {
      const {page} = getTestState();
      const found = await page.$$('aria/bar');
      const ids = await getIds(found);
      expect(ids).toEqual(['node1', 'node2', 'node8']);
    });
    it('should find treeitem by name', async () => {
      const {page} = getTestState();
      const found = await page.$$('aria/item1 item2 item3');
      const ids = await getIds(found);
      expect(ids).toEqual(['node30']);
    });
    it('should find by role "button"', async () => {
      const {page} = getTestState();
      const found = (await page.$$('aria/[role="button"]')) as Array<
        ElementHandle<HTMLButtonElement>
      >;
      const ids = await getIds(found);
      expect(ids).toEqual([
        'node5',
        'node6',
        'node7',
        'node8',
        'node10',
        'node21',
      ]);
    });
    it('should find by role "heading"', async () => {
      const {page} = getTestState();
      const found = await page.$$('aria/[role="heading"]');
      const ids = await getIds(found);
      expect(ids).toEqual(['shown', 'hidden', 'node11', 'node13']);
    });
    it('should find both ignored and unignored', async () => {
      const {page} = getTestState();
      const found = await page.$$('aria/title');
      const ids = await getIds(found);
      expect(ids).toEqual(['shown']);
    });
  });
});
