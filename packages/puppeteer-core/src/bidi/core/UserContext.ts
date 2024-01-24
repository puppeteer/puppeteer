/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {EventEmitter} from '../../common/EventEmitter.js';
import {assert} from '../../util/assert.js';
import {throwIfDisposed} from '../../util/decorators.js';
import {DisposableStack, disposeSymbol} from '../../util/disposable.js';

import type {Browser} from './Browser.js';
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
}> {
  static create(browser: Browser, id: string): UserContext {
    const context = new UserContext(browser, id);
    context.#initialize();
    return context;
  }

  // keep-sorted start
  #reason?: string;
  // Note these are only top-level contexts.
  readonly #browsingContexts = new Map<string, BrowsingContext>();
  // @ts-expect-error -- TODO: This will be used once the WebDriver BiDi
  // protocol supports it.
  readonly #id: string;
  readonly #disposables = new DisposableStack();
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
    // ////////////////////
    // Session listeners //
    // ////////////////////
    const sessionEmitter = this.#disposables.use(
      new EventEmitter(this.#session)
    );
    sessionEmitter.on('browsingContext.contextCreated', info => {
      if (info.parent) {
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
      browsingContextEmitter.on('destroyed', () => {
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
  get disposed(): boolean {
    return Boolean(this.#reason);
  }
  // keep-sorted end

  dispose(reason?: string): void {
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
    });

    const browsingContext = this.#browsingContexts.get(contextId);
    assert(
      browsingContext,
      'The WebDriver BiDi implementation is failing to create a browsing context correctly.'
    );

    // We use an array to avoid the promise from being awaited.
    return browsingContext;
  }

  async close(): Promise<void> {
    const promises = [];
    for (const browsingContext of this.#browsingContexts.values()) {
      promises.push(browsingContext.close());
    }
    await Promise.all(promises);
    this.dispose('User context was closed.');
  }

  [disposeSymbol](): void {
    super[disposeSymbol]();

    if (this.#reason === undefined) {
      this.#reason =
        'User context was destroyed, probably because browser disconnected/closed.';
    }

    this.#disposables.dispose();
  }
}
