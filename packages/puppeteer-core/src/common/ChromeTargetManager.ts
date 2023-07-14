/**
 * Copyright 2022 Google Inc. All rights reserved.
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

import {TargetFilterCallback} from '../api/Browser.js';
import {assert} from '../util/assert.js';
import {Deferred} from '../util/Deferred.js';

import {CDPSession, Connection} from './Connection.js';
import {EventEmitter} from './EventEmitter.js';
import {InitializationStatus, Target} from './Target.js';
import {
  TargetInterceptor,
  TargetFactory,
  TargetManager,
  TargetManagerEmittedEvents,
} from './TargetManager.js';
import {debugError} from './util.js';

/**
 * ChromeTargetManager uses the CDP's auto-attach mechanism to intercept
 * new targets and allow the rest of Puppeteer to configure listeners while
 * the target is paused.
 *
 * @internal
 */
export class ChromeTargetManager extends EventEmitter implements TargetManager {
  #connection: Connection;
  /**
   * Keeps track of the following events: 'Target.targetCreated',
   * 'Target.targetDestroyed', 'Target.targetInfoChanged'.
   *
   * A target becomes discovered when 'Target.targetCreated' is received.
   * A target is removed from this map once 'Target.targetDestroyed' is
   * received.
   *
   * `targetFilterCallback` has no effect on this map.
   */
  #discoveredTargetsByTargetId = new Map<string, Protocol.Target.TargetInfo>();
  /**
   * A target is added to this map once ChromeTargetManager has created
   * a Target and attached at least once to it.
   */
  #attachedTargetsByTargetId = new Map<string, Target>();
  /**
   * Tracks which sessions attach to which target.
   */
  #attachedTargetsBySessionId = new Map<string, Target>();
  /**
   * If a target was filtered out by `targetFilterCallback`, we still receive
   * events about it from CDP, but we don't forward them to the rest of Puppeteer.
   */
  #ignoredTargets = new Set<string>();
  #targetFilterCallback: TargetFilterCallback | undefined;
  #targetFactory: TargetFactory;

  #targetInterceptors = new WeakMap<
    CDPSession | Connection,
    TargetInterceptor[]
  >();

  #attachedToTargetListenersBySession = new WeakMap<
    CDPSession | Connection,
    (event: Protocol.Target.AttachedToTargetEvent) => Promise<void>
  >();
  #detachedFromTargetListenersBySession = new WeakMap<
    CDPSession | Connection,
    (event: Protocol.Target.DetachedFromTargetEvent) => void
  >();

  #initializeDeferred = Deferred.create<void>();
  #targetsIdsForInit = new Set<string>();

  constructor(
    connection: Connection,
    targetFactory: TargetFactory,
    targetFilterCallback?: TargetFilterCallback
  ) {
    super();
    this.#connection = connection;
    this.#targetFilterCallback = targetFilterCallback;
    this.#targetFactory = targetFactory;

    this.#connection.on('Target.targetCreated', this.#onTargetCreated);
    this.#connection.on('Target.targetDestroyed', this.#onTargetDestroyed);
    this.#connection.on('Target.targetInfoChanged', this.#onTargetInfoChanged);
    this.#connection.on('sessiondetached', this.#onSessionDetached);
    this.#setupAttachmentListeners(this.#connection);

    this.#connection
      .send('Target.setDiscoverTargets', {
        discover: true,
        filter: [{type: 'tab', exclude: true}, {}],
      })
      .then(this.#storeExistingTargetsForInit)
      .catch(debugError);
  }

  #storeExistingTargetsForInit = () => {
    for (const [
      targetId,
      targetInfo,
    ] of this.#discoveredTargetsByTargetId.entries()) {
      if (
        (!this.#targetFilterCallback ||
          this.#targetFilterCallback(targetInfo)) &&
        targetInfo.type !== 'browser'
      ) {
        this.#targetsIdsForInit.add(targetId);
      }
    }
  };

  async initialize(): Promise<void> {
    await this.#connection.send('Target.setAutoAttach', {
      waitForDebuggerOnStart: true,
      flatten: true,
      autoAttach: true,
    });
    this.#finishInitializationIfReady();
    await this.#initializeDeferred.valueOrThrow();
  }

  dispose(): void {
    this.#connection.off('Target.targetCreated', this.#onTargetCreated);
    this.#connection.off('Target.targetDestroyed', this.#onTargetDestroyed);
    this.#connection.off('Target.targetInfoChanged', this.#onTargetInfoChanged);
    this.#connection.off('sessiondetached', this.#onSessionDetached);

    this.#removeAttachmentListeners(this.#connection);
  }

  getAvailableTargets(): Map<string, Target> {
    return this.#attachedTargetsByTargetId;
  }

  addTargetInterceptor(
    session: CDPSession | Connection,
    interceptor: TargetInterceptor
  ): void {
    const interceptors = this.#targetInterceptors.get(session) || [];
    interceptors.push(interceptor);
    this.#targetInterceptors.set(session, interceptors);
  }

  removeTargetInterceptor(
    client: CDPSession | Connection,
    interceptor: TargetInterceptor
  ): void {
    const interceptors = this.#targetInterceptors.get(client) || [];
    this.#targetInterceptors.set(
      client,
      interceptors.filter(currentInterceptor => {
        return currentInterceptor !== interceptor;
      })
    );
  }

  #setupAttachmentListeners(session: CDPSession | Connection): void {
    const listener = (event: Protocol.Target.AttachedToTargetEvent) => {
      return this.#onAttachedToTarget(session, event);
    };
    assert(!this.#attachedToTargetListenersBySession.has(session));
    this.#attachedToTargetListenersBySession.set(session, listener);
    session.on('Target.attachedToTarget', listener);

    const detachedListener = (
      event: Protocol.Target.DetachedFromTargetEvent
    ) => {
      return this.#onDetachedFromTarget(session, event);
    };
    assert(!this.#detachedFromTargetListenersBySession.has(session));
    this.#detachedFromTargetListenersBySession.set(session, detachedListener);
    session.on('Target.detachedFromTarget', detachedListener);
  }

  #removeAttachmentListeners(session: CDPSession | Connection): void {
    if (this.#attachedToTargetListenersBySession.has(session)) {
      session.off(
        'Target.attachedToTarget',
        this.#attachedToTargetListenersBySession.get(session)!
      );
      this.#attachedToTargetListenersBySession.delete(session);
    }

    if (this.#detachedFromTargetListenersBySession.has(session)) {
      session.off(
        'Target.detachedFromTarget',
        this.#detachedFromTargetListenersBySession.get(session)!
      );
      this.#detachedFromTargetListenersBySession.delete(session);
    }
  }

  #onSessionDetached = (session: CDPSession) => {
    this.#removeAttachmentListeners(session);
    this.#targetInterceptors.delete(session);
  };

  #onTargetCreated = async (event: Protocol.Target.TargetCreatedEvent) => {
    this.#discoveredTargetsByTargetId.set(
      event.targetInfo.targetId,
      event.targetInfo
    );

    this.emit(TargetManagerEmittedEvents.TargetDiscovered, event.targetInfo);

    // The connection is already attached to the browser target implicitly,
    // therefore, no new CDPSession is created and we have special handling
    // here.
    if (event.targetInfo.type === 'browser' && event.targetInfo.attached) {
      if (this.#attachedTargetsByTargetId.has(event.targetInfo.targetId)) {
        return;
      }
      const target = this.#targetFactory(event.targetInfo, undefined);
      this.#attachedTargetsByTargetId.set(event.targetInfo.targetId, target);
    }
  };

  #onTargetDestroyed = (event: Protocol.Target.TargetDestroyedEvent) => {
    const targetInfo = this.#discoveredTargetsByTargetId.get(event.targetId);
    this.#discoveredTargetsByTargetId.delete(event.targetId);
    this.#finishInitializationIfReady(event.targetId);
    if (
      targetInfo?.type === 'service_worker' &&
      this.#attachedTargetsByTargetId.has(event.targetId)
    ) {
      // Special case for service workers: report TargetGone event when
      // the worker is destroyed.
      const target = this.#attachedTargetsByTargetId.get(event.targetId);
      this.emit(TargetManagerEmittedEvents.TargetGone, target);
      this.#attachedTargetsByTargetId.delete(event.targetId);
    }
  };

  #onTargetInfoChanged = (event: Protocol.Target.TargetInfoChangedEvent) => {
    this.#discoveredTargetsByTargetId.set(
      event.targetInfo.targetId,
      event.targetInfo
    );

    if (
      this.#ignoredTargets.has(event.targetInfo.targetId) ||
      !this.#attachedTargetsByTargetId.has(event.targetInfo.targetId) ||
      !event.targetInfo.attached
    ) {
      return;
    }

    const target = this.#attachedTargetsByTargetId.get(
      event.targetInfo.targetId
    );
    if (!target) {
      return;
    }
    const previousURL = target.url();
    const wasInitialized =
      target._initializedDeferred.value() === InitializationStatus.SUCCESS;

    target._targetInfoChanged(event.targetInfo);

    if (wasInitialized && previousURL !== target.url()) {
      this.emit(TargetManagerEmittedEvents.TargetChanged, {
        target: target,
        wasInitialized,
        previousURL,
      });
    }
  };

  #onAttachedToTarget = async (
    parentSession: Connection | CDPSession,
    event: Protocol.Target.AttachedToTargetEvent
  ) => {
    const targetInfo = event.targetInfo;
    const session = this.#connection.session(event.sessionId);
    if (!session) {
      throw new Error(`Session ${event.sessionId} was not created.`);
    }

    const silentDetach = async () => {
      await session.send('Runtime.runIfWaitingForDebugger').catch(debugError);
      // We don't use `session.detach()` because that dispatches all commands on
      // the connection instead of the parent session.
      await parentSession
        .send('Target.detachFromTarget', {
          sessionId: session.id(),
        })
        .catch(debugError);
    };

    if (!this.#connection.isAutoAttached(targetInfo.targetId)) {
      return;
    }

    // Special case for service workers: being attached to service workers will
    // prevent them from ever being destroyed. Therefore, we silently detach
    // from service workers unless the connection was manually created via
    // `page.worker()`. To determine this, we use
    // `this.#connection.isAutoAttached(targetInfo.targetId)`. In the future, we
    // should determine if a target is auto-attached or not with the help of
    // CDP.
    if (
      targetInfo.type === 'service_worker' &&
      this.#connection.isAutoAttached(targetInfo.targetId)
    ) {
      this.#finishInitializationIfReady(targetInfo.targetId);
      await silentDetach();
      if (this.#attachedTargetsByTargetId.has(targetInfo.targetId)) {
        return;
      }
      const target = this.#targetFactory(targetInfo);
      this.#attachedTargetsByTargetId.set(targetInfo.targetId, target);
      this.emit(TargetManagerEmittedEvents.TargetAvailable, target);
      return;
    }

    if (this.#targetFilterCallback && !this.#targetFilterCallback(targetInfo)) {
      this.#ignoredTargets.add(targetInfo.targetId);
      this.#finishInitializationIfReady(targetInfo.targetId);
      await silentDetach();
      return;
    }

    const existingTarget = this.#attachedTargetsByTargetId.has(
      targetInfo.targetId
    );

    const target = existingTarget
      ? this.#attachedTargetsByTargetId.get(targetInfo.targetId)!
      : this.#targetFactory(targetInfo, session);

    this.#setupAttachmentListeners(session);

    if (existingTarget) {
      this.#attachedTargetsBySessionId.set(
        session.id(),
        this.#attachedTargetsByTargetId.get(targetInfo.targetId)!
      );
    } else {
      this.#attachedTargetsByTargetId.set(targetInfo.targetId, target);
      this.#attachedTargetsBySessionId.set(session.id(), target);
    }

    for (const interceptor of this.#targetInterceptors.get(parentSession) ||
      []) {
      if (!(parentSession instanceof Connection)) {
        // Sanity check: if parent session is not a connection, it should be
        // present in #attachedTargetsBySessionId.
        assert(this.#attachedTargetsBySessionId.has(parentSession.id()));
      }
      interceptor(
        target,
        parentSession instanceof Connection
          ? null
          : this.#attachedTargetsBySessionId.get(parentSession.id())!
      );
    }

    this.#targetsIdsForInit.delete(target._targetId);
    if (!existingTarget) {
      this.emit(TargetManagerEmittedEvents.TargetAvailable, target);
    }
    this.#finishInitializationIfReady();

    // TODO: the browser might be shutting down here. What do we do with the
    // error?
    await Promise.all([
      session.send('Target.setAutoAttach', {
        waitForDebuggerOnStart: true,
        flatten: true,
        autoAttach: true,
      }),
      session.send('Runtime.runIfWaitingForDebugger'),
    ]).catch(debugError);
  };

  #finishInitializationIfReady(targetId?: string): void {
    targetId !== undefined && this.#targetsIdsForInit.delete(targetId);
    if (this.#targetsIdsForInit.size === 0) {
      this.#initializeDeferred.resolve();
    }
  }

  #onDetachedFromTarget = (
    _parentSession: Connection | CDPSession,
    event: Protocol.Target.DetachedFromTargetEvent
  ) => {
    const target = this.#attachedTargetsBySessionId.get(event.sessionId);

    this.#attachedTargetsBySessionId.delete(event.sessionId);

    if (!target) {
      return;
    }

    this.#attachedTargetsByTargetId.delete(target._targetId);
    this.emit(TargetManagerEmittedEvents.TargetGone, target);
  };
}
