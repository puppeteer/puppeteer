/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from 'chai';

import {
  assertAtLeastOneToContain,
  getTestState,
  setupTestBrowserHooks,
} from './mocha-utils.js';
import {assertMatchObject, attachFrame, html} from './utils.js';

describe('Evaluation specs', function () {
  setupTestBrowserHooks();

  describe('Page.evaluate', function () {
    it('should work', async () => {
      const {page} = await getTestState();

      const result = await page.evaluate(() => {
        return 7 * 3;
      });
      assert.strictEqual(result, 21);
    });
    it('should transfer BigInt', async () => {
      const {page} = await getTestState();

      const result = await page.evaluate((a: bigint) => {
        return a;
      }, BigInt(42));
      assert.strictEqual(result, BigInt(42));
    });
    it('should transfer NaN', async () => {
      const {page} = await getTestState();

      const result = await page.evaluate(a => {
        return a;
      }, NaN);
      assert.isTrue(Object.is(result, NaN));
    });
    it('should transfer -0', async () => {
      const {page} = await getTestState();

      const result = await page.evaluate(a => {
        return a;
      }, -0);
      assert.isTrue(Object.is(result, -0));
    });
    it('should transfer Infinity', async () => {
      const {page} = await getTestState();

      const result = await page.evaluate(a => {
        return a;
      }, Infinity);
      assert.isTrue(Object.is(result, Infinity));
    });
    it('should transfer -Infinity', async () => {
      const {page} = await getTestState();

      const result = await page.evaluate(a => {
        return a;
      }, -Infinity);
      assert.isTrue(Object.is(result, -Infinity));
    });
    it('should transfer arrays', async () => {
      const {page} = await getTestState();

      const result = await page.evaluate(
        a => {
          return a;
        },
        [1, 2, 3],
      );
      assert.deepEqual(result, [1, 2, 3]);
    });
    it('should transfer arrays as arrays, not objects', async () => {
      const {page} = await getTestState();

      const result = await page.evaluate(
        a => {
          return Array.isArray(a);
        },
        [1, 2, 3],
      );
      assert.isTrue(result);
    });
    it('should transfer RegEx', async () => {
      const {page} = await getTestState();

      const result = await page.evaluate(a => {
        return `Hello World!`.match(a)![1];
      }, /Hello (.*)/);
      assert.strictEqual(result, `World!`);
    });
    it('should modify global environment', async () => {
      const {page} = await getTestState();

      await page.evaluate(() => {
        return ((globalThis as any).globalVar = 123);
      });
      assert.strictEqual(await page.evaluate('globalVar'), 123);
    });
    it('should evaluate in the page context', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/global-var.html');
      assert.strictEqual(await page.evaluate('globalVar'), 123);
    });
    it('should replace symbols with undefined', async () => {
      const {page} = await getTestState();

      assert.deepEqual<unknown[]>(
        await page.evaluate(() => {
          return [Symbol('foo4'), 'foo'];
        }),
        [undefined, 'foo'],
      );
    });
    it('should work with function shorthands', async () => {
      const {page} = await getTestState();

      const a = {
        sum(a: number, b: number) {
          return a + b;
        },

        async mult(a: number, b: number) {
          return a * b;
        },
      };
      assert.strictEqual(await page.evaluate(a.sum, 1, 2), 3);
      assert.strictEqual(await page.evaluate(a.mult, 2, 4), 8);
    });
    it('should work with function shorthands and nested arrow functions', async () => {
      const {page} = await getTestState();
      const a = {
        sum(a: number, b: number) {
          const _arrow = () => {};
          _arrow();
          return a + b;
        },
      };
      assert.strictEqual(await page.evaluate(a.sum, 1, 2), 3);
    });
    it('should work with unicode chars', async () => {
      const {page} = await getTestState();

      const result = await page.evaluate(
        a => {
          return a['中文字符'];
        },
        {
          中文字符: 42,
        },
      );
      assert.strictEqual(result, 42);
    });
    it('should throw when evaluation triggers reload', async () => {
      const {page} = await getTestState();

      let error!: Error;
      await page
        .evaluate(() => {
          location.reload();
          return new Promise(() => {});
        })
        .catch(error_ => {
          return (error = error_);
        });
      assertAtLeastOneToContain(error.message, [
        'Execution context was destroyed', // Chrome
        'no such frame', // Firefox
      ]);
    });
    it('should await promise', async () => {
      const {page} = await getTestState();

      const result = await page.evaluate(() => {
        return Promise.resolve(8 * 7);
      });
      assert.strictEqual(result, 56);
    });
    it('should work right after framenavigated', async () => {
      const {page, server} = await getTestState();

      let frameEvaluation = null;
      page.on('framenavigated', async frame => {
        frameEvaluation = frame.evaluate(() => {
          return 6 * 7;
        });
      });
      await page.goto(server.EMPTY_PAGE);
      assert.strictEqual(await frameEvaluation, 42);
    });
    it('should work from-inside an exposed function', async () => {
      const {page} = await getTestState();

      // Setup inpage callback, which calls Page.evaluate
      await page.exposeFunction(
        'callController',
        async function (a: number, b: number) {
          return await page.evaluate(
            (a: number, b: number): number => {
              return a * b;
            },
            a,
            b,
          );
        },
      );
      const result = await page.evaluate(async function () {
        return (globalThis as any).callController(9, 3);
      });
      assert.strictEqual(result, 27);
    });
    it('should reject promise with exception', async () => {
      const {page} = await getTestState();

      let error!: Error;
      await page
        .evaluate(() => {
          // @ts-expect-error we know the object doesn't exist
          return notExistingObject.property;
        })
        .catch(error_ => {
          return (error = error_);
        });
      assert.ok(error);
      assert.include(error.message, 'notExistingObject');
    });
    it('should support thrown strings as error messages', async () => {
      const {page} = await getTestState();

      let error!: Error;
      await page
        .evaluate(() => {
          throw 'qwerty';
        })
        .catch(error_ => {
          return (error = error_);
        });
      assert.strictEqual<unknown>(error, 'qwerty');
    });
    it('should support thrown numbers as error messages', async () => {
      const {page} = await getTestState();

      let error!: Error;
      await page
        .evaluate(() => {
          throw 100500;
        })
        .catch(error_ => {
          return (error = error_);
        });
      assert.strictEqual<unknown>(error, 100500);
    });
    it('should support thrown platform objects as error messages', async () => {
      const {page} = await getTestState();

      let error!: Error;
      await page
        .evaluate(() => {
          throw new DOMException('some DOMException message');
        })
        .catch(error_ => {
          return (error = error_);
        });
      assert.include(error.message, 'some DOMException message');
    });
    it('should return complex objects', async () => {
      const {page} = await getTestState();

      const object = {foo: 'bar!'};
      const result = await page.evaluate(a => {
        return a;
      }, object);
      assert.notStrictEqual(result, object);
      assert.deepEqual(result, object);
    });
    it('should return BigInt', async () => {
      const {page} = await getTestState();

      const result = await page.evaluate(() => {
        return BigInt(42);
      });
      assert.strictEqual(result, BigInt(42));
    });
    it('should return NaN', async () => {
      const {page} = await getTestState();

      const result = await page.evaluate(() => {
        return NaN;
      });
      assert.isTrue(Object.is(result, NaN));
    });
    it('should return -0', async () => {
      const {page} = await getTestState();

      const result = await page.evaluate(() => {
        return -0;
      });
      assert.isTrue(Object.is(result, -0));
    });
    it('should return Infinity', async () => {
      const {page} = await getTestState();

      const result = await page.evaluate(() => {
        return Infinity;
      });
      assert.isTrue(Object.is(result, Infinity));
    });
    it('should return -Infinity', async () => {
      const {page} = await getTestState();

      const result = await page.evaluate(() => {
        return -Infinity;
      });
      assert.isTrue(Object.is(result, -Infinity));
    });
    it('should return RegEx', async () => {
      const {page} = await getTestState();

      const result = await page.evaluate(() => {
        return /(.*)/;
      });
      assert.isTrue(result instanceof RegExp);
    });
    it('should accept "null" as one of multiple parameters', async () => {
      const {page} = await getTestState();

      const result = await page.evaluate(
        (a, b) => {
          return Object.is(a, null) && Object.is(b, 'foo');
        },
        null,
        'foo',
      );
      assert.isTrue(result);
    });
    it('should properly serialize null fields', async () => {
      const {page} = await getTestState();

      const result = await page.evaluate(() => {
        return {a: undefined};
      });
      // expect's toEqual({}) ignored properties with undefined values.
      assert.isUndefined(result.a);
    });
    it('should return undefined for non-serializable objects', async () => {
      const {page} = await getTestState();

      assert.isUndefined(
        await page.evaluate(() => {
          return window;
        }),
      );
    });
    it('should return promise as empty object', async () => {
      const {page} = await getTestState();

      const result = await page.evaluate(() => {
        return {
          promise: new Promise(resolve => {
            setTimeout(resolve, 1000);
          }),
        };
      });
      assert.deepEqual<unknown>(result, {
        promise: {},
      });
    });
    it('should work for circular object', async () => {
      const {page} = await getTestState();

      const result = await page.evaluate(() => {
        const a: Record<string, unknown> = {
          c: 5,
          d: {
            foo: 'bar',
          },
        };
        const b = {a};
        a['b'] = b;
        return a;
      });
      assertMatchObject(result, {
        c: 5,
        d: {
          foo: 'bar',
        },
        b: {
          a: undefined,
        },
      });
    });
    it('should accept a string', async () => {
      const {page} = await getTestState();

      const result = await page.evaluate('1 + 2');
      assert.strictEqual(result, 3);
    });
    it('should accept a string with semi colons', async () => {
      const {page} = await getTestState();

      const result = await page.evaluate('1 + 5;');
      assert.strictEqual(result, 6);
    });
    it('should accept a string with comments', async () => {
      const {page} = await getTestState();

      const result = await page.evaluate('2 + 5;\n// do some math!');
      assert.strictEqual(result, 7);
    });
    it('should accept element handle as an argument', async () => {
      const {page} = await getTestState();

      await page.setContent(html`<section>42</section>`);
      using element = (await page.$('section'))!;
      const text = await page.evaluate(e => {
        return e.textContent;
      }, element);
      assert.strictEqual(text, '42');
    });
    it('should throw if underlying element was disposed', async () => {
      const {page} = await getTestState();

      await page.setContent(html`<section>39</section>`);
      using element = (await page.$('section'))!;
      assert.ok(element);
      // We want to dispose early.
      await element.dispose();
      let error!: Error;
      await page
        .evaluate(e => {
          return e.textContent;
        }, element)
        .catch(error_ => {
          return (error = error_);
        });
      assert.include(error.message, 'JSHandle is disposed');
    });
    it('should throw if elementHandles are from other frames', async () => {
      const {page, server} = await getTestState();

      await attachFrame(page, 'frame1', server.EMPTY_PAGE);
      using bodyHandle = await page.frames()[1]!.$('body');
      let error!: Error;
      await page
        .evaluate(body => {
          return body?.innerHTML;
        }, bodyHandle)
        .catch(error_ => {
          return (error = error_);
        });
      assert.ok(error);
      assertAtLeastOneToContain(error.message, [
        'JSHandles can be evaluated only in the context they were created',
        "Trying to evaluate JSHandle from different frames. Usually this means you're using a handle from a page on a different page.",
      ]);
    });
    it('should simulate a user gesture', async () => {
      const {page} = await getTestState();

      const result = await page.evaluate(() => {
        document.body.appendChild(document.createTextNode('test'));
        document.execCommand('selectAll');
        return document.execCommand('copy');
      });
      assert.isTrue(result);
    });
    it('should not throw an error when evaluation does a navigation', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/one-style.html');
      const onRequest = server.waitForRequest('/empty.html');
      const result = await page.evaluate(() => {
        (window as any).location = '/empty.html';
        return [42];
      });
      assert.deepEqual(result, [42]);
      await onRequest;
    });
    it('should transfer 100Mb of data from page to node.js', async function () {
      this.timeout(25_000);
      const {page} = await getTestState();

      const a = await page.evaluate(() => {
        return Array(100 * 1024 * 1024 + 1).join('a');
      });
      assert.strictEqual(a.length, 100 * 1024 * 1024);
    });
    it('should throw error with detailed information on exception inside promise', async () => {
      const {page} = await getTestState();

      let error!: Error;
      await page
        .evaluate(() => {
          return new Promise(() => {
            throw new Error('Error in promise');
          });
        })
        .catch(error_ => {
          return (error = error_);
        });
      assert.include(error.message, 'Error in promise');
    });

    it('should return properly serialize objects with unknown type fields', async () => {
      const {page} = await getTestState();
      await page.setContent(
        html`<img
          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        />`,
      );

      const result = await page.evaluate(async () => {
        const image = document.querySelector('img')!;
        const imageBitmap = await createImageBitmap(image);

        return {
          a: 'foo',
          b: imageBitmap,
        };
      });

      assert.strictEqual(result.a, 'foo');
      assert.isUndefined(result.b);
    });
  });

  describe('Page.evaluateOnNewDocument', function () {
    it('should evaluate before anything else on the page', async () => {
      const {page, server} = await getTestState();

      await page.evaluateOnNewDocument(function () {
        (globalThis as any).injected = 123;
      });
      await page.goto(server.PREFIX + '/tamperable.html');
      assert.strictEqual(
        await page.evaluate(() => {
          return (globalThis as any).result;
        }),
        123,
      );
    });
    it('should work with CSP', async () => {
      const {page, server} = await getTestState();

      server.setCSP('/empty.html', 'script-src ' + server.PREFIX);
      await page.evaluateOnNewDocument(function () {
        (globalThis as any).injected = 123;
      });
      await page.goto(server.PREFIX + '/empty.html');
      assert.strictEqual(
        await page.evaluate(() => {
          return (globalThis as any).injected;
        }),
        123,
      );

      // Make sure CSP works.
      await page.addScriptTag({content: 'window.e = 10;'}).catch(error => {
        return void error;
      });
      assert.isUndefined(
        await page.evaluate(() => {
          return (window as any).e;
        }),
      );
    });
  });

  describe('Page.removeScriptToEvaluateOnNewDocument', function () {
    it('should remove new document script', async () => {
      const {page, server} = await getTestState();

      const {identifier} = await page.evaluateOnNewDocument(function () {
        (globalThis as any).injected = 123;
      });
      await page.goto(server.PREFIX + '/tamperable.html');
      assert.strictEqual(
        await page.evaluate(() => {
          return (globalThis as any).result;
        }),
        123,
      );

      await page.removeScriptToEvaluateOnNewDocument(identifier);
      await page.reload();
      assert.isNull(
        await page.evaluate(() => {
          return (globalThis as any).result || null;
        }),
      );
    });
  });

  describe('Frame.evaluate', function () {
    it('should have different execution contexts', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await attachFrame(page, 'frame1', server.EMPTY_PAGE);
      assert.lengthOf(page.frames(), 2);
      await page.frames()[0]!.evaluate(() => {
        return ((globalThis as any).FOO = 'foo');
      });
      await page.frames()[1]!.evaluate(() => {
        return ((globalThis as any).FOO = 'bar');
      });
      assert.strictEqual(
        await page.frames()[0]!.evaluate(() => {
          return (globalThis as any).FOO;
        }),
        'foo',
      );
      assert.strictEqual(
        await page.frames()[1]!.evaluate(() => {
          return (globalThis as any).FOO;
        }),
        'bar',
      );
    });
    it('should have correct execution contexts', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/frames/one-frame.html');
      assert.lengthOf(page.frames(), 2);
      assert.strictEqual(
        await page.frames()[0]!.evaluate(() => {
          return document.body.textContent!.trim();
        }),
        '',
      );
      assert.strictEqual(
        await page.frames()[1]!.evaluate(() => {
          return document.body.textContent!.trim();
        }),
        `Hi, I'm frame`,
      );
    });
    it('should execute after cross-site navigation', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      const mainFrame = page.mainFrame();
      assert.include(
        await mainFrame.evaluate(() => {
          return window.location.href;
        }),
        'localhost',
      );
      await page.goto(server.CROSS_PROCESS_PREFIX + '/empty.html');
      assert.include(
        await mainFrame.evaluate(() => {
          return window.location.href;
        }),
        '127',
      );
    });
  });
});
