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

/**
 * @internal
 */
export const xpathQuerySelectorAll = function* (
  root: Node,
  selector: string,
  maxResults = -1
): Iterable<Node> {
  const doc = root.ownerDocument || document;
  const iterator = doc.evaluate(
    selector,
    root,
    null,
    XPathResult.ORDERED_NODE_ITERATOR_TYPE
  );
  const items = [];
  let item;

  // Read all results upfront to avoid
  // https://stackoverflow.com/questions/48235278/xpath-error-the-document-has-mutated-since-the-result-was-returned.
  while ((item = iterator.iterateNext())) {
    items.push(item);
    if (maxResults && items.length === maxResults) {
      break;
    }
  }

  for (let i = 0; i < items.length; i++) {
    item = items[i];
    yield item as Node;
    delete items[i];
  }
};
