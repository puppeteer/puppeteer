import {source as injectedSource} from '../generated/injected.js';

class ScriptInjector {
  #updated = false;
  #amendments = new Set<string>();

  // Appends a statement of the form `(PuppeteerUtil) => {...}`.
  append(statement: string): void {
    this.#update(() => {
      this.#amendments.add(statement);
    });
  }

  pop(statement: string): void {
    this.#update(() => {
      this.#amendments.delete(statement);
    });
  }

  inject(inject: (script: string) => void, force = false) {
    if (this.#updated || force) {
      inject(this.#get());
    }
    this.#updated = false;
  }

  #update(callback: () => void): void {
    callback();
    this.#updated = true;
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
}

/**
 * @internal
 */
export const scriptInjector = new ScriptInjector();
