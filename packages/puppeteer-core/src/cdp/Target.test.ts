/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import type {Protocol} from 'devtools-protocol';
import expect from 'expect';
import sinon from 'sinon';

import type {BrowserContext} from '../api/BrowserContext.js';
import {TargetCloseError} from '../common/Errors.js';

import type {CdpCDPSession} from './CdpSession.js';
import {WorkerTarget} from './Target.js';
import type {TargetManager} from './TargetManager.js';

/**
 * Creates a service worker target with one session that `TargetManager` keeps
 * for it. The session is attached through the connection, so it is its own
 * parent session.
 */
function createServiceWorkerTarget() {
  const send = sinon.stub().resolves();
  const session = {
    detached: false,
    id: () => {
      return 'session-id';
    },
    parentSession: () => {
      return session;
    },
    connection: () => {
      return {send};
    },
  };
  const closeTarget = sinon.stub().resolves();
  const waitForSilentDetaches = sinon.stub().resolves();
  const target = new WorkerTarget(
    {
      targetId: 'target-id',
      type: 'service_worker',
    } as Protocol.Target.TargetInfo,
    undefined,
    {
      browser: () => {
        return {_closeTarget: closeTarget};
      },
    } as unknown as BrowserContext,
    {
      getAttachedSessions: () => {
        return [session as unknown as CdpCDPSession];
      },
      waitForSilentDetaches,
    } as unknown as TargetManager,
    () => {
      return Promise.reject(new Error('Attach failed'));
    },
    () => {
      return undefined;
    },
  );
  return {target, session, send, closeTarget, waitForSilentDetaches};
}

describe('WorkerTarget', function () {
  describe('close', function () {
    it('should detach from a service worker after worker() failed', async () => {
      const {target, send, closeTarget} = createServiceWorkerTarget();
      await expect(target.worker()).rejects.toThrow('Attach failed');

      const closed = target.close();
      target._isClosedDeferred.resolve();
      await closed;

      expect(closeTarget.calledOnceWith('target-id')).toBe(true);
      expect(
        send.calledOnceWith('Target.detachFromTarget', {
          sessionId: 'session-id',
        }),
      ).toBe(true);
    });

    it('should not throw if Chrome detached a session while closing', async () => {
      const {target, session, send} = createServiceWorkerTarget();
      // Chrome sends `Target.detachedFromTarget` before the error response.
      send.callsFake(async () => {
        session.detached = true;
        throw new Error('No session with given id');
      });

      const closed = target.close();
      target._isClosedDeferred.resolve();
      await closed;

      expect(send.calledOnce).toBe(true);
    });

    it('should throw if detaching a session fails', async () => {
      const {target, send} = createServiceWorkerTarget();
      send.rejects(new Error('Detach failed'));

      await expect(target.close()).rejects.toThrow('Detach failed');
    });

    it('should reject worker() after the sessions to detach were collected', async () => {
      const {target, send} = createServiceWorkerTarget();
      let worker: Promise<unknown> | undefined;
      // `close()` would not detach a session that `worker()` attached now.
      send.callsFake(async () => {
        worker = target.worker();
      });

      const closed = target.close();
      target._isClosedDeferred.resolve();
      await closed;

      await expect(worker).rejects.toThrow(TargetCloseError);
    });
  });
});
