/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
const HIDDEN_VISIBILITY_VALUES = ['hidden', 'collapse'];

/**
 * @internal
 */
export const checkVisibility = (
  node: Node | null,
  visible?: boolean,
): Node | boolean => {
  if (!node) {
    return visible === false;
  }
  if (visible === undefined) {
    return node;
  }
  // A text node placed directly in a shadow root has no parent element, so
  // fall back to the shadow host.
  const element = (
    node.nodeType === Node.TEXT_NODE
      ? (node.parentElement ?? (node.parentNode as ShadowRoot | null)?.host)
      : node
  ) as Element | null | undefined;
  if (!element) {
    return visible === false;
  }

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

const hasShadowRoot = (node: Node): node is Node & {shadowRoot: ShadowRoot} => {
  return 'shadowRoot' in node && node.shadowRoot instanceof ShadowRoot;
};

/**
 * @internal
 */
export function* pierce(root: Node): IterableIterator<Node | ShadowRoot> {
  if (hasShadowRoot(root)) {
    yield root.shadowRoot;
  } else {
    yield root;
  }
}

/**
 * @internal
 */
export function* pierceAll(root: Node): IterableIterator<Node | ShadowRoot> {
  root = pierce(root).next().value;
  yield root;
  const walkers = [document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)];
  for (const walker of walkers) {
    let node: Element | null;
    while ((node = walker.nextNode() as Element | null)) {
      if (!node.shadowRoot) {
        continue;
      }
      yield node.shadowRoot;
      walkers.push(
        document.createTreeWalker(node.shadowRoot, NodeFilter.SHOW_ELEMENT),
      );
    }
  }
}
