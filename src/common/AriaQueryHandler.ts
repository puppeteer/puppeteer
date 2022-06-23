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

import {InternalQueryHandler} from './QueryHandler.js';
import {ElementHandle, JSHandle} from './JSHandle.js';
import {Protocol} from 'devtools-protocol';
import {CDPSession} from './Connection.js';
import {DOMWorld, PageBinding, WaitForSelectorOptions} from './DOMWorld.js';
import {assert} from './assert.js';

async function queryAXTree(
  client: CDPSession,
  element: ElementHandle,
  accessibleName?: string,
  role?: string
): Promise<Protocol.Accessibility.AXNode[]> {
  const {nodes} = await client.send('Accessibility.queryAXTree', {
    objectId: element._remoteObject.objectId,
    accessibleName,
    role,
  });
  const filteredNodes: Protocol.Accessibility.AXNode[] = nodes.filter(
    (node: Protocol.Accessibility.AXNode) => {
      return !node.role || node.role.value !== 'StaticText';
    }
  );
  return filteredNodes;
}

const normalizeValue = (value: string): string => {
  return value.replace(/ +/g, ' ').trim();
};
const knownAttributes = new Set(['name', 'role']);
const attributeRegexp =
  /\[\s*(?<attribute>\w+)\s*=\s*(?<quote>"|')(?<value>\\.|.*?(?=\k<quote>))\k<quote>\s*\]/g;

type ARIAQueryOption = {name?: string; role?: string};
function isKnownAttribute(
  attribute: string
): attribute is keyof ARIAQueryOption {
  return knownAttributes.has(attribute);
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
function parseAriaSelector(selector: string): ARIAQueryOption {
  const queryOptions: ARIAQueryOption = {};
  const defaultName = selector.replace(
    attributeRegexp,
    (_, attribute: string, _quote: string, value: string) => {
      attribute = attribute.trim();
      assert(
        isKnownAttribute(attribute),
        `Unknown aria attribute "${attribute}" in selector`
      );
      queryOptions[attribute] = normalizeValue(value);
      return '';
    }
  );
  if (defaultName && !queryOptions.name) {
    queryOptions.name = normalizeValue(defaultName);
  }
  return queryOptions;
}

const queryOne = async (
  element: ElementHandle,
  selector: string
): Promise<ElementHandle | null> => {
  const exeCtx = element.executionContext();
  const {name, role} = parseAriaSelector(selector);
  const res = await queryAXTree(exeCtx._client, element, name, role);
  if (!res[0] || !res[0].backendDOMNodeId) {
    return null;
  }
  return exeCtx._adoptBackendNodeId(res[0].backendDOMNodeId);
};

const waitFor = async (
  domWorld: DOMWorld,
  selector: string,
  options: WaitForSelectorOptions
): Promise<ElementHandle<Element> | null> => {
  const binding: PageBinding = {
    name: 'ariaQuerySelector',
    pptrFunction: async (selector: string) => {
      const root = options.root || (await domWorld._document());
      const element = await queryOne(root, selector);
      return element;
    },
  };
  return domWorld._waitForSelectorInPage(
    (_: Element, selector: string) => {
      return (
        globalThis as any as unknown as {
          ariaQuerySelector(selector: string): void;
        }
      ).ariaQuerySelector(selector);
    },
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
  const {name, role} = parseAriaSelector(selector);
  const res = await queryAXTree(exeCtx._client, element, name, role);
  return Promise.all(
    res.map(axNode => {
      return exeCtx._adoptBackendNodeId(axNode.backendDOMNodeId);
    })
  );
};

const queryAllArray = async (
  element: ElementHandle,
  selector: string
): Promise<JSHandle<Element[]>> => {
  const elementHandles = await queryAll(element, selector);
  const exeCtx = element.executionContext();
  const jsHandle = exeCtx.evaluateHandle((...elements) => {
    return elements;
  }, ...elementHandles);
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
