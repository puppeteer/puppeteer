import {assert} from '../util/assert.js';
import {SelectorPart} from './PathPart.js';

const getSelectorPart = (node: Node, optimized?: boolean): SelectorPart => {
  let value;
  switch (node.nodeType) {
    case Node.ELEMENT_NODE:
      assert(node instanceof Element);
      if (optimized && node.getAttribute('id')) {
        return new SelectorPart(`//*[@id="${node.getAttribute('id')}"]`, true);
      }
      value = node.localName;
      break;
    case Node.ATTRIBUTE_NODE:
      value = '@' + node.nodeName;
      break;
    case Node.TEXT_NODE:
    case Node.CDATA_SECTION_NODE:
      value = 'text()';
      break;
    case Node.PROCESSING_INSTRUCTION_NODE:
      value = 'processing-instruction()';
      break;
    case Node.COMMENT_NODE:
      value = 'comment()';
      break;
    case Node.DOCUMENT_NODE:
      value = '';
      break;
    default:
      value = '';
      break;
  }

  const index = getXPathIndexInParent(node);
  if (index > 0) {
    value += `[${index}]`;
  }

  return new SelectorPart(value, node.nodeType === Node.DOCUMENT_NODE);
};

const getXPathIndexInParent = (node: Node): number => {
  /**
   * @returns -1 in case of error, 0 if no siblings matching the same expression,
   * XPath index among the same expression-matching sibling nodes otherwise.
   */
  function areNodesSimilar(left: Node, right: Node): boolean {
    if (left === right) {
      return true;
    }

    if (left instanceof Element && right instanceof Element) {
      return left.localName === right.localName;
    }

    if (left.nodeType === right.nodeType) {
      return true;
    }

    // XPath treats CDATA as text nodes.
    const leftType =
      left.nodeType === Node.CDATA_SECTION_NODE
        ? Node.TEXT_NODE
        : left.nodeType;
    const rightType =
      right.nodeType === Node.CDATA_SECTION_NODE
        ? Node.TEXT_NODE
        : right.nodeType;
    return leftType === rightType;
  }

  const children = node.parentNode ? node.parentNode.children : null;
  if (!children) {
    return 0;
  }
  let hasSameNamedElements;
  for (let i = 0; i < children.length; ++i) {
    if (areNodesSimilar(node, children[i]!) && children[i] !== node) {
      hasSameNamedElements = true;
      break;
    }
  }
  if (!hasSameNamedElements) {
    return 0;
  }
  let ownIndex = 1; // XPath indices start with 1.
  for (let i = 0; i < children.length; ++i) {
    if (areNodesSimilar(node, children[i]!)) {
      if (children[i] === node) {
        return ownIndex;
      }
      ++ownIndex;
    }
  }

  assert(false, 'This is impossible; a child must be the child of the parent');
};

/**
 * Computes the XPath for a node.
 *
 * @param node - The node to compute.
 * @param optimized - Whether to optimize the XPath for the node. Does not imply
 * the XPath is shorter; implies the XPath will be highly-scoped to the node.
 * @returns The computed XPath.
 *
 * @internal
 */
export const computeXPath = (node: Node, optimized?: boolean): string => {
  if (node.nodeType === Node.DOCUMENT_NODE) {
    return '/';
  }

  const parts = [];
  let contextNode: Node | null = node;
  while (contextNode) {
    const part = getSelectorPart(contextNode, optimized);
    parts.push(part);
    if (part.optimized) {
      break;
    }
    contextNode = contextNode.parentNode;
  }

  parts.reverse();
  return (parts.length && parts[0]!.optimized ? '' : '/') + parts.join('/');
};
