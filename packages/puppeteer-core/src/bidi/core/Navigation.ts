/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {EventEmitter} from '../../common/EventEmitter.js';
import {inertIfDisposed} from '../../util/decorators.js';
import {Deferred} from '../../util/Deferred.js';
import {DisposableStack, disposeSymbol} from '../../util/disposable.js';

import type {BrowsingContext} from './BrowsingContext.js';
import type {Request} from './Request.js';

/**
 * @internal
 */
export interface NavigationInfo {
  url: string;
  timestamp: Date;
}

/**
 * @internal
 */
export class Navigation extends EventEmitter<{
  /** Emitted when navigation has a request associated with it. */
  request: Request;
  /** Emitted when fragment navigation occurred. */
  fragment: NavigationInfo;
  /** Emitted when navigation failed. */
  failed: NavigationInfo;
  /** Emitted when navigation was aborted. */
  aborted: NavigationInfo;
}> {
  static from(context: BrowsingContext): Navigation {
    const navigation = new Navigation(context);
    navigation.#initialize();
    return navigation;
  }

  // keep-sorted start
  #request: Request | undefined;
  readonly #browsingContext: BrowsingContext;
  readonly #disposables = new DisposableStack();
  readonly #id = new Deferred<string>();
  // keep-sorted end

  private constructor(context: BrowsingContext) {
    super();
    // keep-sorted start
    this.#browsingContext = context;
    // keep-sorted end
  }

  #initialize() {
    const browsingContextEmitter = this.#disposables.use(
      new EventEmitter(this.#browsingContext)
    );
    browsingContextEmitter.once('closed', () => {
      this.emit('failed', {
        url: this.#browsingContext.url,
        timestamp: new Date(),
      });
      this.dispose();
    });

    this.#browsingContext.on('request', ({request}) => {
      if (request.navigation === this.#id.value()) {
        this.#request = request;
        this.emit('request', request);
      }
    });

    const sessionEmitter = this.#disposables.use(
      new EventEmitter(this.#session)
    );
    // To get the navigation ID if any.
    for (const eventName of [
      'browsingContext.domContentLoaded',
      'browsingContext.load',
    ] as const) {
      sessionEmitter.on(eventName, info => {
        if (info.context !== this.#browsingContext.id) {
          return;
        }
        if (!info.navigation) {
          return;
        }
        if (!this.#id.resolved()) {
          this.#id.resolve(info.navigation);
        }
      });
    }

    for (const [eventName, event] of [
      ['browsingContext.fragmentNavigated', 'fragment'],
      ['browsingContext.navigationFailed', 'failed'],
      ['browsingContext.navigationAborted', 'aborted'],
    ] as const) {
      sessionEmitter.on(eventName, info => {
        if (info.context !== this.#browsingContext.id) {
          return;
        }
        if (!info.navigation) {
          return;
        }
        if (!this.#id.resolved()) {
          this.#id.resolve(info.navigation);
        }
        if (this.#id.value() !== info.navigation) {
          return;
        }
        this.emit(event, {
          url: info.url,
          timestamp: new Date(info.timestamp),
        });
        this.dispose();
      });
    }
  }

  // keep-sorted start block=yes
  get #session() {
    return this.#browsingContext.userContext.browser.session;
  }
  get disposed(): boolean {
    return this.#disposables.disposed;
  }
  get request(): Request | undefined {
    return this.#request;
  }
  // keep-sorted end

  @inertIfDisposed
  private dispose(): void {
    this[disposeSymbol]();
  }

  [disposeSymbol](): void {
    this.#disposables.dispose();
    super[disposeSymbol]();
  }
}
