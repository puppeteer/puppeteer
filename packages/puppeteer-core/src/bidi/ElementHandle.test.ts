/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import expect from 'expect';
import type * as Bidi from 'webdriver-bidi-protocol';

import {Accessibility} from '../cdp/Accessibility.js';
import {EventEmitter} from '../common/EventEmitter.js';
import {TimeoutSettings} from '../common/TimeoutSettings.js';

import type {WindowRealm} from './core/Realm.js';
import {BidiElementHandle} from './ElementHandle.js';
import type {BidiFrame} from './Frame.js';
import {BidiFrameRealm} from './Realm.js';

const noopLogger = () => {
  return undefined;
};

function createTestRealms() {
  const cdpCalls: Array<{method: string; params: Record<string, unknown>}> = [];
  const disownedHandles: string[][] = [];
  let callFunctionCount = 0;

  const frame = {
    _id: 'frame-1',
    timeoutSettings: new TimeoutSettings(),
    clearDocumentHandle() {},
    mainRealm(): BidiFrameRealm {
      return mainRealm;
    },
    isolatedRealm(): BidiFrameRealm {
      return isolatedRealm;
    },
    page() {
      return {
        browser() {
          return {cdpSupported: true};
        },
      };
    },
    client: {
      async send(method: string, params: Record<string, unknown>) {
        cdpCalls.push({method, params});
        if (method === 'DOM.describeNode') {
          return {node: {backendNodeId: 42}};
        }
        if (method === 'Accessibility.getFullAXTree') {
          return {
            nodes: [
              {
                nodeId: 'ax-root',
                ignored: false,
                role: {type: 'role', value: 'RootWebArea'},
                childIds: ['ax-btn'],
              },
              {
                nodeId: 'ax-btn',
                ignored: false,
                backendDOMNodeId: 42,
                role: {type: 'role', value: 'button'},
                name: {type: 'computedString', value: 'Submit'},
                childIds: [],
              },
            ],
          };
        }
        return {};
      },
    },
  } as unknown as BidiFrame;

  const makeWindowRealm = () => {
    return Object.assign(new EventEmitter(), {
      disposed: false,
      async callFunction(): Promise<Bidi.Script.EvaluateResult> {
        callFunctionCount++;
        return {
          type: 'success',
          realm: 'realm-1',
          result: {
            type: 'node',
            sharedId: 'shared-1',
            handle: 'temp-object-id-1',
            value: {nodeType: 1, childNodeCount: 0},
          },
        };
      },
      async disown(handles: string[]) {
        disownedHandles.push(handles);
      },
    }) as unknown as WindowRealm;
  };

  const mainRealm = BidiFrameRealm.from(makeWindowRealm(), frame, noopLogger);
  const isolatedRealm = BidiFrameRealm.from(
    makeWindowRealm(),
    frame,
    noopLogger,
  );
  return {
    realm1: mainRealm,
    realm2: isolatedRealm,
    cdpCalls,
    disownedHandles,
    getCallFunctionCount() {
      return callFunctionCount;
    },
  };
}

describe('BidiElementHandle and BidiFrameRealm', () => {
  it('lazily materializes an objectId for backendNodeId and autofill on sharedId-only handles', async () => {
    const {realm1, cdpCalls, disownedHandles} = createTestRealms();
    const sharedOnlyNode: Bidi.Script.NodeRemoteValue = {
      type: 'node',
      sharedId: 'shared-1',
      value: {nodeType: 1, childNodeCount: 0},
    };

    const element = BidiElementHandle.from(sharedOnlyNode, realm1);
    expect(element.handle.id).toBeUndefined();

    const backendId = await element.backendNodeId();
    expect(backendId).toBe(42);
    expect(cdpCalls).toEqual([
      {method: 'DOM.describeNode', params: {objectId: 'temp-object-id-1'}},
    ]);
    expect(disownedHandles).toEqual([['temp-object-id-1']]);

    cdpCalls.length = 0;
    disownedHandles.length = 0;

    await element.autofill({
      address: {fields: [{name: 'ADDRESS_HOME_CITY', value: 'London'}]},
    });
    expect(cdpCalls).toEqual([
      {method: 'DOM.describeNode', params: {objectId: 'temp-object-id-1'}},
      {
        method: 'Autofill.trigger',
        params: {
          fieldId: 42,
          frameId: 'frame-1',
          card: undefined,
          address: {fields: [{name: 'ADDRESS_HOME_CITY', value: 'London'}]},
        },
      },
    ]);
    expect(disownedHandles).toEqual([['temp-object-id-1']]);
  });

  it('adopts live sharedId-only handles directly but rejects disposed handles', async () => {
    const {realm1, realm2} = createTestRealms();
    const sharedOnlyNode: Bidi.Script.NodeRemoteValue = {
      type: 'node',
      sharedId: 'shared-1',
      value: {nodeType: 1, childNodeCount: 0},
    };

    const liveHandle = BidiElementHandle.from(sharedOnlyNode, realm1);
    const adopted = await realm2.adoptHandle(liveHandle);
    expect(adopted.realm).toBe(realm2);
    expect(adopted.disposed).toBe(false);

    await liveHandle.dispose();
    expect(liveHandle.disposed).toBe(true);
    await expect(realm2.adoptHandle(liveHandle)).rejects.toThrow(
      'JSHandle is disposed',
    );
  });

  it('adopts handles with both handle and sharedId without a BiDi round trip or disowning source handle', async () => {
    const {realm1, realm2, disownedHandles, getCallFunctionCount} =
      createTestRealms();
    const nodeWithHandle: Bidi.Script.NodeRemoteValue = {
      type: 'node',
      sharedId: 'shared-1',
      handle: 'main-handle-1',
      value: {nodeType: 1, childNodeCount: 0},
    };

    const mainHandle = BidiElementHandle.from(nodeWithHandle, realm1);
    const adopted = await realm2.adoptHandle(mainHandle);

    expect(getCallFunctionCount()).toBe(0);
    expect(adopted.realm).toBe(realm2);
    expect(adopted.id).toBeUndefined();
    expect(adopted.remoteValue()).toEqual({
      type: 'node',
      sharedId: 'shared-1',
      value: {nodeType: 1, childNodeCount: 0},
    });

    await adopted.dispose();
    expect(disownedHandles).toEqual([]);
    expect(mainHandle.disposed).toBe(false);

    await mainHandle.dispose();
    expect(disownedHandles).toEqual([['main-handle-1']]);
  });

  it('transfers isolated handles to main realm via sharedId with zero round trips while preserving isolatedHandle ownership', async () => {
    const {realm1, realm2, cdpCalls, disownedHandles, getCallFunctionCount} =
      createTestRealms();
    const isolatedNode: Bidi.Script.NodeRemoteValue = {
      type: 'node',
      sharedId: 'shared-1',
      handle: 'isolated-handle-1',
      value: {nodeType: 1, childNodeCount: 0},
    };

    const isolatedHandle = BidiElementHandle.from(isolatedNode, realm2);
    const mainHandle = await realm1.transferHandle(isolatedHandle);

    expect(getCallFunctionCount()).toBe(0);
    expect(disownedHandles).toEqual([]);
    expect(mainHandle.realm).toBe(realm1);
    expect(mainHandle.id).toBeUndefined();
    expect(mainHandle.isolatedHandle).toBe(isolatedHandle);

    // backendNodeId() reuses isolatedHandle.id without materializing a temporary handle
    const backendId = await mainHandle.backendNodeId();
    expect(backendId).toBe(42);
    expect(getCallFunctionCount()).toBe(0);
    expect(cdpCalls).toEqual([
      {method: 'DOM.describeNode', params: {objectId: 'isolated-handle-1'}},
    ]);

    await mainHandle.dispose();
    expect(mainHandle.disposed).toBe(true);
    expect(isolatedHandle.disposed).toBe(true);
    expect(disownedHandles).toEqual([['isolated-handle-1']]);
  });

  it('supports Accessibility.snapshot({root}) with sharedId-only handles', async () => {
    const {realm1, disownedHandles} = createTestRealms();
    const sharedOnlyNode: Bidi.Script.NodeRemoteValue = {
      type: 'node',
      sharedId: 'shared-1',
      value: {nodeType: 1, childNodeCount: 0},
    };

    const element = BidiElementHandle.from(sharedOnlyNode, realm1);
    const accessibility = new Accessibility(realm1, 'frame-1');
    const snapshot = await accessibility.snapshot({root: element});

    expect(snapshot).toMatchObject({
      role: 'button',
      name: 'Submit',
      backendNodeId: 42,
    });
    expect(disownedHandles).toEqual([['temp-object-id-1']]);
  });
});
