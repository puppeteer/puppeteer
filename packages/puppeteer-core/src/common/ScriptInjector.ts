import {source as injectedSource} from '../generated/injected.js';

/**
 * @internal
 */
export class ScriptInjector {
  #amendments = new Set<string>();
  #updated = false;

  // Appends a statement of the form `(PuppeteerUtil) => {...}`.
  append(statement: string): void {
    this.#update(() => {
      this.#amendments.add(statement);
    });
  }
  inject(inject: (script: string) => void, force = false): void {
    if (this.#updated || force) {
      inject(this.#get());
    }
    this.#updated = false;
  }
  pop(statement: string): void {
    this.#update(() => {
      this.#amendments.delete(statement);
    });
  }
  #get(): string {
    return `(() => {
      const module = {};
      ${injectedSource}
      ${[...this.#amendments]
        .map(statement => {
          return `(${statement})(module.exports.default);`;
        })
        .join('')}
      return module.exports.default;
    })()`;
  }

  #update(callback: () => void): void {
    callback();
    this.#updated = true;
  }
}

/**
 * @internal
 */
export const scriptInjector = new ScriptInjector();
