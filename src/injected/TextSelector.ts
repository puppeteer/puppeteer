import {
  createTextContent,
  isSuitableNodeForTextMatching,
} from './TextContent.js';

/**
 * Queries the given node for a node matching the given text selector.
 *
 * @internal
 */
export const textQuerySelector = (
  selector: string,
  root: Node
): Element | null => {
  for (const node of root.childNodes) {
    if (node instanceof Element && isSuitableNodeForTextMatching(node)) {
      let matchedNode: Element | null;
      if (node.shadowRoot) {
        matchedNode = textQuerySelector(selector, node.shadowRoot);
      } else {
        matchedNode = textQuerySelector(selector, node);
      }
      if (matchedNode) {
        return matchedNode;
      }
    }
  }

  if (root instanceof Element) {
    const textContent = createTextContent(root);
    if (textContent.full.includes(selector)) {
      return root;
    }
  }
  return null;
};

/**
 * Queries the given node for all nodes matching the given text selector.
 *
 * @internal
 */
export const textQuerySelectorAll = (
  selector: string,
  root: Node
): Element[] => {
  let results: Element[] = [];
  for (const node of root.childNodes) {
    if (node instanceof Element) {
      let matchedNodes: Element[];
      if (node.shadowRoot) {
        matchedNodes = textQuerySelectorAll(selector, node.shadowRoot);
      } else {
        matchedNodes = textQuerySelectorAll(selector, node);
      }
      results = results.concat(matchedNodes);
    }
  }
  if (results.length > 0) {
    return results;
  }

  if (root instanceof Element) {
    const textContent = createTextContent(root);
    if (textContent.full.includes(selector)) {
      return [root];
    }
  }
  return [];
};
