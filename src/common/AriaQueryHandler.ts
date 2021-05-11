/**
 * Copyright 2020 Google Inc. All rights reserved.
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

import { InternalQueryHandler } from './QueryHandler.js';
import { ElementHandle, JSHandle } from './JSHandle.js';
import { Protocol } from 'devtools-protocol';
import { CDPSession } from './Connection.js';
import { DOMWorld, PageBinding, WaitForSelectorOptions } from './DOMWorld.js';

async function queryAXTree(
  client: CDPSession,
  element: ElementHandle,
  accessibleName?: string,
  role?: string
): Promise<Protocol.Accessibility.AXNode[]> {
  const { nodes } = await client.send('Accessibility.queryAXTree', {
    objectId: element._remoteObject.objectId,
    accessibleName,
    role,
  });
  const filteredNodes: Protocol.Accessibility.AXNode[] = nodes.filter(
    (node: Protocol.Accessibility.AXNode) => node.role.value !== 'text'
  );
  return filteredNodes;
}

/*
 * The selectors consist of an accessible name to query for and optionally
 * further aria attributes on the form `[<attribute>=<value>]`.
 * Currently, we only support the `name` and `role` attribute.
 * The following examples showcase how the syntax works wrt. querying:
 * - 'title[role="heading"]' queries for elements with name 'title' and role 'heading'.
 * - '[role="img"]' queries for elements with role 'img' and any name.
 * - 'label' queries for elements with name 'label' and any role.
 * - '[name=""][role="button"]' queries for elements with no name and role 'button'.
 */
type ariaQueryOption = { name?: string; role?: string };
function parseAriaSelector(selector: string): ariaQueryOption {
  const normalize = (value: string): string => value.replace(/ +/g, ' ').trim();
  const knownAttributes = new Set(['name', 'role']);
  const queryOptions: ariaQueryOption = {};
  const attributeRegexp = /\[\s*(?<attribute>\w+)\s*=\s*"(?<value>\\.|[^"\\]*)"\s*\]/g;
  const defaultName = selector.replace(
    attributeRegexp,
    (_, attribute: string, value: string) => {
      attribute = attribute.trim();
      if (!knownAttributes.has(attribute))
        throw new Error(`Unknown aria attribute "${attribute}" in selector`);
      queryOptions[attribute] = normalize(value);
      return '';
    }
  );
  if (defaultName && !queryOptions.name)
    queryOptions.name = normalize(defaultName);
  return queryOptions;
}

const queryOne = async (
  element: ElementHandle,
  selector: string
): Promise<ElementHandle | null> => {
  const exeCtx = element.executionContext();
  const { name, role } = parseAriaSelector(selector);
  const res = await queryAXTree(exeCtx._client, element, name, role);
  if (res.length < 1) {
    return null;
  }
  return exeCtx._adoptBackendNodeId(res[0].backendDOMNodeId);
};

const waitFor = async (
  domWorld: DOMWorld,
  selector: string,
  options: WaitForSelectorOptions
): Promise<ElementHandle<Element>> => {
  const binding: PageBinding = {
    name: 'ariaQuerySelector',
    pptrFunction: async (selector: string) => {
      const document = await domWorld._document();
      const element = await queryOne(document, selector);
      return element;
    },
  };
  return domWorld.waitForSelectorInPage(
    (_: Element, selector: string) => globalThis.ariaQuerySelector(selector),
    selector,
    options,
    binding
  );
};

const queryAll = async (
  element: ElementHandle,
  selector: string
): Promise<ElementHandle[]> => {
  const exeCtx = element.executionContext();
  const { name, role } = parseAriaSelector(selector);
  const res = await queryAXTree(exeCtx._client, element, name, role);
  return Promise.all(
    res.map((axNode) => exeCtx._adoptBackendNodeId(axNode.backendDOMNodeId))
  );
};

const queryAllArray = async (
  element: ElementHandle,
  selector: string
): Promise<JSHandle> => {
  const elementHandles = await queryAll(element, selector);
  const exeCtx = element.executionContext();
  const jsHandle = exeCtx.evaluateHandle(
    (...elements) => elements,
    ...elementHandles
  );
  return jsHandle;
};

/**
 * @internal
 */
export const ariaHandler: InternalQueryHandler = {
  queryOne,
  waitFor,
  queryAll,
  queryAllArray,
};
