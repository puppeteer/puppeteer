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
import { ElementHandle } from './JSHandle.js';
import { Protocol } from 'devtools-protocol';
import { CDPSession } from './Connection.js';
import { DOMWorld } from './DOMWorld.js';

async function queryAXTree(
  client: CDPSession,
  element: ElementHandle,
  accessibleName?: string,
  role?: string
): Promise<Protocol.Accessibility.AXNode[]> {
  // @ts-ignore
  const { nodes } = await client.send(
    // @ts-ignore
    'Accessibility.queryAXTree',
    {
      objectId: element._remoteObject.objectId,
      accessibleName,
      role,
    }
  );
  // @ts-ignore
  const filteredNodes: Protocol.Accessibility.AXNode[] = nodes.filter(
    (node: Protocol.Accessibility.AXNode) => node.role.value !== 'text'
  );
  return filteredNodes;
}

/*
 * The aria selectors are on the form '<computed name>&<computed role>'.
 * The following examples showcase how the syntax works wrt. querying:
 * - 'title&heading' queries for elements with computed name 'title' and role 'heading'.
 * - '&img' queries for elements with role 'img' and any name.
 * - 'label' queries for elements with name 'label' and any role.
 */
function parseAriaSelector(selector: string): { name?: string; role?: string } {
  const s = selector.split('&');
  const name = s[0] || undefined;
  const role = s.length > 1 ? s[1] : undefined;
  return { name, role };
}

const queryOne = async (element: ElementHandle, selector: string) => {
  const exeCtx = element.executionContext();
  const { name, role } = parseAriaSelector(selector);
  const res = await queryAXTree(exeCtx._client, element, name, role);
  if (res.length < 1) {
    return null;
  }
  const handle = await exeCtx._adoptBackendNodeId(res[0].backendDOMNodeId);
  return handle;
};

const queryAll = async (element: ElementHandle, selector: string) => {
  const exeCtx = element.executionContext();
  const { name, role } = parseAriaSelector(selector);
  const res = await queryAXTree(exeCtx._client, element, name, role);
  const resHandles = Promise.all(
    res.map((axNode) => exeCtx._adoptBackendNodeId(axNode.backendDOMNodeId))
  );
  return resHandles;
};

// If multiple waitFor are set up asynchronously, we need to wait for the first
// one to set up the binding in the page before running the others.
let settingUpBinding = null;

async function addHandlerToWorld(domWorld: DOMWorld) {
  if (settingUpBinding) {
    await settingUpBinding;
  }
  if (!domWorld.hasBinding('ariaQuerySelector')) {
    let done: () => void | null = null;
    settingUpBinding = new Promise((resolve) => {
      done = resolve;
    });
    await domWorld.addBinding('ariaQuerySelector', async (selector: string) => {
      const document = await domWorld._document();
      const element = await queryOne(document, selector);
      return element;
    });
    done();
    settingUpBinding = null;
  }
}

/**
 * @internal
 */
export const ariaHandler: InternalQueryHandler = {
  queryOne,
  waitFor: async (domWorld, selector, options) => {
    await addHandlerToWorld(domWorld);
    return domWorld.waitForSelectorInPage(
      (_: Element, selector: string) => globalThis.ariaQuerySelector(selector),
      selector,
      options
    );
  },
  queryAll,
  queryAllArray: async (element, selector) => {
    const elementHandles = await queryAll(element, selector);
    const exeCtx = element.executionContext();
    const jsHandle = exeCtx.evaluateHandle(
      (...elements) => Array.from(elements),
      ...elementHandles
    );
    return jsHandle;
  },
};
