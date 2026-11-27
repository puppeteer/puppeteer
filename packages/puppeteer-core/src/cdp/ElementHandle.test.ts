/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {afterEach, beforeEach, describe, it} from 'node:test';

import type {Protocol} from 'devtools-protocol';
import expect from 'expect';
import sinon from 'sinon';

import type {CDPSession} from '../api/CDPSession.js';
import {EventEmitter} from '../common/EventEmitter.js';
import {TimeoutSettings} from '../common/TimeoutSettings.js';
import {AsyncIterableUtil} from '../util/AsyncIterableUtil.js';
import {Deferred} from '../util/Deferred.js';
import {disposeSymbol} from '../util/disposable.js';

import type {CdpElementHandle} from './ElementHandle.js';
import type {ExecutionContext} from './ExecutionContext.js';
import type {CdpFrame} from './Frame.js';
import {IsolatedWorld} from './IsolatedWorld.js';
import {MAIN_WORLD, PUPPETEER_WORLD} from './IsolatedWorlds.js';

function createContext(id: number): ExecutionContext {
  return Object.assign(new EventEmitter(), {
    id,
    [disposeSymbol]: sinon.stub(),
  }) as unknown as ExecutionContext;
}

function createTestWorlds(frameId = 'frame-1') {
  const clientSend = sinon.stub().resolves({});
  clientSend
    .withArgs('DOM.describeNode')
    .resolves({node: {backendNodeId: 42, frameId: 'child-frame'}});
  clientSend
    .withArgs('DOM.resolveNode')
    .callsFake(
      async (
        _method: string,
        params: Protocol.DOM.ResolveNodeRequest,
      ): Promise<Protocol.DOM.ResolveNodeResponse> => {
        return {
          object: {
            type: 'object',
            subtype: 'node',
            objectId: `obj-${params.executionContextId}-${params.backendNodeId}`,
          },
        };
      },
    );

  const client = {send: clientSend} as unknown as CDPSession;
  const childFrame = {_id: 'child-frame'} as unknown as CdpFrame;
  const frame = {
    _id: frameId,
    _frameManager: {
      frame: sinon.stub().withArgs('child-frame').returns(childFrame),
    },
    client,
    url: sinon.stub().returns('https://example.com'),
    clearDocumentHandle: sinon.stub(),
  } as unknown as CdpFrame;

  const logger = sinon.stub();
  const timeoutSettings = new TimeoutSettings();
  const mainWorld = new IsolatedWorld(
    frame,
    timeoutSettings,
    MAIN_WORLD,
    logger,
  );
  const isolatedWorld = new IsolatedWorld(
    frame,
    timeoutSettings,
    PUPPETEER_WORLD,
    logger,
  );
  mainWorld.setContext(createContext(1));
  isolatedWorld.setContext(createContext(2));

  return {
    frame,
    childFrame,
    client,
    clientSend,
    mainWorld,
    isolatedWorld,
  };
}

describe('CdpElementHandle and IsolatedWorld', () => {
  let clientSend: sinon.SinonStub;
  let mainWorld: IsolatedWorld;
  let isolatedWorld: IsolatedWorld;
  let childFrame: CdpFrame;

  beforeEach(() => {
    ({clientSend, mainWorld, isolatedWorld, childFrame} = createTestWorlds());
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('backendNodeId caching and adoption', () => {
    it('seeds backendNodeId in adoptBackendNode and skips DOM.describeNode on adoptHandle and autofill', async () => {
      const handle = (await mainWorld.adoptBackendNode(
        99,
      )) as CdpElementHandle<Element>;

      sinon.assert.calledOnceWithExactly(clientSend, 'DOM.resolveNode', {
        backendNodeId: 99,
        executionContextId: 1,
      });
      sinon.resetHistory();

      expect(await handle.backendNodeId()).toBe(99);
      const adopted = await isolatedWorld.adoptHandle(handle);
      expect(await adopted.backendNodeId()).toBe(99);
      await adopted.autofill({
        address: {fields: [{name: 'ADDRESS_HOME_CITY', value: 'London'}]},
      });

      sinon.assert.neverCalledWith(clientSend, 'DOM.describeNode');
      sinon.assert.calledWithExactly(clientSend.firstCall, 'DOM.resolveNode', {
        backendNodeId: 99,
        executionContextId: 2,
      });
      sinon.assert.calledWithExactly(
        clientSend.secondCall,
        'Autofill.trigger',
        {
          fieldId: 99,
          frameId: 'frame-1',
          card: undefined,
          address: {fields: [{name: 'ADDRESS_HOME_CITY', value: 'London'}]},
        },
      );
    });

    it('caches backendNodeId on both source and target handles on first adoptHandle', async () => {
      const handle = mainWorld.createCdpHandle({
        type: 'object',
        subtype: 'node',
        objectId: 'obj-1-initial',
      }) as CdpElementHandle<Element>;

      const adopted = await isolatedWorld.adoptHandle(handle);
      sinon.assert.callCount(clientSend, 2);
      sinon.assert.calledWithExactly(clientSend.firstCall, 'DOM.describeNode', {
        objectId: 'obj-1-initial',
      });
      sinon.assert.calledWithExactly(clientSend.secondCall, 'DOM.resolveNode', {
        backendNodeId: 42,
        executionContextId: 2,
      });

      sinon.resetHistory();
      expect(await handle.backendNodeId()).toBe(42);
      expect(await adopted.backendNodeId()).toBe(42);
      sinon.assert.notCalled(clientSend);
    });

    it('reuses cached backendNodeId in transferHandle and disposes the source handle', async () => {
      const source = (await isolatedWorld.adoptBackendNode(
        77,
      )) as CdpElementHandle<Element>;
      sinon.resetHistory();

      const transferred = await mainWorld.transferHandle(source);

      expect(source.disposed).toBe(true);
      expect(transferred.realm).toBe(mainWorld);
      sinon.assert.neverCalledWith(clientSend, 'DOM.describeNode');
      sinon.assert.callCount(clientSend, 2);
      sinon.assert.calledWithExactly(clientSend.firstCall, 'DOM.resolveNode', {
        backendNodeId: 77,
        executionContextId: 1,
      });
      sinon.assert.calledWithExactly(
        clientSend.secondCall,
        'Runtime.releaseObject',
        {objectId: 'obj-2-77'},
      );

      sinon.resetHistory();
      expect(await transferred.backendNodeId()).toBe(77);
      sinon.assert.notCalled(clientSend);
    });

    it('falls back to DOM.describeNode on target session for cross-session handles', async () => {
      const other = createTestWorlds('oopif-frame');
      const otherHandle = (await other.mainWorld.adoptBackendNode(
        99,
      )) as CdpElementHandle<Element>;
      sinon.resetHistory();

      await mainWorld.adoptHandle(otherHandle);

      sinon.assert.calledWithExactly(clientSend.firstCall, 'DOM.describeNode', {
        objectId: 'obj-1-99',
      });
      sinon.assert.calledWithExactly(clientSend.secondCall, 'DOM.resolveNode', {
        backendNodeId: 42,
        executionContextId: 1,
      });
    });

    it('rejects disposed handles without issuing CDP calls', async () => {
      const handle = (await mainWorld.adoptBackendNode(
        55,
      )) as CdpElementHandle<Element>;
      await handle.dispose();
      sinon.resetHistory();

      expect(() => {
        return handle.backendNodeId();
      }).toThrow('Attempted to use disposed CdpElementHandle.');
      await expect(isolatedWorld.adoptHandle(handle)).rejects.toThrow(
        'Attempted to use disposed CdpElementHandle.',
      );
      await expect(isolatedWorld.transferHandle(handle)).rejects.toThrow(
        'Attempted to use disposed CdpElementHandle.',
      );
      sinon.assert.notCalled(clientSend);
    });

    it('populates cached backendNodeId from contentFrame', async () => {
      const handle = mainWorld.createCdpHandle({
        type: 'object',
        subtype: 'node',
        objectId: 'obj-iframe',
      }) as CdpElementHandle<HTMLIFrameElement>;

      expect(await handle.contentFrame()).toBe(childFrame);
      sinon.assert.calledOnceWithExactly(clientSend, 'DOM.describeNode', {
        objectId: 'obj-iframe',
      });

      sinon.resetHistory();
      expect(await handle.backendNodeId()).toBe(42);
      sinon.assert.notCalled(clientSend);
    });
  });

  describe('queryAXTree', () => {
    const makeAxNodes = (ids: number[]) => {
      return ids.map(id => {
        return {
          nodeId: `ax-${id}`,
          ignored: false,
          role: {type: 'role', value: 'button'},
          backendDOMNodeId: id,
        };
      });
    };

    it('resolves only the first match for single-element queries', async () => {
      clientSend
        .withArgs('Accessibility.queryAXTree')
        .resolves({nodes: makeAxNodes([10, 11, 12, 13])});
      const root = mainWorld.createCdpHandle({
        type: 'object',
        subtype: 'node',
        objectId: 'doc-1',
      }) as CdpElementHandle<Element>;

      const first = (await AsyncIterableUtil.first(
        root.queryAXTree(undefined, 'button'),
      )) as CdpElementHandle<Element>;

      expect(first.id).toBe('obj-1-10');
      sinon.assert.callCount(clientSend, 2);
      sinon.assert.calledWithExactly(
        clientSend.firstCall,
        'Accessibility.queryAXTree',
        {objectId: 'doc-1', accessibleName: undefined, role: 'button'},
      );
      sinon.assert.calledWithExactly(clientSend.secondCall, 'DOM.resolveNode', {
        backendNodeId: 10,
        executionContextId: 1,
      });

      sinon.resetHistory();
      expect(await first.backendNodeId()).toBe(10);
      sinon.assert.notCalled(clientSend);
    });

    it('pipelines remaining DOM.resolveNode calls concurrently in batches', async () => {
      clientSend
        .withArgs('Accessibility.queryAXTree')
        .resolves({nodes: makeAxNodes([1, 2, 3, 4])});

      const gates = new Map<number, Deferred<void>>([
        [2, Deferred.create<void>()],
        [3, Deferred.create<void>()],
        [4, Deferred.create<void>()],
      ]);
      const started: number[] = [];

      clientSend
        .withArgs('DOM.resolveNode')
        .callsFake(
          async (_method: string, params: Protocol.DOM.ResolveNodeRequest) => {
            const id = params.backendNodeId!;
            started.push(id);
            const gate = gates.get(id);
            if (gate) {
              await gate.valueOrThrow();
            }
            return {
              object: {
                type: 'object',
                subtype: 'node',
                objectId: `obj-1-${id}`,
              },
            };
          },
        );

      const root = mainWorld.createCdpHandle({
        type: 'object',
        subtype: 'node',
        objectId: 'doc-1',
      }) as CdpElementHandle<Element>;

      const collectPromise = AsyncIterableUtil.collect(
        root.queryAXTree(undefined, 'button'),
      );

      // Wait until the first item yields and the batch fires concurrently.
      await new Promise(resolve => {
        setTimeout(resolve, 0);
      });
      expect(started).toEqual([1, 2, 3, 4]);

      for (const gate of gates.values()) {
        gate.resolve();
      }
      const handles = await collectPromise;
      expect(
        handles.map(handle => {
          return handle.id;
        }),
      ).toEqual(['obj-1-1', 'obj-1-2', 'obj-1-3', 'obj-1-4']);
    });

    it('disposes unconsumed handles when breaking out of a batch early', async () => {
      clientSend
        .withArgs('Accessibility.queryAXTree')
        .resolves({nodes: makeAxNodes([1, 2, 3, 4])});
      const root = mainWorld.createCdpHandle({
        type: 'object',
        subtype: 'node',
        objectId: 'doc-1',
      }) as CdpElementHandle<Element>;

      const taken: string[] = [];
      // Keep consumed handles undisposed to verify only unconsumed ones release.
      // eslint-disable-next-line @puppeteer/use-using
      for await (const handle of root.queryAXTree(undefined, 'button')) {
        taken.push(handle.id!);
        if (taken.length === 2) {
          break;
        }
      }

      // Let fire-and-forget dispose calls settle.
      await new Promise(resolve => {
        setTimeout(resolve, 0);
      });

      expect(taken).toEqual(['obj-1-1', 'obj-1-2']);
      const released = clientSend
        .getCalls()
        .filter(call => {
          return call.args[0] === 'Runtime.releaseObject';
        })
        .map(call => {
          return (call.args[1] as Protocol.Runtime.ReleaseObjectRequest)
            .objectId;
        });
      expect(released).toEqual(['obj-1-3', 'obj-1-4']);
    });

    it('disposes resolved handles in a batch when another node in the batch fails', async () => {
      clientSend
        .withArgs('Accessibility.queryAXTree')
        .resolves({nodes: makeAxNodes([1, 2, 3, 4])});
      clientSend
        .withArgs('DOM.resolveNode')
        .callsFake(
          async (_method: string, params: Protocol.DOM.ResolveNodeRequest) => {
            if (params.backendNodeId === 3) {
              throw new Error('No node with given id found');
            }
            return {
              object: {
                type: 'object',
                subtype: 'node',
                objectId: `obj-1-${params.backendNodeId}`,
              },
            };
          },
        );
      const root = mainWorld.createCdpHandle({
        type: 'object',
        subtype: 'node',
        objectId: 'doc-1',
      }) as CdpElementHandle<Element>;

      await expect(
        AsyncIterableUtil.collect(root.queryAXTree(undefined, 'button')),
      ).rejects.toThrow('No node with given id found');

      await new Promise(resolve => {
        setTimeout(resolve, 0);
      });

      // Node 2 was yielded to collect(), node 3 failed, and node 4 must be disposed.
      const released = clientSend
        .getCalls()
        .filter(call => {
          return call.args[0] === 'Runtime.releaseObject';
        })
        .map(call => {
          return (call.args[1] as Protocol.Runtime.ReleaseObjectRequest)
            .objectId;
        });
      expect(released).toEqual(['obj-1-4']);
    });
  });
});
