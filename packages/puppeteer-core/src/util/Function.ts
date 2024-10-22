/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
const createdFunctions = new Map<string, (...args: unknown[]) => unknown>();

/**
 * Creates a function from a string.
 *
 * @internal
 */
export const createFunction = (
  functionValue: string
): ((...args: unknown[]) => unknown) => {
  let fn = createdFunctions.get(functionValue);
  if (fn) {
    return fn;
  }
  fn = new Function(`return ${functionValue}`)() as (
    ...args: unknown[]
  ) => unknown;
  createdFunctions.set(functionValue, fn);
  return fn;
};

/**
 * @internal
 */
export function stringifyFunction(fn: (...args: never) => unknown): string {
  let value = fn.toString();
  try {
    new Function(`(${value})`);
  } catch (err) {
    if (
      (err as Error).message.includes(
        `Refused to evaluate a string as JavaScript because 'unsafe-eval' is not an allowed source of script in the following Content Security Policy directive`
      )
    ) {
      // The content security policy does not allow Function eval. Let's
      // assume the value might be valid as is.
      return value;
    }
    // This means we might have a function shorthand (e.g. `test(){}`). Let's
    // try prefixing.
    let prefix = 'function ';
    if (value.startsWith('async ')) {
      prefix = `async ${prefix}`;
      value = value.substring('async '.length);
    }
    value = `${prefix}${value}`;
    try {
      new Function(`(${value})`);
    } catch {
      // We tried hard to serialize, but there's a weird beast here.
      throw new Error('Passed function cannot be serialized!');
    }
  }
  return value;
}

/**
 * Replaces `PLACEHOLDER`s with the given replacements.
 *
 * All replacements must be valid JS code.
 *
 * @example
 *
 * ```ts
 * interpolateFunction(() => PLACEHOLDER('test'), {test: 'void 0'});
 * // Equivalent to () => void 0
 * ```
 *
 * @internal
 */
export const interpolateFunction = <T extends (...args: never[]) => unknown>(
  fn: T,
  replacements: Record<string, string>
): T => {
  let value = stringifyFunction(fn);
  for (const [name, jsValue] of Object.entries(replacements)) {
    value = value.replace(
      new RegExp(`PLACEHOLDER\\(\\s*(?:'${name}'|"${name}")\\s*\\)`, 'g'),
      // Wrapping this ensures tersers that accidentally inline PLACEHOLDER calls
      // are still valid. Without, we may get calls like ()=>{...}() which is
      // not valid.
      `(${jsValue})`
    );
  }
  return createFunction(value) as unknown as T;
};

declare global {
  /**
   * Used for interpolation with {@link interpolateFunction}.
   *
   * @internal
   */
  function PLACEHOLDER<T>(name: string): T;
}
