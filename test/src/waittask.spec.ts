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

import expect from 'expect';
import {isErrorLike} from '../../lib/cjs/puppeteer/util/ErrorLike.js';
import {
  getTestState,
  setupTestBrowserHooks,
  setupTestPageAndContextHooks,
} from './mocha-utils.js';
import {attachFrame, detachFrame} from './utils.js';

describe('waittask specs', function () {
  setupTestBrowserHooks();
  setupTestPageAndContextHooks();

  describe('Frame.waitForFunction', function () {
    it('should accept a string', async () => {
      const {page} = getTestState();

      const watchdog = page.waitForFunction(() => {
        return (window as unknown as {__FOO: number}).__FOO === 1;
      });
      await page.evaluate(() => {
        return ((globalThis as any).__FOO = 1);
      });
      await watchdog;
    });
    it('should work when resolved right before execution context disposal', async () => {
      const {page} = getTestState();

      await page.evaluateOnNewDocument(() => {
        return ((globalThis as any).__RELOADED = true);
      });
      await page.waitForFunction(() => {
        if (!(globalThis as any).__RELOADED) {
          window.location.reload();
        }
        return true;
      });
    });
    it('should poll on interval', async () => {
      const {page} = getTestState();

      let success = false;
      const startTime = Date.now();
      const polling = 100;
      const watchdog = page
        .waitForFunction(
          () => {
            return (globalThis as any).__FOO === 'hit';
          },
          {
            polling,
          }
        )
        .then(() => {
          return (success = true);
        });
      await page.evaluate(() => {
        return ((globalThis as any).__FOO = 'hit');
      });
      expect(success).toBe(false);
      await page.evaluate(() => {
        return document.body.appendChild(document.createElement('div'));
      });
      await watchdog;
      expect(Date.now() - startTime).not.toBeLessThan(polling / 2);
    });
    it('should poll on interval async', async () => {
      const {page} = getTestState();
      let success = false;
      const startTime = Date.now();
      const polling = 100;
      const watchdog = page
        .waitForFunction(
          async () => {
            return (globalThis as any).__FOO === 'hit';
          },
          {
            polling,
          }
        )
        .then(() => {
          return (success = true);
        });
      await page.evaluate(async () => {
        return ((globalThis as any).__FOO = 'hit');
      });
      expect(success).toBe(false);
      await page.evaluate(async () => {
        return document.body.appendChild(document.createElement('div'));
      });
      await watchdog;
      expect(Date.now() - startTime).not.toBeLessThan(polling / 2);
    });
    it('should poll on mutation', async () => {
      const {page} = getTestState();

      let success = false;
      const watchdog = page
        .waitForFunction(
          () => {
            return (globalThis as any).__FOO === 'hit';
          },
          {
            polling: 'mutation',
          }
        )
        .then(() => {
          return (success = true);
        });
      await page.evaluate(() => {
        return ((globalThis as any).__FOO = 'hit');
      });
      expect(success).toBe(false);
      await page.evaluate(() => {
        return document.body.appendChild(document.createElement('div'));
      });
      await watchdog;
    });
    it('should poll on mutation async', async () => {
      const {page} = getTestState();

      let success = false;
      const watchdog = page
        .waitForFunction(
          async () => {
            return (globalThis as any).__FOO === 'hit';
          },
          {
            polling: 'mutation',
          }
        )
        .then(() => {
          return (success = true);
        });
      await page.evaluate(async () => {
        return ((globalThis as any).__FOO = 'hit');
      });
      expect(success).toBe(false);
      await page.evaluate(async () => {
        return document.body.appendChild(document.createElement('div'));
      });
      await watchdog;
    });
    it('should poll on raf', async () => {
      const {page} = getTestState();

      const watchdog = page.waitForFunction(
        () => {
          return (globalThis as any).__FOO === 'hit';
        },
        {
          polling: 'raf',
        }
      );
      await page.evaluate(() => {
        return ((globalThis as any).__FOO = 'hit');
      });
      await watchdog;
    });
    it('should poll on raf async', async () => {
      const {page} = getTestState();

      const watchdog = page.waitForFunction(
        async () => {
          return (globalThis as any).__FOO === 'hit';
        },
        {
          polling: 'raf',
        }
      );
      await page.evaluate(async () => {
        return ((globalThis as any).__FOO = 'hit');
      });
      await watchdog;
    });
    it('should work with strict CSP policy', async () => {
      const {page, server} = getTestState();

      server.setCSP('/empty.html', 'script-src ' + server.PREFIX);
      await page.goto(server.EMPTY_PAGE);
      let error!: Error;
      await Promise.all([
        page
          .waitForFunction(
            () => {
              return (globalThis as any).__FOO === 'hit';
            },
            {
              polling: 'raf',
            }
          )
          .catch(error_ => {
            return (error = error_);
          }),
        page.evaluate(() => {
          return ((globalThis as any).__FOO = 'hit');
        }),
      ]);
      expect(error).toBeUndefined();
    });
    it('should throw on bad polling value', async () => {
      const {page} = getTestState();

      let error!: Error;
      try {
        await page.waitForFunction(
          () => {
            return !!document.body;
          },
          {
            polling: 'unknown',
          }
        );
      } catch (error_) {
        if (isErrorLike(error_)) {
          error = error_ as Error;
        }
      }
      expect(error?.message).toContain('polling');
    });
    it('should throw negative polling interval', async () => {
      const {page} = getTestState();

      let error!: Error;
      try {
        await page.waitForFunction(
          () => {
            return !!document.body;
          },
          {polling: -10}
        );
      } catch (error_) {
        if (isErrorLike(error_)) {
          error = error_ as Error;
        }
      }
      expect(error?.message).toContain(
        'Cannot poll with non-positive interval'
      );
    });
    it('should return the success value as a JSHandle', async () => {
      const {page} = getTestState();

      expect(
        await (
          await page.waitForFunction(() => {
            return 5;
          })
        ).jsonValue()
      ).toBe(5);
    });
    it('should return the window as a success value', async () => {
      const {page} = getTestState();

      expect(
        await page.waitForFunction(() => {
          return window;
        })
      ).toBeTruthy();
    });
    it('should accept ElementHandle arguments', async () => {
      const {page} = getTestState();

      await page.setContent('<div></div>');
      const div = (await page.$('div'))!;
      let resolved = false;
      const waitForFunction = page
        .waitForFunction(
          (element: Element) => {
            return element.localName === 'div' && !element.parentElement;
          },
          {},
          div
        )
        .then(() => {
          return (resolved = true);
        });
      expect(resolved).toBe(false);
      await page.evaluate((element: HTMLElement) => {
        return element.remove();
      }, div);
      await waitForFunction;
    });
    it('should respect timeout', async () => {
      const {page, puppeteer} = getTestState();

      let error!: Error;
      await page
        .waitForFunction(
          () => {
            return false;
          },
          {timeout: 10}
        )
        .catch(error_ => {
          return (error = error_);
        });

      expect(error).toBeInstanceOf(puppeteer.errors.TimeoutError);
      expect(error?.message).toContain('waiting for function failed: timeout');
    });
    it('should respect default timeout', async () => {
      const {page, puppeteer} = getTestState();

      page.setDefaultTimeout(1);
      let error!: Error;
      await page
        .waitForFunction(() => {
          return false;
        })
        .catch(error_ => {
          return (error = error_);
        });
      expect(error).toBeInstanceOf(puppeteer.errors.TimeoutError);
      expect(error?.message).toContain('waiting for function failed: timeout');
    });
    it('should disable timeout when its set to 0', async () => {
      const {page} = getTestState();

      const watchdog = page.waitForFunction(
        () => {
          (globalThis as any).__counter =
            ((globalThis as any).__counter || 0) + 1;
          return (globalThis as any).__injected;
        },
        {timeout: 0, polling: 10}
      );
      await page.waitForFunction(() => {
        return (globalThis as any).__counter > 10;
      });
      await page.evaluate(() => {
        return ((globalThis as any).__injected = true);
      });
      await watchdog;
    });
    it('should survive cross-process navigation', async () => {
      const {page, server} = getTestState();

      let fooFound = false;
      const waitForFunction = page
        .waitForFunction(() => {
          return (globalThis as unknown as {__FOO: number}).__FOO === 1;
        })
        .then(() => {
          return (fooFound = true);
        });
      await page.goto(server.EMPTY_PAGE);
      expect(fooFound).toBe(false);
      await page.reload();
      expect(fooFound).toBe(false);
      await page.goto(server.CROSS_PROCESS_PREFIX + '/grid.html');
      expect(fooFound).toBe(false);
      await page.evaluate(() => {
        return ((globalThis as any).__FOO = 1);
      });
      await waitForFunction;
      expect(fooFound).toBe(true);
    });
    it('should survive navigations', async () => {
      const {page, server} = getTestState();

      const watchdog = page.waitForFunction(() => {
        return (globalThis as any).__done;
      });
      await page.goto(server.EMPTY_PAGE);
      await page.goto(server.PREFIX + '/consolelog.html');
      await page.evaluate(() => {
        return ((globalThis as any).__done = true);
      });
      await watchdog;
    });
  });

  describe('Page.waitForTimeout', () => {
    it('waits for the given timeout before resolving', async () => {
      const {page, server} = getTestState();
      await page.goto(server.EMPTY_PAGE);
      const startTime = Date.now();
      await page.waitForTimeout(1000);
      const endTime = Date.now();
      /* In a perfect world endTime - startTime would be exactly 1000 but we
       * expect some fluctuations and for it to be off by a little bit. So to
       * avoid a flaky test we'll make sure it waited for roughly 1 second.
       */
      expect(endTime - startTime).toBeGreaterThan(700);
      expect(endTime - startTime).toBeLessThan(1300);
    });
  });

  describe('Frame.waitForTimeout', () => {
    it('waits for the given timeout before resolving', async () => {
      const {page, server} = getTestState();
      await page.goto(server.EMPTY_PAGE);
      const frame = page.mainFrame();
      const startTime = Date.now();
      await frame.waitForTimeout(1000);
      const endTime = Date.now();
      /* In a perfect world endTime - startTime would be exactly 1000 but we
       * expect some fluctuations and for it to be off by a little bit. So to
       * avoid a flaky test we'll make sure it waited for roughly 1 second
       */
      expect(endTime - startTime).toBeGreaterThan(700);
      expect(endTime - startTime).toBeLessThan(1300);
    });
  });

  describe('Frame.waitForSelector', function () {
    const addElement = (tag: string) => {
      return document.body.appendChild(document.createElement(tag));
    };

    it('should immediately resolve promise if node exists', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const frame = page.mainFrame();
      await frame.waitForSelector('*');
      await frame.evaluate(addElement, 'div');
      await frame.waitForSelector('div');
    });

    it('should work with removed MutationObserver', async () => {
      const {page} = getTestState();

      await page.evaluate(() => {
        // @ts-expect-error We want to remove it for the test.
        return delete window.MutationObserver;
      });
      const [handle] = await Promise.all([
        page.waitForSelector('.zombo'),
        page.setContent(`<div class='zombo'>anything</div>`),
      ]);
      expect(
        await page.evaluate(x => {
          return x?.textContent;
        }, handle)
      ).toBe('anything');
    });

    it('should resolve promise when node is added', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const frame = page.mainFrame();
      const watchdog = frame.waitForSelector('div');
      await frame.evaluate(addElement, 'br');
      await frame.evaluate(addElement, 'div');
      const eHandle = (await watchdog)!;
      const tagName = await (await eHandle.getProperty('tagName')).jsonValue();
      expect(tagName).toBe('DIV');
    });

    it('should work when node is added through innerHTML', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const watchdog = page.waitForSelector('h3 div');
      await page.evaluate(addElement, 'span');
      await page.evaluate(() => {
        return (document.querySelector('span')!.innerHTML =
          '<h3><div></div></h3>');
      });
      await watchdog;
    });

    it('Page.waitForSelector is shortcut for main frame', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await attachFrame(page, 'frame1', server.EMPTY_PAGE);
      const otherFrame = page.frames()[1]!;
      const watchdog = page.waitForSelector('div');
      await otherFrame.evaluate(addElement, 'div');
      await page.evaluate(addElement, 'div');
      const eHandle = await watchdog;
      expect(eHandle?.frame).toBe(page.mainFrame());
    });

    it('should run in specified frame', async () => {
      const {page, server} = getTestState();

      await attachFrame(page, 'frame1', server.EMPTY_PAGE);
      await attachFrame(page, 'frame2', server.EMPTY_PAGE);
      const frame1 = page.frames()[1]!;
      const frame2 = page.frames()[2]!;
      const waitForSelectorPromise = frame2.waitForSelector('div');
      await frame1.evaluate(addElement, 'div');
      await frame2.evaluate(addElement, 'div');
      const eHandle = await waitForSelectorPromise;
      expect(eHandle?.frame).toBe(frame2);
    });

    it('should throw when frame is detached', async () => {
      const {page, server} = getTestState();

      await attachFrame(page, 'frame1', server.EMPTY_PAGE);
      const frame = page.frames()[1]!;
      let waitError: Error | undefined;
      const waitPromise = frame.waitForSelector('.box').catch(error => {
        return (waitError = error);
      });
      await detachFrame(page, 'frame1');
      await waitPromise;
      expect(waitError).toBeTruthy();
      expect(waitError?.message).toContain(
        'waitForFunction failed: frame got detached.'
      );
    });
    it('should survive cross-process navigation', async () => {
      const {page, server} = getTestState();

      let boxFound = false;
      const waitForSelector = page.waitForSelector('.box').then(() => {
        return (boxFound = true);
      });
      await page.goto(server.EMPTY_PAGE);
      expect(boxFound).toBe(false);
      await page.reload();
      expect(boxFound).toBe(false);
      await page.goto(server.CROSS_PROCESS_PREFIX + '/grid.html');
      await waitForSelector;
      expect(boxFound).toBe(true);
    });
    it('should wait for visible', async () => {
      const {page} = getTestState();

      let divFound = false;
      const waitForSelector = page
        .waitForSelector('div', {visible: true})
        .then(() => {
          return (divFound = true);
        });
      await page.setContent(
        `<div style='display: none; visibility: hidden;'>1</div>`
      );
      expect(divFound).toBe(false);
      await page.evaluate(() => {
        return document.querySelector('div')?.style.removeProperty('display');
      });
      expect(divFound).toBe(false);
      await page.evaluate(() => {
        return document
          .querySelector('div')
          ?.style.removeProperty('visibility');
      });
      expect(await waitForSelector).toBe(true);
      expect(divFound).toBe(true);
    });
    it('should wait for visible recursively', async () => {
      const {page} = getTestState();

      let divVisible = false;
      const waitForSelector = page
        .waitForSelector('div#inner', {visible: true})
        .then(() => {
          return (divVisible = true);
        });
      await page.setContent(
        `<div style='display: none; visibility: hidden;'><div id="inner">hi</div></div>`
      );
      expect(divVisible).toBe(false);
      await page.evaluate(() => {
        return document.querySelector('div')?.style.removeProperty('display');
      });
      expect(divVisible).toBe(false);
      await page.evaluate(() => {
        return document
          .querySelector('div')
          ?.style.removeProperty('visibility');
      });
      expect(await waitForSelector).toBe(true);
      expect(divVisible).toBe(true);
    });
    it('hidden should wait for visibility: hidden', async () => {
      const {page} = getTestState();

      let divHidden = false;
      await page.setContent(`<div style='display: block;'></div>`);
      const waitForSelector = page
        .waitForSelector('div', {hidden: true})
        .then(() => {
          return (divHidden = true);
        });
      await page.waitForSelector('div'); // do a round trip
      expect(divHidden).toBe(false);
      await page.evaluate(() => {
        return document
          .querySelector('div')
          ?.style.setProperty('visibility', 'hidden');
      });
      expect(await waitForSelector).toBe(true);
      expect(divHidden).toBe(true);
    });
    it('hidden should wait for display: none', async () => {
      const {page} = getTestState();

      let divHidden = false;
      await page.setContent(`<div style='display: block;'></div>`);
      const waitForSelector = page
        .waitForSelector('div', {hidden: true})
        .then(() => {
          return (divHidden = true);
        });
      await page.waitForSelector('div'); // do a round trip
      expect(divHidden).toBe(false);
      await page.evaluate(() => {
        return document
          .querySelector('div')
          ?.style.setProperty('display', 'none');
      });
      expect(await waitForSelector).toBe(true);
      expect(divHidden).toBe(true);
    });
    it('hidden should wait for removal', async () => {
      const {page} = getTestState();

      await page.setContent(`<div></div>`);
      let divRemoved = false;
      const waitForSelector = page
        .waitForSelector('div', {hidden: true})
        .then(() => {
          return (divRemoved = true);
        });
      await page.waitForSelector('div'); // do a round trip
      expect(divRemoved).toBe(false);
      await page.evaluate(() => {
        return document.querySelector('div')?.remove();
      });
      expect(await waitForSelector).toBe(true);
      expect(divRemoved).toBe(true);
    });
    it('should return null if waiting to hide non-existing element', async () => {
      const {page} = getTestState();

      const handle = await page.waitForSelector('non-existing', {
        hidden: true,
      });
      expect(handle).toBe(null);
    });
    it('should respect timeout', async () => {
      const {page, puppeteer} = getTestState();

      let error!: Error;
      await page.waitForSelector('div', {timeout: 10}).catch(error_ => {
        return (error = error_);
      });
      expect(error).toBeInstanceOf(puppeteer.errors.TimeoutError);
      expect(error?.message).toContain(
        'waiting for selector `div` failed: timeout'
      );
    });
    it('should have an error message specifically for awaiting an element to be hidden', async () => {
      const {page} = getTestState();

      await page.setContent(`<div></div>`);
      let error!: Error;
      await page
        .waitForSelector('div', {hidden: true, timeout: 10})
        .catch(error_ => {
          return (error = error_);
        });
      expect(error).toBeTruthy();
      expect(error?.message).toContain(
        'waiting for selector `div` to be hidden failed: timeout'
      );
    });

    it('should respond to node attribute mutation', async () => {
      const {page} = getTestState();

      let divFound = false;
      const waitForSelector = page.waitForSelector('.zombo').then(() => {
        return (divFound = true);
      });
      await page.setContent(`<div class='notZombo'></div>`);
      expect(divFound).toBe(false);
      await page.evaluate(() => {
        return (document.querySelector('div')!.className = 'zombo');
      });
      expect(await waitForSelector).toBe(true);
    });
    it('should return the element handle', async () => {
      const {page} = getTestState();

      const waitForSelector = page.waitForSelector('.zombo');
      await page.setContent(`<div class='zombo'>anything</div>`);
      expect(
        await page.evaluate(x => {
          return x?.textContent;
        }, await waitForSelector)
      ).toBe('anything');
    });
    it('should have correct stack trace for timeout', async () => {
      const {page} = getTestState();

      let error!: Error;
      await page.waitForSelector('.zombo', {timeout: 10}).catch(error_ => {
        return (error = error_);
      });
      expect(error?.stack).toContain('waiting for selector `.zombo` failed');
      // The extension is ts here as Mocha maps back via sourcemaps.
      expect(error?.stack).toContain('waittask.spec.ts');
    });
  });

  describe('Frame.waitForXPath', function () {
    const addElement = (tag: string) => {
      return document.body.appendChild(document.createElement(tag));
    };

    it('should support some fancy xpath', async () => {
      const {page} = getTestState();

      await page.setContent(`<p>red herring</p><p>hello  world  </p>`);
      const waitForXPath = page.waitForXPath(
        '//p[normalize-space(.)="hello world"]'
      );
      expect(
        await page.evaluate(x => {
          return x?.textContent;
        }, await waitForXPath)
      ).toBe('hello  world  ');
    });
    it('should respect timeout', async () => {
      const {page, puppeteer} = getTestState();

      let error!: Error;
      await page.waitForXPath('//div', {timeout: 10}).catch(error_ => {
        return (error = error_);
      });
      expect(error).toBeInstanceOf(puppeteer.errors.TimeoutError);
      expect(error?.message).toContain(
        'waiting for selector `.//div` failed: timeout 10ms exceeded'
      );
    });
    it('should run in specified frame', async () => {
      const {page, server} = getTestState();

      await attachFrame(page, 'frame1', server.EMPTY_PAGE);
      await attachFrame(page, 'frame2', server.EMPTY_PAGE);
      const frame1 = page.frames()[1]!;
      const frame2 = page.frames()[2]!;
      const waitForXPathPromise = frame2.waitForXPath('//div');
      await frame1.evaluate(addElement, 'div');
      await frame2.evaluate(addElement, 'div');
      const eHandle = await waitForXPathPromise;
      expect(eHandle?.frame).toBe(frame2);
    });
    it('should throw when frame is detached', async () => {
      const {page, server} = getTestState();

      await attachFrame(page, 'frame1', server.EMPTY_PAGE);
      const frame = page.frames()[1]!;
      let waitError: Error | undefined;
      const waitPromise = frame
        .waitForXPath('//*[@class="box"]')
        .catch(error => {
          return (waitError = error);
        });
      await detachFrame(page, 'frame1');
      await waitPromise;
      expect(waitError).toBeTruthy();
      expect(waitError?.message).toContain(
        'waitForFunction failed: frame got detached.'
      );
    });
    it('hidden should wait for display: none', async () => {
      const {page} = getTestState();

      let divHidden = false;
      await page.setContent(`<div style='display: block;'></div>`);
      const waitForXPath = page
        .waitForXPath('//div', {hidden: true})
        .then(() => {
          return (divHidden = true);
        });
      await page.waitForXPath('//div'); // do a round trip
      expect(divHidden).toBe(false);
      await page.evaluate(() => {
        return document
          .querySelector('div')
          ?.style.setProperty('display', 'none');
      });
      expect(await waitForXPath).toBe(true);
      expect(divHidden).toBe(true);
    });
    it('should return the element handle', async () => {
      const {page} = getTestState();

      const waitForXPath = page.waitForXPath('//*[@class="zombo"]');
      await page.setContent(`<div class='zombo'>anything</div>`);
      expect(
        await page.evaluate(x => {
          return x?.textContent;
        }, await waitForXPath)
      ).toBe('anything');
    });
    it('should allow you to select a text node', async () => {
      const {page} = getTestState();

      await page.setContent(`<div>some text</div>`);
      const text = await page.waitForXPath('//div/text()');
      expect(await (await text!.getProperty('nodeType')!).jsonValue()).toBe(
        3 /* Node.TEXT_NODE */
      );
    });
    it('should allow you to select an element with single slash', async () => {
      const {page} = getTestState();

      await page.setContent(`<div>some text</div>`);
      const waitForXPath = page.waitForXPath('/html/body/div');
      expect(
        await page.evaluate(x => {
          return x?.textContent;
        }, await waitForXPath)
      ).toBe('some text');
    });
  });
});
