const HIDDEN_VISIBILITY_VALUES = ['hidden', 'collapse'];

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
    style &&
    !HIDDEN_VISIBILITY_VALUES.includes(style.visibility) &&
    !isBoundingBoxEmpty(element);
  return visible === isVisible ? node : false;
};

function isBoundingBoxEmpty(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width === 0 || rect.height === 0;
}
