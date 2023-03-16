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

declare global {
  interface Window {
    /**
     * @internal
     */
    __ariaQuerySelector(root: Node, selector: string): Promise<Node | null>;
    /**
     * @internal
     */
    __ariaQuerySelectorAll(root: Node, selector: string): Promise<Node[]>;
  }
}

export const ariaQuerySelector = (
  root: Node,
  selector: string
): Promise<Node | null> => {
  return window.__ariaQuerySelector(root, selector);
};
export const ariaQuerySelectorAll = async function* (
  root: Node,
  selector: string
): AsyncIterable<Node> {
  yield* await window.__ariaQuerySelectorAll(root, selector);
};
