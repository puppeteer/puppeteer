/**
 * @internal
 */

export type NamedSymbol = symbol & {name: string};
/**
 * @internal
 */

export const NamedSymbol = (name: string): NamedSymbol => {
  return Object.assign(Symbol(name), {name});
};
