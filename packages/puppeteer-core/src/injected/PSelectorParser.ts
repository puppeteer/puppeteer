/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {type Token, tokenize, TOKENS, stringify} from 'parsel-js';

export type CSSSelector = string;
export interface PPseudoSelector {
  name: string;
  value: string;
}
export const enum PCombinator {
  Descendent = '>>>',
  Child = '>>>>',
}
export type CompoundPSelector = Array<CSSSelector | PPseudoSelector>;
export type ComplexPSelector = Array<CompoundPSelector | PCombinator>;
export type ComplexPSelectorList = ComplexPSelector[];

TOKENS['combinator'] = /\s*(>>>>?|[\s>+~])\s*/g;

const ESCAPE_REGEXP = /\\[\s\S]/g;
const unquote = (text: string): string => {
  if (text.length <= 1) {
    return text;
  }
  if ((text[0] === '"' || text[0] === "'") && text.endsWith(text[0])) {
    text = text.slice(1, -1);
  }
  return text.replace(ESCAPE_REGEXP, match => {
    return match[1] as string;
  });
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
  const storage: Token[] = [];
  for (const token of tokens) {
    switch (token.type) {
      case 'combinator':
        switch (token.content) {
          case PCombinator.Descendent:
            isPureCSS = false;
            if (storage.length) {
              compoundSelector.push(stringify(storage));
              storage.splice(0);
            }
            compoundSelector = [];
            complexSelector.push(PCombinator.Descendent);
            complexSelector.push(compoundSelector);
            continue;
          case PCombinator.Child:
            isPureCSS = false;
            if (storage.length) {
              compoundSelector.push(stringify(storage));
              storage.splice(0);
            }
            compoundSelector = [];
            complexSelector.push(PCombinator.Child);
            complexSelector.push(compoundSelector);
            continue;
        }
        break;
      case 'pseudo-element':
        if (!token.name.startsWith('-p-')) {
          break;
        }
        isPureCSS = false;
        if (storage.length) {
          compoundSelector.push(stringify(storage));
          storage.splice(0);
        }
        compoundSelector.push({
          name: token.name.slice(3),
          value: unquote(token.argument ?? ''),
        });
        continue;
      case 'comma':
        if (storage.length) {
          compoundSelector.push(stringify(storage));
          storage.splice(0);
        }
        compoundSelector = [];
        complexSelector = [compoundSelector];
        selectors.push(complexSelector);
        continue;
    }
    storage.push(token);
  }
  if (storage.length) {
    compoundSelector.push(stringify(storage));
  }
  return [selectors, isPureCSS];
}
