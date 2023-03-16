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

/**
 * @internal
 */
export function* deepChildren(
  root: Node
): IterableIterator<Element | ShadowRoot> {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let node = walker.nextNode() as Element | null;
  for (; node; node = walker.nextNode() as Element | null) {
    yield node.shadowRoot ?? node;
  }
}

/**
 * @internal
 */
export function* deepDescendents(
  root: Node
): IterableIterator<Element | ShadowRoot> {
  const walkers = [document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)];
  let walker: TreeWalker | undefined;
  while ((walker = walkers.shift())) {
    for (
      let node = walker.nextNode() as Element | null;
      node;
      node = walker.nextNode() as Element | null
    ) {
      if (!node.shadowRoot) {
        yield node;
        continue;
      }
      walkers.push(
        document.createTreeWalker(node.shadowRoot, NodeFilter.SHOW_ELEMENT)
      );
      yield node.shadowRoot;
    }
  }
}
