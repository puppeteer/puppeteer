/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {EventEmitter} from '../../common/EventEmitter.js';
import {inertIfDisposed} from '../../util/decorators.js';
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
  /** Emitted when navigation failed. */
  failed: NavigationInfo;
  /** Emitted when navigation was aborted. */
  aborted: NavigationInfo;
}> {
  static from(context: BrowsingContext, url: string): Navigation {
    const navigation = new Navigation(context, url);
    navigation.#initialize();
    return navigation;
  }

  #request: Request | undefined;
  #navigation: Navigation | undefined;
  readonly #browsingContext: BrowsingContext;
  readonly #disposables = new DisposableStack();
  #id?: string | null;
  readonly #url: string;

  private constructor(context: BrowsingContext, url: string) {
    super();

    this.#browsingContext = context;
    this.#url = url;
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

    browsingContextEmitter.on('request', ({request}) => {
      if (
        request.navigation === undefined ||
        // If a request with a navigation ID comes in, then the navigation ID is
        // for this navigation.
        !this.#matches(request.navigation)
      ) {
        return;
      }

      this.#request = request;
      this.emit('request', request);
      const requestEmitter = this.#disposables.use(
        new EventEmitter(this.#request)
      );

      requestEmitter.on('redirect', request => {
        this.#request = request;
      });
    });

    const sessionEmitter = this.#disposables.use(
      new EventEmitter(this.#session)
    );
    for (const [eventName, event] of [
      ['browsingContext.navigationFailed', 'failed'],
      ['browsingContext.navigationAborted', 'aborted'],
    ] as const) {
      sessionEmitter.on(eventName, info => {
        if (
          info.context !== this.#browsingContext.id ||
          // Note we don't check if `navigation` is null since `null` means the
          // fragment navigated.
          !this.#matches(info.navigation)
        ) {
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

  #matches(navigation: string | null): boolean {
    if (this.#navigation !== undefined && !this.#navigation.disposed) {
      return false;
    }
    if (this.#id === undefined) {
      this.#id = navigation;
      return true;
    }
    return this.#id === navigation;
  }

  get #session() {
    return this.#browsingContext.userContext.browser.session;
  }
  get disposed(): boolean {
    return this.#disposables.disposed;
  }
  get request(): Request | undefined {
    return this.#request;
  }
  get url(): string {
    return this.#url;
  }

  @inertIfDisposed
  dispose(): void {
    this[disposeSymbol]();
  }

  [disposeSymbol](): void {
    this.#disposables.dispose();
    super[disposeSymbol]();
  }
}
