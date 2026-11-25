/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {afterEach, beforeEach, describe, it} from 'node:test';

import expect from 'expect';
import sinon from 'sinon';
import type * as Bidi from 'webdriver-bidi-protocol';

import {Accessibility} from '../cdp/Accessibility.js';
import {EventEmitter} from '../common/EventEmitter.js';
import {TimeoutSettings} from '../common/TimeoutSettings.js';

import type {WindowRealm} from './core/Realm.js';
import {BidiElementHandle} from './ElementHandle.js';
import type {BidiFrame} from './Frame.js';
import {BidiFrameRealm} from './Realm.js';

const SHARED_ONLY_NODE: Bidi.Script.NodeRemoteValue = {
  type: 'node',
  sharedId: 'shared-1',
  value: {nodeType: 1, childNodeCount: 0},
};

const MATERIALIZED_EVAL_RESULT: Bidi.Script.EvaluateResultSuccess = {
  type: 'success',
  realm: 'realm-1',
  result: {
    type: 'node',
    sharedId: 'shared-1',
    handle: 'temp-object-id-1',
    value: {nodeType: 1, childNodeCount: 0},
  },
};

const AX_TREE_NODES = [
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
];

type StubWindowRealm = WindowRealm & {
  callFunction: sinon.SinonStub;
  disown: sinon.SinonStub;
};

function createWindowRealm(): StubWindowRealm {
  return Object.assign(new EventEmitter(), {
    disposed: false,
    callFunction: sinon.stub().resolves(MATERIALIZED_EVAL_RESULT),
    disown: sinon.stub().resolves(),
  }) as unknown as StubWindowRealm;
}

function createTestRealms(frameId = 'frame-1') {
  const clientSend = sinon.stub().resolves({});
  clientSend.withArgs('DOM.describeNode').resolves({node: {backendNodeId: 42}});
  clientSend
    .withArgs('Accessibility.getFullAXTree')
    .resolves({nodes: AX_TREE_NODES});

  const frame = {
    _id: frameId,
    timeoutSettings: new TimeoutSettings(),
    clearDocumentHandle: sinon.stub(),
    page: sinon.stub().returns({
      browser: sinon.stub().returns({cdpSupported: true}),
    }),
    client: {send: clientSend},
  } as unknown as BidiFrame;

  const logger = sinon.stub();
  const windowRealm1 = createWindowRealm();
  const windowRealm2 = createWindowRealm();
  const realm1 = BidiFrameRealm.from(windowRealm1, frame, logger);
  const realm2 = BidiFrameRealm.from(windowRealm2, frame, logger);

  return {
    realm1,
    realm2,
    windowRealm1,
    windowRealm2,
    clientSend,
  };
}

describe('BidiElementHandle and BidiFrameRealm', () => {
  let realm1: BidiFrameRealm;
  let realm2: BidiFrameRealm;
  let windowRealm1: StubWindowRealm;
  let windowRealm2: StubWindowRealm;
  let clientSend: sinon.SinonStub;

  beforeEach(() => {
    ({realm1, realm2, windowRealm1, windowRealm2, clientSend} =
      createTestRealms());
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('backendNodeId and autofill', () => {
    it('lazily materializes objectId for sharedId-only handles and disowns the temporary handle', async () => {
      const element = BidiElementHandle.from(SHARED_ONLY_NODE, realm1);
      expect(element.handle.id).toBeUndefined();

      expect(await element.backendNodeId()).toBe(42);
      sinon.assert.calledOnceWithExactly(clientSend, 'DOM.describeNode', {
        objectId: 'temp-object-id-1',
      });
      sinon.assert.calledOnceWithExactly(windowRealm1.disown, [
        'temp-object-id-1',
      ]);
    });

    it('reuses cached backendNodeId in autofill without re-materializing', async () => {
      const element = BidiElementHandle.from(SHARED_ONLY_NODE, realm1);

      expect(await element.backendNodeId()).toBe(42);
      sinon.resetHistory();

      await element.autofill({
        address: {fields: [{name: 'ADDRESS_HOME_CITY', value: 'London'}]},
      });

      sinon.assert.notCalled(windowRealm1.callFunction);
      sinon.assert.notCalled(windowRealm1.disown);
      sinon.assert.calledOnceWithExactly(clientSend, 'Autofill.trigger', {
        fieldId: 42,
        frameId: 'frame-1',
        card: undefined,
        address: {fields: [{name: 'ADDRESS_HOME_CITY', value: 'London'}]},
      });
    });

    it('materializes and disowns when autofill is called on a fresh sharedId-only handle', async () => {
      const element = BidiElementHandle.from(SHARED_ONLY_NODE, realm1);

      await element.autofill({
        address: {fields: [{name: 'ADDRESS_HOME_CITY', value: 'Paris'}]},
      });

      sinon.assert.callCount(clientSend, 2);
      sinon.assert.calledWithExactly(clientSend.firstCall, 'DOM.describeNode', {
        objectId: 'temp-object-id-1',
      });
      sinon.assert.calledWithExactly(
        clientSend.secondCall,
        'Autofill.trigger',
        {
          fieldId: 42,
          frameId: 'frame-1',
          card: undefined,
          address: {fields: [{name: 'ADDRESS_HOME_CITY', value: 'Paris'}]},
        },
      );
      sinon.assert.calledOnceWithExactly(windowRealm1.disown, [
        'temp-object-id-1',
      ]);
    });
  });

  describe('adoptHandle', () => {
    it('adopts live sharedId-only handles in the same frame without calling callFunction', async () => {
      const liveHandle = BidiElementHandle.from(SHARED_ONLY_NODE, realm1);

      const adopted = await realm2.adoptHandle(liveHandle);

      expect(adopted.realm).toBe(realm2);
      expect(adopted.disposed).toBe(false);
      sinon.assert.notCalled(windowRealm2.callFunction);
    });

    it('falls back to callFunction for handles without sharedId', async () => {
      const windowHandle = BidiElementHandle.from(
        {type: 'window', value: {context: 'frame-1'}},
        realm1,
      );

      await realm2.adoptHandle(windowHandle);

      sinon.assert.calledOnce(windowRealm2.callFunction);
    });

    it('falls back and rejects when adopting into a disposed target realm', async () => {
      sinon.stub(windowRealm2, 'disposed').value(true);
      windowRealm2.callFunction.rejects(new Error('Realm is disposed'));
      const liveHandle = BidiElementHandle.from(SHARED_ONLY_NODE, realm1);

      await expect(realm2.adoptHandle(liveHandle)).rejects.toThrow(
        'Realm is disposed',
      );
      sinon.assert.calledOnce(windowRealm2.callFunction);
    });

    it('rejects when adopting a disposed handle', async () => {
      const liveHandle = BidiElementHandle.from(SHARED_ONLY_NODE, realm1);
      await liveHandle.dispose();

      expect(liveHandle.disposed).toBe(true);
      await expect(realm2.adoptHandle(liveHandle)).rejects.toThrow(
        'JSHandle is disposed',
      );
      sinon.assert.notCalled(windowRealm2.callFunction);
    });
  });

  describe('Accessibility.snapshot', () => {
    it('supports sharedId-only root handles and disowns the temporary handle', async () => {
      const element = BidiElementHandle.from(SHARED_ONLY_NODE, realm1);
      const accessibility = new Accessibility(realm1, 'frame-1');

      const snapshot = await accessibility.snapshot({root: element});

      expect(snapshot).toMatchObject({
        role: 'button',
        name: 'Submit',
        backendNodeId: 42,
      });
      sinon.assert.calledOnceWithExactly(windowRealm1.disown, [
        'temp-object-id-1',
      ]);
    });

    it('returns null for a cross-frame root handle to prevent backendNodeId collisions', async () => {
      const {realm1: otherFrameRealm, windowRealm1: otherWindowRealm} =
        createTestRealms('frame-2');
      const otherFrameElement = BidiElementHandle.from(
        SHARED_ONLY_NODE,
        otherFrameRealm,
      );
      const accessibility = new Accessibility(realm1, 'frame-1');

      expect(
        await accessibility.snapshot({root: otherFrameElement}),
      ).toBeNull();
      sinon.assert.notCalled(otherWindowRealm.callFunction);
    });

    it('rejects for a disposed root handle', async () => {
      const element = BidiElementHandle.from(SHARED_ONLY_NODE, realm1);
      await element.dispose();
      const accessibility = new Accessibility(realm1, 'frame-1');

      await expect(accessibility.snapshot({root: element})).rejects.toThrow(
        'Attempted to use disposed BidiElementHandle.',
      );
    });
  });
});
