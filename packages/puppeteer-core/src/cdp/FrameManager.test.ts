/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import expect from 'expect';

import type {CDPSessionEvents} from '../api/CDPSession.js';
import {EventEmitter} from '../common/EventEmitter.js';
import {TimeoutSettings} from '../common/TimeoutSettings.js';

import type {CdpCDPSession} from './CdpSession.js';
import {FrameManager} from './FrameManager.js';
import {FrameManagerEvent} from './FrameManagerEvents.js';
import type {CdpPage} from './Page.js';
import type {CdpTarget} from './Target.js';
import type {TargetManager} from './TargetManager.js';

const MAIN_FRAME_ID = 'main';
const OOPIF_FRAME_ID = 'oopif';
const SIBLING_FRAME_ID = 'sibling';

class MockCDPSession extends EventEmitter<CDPSessionEvents> {
  pageTarget?: CdpTarget;
  constructor(
    readonly sessionId: string,
    readonly responses: Record<string, unknown> = {},
  ) {
    super();
  }
  async send(method: string): Promise<any> {
    return this.responses[method];
  }
  connection() {
    return undefined;
  }
  readonly detached = false;
  async detach() {}
  id() {
    return this.sessionId;
  }
  parentSession() {
    return undefined;
  }
  target() {
    return this.pageTarget;
  }
}

function tick(): Promise<void> {
  return new Promise(resolve => {
    setImmediate(resolve);
  });
}

function createIframeTarget(
  session: MockCDPSession,
  frameId: string,
  parentFrameId?: string,
): CdpTarget {
  return {
    _targetId: frameId,
    _getTargetInfo() {
      return {type: 'iframe', targetId: frameId, parentFrameId};
    },
    _session() {
      return session;
    },
  } as unknown as CdpTarget;
}

function createIframeSession(
  frameId: string,
  parentFrameId: string,
): MockCDPSession {
  return new MockCDPSession(frameId, {
    'Page.getFrameTree': {
      frameTree: {
        frame: {
          id: frameId,
          parentId: parentFrameId,
          loaderId: `${frameId}-loader`,
          url: `https://${frameId}.test/`,
        },
      },
    },
  });
}

function emitDefaultContext(session: MockCDPSession, frameId: string): void {
  session.emit('Runtime.executionContextCreated', {
    context: {
      id: 1,
      origin: 'https://example.test',
      name: '',
      uniqueId: '1',
      auxData: {frameId, isDefault: true},
    },
  });
}

/**
 * Creates a frame manager with a main frame, a same-process child frame and
 * an out-of-process child frame that has its own session.
 */
async function setup() {
  // The iframe targets that the target manager reports as attached.
  const targets = new Map<string, CdpTarget>();
  const targetManager = {
    getFrameTarget(frameId: string) {
      return targets.get(frameId);
    },
  } as unknown as TargetManager;
  const pageSession = new MockCDPSession('page');
  pageSession.pageTarget = {
    _targetId: MAIN_FRAME_ID,
    _targetManager() {
      return targetManager;
    },
  } as unknown as CdpTarget;
  const oopifSession = createIframeSession(OOPIF_FRAME_ID, MAIN_FRAME_ID);
  const page = {
    browser() {
      return {
        connected: true,
        isNetworkEnabled() {
          return false;
        },
        isIssuesEnabled() {
          return false;
        },
      };
    },
    isClosed() {
      return false;
    },
  } as unknown as CdpPage;
  const frameManager = new FrameManager(
    pageSession as unknown as CdpCDPSession,
    page,
    new TimeoutSettings(),
    () => {
      return undefined;
    },
  );
  const attach = (target: CdpTarget) => {
    targets.set(target._targetId, target);
    frameManager.onAttachedToTarget(target);
  };
  const detach = (target: CdpTarget) => {
    targets.delete(target._targetId);
    frameManager.onDetachedFromTarget(target);
  };

  pageSession.emit('Page.frameNavigated', {
    frame: {
      id: MAIN_FRAME_ID,
      loaderId: 'main-loader',
      url: 'https://main.test/',
    },
    type: 'Navigation',
  } as any);
  await tick();
  for (const frameId of [OOPIF_FRAME_ID, SIBLING_FRAME_ID]) {
    pageSession.emit('Page.frameAttached', {
      frameId,
      parentFrameId: MAIN_FRAME_ID,
    });
  }
  await tick();
  const oopifTarget = createIframeTarget(
    oopifSession,
    OOPIF_FRAME_ID,
    MAIN_FRAME_ID,
  );
  attach(oopifTarget);
  await tick();

  expect(frameManager.mainFrame().client).toBe(pageSession);
  expect(frameManager.frame(SIBLING_FRAME_ID)!.client).toBe(pageSession);
  expect(frameManager.frame(OOPIF_FRAME_ID)!.client).toBe(oopifSession);

  return {
    frameManager,
    pageSession,
    oopifSession,
    oopifTarget,
    attach,
    detach,
  };
}

describe('FrameManager', () => {
  describe('Page.frameAttached for a known frame', () => {
    it('should keep the main frame on the session of the page', async () => {
      const {frameManager, pageSession, oopifSession} = await setup();

      oopifSession.emit('Page.frameAttached', {
        frameId: MAIN_FRAME_ID,
        parentFrameId: OOPIF_FRAME_ID,
      });
      emitDefaultContext(oopifSession, MAIN_FRAME_ID);
      await tick();

      expect(frameManager.mainFrame().client).toBe(pageSession);
      expect(frameManager.mainFrame().mainRealm().hasContext()).toBe(false);
    });

    it('should keep a frame on the session of its parent frame', async () => {
      const {frameManager, pageSession, oopifSession} = await setup();

      // The event has a different parent frame.
      oopifSession.emit('Page.frameAttached', {
        frameId: SIBLING_FRAME_ID,
        parentFrameId: OOPIF_FRAME_ID,
      });
      // The event has the same parent frame but a different session.
      oopifSession.emit('Page.frameAttached', {
        frameId: SIBLING_FRAME_ID,
        parentFrameId: MAIN_FRAME_ID,
      });
      emitDefaultContext(oopifSession, SIBLING_FRAME_ID);
      await tick();

      const frame = frameManager.frame(SIBLING_FRAME_ID)!;
      expect(frame.client).toBe(pageSession);
      expect(frame.mainRealm().hasContext()).toBe(false);
    });

    it('should move an OOP frame to the session of its parent frame when its target is gone', async () => {
      const {frameManager, pageSession, oopifTarget, detach} = await setup();

      detach(oopifTarget);
      pageSession.emit('Page.frameAttached', {
        frameId: OOPIF_FRAME_ID,
        parentFrameId: MAIN_FRAME_ID,
      });
      emitDefaultContext(pageSession, OOPIF_FRAME_ID);
      await tick();

      const frame = frameManager.frame(OOPIF_FRAME_ID)!;
      expect(frame.client).toBe(pageSession);
      expect(frame.mainRealm().hasContext()).toBe(true);
    });

    it('should keep an OOP frame on its session while its target is attached', async () => {
      const {frameManager, pageSession, oopifSession} = await setup();

      pageSession.emit('Page.frameAttached', {
        frameId: OOPIF_FRAME_ID,
        parentFrameId: MAIN_FRAME_ID,
      });
      emitDefaultContext(pageSession, OOPIF_FRAME_ID);
      await tick();

      const frame = frameManager.frame(OOPIF_FRAME_ID)!;
      expect(frame.client).toBe(oopifSession);
      expect(frame.mainRealm().hasContext()).toBe(false);
    });

    it('should keep a nested OOP frame on its session while its target is attached', async () => {
      const {frameManager, oopifSession, attach, detach} = await setup();
      oopifSession.emit('Page.frameAttached', {
        frameId: 'nested',
        parentFrameId: OOPIF_FRAME_ID,
      });
      await tick();
      const nestedSession = createIframeSession('nested', OOPIF_FRAME_ID);
      const nestedTarget = createIframeTarget(
        nestedSession,
        'nested',
        OOPIF_FRAME_ID,
      );
      attach(nestedTarget);
      await tick();
      const frame = frameManager.frame('nested')!;
      expect(frame.client).toBe(nestedSession);

      oopifSession.emit('Page.frameAttached', {
        frameId: 'nested',
        parentFrameId: OOPIF_FRAME_ID,
      });
      emitDefaultContext(oopifSession, 'nested');
      await tick();

      expect(frame.client).toBe(nestedSession);
      expect(frame.mainRealm().hasContext()).toBe(false);

      detach(nestedTarget);
      emitDefaultContext(oopifSession, 'nested');
      await tick();

      expect(frame.client).toBe(oopifSession);
      expect(frame.mainRealm().hasContext()).toBe(true);
    });
  });

  describe('frame events', () => {
    it('should only handle the events of a frame on its session', async () => {
      const {frameManager, oopifSession} = await setup();
      const frame = frameManager.frame(SIBLING_FRAME_ID)!;
      const url = frame.url();
      let lifecycleEvents = 0;
      frameManager.on(FrameManagerEvent.LifecycleEvent, () => {
        lifecycleEvents++;
      });

      oopifSession.emit('Page.frameNavigated', {
        frame: {
          id: SIBLING_FRAME_ID,
          parentId: MAIN_FRAME_ID,
          loaderId: 'other-loader',
          url: 'https://other.test/',
        },
        type: 'Navigation',
      } as any);
      oopifSession.emit('Page.navigatedWithinDocument', {
        frameId: SIBLING_FRAME_ID,
        url: 'https://other.test/#hash',
      } as any);
      oopifSession.emit('Page.lifecycleEvent', {
        frameId: SIBLING_FRAME_ID,
        loaderId: 'other-loader',
        name: 'load',
        timestamp: 0,
      });
      oopifSession.emit('Page.frameStoppedLoading', {
        frameId: SIBLING_FRAME_ID,
      });
      oopifSession.emit('Page.frameDetached', {
        frameId: SIBLING_FRAME_ID,
        reason: 'remove',
      });
      await tick();

      expect(frameManager.frame(SIBLING_FRAME_ID)).toBe(frame);
      expect(frame.url()).toBe(url);
      expect(frame.detached).toBe(false);
      expect(lifecycleEvents).toBe(0);
    });

    it('should handle the detachment of a frame on the session of an ancestor', async () => {
      const {frameManager, pageSession} = await setup();

      pageSession.emit('Page.frameDetached', {
        frameId: OOPIF_FRAME_ID,
        reason: 'remove',
      });
      await tick();

      expect(frameManager.frame(OOPIF_FRAME_ID)).toBe(null);
    });

    it('should only add child frames on the session of the parent frame', async () => {
      const {frameManager, oopifSession} = await setup();

      oopifSession.emit('Page.frameAttached', {
        frameId: 'child-of-main',
        parentFrameId: MAIN_FRAME_ID,
      });
      oopifSession.emit('Page.frameAttached', {
        frameId: 'child-of-oopif',
        parentFrameId: OOPIF_FRAME_ID,
      });
      await tick();

      expect(frameManager.frame('child-of-main')).toBe(null);
      expect(frameManager.frame('child-of-oopif')!.client).toBe(oopifSession);
    });

    it('should only add a main frame on the session of the page', async () => {
      const {frameManager, oopifSession} = await setup();

      oopifSession.emit('Page.frameNavigated', {
        frame: {
          id: 'other-main',
          loaderId: 'other-loader',
          url: 'https://other.test/',
        },
        type: 'Navigation',
      } as any);
      await tick();

      expect(frameManager.frame('other-main')).toBe(null);
    });
  });

  describe('iframe targets', () => {
    it('should use the parent frame from the target info', async () => {
      const {frameManager, attach} = await setup();
      const session = createIframeSession(
        'late',
        // The frame tree of the target has a different parent frame.
        OOPIF_FRAME_ID,
      );

      attach(createIframeTarget(session, 'late', MAIN_FRAME_ID));
      await tick();

      const frame = frameManager.frame('late')!;
      expect(frame.client).toBe(session);
      expect(frame.parentFrame()).toBe(frameManager.mainFrame());
    });
  });
});
