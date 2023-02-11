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
 * Queries the given node for all nodes matching the given text selector.
 *
 * @internal
 */
export const textQuerySelectorAll = function* (
  root: Node,
  selector: string
): Generator<Element> {
  let yielded = false;
  for (const node of root.childNodes) {
    if (node instanceof Element && isSuitableNodeForTextMatching(node)) {
      let matches: Generator<Element, boolean>;
      if (!node.shadowRoot) {
        matches = textQuerySelectorAll(node, selector);
      } else {
        matches = textQuerySelectorAll(node.shadowRoot, selector);
      }
      for (const match of matches) {
        yield match;
        yielded = true;
      }
    }
  }
  if (yielded) {
    return;
  }

  if (root instanceof Element && isSuitableNodeForTextMatching(root)) {
    const textContent = createTextContent(root);
    if (textContent.full.includes(selector)) {
      yield root;
    }
  }
};
