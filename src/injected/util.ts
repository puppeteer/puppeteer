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
export const checkVisibility = (
  node: Node | null,
  visible?: boolean
): Node | boolean => {
  if (!node) {
    return visible === false;
  }
  if (visible === undefined) {
    return node;
  }
  const element = (
    node.nodeType === Node.TEXT_NODE ? node.parentElement : node
  ) as Element;

  const style = window.getComputedStyle(element);
  const isVisible =
    style && style.visibility !== 'hidden' && isBoundingBoxVisible(element);
  return visible === isVisible ? node : false;
};

function isBoundingBoxVisible(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return !!(rect.top || rect.bottom || rect.width || rect.height);
}
