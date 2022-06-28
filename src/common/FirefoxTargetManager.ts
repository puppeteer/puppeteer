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

import Protocol from 'devtools-protocol';
import {assert} from './assert.js';
import {CDPSession, Connection} from './Connection.js';
import {Target} from './Target.js';
import {TargetFilterCallback} from './Browser.js';
import {
  TargetFactory,
  TargetInterceptor,
  TargetManagerEmittedEvents,
  TargetManager,
} from './TargetManager.js';
import {EventEmitter} from './EventEmitter.js';

/**
 * FirefoxTargetManager implements target management using
 * `Target.setDiscoverTargets` without using auto-attach. It, therefore,
 * creates targets that lazily establish their CDP sessions.
 *
 * Although the approach is potentially flaky, there is no other way
 * for Firefox because Firefox's CDP implementation does not support
 * auto-attach.
 * @internal
 */
export class FirefoxTargetManager
  extends EventEmitter
  implements TargetManager
{
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
  #discoveredTargetsByTargetId: Map<string, Protocol.Target.TargetInfo> =
    new Map();
  /**
   * Keeps track of targets that were created via 'Target.targetCreated'
   * and which one are not filtered out by `targetFilterCallback`.
   *
   * The target is removed from here once it's been destroyed.
   */
  #availableTargetsByTargetId: Map<string, Target> = new Map();
  /**
   * Tracks which sessions attach to which target.
   */
  #availableTargetsBySessionId: Map<string, Target> = new Map();
  /**
   * If a target was filtered out by `targetFilterCallback`, we still receive
   * events about it from CDP, but we don't forward them to the rest of Puppeteer.
   */
  #ignoredTargets = new Set<string>();
  #targetFilterCallback: TargetFilterCallback | undefined;
  #targetFactory: TargetFactory;

  #targetInterceptors: WeakMap<CDPSession | Connection, TargetInterceptor[]> =
    new WeakMap();

  #attachedToTargetListenersBySession: WeakMap<
    CDPSession | Connection,
    (event: Protocol.Target.AttachedToTargetEvent) => Promise<void>
  > = new WeakMap();
  #detachedFromTargetListenersBySession: WeakMap<
    CDPSession | Connection,
    (event: Protocol.Target.DetachedFromTargetEvent) => void
  > = new WeakMap();

  #initializeCallback = () => {};
  #initializePromise: Promise<void> = new Promise(resolve => {
    this.#initializeCallback = resolve;
  });
  #targetsIdsForInit: Set<string> = new Set();

  constructor(
    connection: Connection,
    targetFactory: TargetFactory,
    targetFilterCallback?: TargetFilterCallback
  ) {
    super();
    this.#connection = connection;
    this.#targetFilterCallback = targetFilterCallback;
    this.#targetFactory = targetFactory;

    this.#connection.on('Target.targetCreated', this.onTargetCreated);
    this.#connection.on('Target.targetDestroyed', this.onTargetDestroyed);
    this.#connection.on('Target.targetInfoChanged', this.onTargetInfoChanged);
    this.#connection.on('sessiondetached', this.#onSessionDetached);
    this.setupAttachmentListeners(this.#connection);
  }

  addTargetInterceptor(
    client: CDPSession | Connection,
    interceptor: TargetInterceptor
  ): void {
    const interceptors = this.#targetInterceptors.get(client) || [];
    interceptors.push(interceptor);
    this.#targetInterceptors.set(client, interceptors);
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

  setupAttachmentListeners(session: CDPSession | Connection): void {
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

  #onSessionDetached = (session: CDPSession) => {
    this.removeSessionListeners(session);
    this.#targetInterceptors.delete(session);
    this.#availableTargetsBySessionId.delete(session.id());
  };

  removeSessionListeners(session: CDPSession): void {
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

  getAvailableTargets(): Map<string, Target> {
    return this.#availableTargetsByTargetId;
  }

  dispose(): void {
    this.#connection.off('Target.targetCreated', this.onTargetCreated);
    this.#connection.off('Target.targetDestroyed', this.onTargetDestroyed);
    this.#connection.off('Target.targetInfoChanged', this.onTargetInfoChanged);
  }

  async initialize(): Promise<void> {
    await this.#connection.send('Target.setDiscoverTargets', {discover: true});
    this.#targetsIdsForInit = new Set(this.#discoveredTargetsByTargetId.keys());
    await this.#initializePromise;
  }

  protected onTargetCreated = async (
    event: Protocol.Target.TargetCreatedEvent
  ): Promise<void> => {
    if (this.#discoveredTargetsByTargetId.has(event.targetInfo.targetId)) {
      return;
    }

    this.#discoveredTargetsByTargetId.set(
      event.targetInfo.targetId,
      event.targetInfo
    );

    if (event.targetInfo.type === 'browser' && event.targetInfo.attached) {
      const target = this.#targetFactory(event.targetInfo, undefined);
      this.#availableTargetsByTargetId.set(event.targetInfo.targetId, target);
      this.#finishInitializationIfReady(target._targetId);
      return;
    }

    if (
      this.#targetFilterCallback &&
      !this.#targetFilterCallback(event.targetInfo)
    ) {
      this.#ignoredTargets.add(event.targetInfo.targetId);
      this.#finishInitializationIfReady(event.targetInfo.targetId);
      return;
    }

    const target = this.#targetFactory(event.targetInfo, undefined);
    this.#availableTargetsByTargetId.set(event.targetInfo.targetId, target);
    this.emit(TargetManagerEmittedEvents.TargetAvailable, target);
    this.#finishInitializationIfReady(target._targetId);
  };

  protected onTargetDestroyed = (
    event: Protocol.Target.TargetDestroyedEvent
  ): void => {
    this.#discoveredTargetsByTargetId.delete(event.targetId);
    this.#finishInitializationIfReady(event.targetId);
    const target = this.#availableTargetsByTargetId.get(event.targetId);
    if (target) {
      this.emit(TargetManagerEmittedEvents.TargetGone, target);
      this.#availableTargetsByTargetId.delete(event.targetId);
    }
  };

  protected onTargetInfoChanged = (
    event: Protocol.Target.TargetInfoChangedEvent
  ): void => {
    this.#discoveredTargetsByTargetId.set(
      event.targetInfo.targetId,
      event.targetInfo
    );

    if (
      this.#ignoredTargets.has(event.targetInfo.targetId) ||
      !this.#availableTargetsByTargetId.has(event.targetInfo.targetId) ||
      !event.targetInfo.attached
    ) {
      return;
    }

    const target = this.#availableTargetsByTargetId.get(
      event.targetInfo.targetId
    );
    this.emit(TargetManagerEmittedEvents.TargetChanged, {
      target: target!,
      targetInfo: event.targetInfo,
    });
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

    const target = this.#availableTargetsByTargetId.get(targetInfo.targetId);

    assert(target, `Target ${targetInfo.targetId} is missing`);

    // 4) Set up listeners for the session so that session events are received.
    this.setupAttachmentListeners(session);

    // 5) Update the maps
    this.#availableTargetsBySessionId.set(
      session.id(),
      this.#availableTargetsByTargetId.get(targetInfo.targetId)!
    );

    // 6) At this point the target is paused so we can allow clients to
    //    configure themselves using hooks.
    for (const hook of this.#targetInterceptors.get(parentSession) || []) {
      if (!(parentSession instanceof Connection)) {
        assert(this.#availableTargetsBySessionId.has(parentSession.id()));
      }
      await hook(
        target,
        parentSession instanceof Connection
          ? null
          : this.#availableTargetsBySessionId.get(parentSession.id())!
      );
    }
  };

  #onDetachedFromTarget = (
    _parentSession: Connection | CDPSession,
    event: Protocol.Target.DetachedFromTargetEvent
  ) => {
    this.#availableTargetsBySessionId.delete(event.sessionId);
  };

  #finishInitializationIfReady(targetId: string): void {
    this.#targetsIdsForInit.delete(targetId);
    if (this.#targetsIdsForInit.size === 0) {
      this.#initializeCallback();
    }
  }
}
