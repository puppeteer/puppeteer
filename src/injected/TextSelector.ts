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
