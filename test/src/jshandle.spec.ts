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
import {JSHandle} from 'puppeteer-core/internal/api/JSHandle.js';
import sinon from 'sinon';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';

describe('JSHandle', function () {
  setupTestBrowserHooks();

  describe('Page.evaluateHandle', function () {
    it('should work', async () => {
      const {page} = await getTestState();

      using windowHandle = await page.evaluateHandle(() => {
        return window;
      });
      expect(windowHandle).toBeTruthy();
    });
    it('should return the RemoteObject', async () => {
      const {page} = await getTestState();

      using windowHandle = await page.evaluateHandle(() => {
        return window;
      });
      expect(windowHandle.remoteObject()).toBeTruthy();
    });
    it('should accept object handle as an argument', async () => {
      const {page} = await getTestState();

      using navigatorHandle = await page.evaluateHandle(() => {
        return navigator;
      });
      const text = await page.evaluate(e => {
        return e.userAgent;
      }, navigatorHandle);
      expect(text).toContain('Mozilla');
    });
    it('should accept object handle to primitive types', async () => {
      const {page} = await getTestState();

      using aHandle = await page.evaluateHandle(() => {
        return 5;
      });
      const isFive = await page.evaluate(e => {
        return Object.is(e, 5);
      }, aHandle);
      expect(isFive).toBeTruthy();
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
      expect(error.message).toContain('Recursive objects are not allowed.');
    });
    it('should accept object handle to unserializable value', async () => {
      const {page} = await getTestState();

      using aHandle = await page.evaluateHandle(() => {
        return Infinity;
      });
      expect(
        await page.evaluate(e => {
          return Object.is(e, Infinity);
        }, aHandle)
      ).toBe(true);
    });
    it('should use the same JS wrappers', async () => {
      const {page} = await getTestState();

      using aHandle = await page.evaluateHandle(() => {
        (globalThis as any).FOO = 123;
        return window;
      });
      expect(
        await page.evaluate(e => {
          return (e as any).FOO;
        }, aHandle)
      ).toBe(123);
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
      expect(await twoHandle.jsonValue()).toEqual(2);
    });
  });

  describe('JSHandle.jsonValue', function () {
    it('should work', async () => {
      const {page} = await getTestState();

      using aHandle = await page.evaluateHandle(() => {
        return {foo: 'bar'};
      });
      const json = await aHandle.jsonValue();
      expect(json).toEqual({foo: 'bar'});
    });

    it('works with jsonValues that are not objects', async () => {
      const {page} = await getTestState();

      using aHandle = await page.evaluateHandle(() => {
        return ['a', 'b'];
      });
      const json = await aHandle.jsonValue();
      expect(json).toEqual(['a', 'b']);
    });

    it('works with jsonValues that are primitives', async () => {
      const {page} = await getTestState();

      using aHandle = await page.evaluateHandle(() => {
        return 'foo';
      });
      expect(await aHandle.jsonValue()).toEqual('foo');

      using bHandle = await page.evaluateHandle(() => {
        return undefined;
      });
      expect(await bHandle.jsonValue()).toEqual(undefined);
    });

    it('should work with dates', async () => {
      const {page} = await getTestState();

      using dateHandle = await page.evaluateHandle(() => {
        return new Date('2017-09-26T00:00:00.000Z');
      });
      const date = await dateHandle.jsonValue();
      expect(date).toBeInstanceOf(Date);
      expect(date.toISOString()).toEqual('2017-09-26T00:00:00.000Z');
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
      expect(foo).toBeTruthy();
      expect(await foo.jsonValue()).toBe('bar');
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
      expect(await properties.get('a')!.jsonValue()).toBe('1');
      expect(await properties.get('b')!.jsonValue()).toBe('2');
    });
  });

  describe('JSHandle.asElement', function () {
    it('should work', async () => {
      const {page} = await getTestState();

      using aHandle = await page.evaluateHandle(() => {
        return document.body;
      });
      using element = aHandle.asElement();
      expect(element).toBeTruthy();
    });
    it('should return null for non-elements', async () => {
      const {page} = await getTestState();

      using aHandle = await page.evaluateHandle(() => {
        return 2;
      });
      using element = aHandle.asElement();
      expect(element).toBeFalsy();
    });
    it('should return ElementHandle for TextNodes', async () => {
      const {page} = await getTestState();

      await page.setContent('<div>ee!</div>');
      using aHandle = await page.evaluateHandle(() => {
        return document.querySelector('div')!.firstChild;
      });
      using element = aHandle.asElement();
      expect(element).toBeTruthy();
      expect(
        await page.evaluate(e => {
          return e?.nodeType === Node.TEXT_NODE;
        }, element)
      );
    });
  });

  describe('JSHandle.toString', function () {
    it('should work for primitives', async () => {
      const {page} = await getTestState();

      using numberHandle = await page.evaluateHandle(() => {
        return 2;
      });
      expect(numberHandle.toString()).toBe('JSHandle:2');
      using stringHandle = await page.evaluateHandle(() => {
        return 'a';
      });
      expect(stringHandle.toString()).toBe('JSHandle:a');
    });
    it('should work for complicated objects', async () => {
      const {page} = await getTestState();

      using aHandle = await page.evaluateHandle(() => {
        return window;
      });
      expect(aHandle.toString()).atLeastOneToContain([
        'JSHandle@object',
        'JSHandle@window',
      ]);
    });
    it('should work with different subtypes', async () => {
      const {page} = await getTestState();

      expect((await page.evaluateHandle('(function(){})')).toString()).toBe(
        'JSHandle@function'
      );
      expect((await page.evaluateHandle('12')).toString()).toBe('JSHandle:12');
      expect((await page.evaluateHandle('true')).toString()).toBe(
        'JSHandle:true'
      );
      expect((await page.evaluateHandle('undefined')).toString()).toBe(
        'JSHandle:undefined'
      );
      expect((await page.evaluateHandle('"foo"')).toString()).toBe(
        'JSHandle:foo'
      );
      expect((await page.evaluateHandle('Symbol()')).toString()).toBe(
        'JSHandle@symbol'
      );
      expect((await page.evaluateHandle('new Map()')).toString()).toBe(
        'JSHandle@map'
      );
      expect((await page.evaluateHandle('new Set()')).toString()).toBe(
        'JSHandle@set'
      );
      expect((await page.evaluateHandle('[]')).toString()).toBe(
        'JSHandle@array'
      );
      expect((await page.evaluateHandle('null')).toString()).toBe(
        'JSHandle:null'
      );
      expect((await page.evaluateHandle('/foo/')).toString()).toBe(
        'JSHandle@regexp'
      );
      expect((await page.evaluateHandle('document.body')).toString()).toBe(
        'JSHandle@node'
      );
      expect((await page.evaluateHandle('new Date()')).toString()).toBe(
        'JSHandle@date'
      );
      expect((await page.evaluateHandle('new WeakMap()')).toString()).toBe(
        'JSHandle@weakmap'
      );
      expect((await page.evaluateHandle('new WeakSet()')).toString()).toBe(
        'JSHandle@weakset'
      );
      expect((await page.evaluateHandle('new Error()')).toString()).toBe(
        'JSHandle@error'
      );
      expect((await page.evaluateHandle('new Int32Array()')).toString()).toBe(
        'JSHandle@typedarray'
      );
      expect((await page.evaluateHandle('new Proxy({}, {})')).toString()).toBe(
        'JSHandle@proxy'
      );
    });
  });

  describe('JSHandle[Symbol.dispose]', () => {
    it('should work', async () => {
      const {page} = await getTestState();
      using handle = await page.evaluateHandle('new Set()');
      const spy = sinon.spy(handle, Symbol.dispose);
      {
        using _ = handle;
      }
      expect(handle).toBeInstanceOf(JSHandle);
      expect(spy.calledOnce).toBeTruthy();
      expect(handle.disposed).toBeTruthy();
    });
  });

  describe('JSHandle[Symbol.asyncDispose]', () => {
    it('should work', async () => {
      const {page} = await getTestState();
      using handle = await page.evaluateHandle('new Set()');
      const spy = sinon.spy(handle, Symbol.asyncDispose);
      {
        await using _ = handle;
      }
      expect(handle).toBeInstanceOf(JSHandle);
      expect(spy.calledOnce).toBeTruthy();
      expect(handle.disposed).toBeTruthy();
    });
  });

  describe('JSHandle.move', () => {
    it('should work', async () => {
      const {page} = await getTestState();
      using handle = await page.evaluateHandle('new Set()');
      const spy = sinon.spy(handle, Symbol.dispose);
      {
        using _ = handle;
        handle.move();
      }
      expect(handle).toBeInstanceOf(JSHandle);
      expect(spy.calledOnce).toBeTruthy();
      expect(handle.disposed).toBeFalsy();
    });
  });
});
