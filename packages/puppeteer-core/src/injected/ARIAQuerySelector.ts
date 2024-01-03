/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
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
