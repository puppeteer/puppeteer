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
    !TRIVIAL_VALUE_INPUT_TYPES.has(node.type.toLowerCase())
  ) {
    return true;
  }
  return false;
};

const shouldSkipForTextMatching = (node: Node) => {
  return (
    node.nodeName === 'SCRIPT' ||
    node.nodeName === 'STYLE' ||
    (document.head && document.head.contains(node))
  );
};

/**
 * @internal
 */
export type TextContent = {full: string; immediate: string[]};

/**
 * This class builds the text content of a node using some custom logic.
 *
 * @remarks
 * The primary reason this class exists is due to {@link ShadowRoot}s not having
 * text content.
 *
 * @internal
 */
export class TextContentBuilder {
  /**
   * Maps {@link Node}s to their computed {@link TextContent}.
   */
  #cache = new Map<Node, TextContent>();

  build(root: Node): TextContent {
    let value = this.#cache.get(root);
    if (value) {
      return value;
    }
    value = {full: '', immediate: []};
    if (!shouldSkipForTextMatching(root)) {
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
          value.full += this.build(child).full;
        }
      }
      if (currentImmediate) {
        value.immediate.push(currentImmediate);
      }
      if (root instanceof Element && root.shadowRoot) {
        value.full += this.build(root.shadowRoot).full;
      }
    }
    this.#cache.set(root, value);
    return value;
  }
}
