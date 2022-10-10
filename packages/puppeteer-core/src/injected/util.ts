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

const createdFunctions = new Map<string, (...args: unknown[]) => unknown>();

/**
 * Creates a function from a string.
 *
 * @internal
 */
export const createFunction = (
  functionValue: string
): ((...args: unknown[]) => unknown) => {
  let fn = createdFunctions.get(functionValue);
  if (fn) {
    return fn;
  }
  fn = new Function(`return ${functionValue}`)() as (
    ...args: unknown[]
  ) => unknown;
  createdFunctions.set(functionValue, fn);
  return fn;
};

const HIDDEN_VISIBILITY_VALUES = ['hidden', 'collapse'];

/**
 * @internal
 */
export const checkVisibility = (
  node: Node | null,
  visible?: boolean
): Node | boolean => {
  if (!node) {
    return visible === false;
  }
  if (visible === undefined) {
    return node;
  }
  const element = (
    node.nodeType === Node.TEXT_NODE ? node.parentElement : node
  ) as Element;

  const style = window.getComputedStyle(element);
  const isVisible =
    style &&
    !HIDDEN_VISIBILITY_VALUES.includes(style.visibility) &&
    isBoundingBoxVisible(element);
  return visible === isVisible ? node : false;
};

function isBoundingBoxVisible(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.bottom > 0;
}
