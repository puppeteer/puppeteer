/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from 'chai';
import {JSHandle} from 'puppeteer-core/internal/api/JSHandle.js';
import {
  asyncDisposeSymbol,
  disposeSymbol,
} from 'puppeteer-core/internal/util/disposable.js';
import sinon from 'sinon';

import {
  assertAtLeastOneToContain,
  getTestState,
  setupTestBrowserHooks,
} from './mocha-utils.js';
import {html} from './utils.js';

describe('JSHandle', function () {
  setupTestBrowserHooks();

  describe('Page.evaluateHandle', function () {
    it('should work', async () => {
      const {page} = await getTestState();

      using windowHandle = await page.evaluateHandle(() => {
        return window;
      });
      assert.ok(windowHandle);
    });
    it('should return the RemoteObject', async () => {
      const {page} = await getTestState();

      using windowHandle = await page.evaluateHandle(() => {
        return window;
      });
      assert.ok(windowHandle.remoteObject());
    });
    it('should accept object handle as an argument', async () => {
      const {page} = await getTestState();

      using navigatorHandle = await page.evaluateHandle(() => {
        return navigator;
      });
      const text = await page.evaluate(e => {
        return e.userAgent;
      }, navigatorHandle);
      assert.include(text, 'Mozilla');
    });
    it('should accept object handle to primitive types', async () => {
      const {page} = await getTestState();

      using aHandle = await page.evaluateHandle(() => {
        return 5;
      });
      const isFive = await page.evaluate(e => {
        return Object.is(e, 5);
      }, aHandle);
      assert.ok(isFive);
    });
    it('should warn about recursive objects', async () => {
      const {page} = await getTestState();

      const test: {obj?: unknown} = {};
      test.obj = test;
      let error!: Error;
      await page
        .evaluateHandle(opts => {
          return opts;
        }, test)
        .catch(error_ => {
          return (error = error_);
        });
      assert.include(error.message, 'Recursive objects are not allowed.');
    });
    it('should accept object handle to unserializable value', async () => {
      const {page} = await getTestState();

      using aHandle = await page.evaluateHandle(() => {
        return Infinity;
      });
      assert.isTrue(
        await page.evaluate(e => {
          return Object.is(e, Infinity);
        }, aHandle),
      );
    });
    it('should use the same JS wrappers', async () => {
      const {page} = await getTestState();

      using aHandle = await page.evaluateHandle(() => {
        (globalThis as any).FOO = 123;
        return window;
      });
      assert.strictEqual(
        await page.evaluate(e => {
          return (e as any).FOO;
        }, aHandle),
        123,
      );
    });
  });

  describe('JSHandle.getProperty', function () {
    it('should work', async () => {
      const {page} = await getTestState();

      using aHandle = await page.evaluateHandle(() => {
        return {
          one: 1,
          two: 2,
          three: 3,
        };
      });
      using twoHandle = await aHandle.getProperty('two');
      assert.deepEqual(await twoHandle.jsonValue(), 2);
    });
  });

  describe('JSHandle.jsonValue', function () {
    it('should work', async () => {
      const {page} = await getTestState();

      using aHandle = await page.evaluateHandle(() => {
        return {foo: 'bar'};
      });
      const json = await aHandle.jsonValue();
      assert.deepEqual(json, {foo: 'bar'});
    });

    it('works with jsonValues that are not objects', async () => {
      const {page} = await getTestState();

      using aHandle = await page.evaluateHandle(() => {
        return ['a', 'b'];
      });
      const json = await aHandle.jsonValue();
      assert.deepEqual(json, ['a', 'b']);
    });

    it('works with jsonValues that are primitives', async () => {
      const {page} = await getTestState();

      using aHandle = await page.evaluateHandle(() => {
        return 'foo';
      });
      assert.deepEqual(await aHandle.jsonValue(), 'foo');

      using bHandle = await page.evaluateHandle(() => {
        return undefined;
      });
      assert.isUndefined(await bHandle.jsonValue());
    });

    it('should work with dates', async () => {
      const {page} = await getTestState();

      using dateHandle = await page.evaluateHandle(() => {
        return new Date('2017-09-26T00:00:00.000Z');
      });
      const date = await dateHandle.jsonValue();
      assert.instanceOf(date, Date);
      assert.deepEqual(date.toISOString(), '2017-09-26T00:00:00.000Z');
    });
    it('should not throw for circular objects', async () => {
      const {page} = await getTestState();

      using handle = await page.evaluateHandle(() => {
        const t: {t?: unknown; g: number} = {g: 1};
        t.t = t;
        return t;
      });
      await handle.jsonValue();
    });
  });

  describe('JSHandle.getProperties', function () {
    it('should work', async () => {
      const {page} = await getTestState();

      using aHandle = await page.evaluateHandle(() => {
        return {
          foo: 'bar',
        };
      });
      const properties = await aHandle.getProperties();
      using foo = properties.get('foo')!;
      assert.ok(foo);
      assert.strictEqual(await foo.jsonValue(), 'bar');
    });
    it('should return even non-own properties', async () => {
      const {page} = await getTestState();

      using aHandle = await page.evaluateHandle(() => {
        class A {
          a: string;
          constructor() {
            this.a = '1';
          }
        }
        class B extends A {
          b: string;
          constructor() {
            super();
            this.b = '2';
          }
        }
        return new B();
      });
      const properties = await aHandle.getProperties();
      assert.strictEqual(await properties.get('a')!.jsonValue(), '1');
      assert.strictEqual(await properties.get('b')!.jsonValue(), '2');
    });
  });

  describe('JSHandle.asElement', function () {
    it('should work', async () => {
      const {page} = await getTestState();

      using aHandle = await page.evaluateHandle(() => {
        return document.body;
      });
      using element = aHandle.asElement();
      assert.ok(element);
    });
    it('should return null for non-elements', async () => {
      const {page} = await getTestState();

      using aHandle = await page.evaluateHandle(() => {
        return 2;
      });
      using element = aHandle.asElement();
      assert.notOk(element);
    });
    it('should return ElementHandle for TextNodes', async () => {
      const {page} = await getTestState();

      await page.setContent(html`<div>ee!</div>`);
      using aHandle = await page.evaluateHandle(() => {
        return document.querySelector('div')!.firstChild;
      });
      using element = aHandle.asElement();
      assert.ok(element);
      assert.isTrue(
        await page.evaluate(e => {
          return e?.nodeType === Node.TEXT_NODE;
        }, element),
      );
    });
  });

  describe('JSHandle.toString', function () {
    it('should work for primitives', async () => {
      const {page} = await getTestState();

      using numberHandle = await page.evaluateHandle(() => {
        return 2;
      });
      assert.strictEqual(numberHandle.toString(), 'JSHandle:2');
      using stringHandle = await page.evaluateHandle(() => {
        return 'a';
      });
      assert.strictEqual(stringHandle.toString(), 'JSHandle:a');
    });
    it('should work for complicated objects', async () => {
      const {page} = await getTestState();

      using aHandle = await page.evaluateHandle(() => {
        return window;
      });
      assertAtLeastOneToContain(aHandle.toString(), [
        'JSHandle@object',
        'JSHandle@window',
      ]);
    });
    it('should work with different subtypes', async () => {
      const {page} = await getTestState();

      assert.strictEqual(
        (await page.evaluateHandle('(function(){})')).toString(),
        'JSHandle@function',
      );
      assert.strictEqual(
        (await page.evaluateHandle('12')).toString(),
        'JSHandle:12',
      );
      assert.strictEqual(
        (await page.evaluateHandle('true')).toString(),
        'JSHandle:true',
      );
      assert.strictEqual(
        (await page.evaluateHandle('undefined')).toString(),
        'JSHandle:undefined',
      );
      assert.strictEqual(
        (await page.evaluateHandle('"foo"')).toString(),
        'JSHandle:foo',
      );
      assert.strictEqual(
        (await page.evaluateHandle('Symbol()')).toString(),
        'JSHandle@symbol',
      );
      assert.strictEqual(
        (await page.evaluateHandle('new Map()')).toString(),
        'JSHandle@map',
      );
      assert.strictEqual(
        (await page.evaluateHandle('new Set()')).toString(),
        'JSHandle@set',
      );
      assert.strictEqual(
        (await page.evaluateHandle('[]')).toString(),
        'JSHandle@array',
      );
      assert.strictEqual(
        (await page.evaluateHandle('null')).toString(),
        'JSHandle:null',
      );
      assert.strictEqual(
        (await page.evaluateHandle('/foo/')).toString(),
        'JSHandle@regexp',
      );
      assert.strictEqual(
        (await page.evaluateHandle('document.body')).toString(),
        'JSHandle@node',
      );
      assert.strictEqual(
        (await page.evaluateHandle('new Date()')).toString(),
        'JSHandle@date',
      );
      assert.strictEqual(
        (await page.evaluateHandle('new WeakMap()')).toString(),
        'JSHandle@weakmap',
      );
      assert.strictEqual(
        (await page.evaluateHandle('new WeakSet()')).toString(),
        'JSHandle@weakset',
      );
      assert.strictEqual(
        (await page.evaluateHandle('new Error()')).toString(),
        'JSHandle@error',
      );
      assert.strictEqual(
        (await page.evaluateHandle('new Int32Array()')).toString(),
        'JSHandle@typedarray',
      );
      assert.strictEqual(
        (await page.evaluateHandle('new Proxy({}, {})')).toString(),
        'JSHandle@proxy',
      );
    });
    it('should work with window subtypes', async () => {
      const {page} = await getTestState();

      assert.strictEqual(
        (await page.evaluateHandle('window')).toString(),
        'JSHandle@window',
      );
      assert.strictEqual(
        (await page.evaluateHandle('globalThis')).toString(),
        'JSHandle@window',
      );
    });
  });

  describe('JSHandle[Symbol.dispose]', () => {
    it('should work', async () => {
      const {page} = await getTestState();
      using handle = await page.evaluateHandle('new Set()');
      const spy = sinon.spy(handle, disposeSymbol);
      {
        using _ = handle;
      }
      assert.isTrue(handle instanceof JSHandle);
      assert.ok(spy.calledOnce);
      assert.ok(handle.disposed);
    });
  });

  describe('JSHandle[Symbol.asyncDispose]', () => {
    it('should work', async () => {
      const {page} = await getTestState();
      using handle = await page.evaluateHandle('new Set()');
      const spy = sinon.spy(handle, asyncDisposeSymbol);
      {
        await using _ = handle;
      }
      assert.isTrue(handle instanceof JSHandle);
      assert.ok(spy.calledOnce);
      assert.ok(handle.disposed);
    });
  });

  describe('JSHandle.move', () => {
    it('should work', async () => {
      const {page} = await getTestState();
      using handle = await page.evaluateHandle('new Set()');
      const spy = sinon.spy(handle, disposeSymbol);
      {
        using _ = handle;
        handle.move();
      }
      assert.isTrue(handle instanceof JSHandle);
      assert.ok(spy.calledOnce);
      assert.notOk(handle.disposed);
    });
  });
});
