// Copyright 2022 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @internal
 */
export const pierceQuerySelector = (
  root: Node,
  selector: string
): Element | null => {
  let found: Node | null = null;
  const search = (root: Node) => {
    const iter = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    do {
      const currentNode = iter.currentNode as Element;
      if (currentNode.shadowRoot) {
        search(currentNode.shadowRoot);
      }
      if (currentNode instanceof ShadowRoot) {
        continue;
      }
      if (currentNode !== root && !found && currentNode.matches(selector)) {
        found = currentNode;
      }
    } while (!found && iter.nextNode());
  };
  if (root instanceof Document) {
    root = root.documentElement;
  }
  search(root);
  return found;
};

/**
 * @internal
 */
export const pierceQuerySelectorAll = (
  element: Node,
  selector: string
): Element[] => {
  const result: Element[] = [];
  const collect = (root: Node) => {
    const iter = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    do {
      const currentNode = iter.currentNode as Element;
      if (currentNode.shadowRoot) {
        collect(currentNode.shadowRoot);
      }
      if (currentNode instanceof ShadowRoot) {
        continue;
      }
      if (currentNode !== root && currentNode.matches(selector)) {
        result.push(currentNode);
      }
    } while (iter.nextNode());
  };
  if (element instanceof Document) {
    element = element.documentElement;
  }
  collect(element);
  return result;
};
