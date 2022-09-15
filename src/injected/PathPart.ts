/**
 * @internal
 */
export class SelectorPart {
  value: string;
  optimized: boolean;
  constructor(value: string, optimized: boolean) {
    this.value = value;
    this.optimized = optimized || false;
  }

  toString(): string {
    return this.value;
  }
}
