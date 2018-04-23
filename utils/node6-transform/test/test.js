/**
 * Copyright 2017 Google Inc. All rights reserved.
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
const transformAsyncFunctions = require('../TransformAsyncFunctions');

const {TestRunner, Reporter, Matchers}  = require('../../testrunner/');
const runner = new TestRunner();
new Reporter(runner);

const {describe, xdescribe, fdescribe} = runner;
const {it, fit, xit} = runner;
const {beforeAll, beforeEach, afterAll, afterEach} = runner;

const {expect} = new Matchers();

describe('TransformAsyncFunctions', function() {
  it('should convert a function expression', function(done) {
    const input = `(async function(){ return 123 })()`;
    const output = eval(transformAsyncFunctions(input));
    expect(output instanceof Promise).toBe(true);
    output.then(result => expect(result).toBe(123)).then(done);
  });
  it('should convert an arrow function', function(done) {
    const input = `(async () => 123)()`;
    const output = eval(transformAsyncFunctions(input));
    expect(output instanceof Promise).toBe(true);
    output.then(result => expect(result).toBe(123)).then(done);
  });
  it('should convert an arrow function with curly braces', function(done) {
    const input = `(async () => { return 123 })()`;
    const output = eval(transformAsyncFunctions(input));
    expect(output instanceof Promise).toBe(true);
    output.then(result => expect(result).toBe(123)).then(done);
  });
  it('should convert a function declaration', function(done) {
    const input = `async function f(){ return 123; } f();`;
    const output = eval(transformAsyncFunctions(input));
    expect(output instanceof Promise).toBe(true);
    output.then(result => expect(result).toBe(123)).then(done);
  });
  it('should convert await', function(done) {
    const input = `async function f(){ return 23 + await Promise.resolve(100); } f();`;
    const output = eval(transformAsyncFunctions(input));
    expect(output instanceof Promise).toBe(true);
    output.then(result => expect(result).toBe(123)).then(done);
  });
  it('should convert method', function(done) {
    const input = `class X{async f() { return 123 }} (new X()).f();`;
    const output = eval(transformAsyncFunctions(input));
    expect(output instanceof Promise).toBe(true);
    output.then(result => expect(result).toBe(123)).then(done);
  });
  it('should pass arguments', function(done) {
    const input = `(async function(a, b){ return await a + await b })(Promise.resolve(100), 23)`;
    const output = eval(transformAsyncFunctions(input));
    expect(output instanceof Promise).toBe(true);
    output.then(result => expect(result).toBe(123)).then(done);
  });
  it('should still work across eval', function(done) {
    const input = `var str = (async function(){ return 123; }).toString(); eval('(' + str + ')')();`;
    const output = eval(transformAsyncFunctions(input));
    expect(output instanceof Promise).toBe(true);
    output.then(result => expect(result).toBe(123)).then(done);
  });
  it('should work with double await', function(done) {
    const input = `async function f(){ return 23 + await Promise.resolve(50 + await Promise.resolve(50)); } f();`;
    const output = eval(transformAsyncFunctions(input));
    expect(output instanceof Promise).toBe(true);
    output.then(result => expect(result).toBe(123)).then(done);
  });
  it('should work paren around arrow function', function(done) {
    const input = `(async x => ( 123))()`;
    const output = eval(transformAsyncFunctions(input));
    expect(output instanceof Promise).toBe(true);
    output.then(result => expect(result).toBe(123)).then(done);
  });
  it('should work async arrow with await', function(done) {
    const input = `(async() => await 123)()`;
    const output = eval(transformAsyncFunctions(input));
    expect(output instanceof Promise).toBe(true);
    output.then(result => expect(result).toBe(123)).then(done);
  });
});

runner.run();
