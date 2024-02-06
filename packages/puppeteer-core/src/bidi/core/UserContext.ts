/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {EventEmitter} from '../../common/EventEmitter.js';
import {assert} from '../../util/assert.js';
import {inertIfDisposed, throwIfDisposed} from '../../util/decorators.js';
import {DisposableStack, disposeSymbol} from '../../util/disposable.js';

import type {Browser} from './Browser.js';
import type {GetCookiesOptions} from './BrowsingContext.js';
import {BrowsingContext} from './BrowsingContext.js';

/**
 * @internal
 */
export type CreateBrowsingContextOptions = Omit<
  Bidi.BrowsingContext.CreateParameters,
  'type' | 'referenceContext'
> & {
  referenceContext?: BrowsingContext;
};

/**
 * @internal
 */
export class UserContext extends EventEmitter<{
  /**
   * Emitted when a new browsing context is created.
   */
  browsingcontext: {
    /** The new browsing context. */
    browsingContext: BrowsingContext;
  };
  /**
   * Emitted when the user context is closed.
   */
  closed: {
    /** The reason the user context was closed. */
    reason: string;
  };
}> {
  static DEFAULT = 'default' as const;

  static create(browser: Browser, id: string): UserContext {
    const context = new UserContext(browser, id);
    context.#initialize();
    return context;
  }

  // keep-sorted start
  #reason?: string;
  // Note these are only top-level contexts.
  readonly #browsingContexts = new Map<string, BrowsingContext>();
  readonly #disposables = new DisposableStack();
  readonly #id: string;
  readonly browser: Browser;
  // keep-sorted end

  private constructor(browser: Browser, id: string) {
    super();
    // keep-sorted start
    this.#id = id;
    this.browser = browser;
    // keep-sorted end
  }

  #initialize() {
    const browserEmitter = this.#disposables.use(
      new EventEmitter(this.browser)
    );
    browserEmitter.once('closed', ({reason}) => {
      this.dispose(`User context already closed: ${reason}`);
    });

    const sessionEmitter = this.#disposables.use(
      new EventEmitter(this.#session)
    );
    sessionEmitter.on('browsingContext.contextCreated', info => {
      if (info.parent) {
        return;
      }

      if (info.userContext !== this.#id) {
        return;
      }

      const browsingContext = BrowsingContext.from(
        this,
        undefined,
        info.context,
        info.url
      );
      this.#browsingContexts.set(browsingContext.id, browsingContext);

      const browsingContextEmitter = this.#disposables.use(
        new EventEmitter(browsingContext)
      );
      browsingContextEmitter.on('closed', () => {
        browsingContextEmitter.removeAllListeners();

        this.#browsingContexts.delete(browsingContext.id);
      });

      this.emit('browsingcontext', {browsingContext});
    });
  }

  // keep-sorted start block=yes
  get #session() {
    return this.browser.session;
  }
  get browsingContexts(): Iterable<BrowsingContext> {
    return this.#browsingContexts.values();
  }
  get closed(): boolean {
    return this.#reason !== undefined;
  }
  get disposed(): boolean {
    return this.closed;
  }
  get id(): string {
    return this.#id;
  }
  // keep-sorted end

  @inertIfDisposed
  private dispose(reason?: string): void {
    this.#reason = reason;
    this[disposeSymbol]();
  }

  @throwIfDisposed<UserContext>(context => {
    // SAFETY: Disposal implies this exists.
    return context.#reason!;
  })
  async createBrowsingContext(
    type: Bidi.BrowsingContext.CreateType,
    options: CreateBrowsingContextOptions = {}
  ): Promise<BrowsingContext> {
    const {
      result: {context: contextId},
    } = await this.#session.send('browsingContext.create', {
      type,
      ...options,
      referenceContext: options.referenceContext?.id,
      userContext: this.#id,
    });

    const browsingContext = this.#browsingContexts.get(contextId);
    assert(
      browsingContext,
      'The WebDriver BiDi implementation is failing to create a browsing context correctly.'
    );

    // We use an array to avoid the promise from being awaited.
    return browsingContext;
  }

  @throwIfDisposed<UserContext>(context => {
    // SAFETY: Disposal implies this exists.
    return context.#reason!;
  })
  async remove(): Promise<void> {
    try {
      await this.#session.send('browser.removeUserContext', {
        userContext: this.#id,
      });
    } finally {
      this.dispose('User context already closed.');
    }
  }

  @throwIfDisposed<UserContext>(context => {
    // SAFETY: Disposal implies this exists.
    return context.#reason!;
  })
  async getCookies(
    options: GetCookiesOptions = {},
    sourceOrigin: string | undefined = undefined
  ): Promise<Bidi.Network.Cookie[]> {
    const {
      result: {cookies},
    } = await this.#session.send('storage.getCookies', {
      ...options,
      partition: {
        type: 'storageKey',
        userContext: this.#id,
        sourceOrigin,
      },
    });
    return cookies;
  }

  @throwIfDisposed<UserContext>(context => {
    // SAFETY: Disposal implies this exists.
    return context.#reason!;
  })
  async setCookie(
    cookie: Bidi.Storage.PartialCookie,
    sourceOrigin?: string
  ): Promise<void> {
    await this.#session.send('storage.setCookie', {
      cookie,
      partition: {
        type: 'storageKey',
        sourceOrigin,
        userContext: this.id,
      },
    });
  }

  [disposeSymbol](): void {
    this.#reason ??=
      'User context already closed, probably because the browser disconnected/closed.';
    this.emit('closed', {reason: this.#reason});

    this.#disposables.dispose();
    super[disposeSymbol]();
  }
}
