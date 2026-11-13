/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import expect from 'expect';

import type {CDPSession} from '../api/CDPSession.js';
import {EventEmitter} from '../common/EventEmitter.js';
import {TimeoutSettings} from '../common/TimeoutSettings.js';

import {CdpElementHandle} from './ElementHandle.js';
import {ExecutionContext} from './ExecutionContext.js';
import type {CdpFrame} from './Frame.js';
import {IsolatedWorld} from './IsolatedWorld.js';
import {MAIN_WORLD, PUPPETEER_WORLD} from './IsolatedWorlds.js';

const noopLogger = () => {
  return undefined;
};

function createTestWorlds() {
  const cdpCalls: Array<{method: string; params?: Record<string, unknown>}> =
    [];
  let nextObjectCounter = 1;

  const client = Object.assign(new EventEmitter(), {
    async send(method: string, params?: Record<string, unknown>) {
      cdpCalls.push({method, params});
      if (
        method === 'Runtime.evaluate' ||
        method === 'Runtime.callFunctionOn'
      ) {
        if (params?.['returnByValue']) {
          return {result: {type: 'number', value: 123}};
        }
        const contextId =
          params?.['contextId'] ?? params?.['executionContextId'] ?? 1;
        return {
          result: {
            type: 'object',
            subtype: 'node',
            className: 'HTMLButtonElement',
            description: 'button',
            objectId: `ctx-${contextId}-obj-${nextObjectCounter++}`,
            deepSerializedValue: {
              type: 'node',
              value: {
                nodeType: 1,
                backendNodeId: 77,
              },
            },
          },
        };
      }
      if (method === 'DOM.resolveNode') {
        const contextId = params?.['executionContextId'] ?? 1;
        return {
          object: {
            type: 'object',
            subtype: 'node',
            className: 'HTMLButtonElement',
            description: 'button',
            objectId: `ctx-${contextId}-resolved-${nextObjectCounter++}`,
          },
        };
      }
      if (method === 'DOM.describeNode') {
        return {node: {backendNodeId: 99}};
      }
      return {};
    },
  }) as unknown as CDPSession;

  const frame = {
    _id: 'frame-1',
    client,
    url() {
      return 'https://example.com';
    },
    clearDocumentHandle() {},
    mainRealm(): IsolatedWorld {
      return mainWorld;
    },
    isolatedRealm(): IsolatedWorld {
      return isolatedWorld;
    },
  } as unknown as CdpFrame;

  const timeoutSettings = new TimeoutSettings();
  const mainWorld = new IsolatedWorld(
    frame,
    timeoutSettings,
    MAIN_WORLD,
    noopLogger,
  );
  const isolatedWorld = new IsolatedWorld(
    frame,
    timeoutSettings,
    PUPPETEER_WORLD,
    noopLogger,
  );

  mainWorld.setContext(
    new ExecutionContext(
      client,
      {id: 1, origin: 'https://example.com', name: '', uniqueId: 'u1'},
      mainWorld,
      noopLogger,
    ),
  );
  isolatedWorld.setContext(
    new ExecutionContext(
      client,
      {
        id: 2,
        origin: 'https://example.com',
        name: '__puppeteer_utility_world__',
        uniqueId: 'u2',
      },
      isolatedWorld,
      noopLogger,
    ),
  );

  return {mainWorld, isolatedWorld, cdpCalls};
}

describe('IsolatedWorld and CdpElementHandle node adoption', () => {
  it('captures backendNodeId via deep serialization options and skips DOM.describeNode on adoptHandle', async () => {
    const {mainWorld, isolatedWorld, cdpCalls} = createTestWorlds();

    const handle = (await mainWorld.evaluateHandle(() => {
      return document.body;
    })) as CdpElementHandle<HTMLElement>;
    expect(handle).toBeInstanceOf(CdpElementHandle);

    expect(cdpCalls).toHaveLength(1);
    expect(cdpCalls[0]).toMatchObject({
      method: 'Runtime.callFunctionOn',
      params: {
        serializationOptions: {
          serialization: 'deep',
          maxDepth: 0,
          additionalParameters: {maxNodeDepth: 0},
        },
      },
    });
    expect(handle.remoteObject().deepSerializedValue).toBeUndefined();
    expect(handle.cachedBackendNodeId).toBe(77);

    cdpCalls.length = 0;

    const adopted = await isolatedWorld.adoptHandle(handle);
    expect(cdpCalls).toEqual([
      {
        method: 'DOM.resolveNode',
        params: {backendNodeId: 77, executionContextId: 2},
      },
    ]);
    expect(adopted.cachedBackendNodeId).toBe(77);
  });

  it('retains isolatedHandle during transferHandle and skips DOM.describeNode', async () => {
    const {mainWorld, isolatedWorld, cdpCalls} = createTestWorlds();

    const isolatedHandle = (await isolatedWorld.evaluateHandle(() => {
      return document.body;
    })) as CdpElementHandle<HTMLElement>;
    cdpCalls.length = 0;

    const mainHandle = await mainWorld.transferHandle(isolatedHandle);

    expect(cdpCalls).toEqual([
      {
        method: 'DOM.resolveNode',
        params: {backendNodeId: 77, executionContextId: 1},
      },
    ]);
    expect(mainHandle.isolatedHandle).toBe(isolatedHandle);
    expect(isolatedHandle.disposed).toBe(false);
    expect(mainHandle.cachedBackendNodeId).toBe(77);

    cdpCalls.length = 0;
    await mainHandle.dispose();
    expect(mainHandle.disposed).toBe(true);
    expect(isolatedHandle.disposed).toBe(true);
    expect(cdpCalls).toEqual([
      {method: 'Runtime.releaseObject', params: {objectId: mainHandle.id}},
      {method: 'Runtime.releaseObject', params: {objectId: isolatedHandle.id}},
    ]);
  });

  it('rejects disposed handles in adoptHandle and transferHandle', async () => {
    const {mainWorld, isolatedWorld} = createTestWorlds();

    const handle = (await isolatedWorld.evaluateHandle(() => {
      return document.body;
    })) as CdpElementHandle<HTMLElement>;
    await handle.dispose();

    await expect(mainWorld.adoptHandle(handle)).rejects.toThrow(
      'JSHandle is disposed',
    );
    await expect(mainWorld.transferHandle(handle)).rejects.toThrow(
      'JSHandle is disposed',
    );
  });
});
