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

import {Protocol} from 'devtools-protocol';
import {assert} from '../util/assert.js';
import {CDPSession} from './Connection.js';
import {ElementHandle} from './ElementHandle.js';
import {Frame} from './Frame.js';
import {MAIN_WORLD, PUPPETEER_WORLD} from './IsolatedWorld.js';
import type {PuppeteerQueryHandler} from './QueryHandler.js';

async function queryAXTree(
  client: CDPSession,
  element: ElementHandle<Node>,
  accessibleName?: string,
  role?: string
): Promise<Protocol.Accessibility.AXNode[]> {
  const {nodes} = await client.send('Accessibility.queryAXTree', {
    objectId: element.remoteObject().objectId,
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

/**
 * The selectors consist of an accessible name to query for and optionally
 * further aria attributes on the form `[<attribute>=<value>]`.
 * Currently, we only support the `name` and `role` attribute.
 * The following examples showcase how the syntax works wrt. querying:
 *
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

const queryOneId = async (element: ElementHandle<Node>, selector: string) => {
  const {name, role} = parseAriaSelector(selector);
  const res = await queryAXTree(element.client, element, name, role);
  if (!res[0] || !res[0].backendDOMNodeId) {
    return null;
  }
  return res[0].backendDOMNodeId;
};

const queryOne: PuppeteerQueryHandler['queryOne'] = async (
  element,
  selector
) => {
  const id = await queryOneId(element, selector);
  if (!id) {
    return null;
  }
  return (await element.frame.worlds[MAIN_WORLD].adoptBackendNode(
    id
  )) as ElementHandle<Node>;
};

const waitFor: PuppeteerQueryHandler['waitFor'] = async (
  elementOrFrame,
  selector,
  options
) => {
  let frame: Frame;
  let element: ElementHandle<Node> | undefined;
  if (elementOrFrame instanceof Frame) {
    frame = elementOrFrame;
  } else {
    frame = elementOrFrame.frame;
    element = await frame.worlds[PUPPETEER_WORLD].adoptHandle(elementOrFrame);
  }

  const ariaQuerySelector = async (selector: string) => {
    const id = await queryOneId(
      element || (await frame.worlds[PUPPETEER_WORLD].document()),
      selector
    );
    if (!id) {
      return null;
    }
    return (await frame.worlds[PUPPETEER_WORLD].adoptBackendNode(
      id
    )) as ElementHandle<Node>;
  };

  const result = await frame.worlds[PUPPETEER_WORLD]._waitForSelectorInPage(
    (_: Element, selector: string) => {
      return (
        globalThis as unknown as {
          ariaQuerySelector(selector: string): Node | null;
        }
      ).ariaQuerySelector(selector);
    },
    element,
    selector,
    options,
    new Map([['ariaQuerySelector', ariaQuerySelector]])
  );
  if (element) {
    await element.dispose();
  }
  if (!(result instanceof ElementHandle)) {
    await result?.dispose();
    return null;
  }
  return result.frame.worlds[MAIN_WORLD].transferHandle(result);
};

const queryAll: PuppeteerQueryHandler['queryAll'] = async (
  element,
  selector
) => {
  const exeCtx = element.executionContext();
  const {name, role} = parseAriaSelector(selector);
  const res = await queryAXTree(exeCtx._client, element, name, role);
  const world = exeCtx._world!;
  return Promise.all(
    res.map(axNode => {
      return world.adoptBackendNode(axNode.backendDOMNodeId) as Promise<
        ElementHandle<Node>
      >;
    })
  );
};

/**
 * @internal
 */
export const ariaHandler: PuppeteerQueryHandler = {
  queryOne,
  waitFor,
  queryAll,
};
