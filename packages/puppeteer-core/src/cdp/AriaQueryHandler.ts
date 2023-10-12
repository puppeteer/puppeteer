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

import type {Protocol} from 'devtools-protocol';

import type {CDPSession} from '../api/CDPSession.js';
import type {ElementHandle} from '../api/ElementHandle.js';
import {QueryHandler, type QuerySelector} from '../common/QueryHandler.js';
import type {AwaitableIterable} from '../common/types.js';
import {assert} from '../util/assert.js';
import {AsyncIterableUtil} from '../util/AsyncIterableUtil.js';

const NON_ELEMENT_NODE_ROLES = new Set(['StaticText', 'InlineTextBox']);

const queryAXTree = async (
  client: CDPSession,
  element: ElementHandle<Node>,
  accessibleName?: string,
  role?: string
): Promise<Protocol.Accessibility.AXNode[]> => {
  const {nodes} = await client.send('Accessibility.queryAXTree', {
    objectId: element.id,
    accessibleName,
    role,
  });
  return nodes.filter((node: Protocol.Accessibility.AXNode) => {
    return !node.role || !NON_ELEMENT_NODE_ROLES.has(node.role.value);
  });
};

interface ARIASelector {
  name?: string;
  role?: string;
}

const isKnownAttribute = (
  attribute: string
): attribute is keyof ARIASelector => {
  return ['name', 'role'].includes(attribute);
};

const normalizeValue = (value: string): string => {
  return value.replace(/ +/g, ' ').trim();
};

/**
 * The selectors consist of an accessible name to query for and optionally
 * further aria attributes on the form `[<attribute>=<value>]`.
 * Currently, we only support the `name` and `role` attribute.
 * The following examples showcase how the syntax works wrt. querying:
 *
 * - 'title[role="heading"]' queries for elements with name 'title' and role 'heading'.
 * - '[role="image"]' queries for elements with role 'image' and any name.
 * - 'label' queries for elements with name 'label' and any role.
 * - '[name=""][role="button"]' queries for elements with no name and role 'button'.
 */
const ATTRIBUTE_REGEXP =
  /\[\s*(?<attribute>\w+)\s*=\s*(?<quote>"|')(?<value>\\.|.*?(?=\k<quote>))\k<quote>\s*\]/g;
const parseARIASelector = (selector: string): ARIASelector => {
  const queryOptions: ARIASelector = {};
  const defaultName = selector.replace(
    ATTRIBUTE_REGEXP,
    (_, attribute, __, value) => {
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
};

/**
 * @internal
 */
export class ARIAQueryHandler extends QueryHandler {
  static override querySelector: QuerySelector = async (
    node,
    selector,
    {ariaQuerySelector}
  ) => {
    return await ariaQuerySelector(node, selector);
  };

  static override async *queryAll(
    element: ElementHandle<Node>,
    selector: string
  ): AwaitableIterable<ElementHandle<Node>> {
    const {name, role} = parseARIASelector(selector);
    const results = await queryAXTree(
      element.realm.environment.client,
      element,
      name,
      role
    );
    yield* AsyncIterableUtil.map(results, node => {
      return element.realm.adoptBackendNode(node.backendDOMNodeId) as Promise<
        ElementHandle<Node>
      >;
    });
  }

  static override queryOne = async (
    element: ElementHandle<Node>,
    selector: string
  ): Promise<ElementHandle<Node> | null> => {
    return (
      (await AsyncIterableUtil.first(this.queryAll(element, selector))) ?? null
    );
  };
}
