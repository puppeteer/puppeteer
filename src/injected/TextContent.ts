/**
 * Copyright 2022 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

interface NonTrivialValueNode extends Node {
  value: string;
}

const TRIVIAL_VALUE_INPUT_TYPES = new Set(['checkbox', 'image', 'radio']);

/**
 * Determines if the node has a non-trivial value property.
 *
 * @internal
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
 *
 * @internal
 */
export const isSuitableNodeForTextMatching = (node: Node): boolean => {
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
const textContentCache = new WeakMap<Node, TextContent>();
const eraseFromCache = (node: Node | null) => {
  while (node) {
    textContentCache.delete(node);
    if (node instanceof ShadowRoot) {
      node = node.host;
    } else {
      node = node.parentNode;
    }
  }
};

/**
 * Erases the cache when the tree has mutated text.
 */
const observedNodes = new WeakSet<Node>();
const textChangeObserver = new MutationObserver(mutations => {
  for (const mutation of mutations) {
    eraseFromCache(mutation.target);
  }
});

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

    root.addEventListener(
      'input',
      event => {
        eraseFromCache(event.target as HTMLInputElement);
      },
      {once: true, capture: true}
    );
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

    if (!observedNodes.has(root)) {
      textChangeObserver.observe(root, {
        childList: true,
        characterData: true,
      });
      observedNodes.add(root);
    }
  }
  textContentCache.set(root, value);
  return value;
};
