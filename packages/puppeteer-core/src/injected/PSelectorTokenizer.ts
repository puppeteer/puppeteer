/**
 * Copyright (c) 2020 Lea Verou
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import {assert} from '../util/assert.js';

export const enum TokenType {
  Class = 'class',
  Attribute = 'attribute',
  Id = 'id',
  Type = 'type',
  Universal = 'universal',
  PseudoElement = 'pseudo-element',
  PseudoClass = 'pseudo-class',
  Comma = 'comma',
  Combinator = 'combinator',
}

export interface Token {
  type: string;
  content: string;
  name: string;
  namespace?: string;
  value?: string;
  pos: [number, number];
  operator?: string;
  argument?: string;
  caseSensitive?: 'i';
  /**
   * @internal
   */
  __changed?: boolean;
}

const TOKENS: Record<string, RegExp> = {
  [TokenType.Attribute]:
    /\[\s*(?:(?<namespace>(?:\\.|[-\w\P{ASCII}])+|\*)?\|)?(?<name>(?:\\.|[-\w\P{ASCII}])+)\s*(?:(?<operator>\W?=)\s*(?<value>.+?)\s*(\s(?<caseSensitive>[iIsS]))?\s*)?\]/gu,
  [TokenType.Id]: /#(?<name>(?:\\.|[-\w\P{ASCII}])+)/gu,
  [TokenType.Class]: /\.(?<name>(?:\\.|[-\w\P{ASCII}])+)/gu,
  [TokenType.Comma]: /\s*,\s*/g,
  [TokenType.Combinator]: /\s*(?:>{3,4}|[\s>+~])\s*/g,
  [TokenType.PseudoElement]:
    /::(?<name>(?:\\.|[-\w\P{ASCII}])+)(?:\((?<argument>¶+)\))?/gu,
  [TokenType.PseudoClass]:
    /:(?<name>(?:\\.|[-\w\P{ASCII}])+)(?:\((?<argument>¶+)\))?/gu,
  [TokenType.Universal]: /(?:(?<namespace>\*|(?:\\.|[-\w\P{ASCII}])*)\|)?\*/gu,
  [TokenType.Type]:
    /(?:(?<namespace>\*|(?:\\.|[-\w\P{ASCII}])*)\|)?(?<name>(?:\\.|[-\w\P{ASCII}])+)/gu,
};

const getArgumentPatternByType = (type: string) => {
  switch (type) {
    case TokenType.PseudoElement:
    case TokenType.PseudoClass:
      return new RegExp(
        TOKENS[type]!.source.replace('(?<argument>¶+)', '(?<argument>.+)'),
        'gu'
      );
    default:
      return TOKENS[type];
  }
};

function assertTokenArray(
  tokens: Array<Token | string>
): asserts tokens is Token[] {
  let offset = 0;
  for (const token of tokens) {
    switch (typeof token) {
      case 'string':
        throw new Error(
          `Unexpected sequence ${token} found at index ${offset}`
        );
      case 'object':
        offset += token.content.length;
        token.pos = [offset - token.content.length, offset];
        switch (token.type) {
          case TokenType.Combinator:
          case TokenType.Comma:
            token.content = token.content.trim() || ' ';
            break;
        }
        break;
    }
  }
}

export function tokenize(selector: string, grammar = TOKENS): Token[] {
  if (!selector) {
    return [];
  }
  selector = selector.trim();

  type Replacement = {value: string; offset: number};
  const replacements: Replacement[] = [];

  // Replace strings with placeholder
  {
    interface State {
      escaped: boolean;
      quoted?: string;
      offset: number;
    }
    const state: State = {escaped: false, offset: 0};
    for (let i = 0; i < selector.length; ++i) {
      if (state.escaped) {
        continue;
      }
      switch (selector[i]) {
        case '\\':
          state.escaped = true;
          break;
        case '"':
        case "'": {
          if (!state.quoted) {
            state.quoted = selector[i];
            state.offset = i;
            continue;
          }
          const quote = state.quoted;
          if (quote !== selector[i]) {
            continue;
          }
          delete state.quoted;
          const offset = state.offset;
          const value = selector.slice(state.offset, i + 1);
          replacements.push({value, offset});
          const replacement = `${quote}${'§'.repeat(value.length - 2)}${quote}`;
          selector =
            selector.slice(0, offset) +
            replacement +
            selector.slice(offset + value.length);
          break;
        }
      }
    }
  }

  // Replace parentheses with placeholder
  {
    interface State {
      escaped: boolean;
      nesting: number;
      offset: number;
    }
    const state: State = {escaped: false, nesting: 0, offset: 0};
    for (let i = 0; i < selector.length; ++i) {
      if (state.escaped) {
        continue;
      }
      switch (selector[i]) {
        case '\\':
          state.escaped = true;
          break;
        case '(':
          if (++state.nesting !== 1) {
            continue;
          }
          state.offset = i;
          break;
        case ')': {
          if (--state.nesting !== 0) {
            continue;
          }
          const {offset} = state;
          const value = selector.slice(offset, i + 1);
          replacements.push({value, offset});
          const replacement = `(${'¶'.repeat(value.length - 2)})`;
          selector =
            selector.slice(0, offset) +
            replacement +
            selector.slice(offset + value.length);
          break;
        }
      }
    }
  }

  // Our goal here is basically try each token type on the selector, keeping
  // track of order. Hopefully by the end, we have an array of tokens.
  const tokens: Array<Token | string> = [selector];
  for (const [type, pattern] of Object.entries(grammar)) {
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (typeof token !== 'string') {
        continue;
      }

      pattern.lastIndex = 0;
      const match = pattern.exec(token);
      if (!match) {
        continue;
      }

      const from = match.index - 1;
      const args: Array<Token | string> = [];
      const content = match[0];

      const before = token.slice(0, from + 1);
      if (before) {
        args.push(before);
      }

      args.push({
        ...(match.groups as unknown as Token),
        type,
        content,
      });

      const after = token.slice(from + content.length + 1);
      if (after) {
        args.push(after);
      }

      tokens.splice(i, 1, ...args);
    }
  }
  assertTokenArray(tokens);

  // Replace placeholders in reverse order.
  for (const replacement of replacements.reverse()) {
    for (const token of tokens) {
      const {offset, value} = replacement;
      if (!(token.pos[0] <= offset && offset + value.length <= token.pos[1])) {
        continue;
      }

      const {content} = token;
      const tokenOffset = offset - token.pos[0];
      token.content =
        content.slice(0, tokenOffset) +
        value +
        content.slice(tokenOffset + value.length);
      token.__changed = token.content !== content;
    }
  }

  // Rematch tokens with changed content.
  for (const token of tokens) {
    if (!token.__changed) {
      continue;
    }
    delete token.__changed;

    const pattern = getArgumentPatternByType(token.type);
    assert(pattern);
    pattern.lastIndex = 0;
    const match = pattern.exec(token.content);
    assert(match);
    Object.assign(token, match.groups);
  }

  return tokens;
}
