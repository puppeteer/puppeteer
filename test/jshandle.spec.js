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

module.exports.addTests = function({testRunner, expect}) {
  const {describe, xdescribe, fdescribe} = testRunner;
  const {it, fit, xit} = testRunner;
  const {beforeAll, beforeEach, afterAll, afterEach} = testRunner;

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

  describe('JSHandle.jsonValue', function() {
    it('should work', async({page, server}) => {
      const aHandle = await page.evaluateHandle(() => ({foo: 'bar'}));
      const json = await aHandle.jsonValue();
      expect(json).toEqual({foo: 'bar'});
    });
    it('should not work with dates', async({page, server}) => {
      const dateHandle = await page.evaluateHandle(() => new Date('2017-09-26T00:00:00.000Z'));
      const json = await dateHandle.jsonValue();
      expect(json).toEqual({});
    });
    it('should throw for circular objects', async({page, server}) => {
      const windowHandle = await page.evaluateHandle('window');
      let error = null;
      await windowHandle.jsonValue().catch(e => error = e);
      expect(error.message).toContain('Object reference chain is too long');
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

  describe('JSHandle.asElement', function() {
    it('should work', async({page, server}) => {
      const aHandle = await page.evaluateHandle(() => document.body);
      const element = aHandle.asElement();
      expect(element).toBeTruthy();
    });
    it('should return null for non-elements', async({page, server}) => {
      const aHandle = await page.evaluateHandle(() => 2);
      const element = aHandle.asElement();
      expect(element).toBeFalsy();
    });
    it('should return ElementHandle for TextNodes', async({page, server}) => {
      await page.setContent('<div>ee!</div>');
      const aHandle = await page.evaluateHandle(() => document.querySelector('div').firstChild);
      const element = aHandle.asElement();
      expect(element).toBeTruthy();
      expect(await page.evaluate(e => e.nodeType === HTMLElement.TEXT_NODE, element));
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
  });
};
