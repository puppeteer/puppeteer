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

describe('TransformAsyncFunctions', function() {
  it('should convert a function expression', function(done) {
    let input = `(async function(){ return 123 })()`;
    let output = eval(transformAsyncFunctions(input));
    expect(output instanceof Promise).toBe(true);
    output.then(result => expect(result).toBe(123)).then(done);
  });
  it('should convert an arrow function', function(done) {
    let input = `(async () => 123)()`;
    let output = eval(transformAsyncFunctions(input));
    expect(output instanceof Promise).toBe(true);
    output.then(result => expect(result).toBe(123)).then(done);
  });
  it('should convert an arrow function with curly braces', function(done) {
    let input = `(async () => { return 123 })()`;
    let output = eval(transformAsyncFunctions(input));
    expect(output instanceof Promise).toBe(true);
    output.then(result => expect(result).toBe(123)).then(done);
  });
  it('should convert a function declaration', function(done) {
    let input = `async function f(){ return 123; } f();`;
    let output = eval(transformAsyncFunctions(input));
    expect(output instanceof Promise).toBe(true);
    output.then(result => expect(result).toBe(123)).then(done);
  });
  it('should convert await', function(done) {
    let input = `async function f(){ return 23 + await Promise.resolve(100); } f();`;
    let output = eval(transformAsyncFunctions(input));
    expect(output instanceof Promise).toBe(true);
    output.then(result => expect(result).toBe(123)).then(done);
  });
  it('should convert method', function(done) {
    let input = `class X{async f() { return 123 }} (new X()).f();`;
    let output = eval(transformAsyncFunctions(input));
    expect(output instanceof Promise).toBe(true);
    output.then(result => expect(result).toBe(123)).then(done);
  });
  it('should pass arguments', function(done) {
    let input = `(async function(a, b){ return await a + await b })(Promise.resolve(100), 23)`;
    let output = eval(transformAsyncFunctions(input));
    expect(output instanceof Promise).toBe(true);
    output.then(result => expect(result).toBe(123)).then(done);
  });
});