/**
 * @license
 * Copyright 2019 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type Protocol from 'devtools-protocol';

import {type Frame, FrameEvent} from '../api/Frame.js';
import type {HTTPRequest} from '../api/HTTPRequest.js';
import type {HTTPResponse} from '../api/HTTPResponse.js';
import type {TimeoutError} from '../common/Errors.js';
import {EventSubscription} from '../common/EventEmitter.js';
import {NetworkManagerEvent} from '../common/NetworkManagerEvents.js';
import {assert} from '../util/assert.js';
import {Deferred} from '../util/Deferred.js';
import {DisposableStack} from '../util/disposable.js';

import type {CdpFrame} from './Frame.js';
import {FrameManagerEvent} from './FrameManagerEvents.js';
import type {NetworkManager} from './NetworkManager.js';

/**
 * @public
 */
export type PuppeteerLifeCycleEvent =
  /**
   * Waits for the 'load' event.
   */
  | 'load'
  /**
   * Waits for the 'DOMContentLoaded' event.
   */
  | 'domcontentloaded'
  /**
   * Waits till there are no more than 0 network connections for at least `500`
   * ms.
   */
  | 'networkidle0'
  /**
   * Waits till there are no more than 2 network connections for at least `500`
   * ms.
   */
  | 'networkidle2';

/**
 * @public
 */
export type ProtocolLifeCycleEvent =
  | 'load'
  | 'DOMContentLoaded'
  | 'networkIdle'
  | 'networkAlmostIdle';

const puppeteerToProtocolLifecycle = new Map<
  PuppeteerLifeCycleEvent,
  ProtocolLifeCycleEvent
>([
  ['load', 'load'],
  ['domcontentloaded', 'DOMContentLoaded'],
  ['networkidle0', 'networkIdle'],
  ['networkidle2', 'networkAlmostIdle'],
]);

/**
 * @internal
 */
export class LifecycleWatcher {
  #expectedLifecycle: ProtocolLifeCycleEvent[];
  #frame: CdpFrame;
  #timeout: number;
  #navigationRequest: HTTPRequest | null = null;
  #subscriptions = new DisposableStack();
  #initialLoaderId: string;

  #terminationDeferred: Deferred<Error>;
  #sameDocumentNavigationDeferred = Deferred.create<undefined>();
  #lifecycleDeferred = Deferred.create<void>();
  #newDocumentNavigationDeferred = Deferred.create<undefined>();

  #hasSameDocumentNavigation?: boolean;
  #swapped?: boolean;

  #navigationResponseReceived?: Deferred<void>;

  constructor(
    networkManager: NetworkManager,
    frame: CdpFrame,
    waitUntil: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[],
    timeout: number
  ) {
    if (Array.isArray(waitUntil)) {
      waitUntil = waitUntil.slice();
    } else if (typeof waitUntil === 'string') {
      waitUntil = [waitUntil];
    }
    this.#initialLoaderId = frame._loaderId;
    this.#expectedLifecycle = waitUntil.map(value => {
      const protocolEvent = puppeteerToProtocolLifecycle.get(value);
      assert(protocolEvent, 'Unknown value for options.waitUntil: ' + value);
      return protocolEvent as ProtocolLifeCycleEvent;
    });

    this.#frame = frame;
    this.#timeout = timeout;
    this.#subscriptions.use(
      // Revert if TODO #1 is done
      new EventSubscription(
        frame._frameManager,
        FrameManagerEvent.LifecycleEvent,
        this.#checkLifecycleComplete.bind(this)
      )
    );
    this.#subscriptions.use(
      new EventSubscription(
        frame,
        FrameEvent.FrameNavigatedWithinDocument,
        this.#navigatedWithinDocument.bind(this)
      )
    );
    this.#subscriptions.use(
      new EventSubscription(
        frame,
        FrameEvent.FrameNavigated,
        this.#navigated.bind(this)
      )
    );
    this.#subscriptions.use(
      new EventSubscription(
        frame,
        FrameEvent.FrameSwapped,
        this.#frameSwapped.bind(this)
      )
    );
    this.#subscriptions.use(
      new EventSubscription(
        frame,
        FrameEvent.FrameSwappedByActivation,
        this.#frameSwapped.bind(this)
      )
    );
    this.#subscriptions.use(
      new EventSubscription(
        frame,
        FrameEvent.FrameDetached,
        this.#onFrameDetached.bind(this)
      )
    );
    this.#subscriptions.use(
      new EventSubscription(
        networkManager,
        NetworkManagerEvent.Request,
        this.#onRequest.bind(this)
      )
    );
    this.#subscriptions.use(
      new EventSubscription(
        networkManager,
        NetworkManagerEvent.Response,
        this.#onResponse.bind(this)
      )
    );
    this.#subscriptions.use(
      new EventSubscription(
        networkManager,
        NetworkManagerEvent.RequestFailed,
        this.#onRequestFailed.bind(this)
      )
    );
    this.#terminationDeferred = Deferred.create<Error>({
      timeout: this.#timeout,
      message: `Navigation timeout of ${this.#timeout} ms exceeded`,
    });

    this.#checkLifecycleComplete();
  }

  #onRequest(request: HTTPRequest): void {
    if (request.frame() !== this.#frame || !request.isNavigationRequest()) {
      return;
    }
    this.#navigationRequest = request;
    // Resolve previous navigation response in case there are multiple
    // navigation requests reported by the backend. This generally should not
    // happen by it looks like it's possible.
    this.#navigationResponseReceived?.resolve();
    this.#navigationResponseReceived = Deferred.create();
    if (request.response() !== null) {
      this.#navigationResponseReceived?.resolve();
    }
  }

  #onRequestFailed(request: HTTPRequest): void {
    if (this.#navigationRequest?.id !== request.id) {
      return;
    }
    this.#navigationResponseReceived?.resolve();
  }

  #onResponse(response: HTTPResponse): void {
    if (this.#navigationRequest?.id !== response.request().id) {
      return;
    }
    this.#navigationResponseReceived?.resolve();
  }

  #onFrameDetached(frame: Frame): void {
    if (this.#frame === frame) {
      this.#terminationDeferred.resolve(
        new Error('Navigating frame was detached')
      );
      return;
    }
    this.#checkLifecycleComplete();
  }

  async navigationResponse(): Promise<HTTPResponse | null> {
    // Continue with a possibly null response.
    await this.#navigationResponseReceived?.valueOrThrow();
    return this.#navigationRequest ? this.#navigationRequest.response() : null;
  }

  sameDocumentNavigationPromise(): Promise<Error | undefined> {
    return this.#sameDocumentNavigationDeferred.valueOrThrow();
  }

  newDocumentNavigationPromise(): Promise<Error | undefined> {
    return this.#newDocumentNavigationDeferred.valueOrThrow();
  }

  lifecyclePromise(): Promise<void> {
    return this.#lifecycleDeferred.valueOrThrow();
  }

  terminationPromise(): Promise<Error | TimeoutError | undefined> {
    return this.#terminationDeferred.valueOrThrow();
  }

  #navigatedWithinDocument(): void {
    this.#hasSameDocumentNavigation = true;
    this.#checkLifecycleComplete();
  }

  #navigated(navigationType: Protocol.Page.NavigationType): void {
    if (navigationType === 'BackForwardCacheRestore') {
      return this.#frameSwapped();
    }
    this.#checkLifecycleComplete();
  }

  #frameSwapped(): void {
    this.#swapped = true;
    this.#checkLifecycleComplete();
  }

  #checkLifecycleComplete(): void {
    // We expect navigation to commit.
    if (!checkLifecycle(this.#frame, this.#expectedLifecycle)) {
      return;
    }
    this.#lifecycleDeferred.resolve();
    if (this.#hasSameDocumentNavigation) {
      this.#sameDocumentNavigationDeferred.resolve(undefined);
    }
    if (this.#swapped || this.#frame._loaderId !== this.#initialLoaderId) {
      this.#newDocumentNavigationDeferred.resolve(undefined);
    }

    function checkLifecycle(
      frame: CdpFrame,
      expectedLifecycle: ProtocolLifeCycleEvent[]
    ): boolean {
      for (const event of expectedLifecycle) {
        if (!frame._lifecycleEvents.has(event)) {
          return false;
        }
      }
      // TODO(#1): Its possible we don't need this check
      // CDP provided the correct order for Loading Events
      // And NetworkIdle is a global state
      // Consider removing
      for (const child of frame.childFrames()) {
        if (
          child._hasStartedLoading &&
          !checkLifecycle(child, expectedLifecycle)
        ) {
          return false;
        }
      }
      return true;
    }
  }

  dispose(): void {
    this.#subscriptions.dispose();
    this.#terminationDeferred.resolve(new Error('LifecycleWatcher disposed'));
  }
}
