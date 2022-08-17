function isBoundingBoxVisible(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return !!(rect.top || rect.bottom || rect.width || rect.height);
}

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

export const createFunction = <Fn>(fnString: string): Fn => {
  return new Function(`return ${fnString}`)();
};
