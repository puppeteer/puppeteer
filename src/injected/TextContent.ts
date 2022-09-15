interface NonTrivialValueNode extends Node {
  value: string;
}

const TRIVIAL_VALUE_INPUT_TYPES = new Set(['checkbox', 'image', 'radio']);

/**
 * Determines if the node has a non-trivial value property.
 */
const isNonTrivialValueNode = (node: Node): node is NonTrivialValueNode => {
  if (node instanceof HTMLSelectElement) {
    return true;
  }
  if (node instanceof HTMLTextAreaElement) {
    return true;
  }
  if (
    node instanceof HTMLInputElement &&
    !TRIVIAL_VALUE_INPUT_TYPES.has(node.type)
  ) {
    return true;
  }
  return false;
};

const UNSUITABLE_NODE_NAMES = new Set(['SCRIPT', 'STYLE']);

/**
 * Determines whether a given node is suitable for text matching.
 */
const isSuitableNodeForTextMatching = (node: Node): boolean => {
  return (
    !UNSUITABLE_NODE_NAMES.has(node.nodeName) && !document.head?.contains(node)
  );
};

/**
 * @internal
 */
export type TextContent = {
  // Contains the full text of the node.
  full: string;
  // Contains the text immediately beneath the node.
  immediate: string[];
};

/**
 * Maps {@link Node}s to their computed {@link TextContent}.
 */
const textContentCache = new Map<Node, TextContent>();

/**
 * Builds the text content of a node using some custom logic.
 *
 * @remarks
 * The primary reason this function exists is due to {@link ShadowRoot}s not having
 * text content.
 *
 * @internal
 */
export const createTextContent = (root: Node): TextContent => {
  let value = textContentCache.get(root);
  if (value) {
    return value;
  }
  value = {full: '', immediate: []};
  if (!isSuitableNodeForTextMatching(root)) {
    return value;
  }
  let currentImmediate = '';
  if (isNonTrivialValueNode(root)) {
    value.full = root.value;
    value.immediate.push(root.value);
  } else {
    for (let child = root.firstChild; child; child = child.nextSibling) {
      if (child.nodeType === Node.TEXT_NODE) {
        value.full += child.nodeValue ?? '';
        currentImmediate += child.nodeValue ?? '';
        continue;
      }
      if (currentImmediate) {
        value.immediate.push(currentImmediate);
      }
      currentImmediate = '';
      if (child.nodeType === Node.ELEMENT_NODE) {
        value.full += createTextContent(child).full;
      }
    }
    if (currentImmediate) {
      value.immediate.push(currentImmediate);
    }
    if (root instanceof Element && root.shadowRoot) {
      value.full += createTextContent(root.shadowRoot).full;
    }
  }
  textContentCache.set(root, value);
  return value;
};
