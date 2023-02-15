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

type CSSSelector = string;

export type PSelector =
  | {
      name: string;
      value: string;
    }
  | CSSSelector;

const PUPPETEER_FUNCTION_TOKEN = /^:-p-([-a-zA-Z_]+)\(/;

class PSelectorParser {
  #input: string;
  #escaped = false;
  #quoted = false;

  // The first level are deep roots. The second level are shallow roots.
  #selectors: PSelector[][][] = [[[]]];

  constructor(input: string) {
    this.#input = input;
  }

  get selectors(): PSelector[][][] {
    return this.#selectors;
  }

  parse(): void {
    for (let i = 0; i < this.#input.length; ++i) {
      if (this.#escaped) {
        this.#escaped = false;
        continue;
      }
      switch (this.#input[i]) {
        case '\\': {
          this.#escaped = true;
          break;
        }
        case '"': {
          this.#quoted = !this.#quoted;
          break;
        }
        default: {
          if (this.#quoted) {
            break;
          }
          const remainder = this.#input.slice(i);
          if (remainder.startsWith('>>>>')) {
            this.#push(this.#input.slice(0, i));
            this.#input = remainder.slice('>>>>'.length);
            this.#parseDeepChild();
          } else if (remainder.startsWith('>>>')) {
            this.#push(this.#input.slice(0, i));
            this.#input = remainder.slice('>>>'.length);
            this.#parseDeepDescendent();
          } else {
            const result = PUPPETEER_FUNCTION_TOKEN.exec(remainder);
            if (!result) {
              continue;
            }
            const [match, name] = result;
            this.#push(this.#input.slice(0, i));
            this.#input = remainder.slice(match.length);
            this.#push({
              name: name as string,
              value: this.#scanParameter(),
            });
          }
        }
      }
    }
    this.#push(this.#input);
  }

  #push(selector: PSelector) {
    if (typeof selector === 'string') {
      // We only trim the end only since `.foo` and ` .foo` are different.
      selector = selector.trimEnd();
      if (selector.length === 0) {
        return;
      }
    }
    const roots = this.#selectors[this.#selectors.length - 1]!;
    roots[roots.length - 1]!.push(selector);
  }

  #parseDeepChild() {
    this.#selectors[this.#selectors.length - 1]!.push([]);
  }

  #parseDeepDescendent() {
    this.#selectors.push([[]]);
  }

  #scanParameter(): string {
    const char = this.#input[0];
    switch (char) {
      case "'":
      case '"':
        this.#input = this.#input.slice(1);
        const parameter = this.#scanEscapedValueTill(char);
        if (!this.#input.startsWith(')')) {
          throw new Error("Expected ')'");
        }
        this.#input = this.#input.slice(1);
        return parameter;
      default:
        return this.#scanEscapedValueTill(')');
    }
  }

  #scanEscapedValueTill(end: string): string {
    let string = '';
    for (let i = 0; i < this.#input.length; ++i) {
      if (this.#escaped) {
        this.#escaped = false;
        string += this.#input[i];
        continue;
      }
      switch (this.#input[i]) {
        case '\\': {
          this.#escaped = true;
          break;
        }
        case end: {
          this.#input = this.#input.slice(i + 1);
          return string;
        }
        default: {
          string += this.#input[i];
        }
      }
    }
    throw new Error(`Expected \`${end}\``);
  }
}

export function parsePSelectors(selector: string): PSelector[][][] {
  const parser = new PSelectorParser(selector);
  parser.parse();
  return parser.selectors;
}
