/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';
import {TimeoutError, ElementHandle} from 'puppeteer';
import {isErrorLike} from 'puppeteer-core/internal/util/ErrorLike.js';

import {
  createTimeout,
  getTestState,
  setupTestBrowserHooks,
} from './mocha-utils.js';
import {attachFrame, detachFrame} from './utils.js';

describe('waittask specs', function () {
  setupTestBrowserHooks();

  describe('Frame.waitForFunction', function () {
    it('should accept a string', async () => {
      const {page} = await getTestState();

      const watchdog = page.waitForFunction('self.__FOO === 1');
      await page.evaluate(() => {
        return ((self as unknown as {__FOO: number}).__FOO = 1);
      });
      await watchdog;
    });
    it('should work when resolved right before execution context disposal', async () => {
      const {page} = await getTestState();

      await page.evaluateOnNewDocument(() => {
        return ((globalThis as any).__RELOADED = true);
      });
      await page.waitForFunction(() => {
        if (!(globalThis as any).__RELOADED) {
          window.location.reload();
          return false;
        }
        return true;
      });
    });
    it('should poll on interval', async () => {
      const {page} = await getTestState();
      const startTime = Date.now();
      const polling = 100;
      const watchdog = page.waitForFunction(
        () => {
          return (globalThis as any).__FOO === 'hit';
        },
        {polling},
      );
      await page.evaluate(() => {
        setTimeout(() => {
          (globalThis as any).__FOO = 'hit';
        }, 50);
      });
      await watchdog;
      expect(Date.now() - startTime).not.toBeLessThan(polling / 2);
    });
    it('should poll on mutation', async () => {
      const {page} = await getTestState();

      let success = false;
      const watchdog = page
        .waitForFunction(
          () => {
            return (globalThis as any).__FOO === 'hit';
          },
          {
            polling: 'mutation',
          },
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
      const {page} = await getTestState();

      let success = false;
      const watchdog = page
        .waitForFunction(
          async () => {
            return (globalThis as any).__FOO === 'hit';
          },
          {
            polling: 'mutation',
          },
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
      const {page} = await getTestState();

      const watchdog = page.waitForFunction(
        () => {
          return (globalThis as any).__FOO === 'hit';
        },
        {
          polling: 'raf',
        },
      );
      await page.evaluate(() => {
        return ((globalThis as any).__FOO = 'hit');
      });
      await watchdog;
    });
    it('should poll on raf async', async () => {
      const {page} = await getTestState();

      const watchdog = page.waitForFunction(
        async () => {
          return (globalThis as any).__FOO === 'hit';
        },
        {
          polling: 'raf',
        },
      );
      await page.evaluate(async () => {
        return ((globalThis as any).__FOO = 'hit');
      });
      await watchdog;
    });
    it('should work with strict CSP policy', async () => {
      const {page, server} = await getTestState();

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
            },
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
    it('should throw negative polling interval', async () => {
      const {page} = await getTestState();

      let error!: Error;
      try {
        await page.waitForFunction(
          () => {
            return !!document.body;
          },
          {polling: -10},
        );
      } catch (error_) {
        if (isErrorLike(error_)) {
          error = error_ as Error;
        }
      }
      expect(error?.message).toContain(
        'Cannot poll with non-positive interval',
      );
    });
    it('should return the success value as a JSHandle', async () => {
      const {page} = await getTestState();

      expect(
        await (
          await page.waitForFunction(() => {
            return 5;
          })
        ).jsonValue(),
      ).toBe(5);
    });
    it('should return the window as a success value', async () => {
      const {page} = await getTestState();

      expect(
        await page.waitForFunction(() => {
          return window;
        }),
      ).toBeTruthy();
    });
    it('should accept ElementHandle arguments', async () => {
      const {page} = await getTestState();

      await page.setContent('<div></div>');
      using div = (await page.$('div'))!;
      let resolved = false;
      const waitForFunction = page
        .waitForFunction(
          element => {
            return element.localName === 'div' && !element.parentElement;
          },
          {},
          div,
        )
        .then(() => {
          return (resolved = true);
        });
      expect(resolved).toBe(false);
      await page.evaluate(element => {
        return element.remove();
      }, div);
      await waitForFunction;
    });
    it('should respect timeout', async () => {
      const {page} = await getTestState();

      let error!: Error;
      await page
        .waitForFunction(
          () => {
            return false;
          },
          {timeout: 10},
        )
        .catch(error_ => {
          return (error = error_);
        });

      expect(error).toBeInstanceOf(TimeoutError);
      expect(error?.message).toContain('Waiting failed: 10ms exceeded');
    });
    it('should respect default timeout', async () => {
      const {page} = await getTestState();

      page.setDefaultTimeout(1);
      let error!: Error;
      await page
        .waitForFunction(() => {
          return false;
        })
        .catch(error_ => {
          return (error = error_);
        });
      expect(error).toBeInstanceOf(TimeoutError);
      expect(error?.message).toContain('Waiting failed: 1ms exceeded');
    });
    it('should disable timeout when its set to 0', async () => {
      const {page} = await getTestState();

      const watchdog = page.waitForFunction(
        () => {
          (globalThis as any).__counter =
            ((globalThis as any).__counter || 0) + 1;
          return (globalThis as any).__injected;
        },
        {timeout: 0, polling: 10},
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
      const {page, server} = await getTestState();

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
      const {page, server} = await getTestState();

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
    it('should be cancellable', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      const abortController = new AbortController();
      const task = page.waitForFunction(
        () => {
          return (globalThis as any).__done;
        },
        {
          signal: abortController.signal,
        },
      );
      abortController.abort();
      await expect(task).rejects.toThrow(/aborted/);
    });
    it('can start multiple tasks without node warnings', async () => {
      const {page} = await getTestState();
      let warning: Error | undefined;
      const warningHandler: NodeJS.WarningListener = w => {
        warning = w;
      };
      process.on('warning', warningHandler);
      process.setMaxListeners(1);
      const abortController = new AbortController();
      try {
        for (let i = 0; i < 2; i++) {
          await page.waitForFunction(
            () => {
              return true;
            },
            {
              signal: abortController.signal,
            },
          );
        }
      } finally {
        process.setMaxListeners(10);
      }
      process.off('warning', warningHandler);
      expect(warning?.stack).toBe(undefined);
    });
  });

  describe('Frame.waitForSelector', function () {
    const addElement = (tag: string) => {
      return document.body.appendChild(document.createElement(tag));
    };

    it('should immediately resolve promise if node exists', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      const frame = page.mainFrame();
      await frame.waitForSelector('*');
      await frame.evaluate(addElement, 'div');
      await frame.waitForSelector('div');
    });

    it('should be cancellable', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      const abortController = new AbortController();
      const task = page.waitForSelector('wrong', {
        signal: abortController.signal,
      });
      abortController.abort();
      await expect(task).rejects.toThrow(/aborted/);
    });

    it('should work with removed MutationObserver', async () => {
      const {page} = await getTestState();

      await page.evaluate(() => {
        // @ts-expect-error We want to remove it for the test.
        delete window.MutationObserver;
      });
      const [handle] = await Promise.all([
        page.waitForSelector('.zombo'),
        page.setContent(`<div class='zombo'>anything</div>`),
      ]);
      expect(
        await page.evaluate(x => {
          return x?.textContent;
        }, handle),
      ).toBe('anything');
    });

    it('should resolve promise when node is added', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      const frame = page.mainFrame();
      const watchdog = frame.waitForSelector('div');
      await frame.evaluate(addElement, 'br');
      await frame.evaluate(addElement, 'div');
      using eHandle = (await watchdog)!;
      const tagName = await (await eHandle.getProperty('tagName')).jsonValue();
      expect(tagName).toBe('DIV');
    });

    it('should work when node is added through innerHTML', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      const watchdog = page.waitForSelector('h3 div');
      await page.evaluate(addElement, 'span');
      await page.evaluate(() => {
        return (document.querySelector('span')!.innerHTML =
          '<h3><div></div></h3>');
      });
      await watchdog;
    });

    // MutationPoller currently does not support shadow DOM.
    // See https://github.com/puppeteer/puppeteer/issues/13163.
    it.skip('should work when node is added in a shadow root', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      const watcher = page.waitForSelector('div >>> h1');
      await page.evaluate(addElement, 'div');
      await expect(
        Promise.race([watcher, createTimeout(40)]),
      ).resolves.toBeFalsy();
      await page.evaluate(() => {
        const host = document.querySelector('div')!;
        const shadow = host.attachShadow({mode: 'open'});
        const h1 = document.createElement('h1');
        h1.textContent = 'inside';
        shadow.appendChild(h1);
      });
      using element = await watcher;
      expect(
        await element!.evaluate(el => {
          return el.textContent;
        }),
      ).toBe('inside');
    });

    it('should work for selector with a pseudo class', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      const watchdog = page.waitForSelector('input:focus');
      await expect(
        Promise.race([watchdog, createTimeout(40)]),
      ).resolves.toBeFalsy();
      await page.setContent(`<input></input>`);
      await page.click('input');
      await watchdog;
    });

    it('Page.waitForSelector is shortcut for main frame', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await attachFrame(page, 'frame1', server.EMPTY_PAGE);
      const otherFrame = page.frames()[1]!;
      const watchdog = page.waitForSelector('div');
      await otherFrame.evaluate(addElement, 'div');
      await page.evaluate(addElement, 'div');
      using eHandle = await watchdog;
      expect(eHandle?.frame).toBe(page.mainFrame());
    });

    it('should run in specified frame', async () => {
      const {page, server} = await getTestState();

      await attachFrame(page, 'frame1', server.EMPTY_PAGE);
      await attachFrame(page, 'frame2', server.EMPTY_PAGE);
      const frame1 = page.frames()[1]!;
      const frame2 = page.frames()[2]!;
      const waitForSelectorPromise = frame2.waitForSelector('div');
      await frame1.evaluate(addElement, 'div');
      await frame2.evaluate(addElement, 'div');
      using eHandle = await waitForSelectorPromise;
      expect(eHandle?.frame).toBe(frame2);
    });

    it('should throw when frame is detached', async () => {
      const {page, server} = await getTestState();

      await attachFrame(page, 'frame1', server.EMPTY_PAGE);
      const frame = page.frames()[1]!;
      let waitError: Error | undefined;
      const waitPromise = frame.waitForSelector('.box').catch(error => {
        return (waitError = error);
      });
      await detachFrame(page, 'frame1');
      await waitPromise;
      expect(waitError).toBeTruthy();
      expect(waitError?.message).atLeastOneToContain([
        'waitForFunction failed: frame got detached.',
        'Browsing context already closed.',
      ]);
    });
    it('should survive cross-process navigation', async () => {
      const {page, server} = await getTestState();

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
    it('should wait for element to be visible (display)', async () => {
      const {page} = await getTestState();

      const promise = page.waitForSelector('div', {visible: true});
      await page.setContent('<div style="display: none">text</div>');
      using element = await page.evaluateHandle(() => {
        return document.getElementsByTagName('div')[0]!;
      });
      await expect(
        Promise.race([promise, createTimeout(40)]),
      ).resolves.toBeFalsy();
      await element.evaluate(e => {
        e.style.removeProperty('display');
      });
      await expect(promise).resolves.toBeTruthy();
    });
    it('should wait for element to be visible (without DOM mutations)', async () => {
      const {page} = await getTestState();

      const promise = page.waitForSelector('div', {visible: true});
      await page.setContent(
        '<style>div {display: none;}</style><div>text</div>',
      );
      using element = await page.evaluateHandle(() => {
        return document.getElementsByTagName('div')[0]!;
      });
      expect(element).toBeTruthy();
      await expect(
        Promise.race([promise, createTimeout(40)]),
      ).resolves.toBeFalsy();
      await page.evaluate(() => {
        const extraSheet = new CSSStyleSheet();
        extraSheet.replaceSync('div { display: block; }');
        document.adoptedStyleSheets = [
          ...document.adoptedStyleSheets,
          extraSheet,
        ];
      });
      await expect(promise).resolves.toBeTruthy();
    });
    it('should wait for element to be visible (visibility)', async () => {
      const {page} = await getTestState();

      const promise = page.waitForSelector('div', {visible: true});
      await page.setContent('<div style="visibility: hidden">text</div>');
      using element = await page.evaluateHandle(() => {
        return document.getElementsByTagName('div')[0]!;
      });
      await expect(
        Promise.race([promise, createTimeout(40)]),
      ).resolves.toBeFalsy();
      await element.evaluate(e => {
        e.style.setProperty('visibility', 'collapse');
      });
      await expect(
        Promise.race([promise, createTimeout(40)]),
      ).resolves.toBeFalsy();
      await element.evaluate(e => {
        e.style.removeProperty('visibility');
      });
      await expect(promise).resolves.toBeTruthy();
    });
    it('should wait for element to be visible (bounding box)', async () => {
      const {page} = await getTestState();

      const promise = page.waitForSelector('div', {visible: true});
      await page.setContent('<div style="width: 0">text</div>');
      using element = await page.evaluateHandle(() => {
        return document.getElementsByTagName('div')[0]!;
      });
      await expect(
        Promise.race([promise, createTimeout(40)]),
      ).resolves.toBeFalsy();
      await element.evaluate(e => {
        e.style.setProperty('height', '0');
        e.style.removeProperty('width');
      });
      await expect(
        Promise.race([promise, createTimeout(40)]),
      ).resolves.toBeFalsy();
      await element.evaluate(e => {
        e.style.removeProperty('height');
      });
      await expect(promise).resolves.toBeTruthy();
    });
    it('should wait for element to be visible recursively', async () => {
      const {page} = await getTestState();

      const promise = page.waitForSelector('div#inner', {
        visible: true,
      });
      await page.setContent(
        `<div style='display: none; visibility: hidden;'><div id="inner">hi</div></div>`,
      );
      using element = await page.evaluateHandle(() => {
        return document.getElementsByTagName('div')[0]!;
      });
      await expect(
        Promise.race([promise, createTimeout(40)]),
      ).resolves.toBeFalsy();
      await element.evaluate(e => {
        return e.style.removeProperty('display');
      });
      await expect(
        Promise.race([promise, createTimeout(40)]),
      ).resolves.toBeFalsy();
      await element.evaluate(e => {
        return e.style.removeProperty('visibility');
      });
      await expect(promise).resolves.toBeTruthy();
    });
    it('should wait for element to be hidden (visibility)', async () => {
      const {page} = await getTestState();

      const promise = page.waitForSelector('div', {hidden: true});
      await page.setContent(`<div style='display: block;'>text</div>`);
      using element = await page.evaluateHandle(() => {
        return document.getElementsByTagName('div')[0]!;
      });
      await expect(
        Promise.race([promise, createTimeout(40)]),
      ).resolves.toBeFalsy();
      await element.evaluate(e => {
        return e.style.setProperty('visibility', 'hidden');
      });
      await expect(promise).resolves.toBeTruthy();
    });
    it('should wait for element to be hidden (display)', async () => {
      const {page} = await getTestState();

      const promise = page.waitForSelector('div', {hidden: true});
      await page.setContent(`<div style='display: block;'>text</div>`);
      using element = await page.evaluateHandle(() => {
        return document.getElementsByTagName('div')[0]!;
      });
      await expect(
        Promise.race([promise, createTimeout(40)]),
      ).resolves.toBeFalsy();
      await element.evaluate(e => {
        return e.style.setProperty('display', 'none');
      });
      await expect(promise).resolves.toBeTruthy();
    });
    it('should wait for element to be hidden (bounding box)', async () => {
      const {page} = await getTestState();

      const promise = page.waitForSelector('div', {hidden: true});
      await page.setContent('<div>text</div>');
      using element = await page.evaluateHandle(() => {
        return document.getElementsByTagName('div')[0]!;
      });
      await expect(
        Promise.race([promise, createTimeout(40)]),
      ).resolves.toBeFalsy();
      await element.evaluate(e => {
        e.style.setProperty('height', '0');
      });
      await expect(promise).resolves.toBeTruthy();
    });
    it('should wait for element to be hidden (removal)', async () => {
      const {page} = await getTestState();

      const promise = page.waitForSelector('div', {hidden: true});
      await page.setContent(`<div>text</div>`);
      using element = await page.evaluateHandle(() => {
        return document.getElementsByTagName('div')[0]!;
      });
      await expect(
        Promise.race([promise, createTimeout(40, true)]),
      ).resolves.toBeTruthy();
      await element.evaluate(e => {
        e.remove();
      });
      await expect(promise).resolves.toBeFalsy();
    });
    it('should return null if waiting to hide non-existing element', async () => {
      const {page} = await getTestState();

      using handle = await page.waitForSelector('non-existing', {
        hidden: true,
      });
      expect(handle).toBe(null);
    });
    it('should respect timeout', async () => {
      const {page} = await getTestState();

      let error!: Error;
      await page.waitForSelector('div', {timeout: 10}).catch(error_ => {
        return (error = error_);
      });
      expect(error).toBeInstanceOf(TimeoutError);
      expect(error?.message).toContain(
        'Waiting for selector `div` failed: Waiting failed: 10ms exceeded',
      );
    });
    it('should have an error message specifically for awaiting an element to be hidden', async () => {
      const {page} = await getTestState();

      await page.setContent(`<div>text</div>`);
      let error!: Error;
      await page
        .waitForSelector('div', {hidden: true, timeout: 10})
        .catch(error_ => {
          return (error = error_);
        });
      expect(error).toBeTruthy();
      expect(error?.message).toContain(
        'Waiting for selector `div` failed: Waiting failed: 10ms exceeded',
      );
    });

    it('should respond to node attribute mutation', async () => {
      const {page} = await getTestState();

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
      const {page} = await getTestState();

      const waitForSelector = page.waitForSelector('.zombo');
      await page.setContent(`<div class='zombo'>anything</div>`);
      expect(
        await page.evaluate(
          x => {
            return x?.textContent;
          },
          await waitForSelector,
        ),
      ).toBe('anything');
    });
    it('should have correct stack trace for timeout', async () => {
      const {page} = await getTestState();

      let error!: Error;
      await page.waitForSelector('.zombo', {timeout: 10}).catch(error_ => {
        return (error = error_);
      });
      expect(error?.stack).toContain(
        'Waiting for selector `.zombo` failed: Waiting failed: 10ms exceeded',
      );
      // The extension is ts here as Mocha maps back via sourcemaps.
      expect(error?.stack).toContain('WaitTask.ts');
    });

    describe('xpath', function () {
      const addElement = (tag: string) => {
        return document.body.appendChild(document.createElement(tag));
      };

      it('should support some fancy xpath', async () => {
        const {page} = await getTestState();

        await page.setContent(`<p>red herring</p><p>hello  world  </p>`);
        const waitForSelector = page.waitForSelector(
          'xpath/.//p[normalize-space(.)="hello world"]',
        );
        expect(
          await page.evaluate(
            x => {
              return x?.textContent;
            },
            await waitForSelector,
          ),
        ).toBe('hello  world  ');
      });
      it('should respect timeout', async () => {
        const {page} = await getTestState();

        let error!: Error;
        await page
          .waitForSelector('xpath/.//div', {timeout: 10})
          .catch(error_ => {
            return (error = error_);
          });
        expect(error).toBeInstanceOf(TimeoutError);
        expect(error?.message).toContain('Waiting failed: 10ms exceeded');
      });
      it('should run in specified frame', async () => {
        const {page, server} = await getTestState();

        await attachFrame(page, 'frame1', server.EMPTY_PAGE);
        await attachFrame(page, 'frame2', server.EMPTY_PAGE);
        const frame1 = page.frames()[1]!;
        const frame2 = page.frames()[2]!;
        const waitForSelector = frame2.waitForSelector('xpath/.//div');
        await frame1.evaluate(addElement, 'div');
        await frame2.evaluate(addElement, 'div');
        using eHandle = await waitForSelector;
        expect(eHandle?.frame).toBe(frame2);
      });
      it('should throw when frame is detached', async () => {
        const {page, server} = await getTestState();

        await attachFrame(page, 'frame1', server.EMPTY_PAGE);
        const frame = page.frames()[1]!;
        let waitError: Error | undefined;
        const waitPromise = frame
          .waitForSelector('xpath/.//*[@class="box"]')
          .catch(error => {
            return (waitError = error);
          });
        await detachFrame(page, 'frame1');
        await waitPromise;
        expect(waitError).toBeTruthy();
        expect(waitError?.message).atLeastOneToContain([
          'waitForFunction failed: frame got detached.',
          'Browsing context already closed.',
        ]);
      });
      it('hidden should wait for display: none', async () => {
        const {page} = await getTestState();

        let divHidden = false;
        await page.setContent(`<div style='display: block;'>text</div>`);
        const waitForSelector = page
          .waitForSelector('xpath/.//div', {hidden: true})
          .then(() => {
            return (divHidden = true);
          });
        await page.waitForSelector('xpath/.//div'); // do a round trip
        expect(divHidden).toBe(false);
        await page.evaluate(() => {
          return document
            .querySelector('div')
            ?.style.setProperty('display', 'none');
        });
        expect(await waitForSelector).toBe(true);
        expect(divHidden).toBe(true);
      });
      it('hidden should return null if the element is not found', async () => {
        const {page} = await getTestState();

        using waitForSelector = await page.waitForSelector('xpath/.//div', {
          hidden: true,
        });

        expect(waitForSelector).toBe(null);
      });
      it('hidden should return an empty element handle if the element is found', async () => {
        const {page} = await getTestState();

        await page.setContent(`<div style='display: none;'>text</div>`);

        using waitForSelector = await page.waitForSelector('xpath/.//div', {
          hidden: true,
        });

        expect(waitForSelector).toBeInstanceOf(ElementHandle);
      });
      it('should return the element handle', async () => {
        const {page} = await getTestState();

        const waitForSelector = page.waitForSelector(
          'xpath/.//*[@class="zombo"]',
        );
        await page.setContent(`<div class='zombo'>anything</div>`);
        expect(
          await page.evaluate(
            x => {
              return x?.textContent;
            },
            await waitForSelector,
          ),
        ).toBe('anything');
      });
      it('should allow you to select a text node', async () => {
        const {page} = await getTestState();

        await page.setContent(`<div>some text</div>`);
        using text = await page.waitForSelector('xpath/.//div/text()');
        expect(await (await text!.getProperty('nodeType')!).jsonValue()).toBe(
          3 /* Node.TEXT_NODE */,
        );
      });
      it('should allow you to select an element with single slash', async () => {
        const {page} = await getTestState();

        await page.setContent(`<div>some text</div>`);
        const waitForSelector = page.waitForSelector('xpath/html/body/div');
        expect(
          await page.evaluate(
            x => {
              return x?.textContent;
            },
            await waitForSelector,
          ),
        ).toBe('some text');
      });
    });
  });
});
