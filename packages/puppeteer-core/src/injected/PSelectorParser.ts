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

import {Token, tokenize, TokenType} from './PSelectorTokenizer.js';

export type CSSSelector = string;
export type PPseudoSelector = {
  name: string;
  value: string;
};
export const enum PCombinator {
  Descendent = '>>>',
  Child = '>>>>',
}
export type CompoundPSelector = Array<CSSSelector | PPseudoSelector>;
export type ComplexPSelector = Array<CompoundPSelector | PCombinator>;
export type ComplexPSelectorList = ComplexPSelector[];

class TokenSpan {
  #tokens: Token[] = [];
  #selector: string;

  constructor(selector: string) {
    this.#selector = selector;
  }

  get length(): number {
    return this.#tokens.length;
  }

  add(token: Token) {
    this.#tokens.push(token);
  }

  toStringAndClear() {
    const startToken = this.#tokens[0] as Token;
    const endToken = this.#tokens[this.#tokens.length - 1] as Token;
    this.#tokens.splice(0);
    return this.#selector.slice(startToken.pos[0], endToken.pos[1]);
  }
}

const ESCAPE_REGEXP = /\\[\s\S]/g;
const unquote = (text: string): string => {
  if (text.length > 1) {
    for (const char of ['"', "'"]) {
      if (!text.startsWith(char) || !text.endsWith(char)) {
        continue;
      }
      return text
        .slice(char.length, -char.length)
        .replace(ESCAPE_REGEXP, match => {
          return match.slice(1);
        });
    }
  }
  return text;
};

export function parsePSelectors(
  selector: string
): [selector: ComplexPSelectorList, isPureCSS: boolean] {
  let isPureCSS = true;
  const tokens = tokenize(selector);
  if (tokens.length === 0) {
    return [[], isPureCSS];
  }
  let compoundSelector: CompoundPSelector = [];
  let complexSelector: ComplexPSelector = [compoundSelector];
  const selectors: ComplexPSelectorList = [complexSelector];
  const storage = new TokenSpan(selector);
  for (const token of tokens) {
    switch (token.type) {
      case TokenType.Combinator:
        switch (token.content) {
          case PCombinator.Descendent:
            isPureCSS = false;
            if (storage.length) {
              compoundSelector.push(storage.toStringAndClear());
            }
            compoundSelector = [];
            complexSelector.push(PCombinator.Descendent);
            complexSelector.push(compoundSelector);
            continue;
          case PCombinator.Child:
            isPureCSS = false;
            if (storage.length) {
              compoundSelector.push(storage.toStringAndClear());
            }
            compoundSelector = [];
            complexSelector.push(PCombinator.Child);
            complexSelector.push(compoundSelector);
            continue;
        }
        break;
      case TokenType.PseudoElement:
        if (!token.name.startsWith('-p-')) {
          break;
        }
        isPureCSS = false;
        if (storage.length) {
          compoundSelector.push(storage.toStringAndClear());
        }
        compoundSelector.push({
          name: token.name.slice(3),
          value: unquote(token.argument ?? ''),
        });
        continue;
      case TokenType.Comma:
        if (storage.length) {
          compoundSelector.push(storage.toStringAndClear());
        }
        compoundSelector = [];
        complexSelector = [compoundSelector];
        selectors.push(complexSelector);
        continue;
    }
    storage.add(token);
  }
  if (storage.length) {
    compoundSelector.push(storage.toStringAndClear());
  }
  return [selectors, isPureCSS];
}
