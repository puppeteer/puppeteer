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
const utils = require('./utils');

module.exports.addTests = function({testRunner, expect, product}) {
  const {describe, xdescribe, fdescribe} = testRunner;
  const {it, fit, xit} = testRunner;
  const {beforeAll, beforeEach, afterAll, afterEach} = testRunner;

  const FFOX = product === 'firefox';
  const CHROME = product === 'chromium';

  describe('Page.evaluateHandle', function() {
    it('should work', async({page, server}) => {
      const windowHandle = await page.evaluateHandle(() => window);
      expect(windowHandle).toBeTruthy();
    });
    it('should accept object handle as an argument', async({page, server}) => {
      const navigatorHandle = await page.evaluateHandle(() => navigator);
      const text = await page.evaluate(e => e.userAgent, navigatorHandle);
      expect(text).toContain('Mozilla');
    });
    it('should accept object handle to primitive types', async({page, server}) => {
      const aHandle = await page.evaluateHandle(() => 5);
      const isFive = await page.evaluate(e => Object.is(e, 5), aHandle);
      expect(isFive).toBeTruthy();
    });
    it('should accept object handle to unserializable value', async({page, server}) => {
      const aHandle = await page.evaluateHandle(() => Infinity);
      expect(await page.evaluate(e => Object.is(e, Infinity), aHandle)).toBe(true);
    });
    it('should use the same JS wrappers', async({page, server}) => {
      const aHandle = await page.evaluateHandle(() => {
        window.FOO = 123;
        return window;
      });
      expect(await page.evaluate(e => e.FOO, aHandle)).toBe(123);
    });
    it('should work with primitives', async({page, server}) => {
      const aHandle = await page.evaluateHandle(() => {
        window.FOO = 123;
        return window;
      });
      expect(await page.evaluate(e => e.FOO, aHandle)).toBe(123);
    });
  });

  describe('JSHandle.jsonValue', function() {
    it('should work', async({page, server}) => {
      const aHandle = await page.evaluateHandle(() => ({foo: 'bar'}));
      const json = await aHandle.jsonValue();
      expect(json).toEqual({foo: 'bar'});
    });
    // This relies on Chrome's internal serialization. We can either repeat it
    // in FFOX, or migrate to JSON.stringify() logic altogether.
    (FFOX ? xit : it)('should not work with dates', async({page, server}) => {
      const dateHandle = await page.evaluateHandle(() => new Date('2017-09-26T00:00:00.000Z'));
      const json = await dateHandle.jsonValue();
      expect(json).toEqual({});
    });
    it('should throw for circular objects', async({page, server}) => {
      const windowHandle = await page.evaluateHandle('window');
      let error = null;
      await windowHandle.jsonValue().catch(e => error = e);
      expect(error).not.toBe(null);
    });
  });

  describe('JSHandle.toString', function() {
    it('should work for primitives', async({page, server}) => {
      const numberHandle = await page.evaluateHandle(() => 2);
      expect(numberHandle.toString()).toBe('JSHandle:2');
      const stringHandle = await page.evaluateHandle(() => 'a');
      expect(stringHandle.toString()).toBe('JSHandle:a');
    });
    it('should work for complicated objects', async({page, server}) => {
      const aHandle = await page.evaluateHandle(() => window);
      expect(aHandle.toString()).toBe('JSHandle@object');
    });
    it('should work with different subtypes', async({page, server}) => {
      expect((await page.evaluateHandle('(function(){})')).toString()).toBe('JSHandle@function');
      expect((await page.evaluateHandle('12')).toString()).toBe('JSHandle:12');
      expect((await page.evaluateHandle('true')).toString()).toBe('JSHandle:true');
      expect((await page.evaluateHandle('undefined')).toString()).toBe('JSHandle:undefined');
      expect((await page.evaluateHandle('"foo"')).toString()).toBe('JSHandle:foo');
      expect((await page.evaluateHandle('Symbol()')).toString()).toBe('JSHandle@symbol');
      expect((await page.evaluateHandle('new Map()')).toString()).toBe('JSHandle@map');
      expect((await page.evaluateHandle('new Set()')).toString()).toBe('JSHandle@set');
      expect((await page.evaluateHandle('[]')).toString()).toBe('JSHandle@array');
      expect((await page.evaluateHandle('null')).toString()).toBe('JSHandle:null');
      expect((await page.evaluateHandle('/foo/')).toString()).toBe('JSHandle@regexp');
      expect((await page.evaluateHandle('document.body')).toString()).toBe('JSHandle@node');
      expect((await page.evaluateHandle('new Date()')).toString()).toBe('JSHandle@date');
      expect((await page.evaluateHandle('new WeakMap()')).toString()).toBe('JSHandle@weakmap');
      expect((await page.evaluateHandle('new WeakSet()')).toString()).toBe('JSHandle@weakset');
      expect((await page.evaluateHandle('new Error()')).toString()).toBe('JSHandle@error');
      expect((await page.evaluateHandle('new Int32Array()')).toString()).toBe('JSHandle@typedarray');
      expect((await page.evaluateHandle('new Proxy({}, {})')).toString()).toBe('JSHandle@proxy');
    });
  });

  describe('JSHandle.getProperties', function() {
    it('should work', async({page, server}) => {
      const aHandle = await page.evaluateHandle(() => ({
        foo: 'bar'
      }));
      const properties = await aHandle.getProperties();
      const foo = properties.get('foo');
      expect(foo).toBeTruthy();
      expect(await foo.jsonValue()).toBe('bar');
    });
    it('should return even non-own properties', async({page, server}) => {
      const aHandle = await page.evaluateHandle(() => {
        class A {
          constructor() {
            this.a = '1';
          }
        }
        class B extends A {
          constructor() {
            super();
            this.b = '2';
          }
        }
        return new B();
      });
      const properties = await aHandle.getProperties();
      expect(await properties.get('a').jsonValue()).toBe('1');
      expect(await properties.get('b').jsonValue()).toBe('2');
    });
  });

  describe('JSHandle.getProperty', function() {
    it('should work', async({page, server}) => {
      const aHandle = await page.evaluateHandle(() => ({
        one: 1,
        two: 2,
        three: 3
      }));
      const twoHandle = await aHandle.getProperty('two');
      expect(await twoHandle.jsonValue()).toEqual(2);
    });
  });
};
