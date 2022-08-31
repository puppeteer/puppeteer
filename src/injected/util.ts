const createdFunctions = new Map<string, (...args: unknown[]) => unknown>();

/**
 * Creates a function from a string.
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
