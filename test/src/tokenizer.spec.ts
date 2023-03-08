/**
 * Copyright 2023 Google Inc. All rights reserved.
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
import {tokenize} from 'puppeteer-core/internal/injected/PSelectorTokenizer.js';

describe('PSelectorTokenizer', () => {
  it('should work', () => {
    expect(JSON.stringify(tokenize('#foo'))).toStrictEqual(
      '[{"name":"foo","type":"id","content":"#foo","pos":[0,4]}]'
    );
  });

  it('should work with empty selectors', () => {
    expect(JSON.stringify(tokenize(''))).toStrictEqual('[]');
  });

  it('should work with multiple strings', () => {
    expect(
      JSON.stringify(
        tokenize('[data-test-id^="test-"]:not([data-test-id^="test-foo"])')
      )
    ).toStrictEqual(
      '[{"name":"data-test-id","operator":"^=","value":"\\"test-\\"","type":"attribute","content":"[data-test-id^=\\"test-\\"]","pos":[0,23]},{"name":"not","argument":"[data-test-id^=\\"test-foo\\"]","type":"pseudo-class","content":":not([data-test-id^=\\"test-foo\\"])","pos":[23,55]}]'
    );
  });

  it('should work with multiple parentheses', () => {
    expect(
      JSON.stringify(
        tokenize(
          '[data-test-id^="test-"]:not([data-test-id^="test-foo"]) [data-test-id^="test-"]:not([data-test-id^="test-foo"])'
        )
      )
    ).toStrictEqual(
      '[{"name":"data-test-id","operator":"^=","value":"\\"test-\\"","type":"attribute","content":"[data-test-id^=\\"test-\\"]","pos":[0,23]},{"name":"not","argument":"[data-test-id^=\\"test-foo\\"]","type":"pseudo-class","content":":not([data-test-id^=\\"test-foo\\"])","pos":[23,55]},{"type":"combinator","content":" ","pos":[55,56]},{"name":"data-test-id","operator":"^=","value":"\\"test-\\"","type":"attribute","content":"[data-test-id^=\\"test-\\"]","pos":[56,79]},{"name":"not","argument":"[data-test-id^=\\"test-foo\\"]","type":"pseudo-class","content":":not([data-test-id^=\\"test-foo\\"])","pos":[79,111]}]'
    );
  });

  it('should work with CSS escapes', () => {
    expect(
      JSON.stringify(tokenize('.mb-\\[max\\(-70\\%\\2c -23rem\\)\\]'))
    ).toStrictEqual(
      '[{"name":"mb-\\\\[max\\\\(-70\\\\%\\\\2c","type":"class","content":".mb-\\\\[max\\\\(-70\\\\%\\\\2c","pos":[0,19]},{"type":"combinator","content":" ","pos":[19,20]},{"name":"-23rem\\\\)\\\\]","type":"type","content":"-23rem\\\\)\\\\]","pos":[20,30]}]'
    );
  });

  it('should work with complex selectors', () => {
    expect(
      JSON.stringify(tokenize('a > b, c ~ d, a+b, e ::before ::after(a)'))
    ).toStrictEqual(
      '[{"name":"a","type":"type","content":"a","pos":[0,1]},{"type":"combinator","content":">","pos":[1,4]},{"name":"b","type":"type","content":"b","pos":[4,5]},{"type":"comma","content":",","pos":[5,7]},{"name":"c","type":"type","content":"c","pos":[7,8]},{"type":"combinator","content":"~","pos":[8,11]},{"name":"d","type":"type","content":"d","pos":[11,12]},{"type":"comma","content":",","pos":[12,14]},{"name":"a","type":"type","content":"a","pos":[14,15]},{"type":"combinator","content":"+","pos":[15,16]},{"name":"b","type":"type","content":"b","pos":[16,17]},{"type":"comma","content":",","pos":[17,19]},{"name":"e","type":"type","content":"e","pos":[19,20]},{"type":"combinator","content":" ","pos":[20,21]},{"name":"before","type":"pseudo-element","content":"::before","pos":[21,29]},{"type":"combinator","content":" ","pos":[29,30]},{"name":"after","argument":"a","type":"pseudo-element","content":"::after(a)","pos":[30,40]}]'
    );
  });

  it('should throw with invalid selectors', () => {
    expect(() => {
      tokenize('a[b');
    }).toThrow();
    expect(() => {
      tokenize('a(b');
    }).toThrow();
    expect(() => {
      tokenize('[');
    }).toThrow();
  });

  it('should work with universal selectors', () => {
    expect(JSON.stringify(tokenize('* > *'))).toStrictEqual(
      '[{"type":"universal","content":"*","pos":[0,1]},{"type":"combinator","content":">","pos":[1,4]},{"type":"universal","content":"*","pos":[4,5]}]'
    );
  });
});
