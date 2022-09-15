import {SelectorPart} from './PathPart.js';

const getCSSNodeName = (node: Node): string => {
  // If node is not an element, it's case sensitive
  if (!(node instanceof Element)) {
    return node.nodeName;
  }

  // If the names are different lengths, there is a prefix and it's case sensitive
  if (node.localName.length !== node.nodeName.length) {
    return node.nodeName;
  }

  // Return the local name, which will be case insensitive if its an html node
  return node.localName;
};

const getPrefixedClassNames = (node: Element): Set<string> => {
  const classAttribute = node.getAttribute('class');
  if (!classAttribute) {
    return new Set();
  }

  return new Set(
    classAttribute
      .split(/\s+/g)
      .filter(Boolean)
      .map(name => {
        // The prefix is required to store "__proto__" in a object-based map.
        return `$${name}`;
      })
  );
};

const idSelector = (id: string): string => {
  return `#${CSS.escape(id)}`;
};

const attributeSelector = (name: string, value: string): string => {
  return `[${name}=${CSS.escape(value)}]`;
};

const getSelectorPart = (
  node: Node,
  optimized: boolean,
  isTargetNode: boolean,
  attributes: string[] = []
): SelectorPart | undefined => {
  if (!(node instanceof Element)) {
    return;
  }

  const id = node.id;
  if (optimized) {
    for (const attribute of attributes) {
      const value = node.getAttribute(attribute);
      if (value) {
        return new SelectorPart(attributeSelector(attribute, value), true);
      }
    }
    if (id) {
      return new SelectorPart(idSelector(id), true);
    }
    switch (node.nodeName) {
      case 'BODY':
      case 'HEAD':
      case 'HTML':
        return new SelectorPart(getCSSNodeName(node), true);
    }
  }
  const nodeName = getCSSNodeName(node);

  if (id) {
    return new SelectorPart(`${nodeName}${idSelector(id)}`, true);
  }
  const parent = node.parentNode;
  if (!parent) {
    return new SelectorPart(nodeName, true);
  }

  const classNames = getPrefixedClassNames(node);
  let needsClassNames = false;
  let needsNthChild = false;
  let nodeIndex = -1;
  const children = parent.children;

  // If there are no class names, we will use the `nth-child` selector.
  if (!classNames.size) {
    needsNthChild = true;
  }

  for (
    let i = 0;
    (nodeIndex < 0 || !needsNthChild) && i < children.length;
    ++i
  ) {
    const child = children[i]!;
    if (child === node) {
      nodeIndex = i;
      continue;
    }
    if (needsNthChild) {
      continue;
    }
    if (getCSSNodeName(child) !== nodeName) {
      continue;
    }

    // Remove class names that are from children to keep things unique.
    needsClassNames = true;
    for (const childClassName of getPrefixedClassNames(child)) {
      if (!classNames.has(childClassName)) {
        continue;
      }
      classNames.delete(childClassName);
      // If we run out of unique class names, we circle back to the `nth-child` selector.
      if (!classNames.size) {
        needsNthChild = true;
        break;
      }
    }
  }

  let selector = nodeName;
  if (
    isTargetNode &&
    nodeName.toLowerCase() === 'input' &&
    node.getAttribute('type') &&
    !node.getAttribute('id') &&
    !node.getAttribute('class')
  ) {
    selector += '[type=' + CSS.escape(node.getAttribute('type') || '') + ']';
  }

  if (needsNthChild) {
    selector += ':nth-child(' + (nodeIndex + 1) + ')';
  } else if (needsClassNames) {
    for (const prefixedName of classNames) {
      selector += '.' + CSS.escape(prefixedName.slice(1));
    }
  }

  return new SelectorPart(selector, false);
};

/**
 * Computes the CSS selector for a node.
 *
 * @param node - The node to compute.
 * @param optimized - Whether to optimize the CSS selector for the node. Does
 * not imply the selector is shorter; implies the selector will be highly-scoped
 * to the node.
 * @returns The computed CSS selector.
 *
 * @internal
 */
export const computeCSSSelector = (
  node: Node | null,
  optimized?: boolean,
  attributes?: string[]
): {root: Node | null; selector: string} => {
  const parts = [];
  let contextNode: Node | null = node;
  while (contextNode) {
    const part = getSelectorPart(
      contextNode,
      !!optimized,
      contextNode === node,
      attributes
    );
    if (!part) {
      break;
    } // Error - bail out early.
    parts.push(part);
    if (part.optimized) {
      break;
    }
    contextNode = contextNode.parentNode;
  }

  parts.reverse();

  contextNode = node;
  while (contextNode) {
    if (contextNode instanceof ShadowRoot) {
      return {
        selector: parts.join(' > '),
        root: contextNode,
      };
    }
    contextNode = contextNode.parentNode;
  }

  return {
    selector: parts.join(' > '),
    root: null,
  };
};
