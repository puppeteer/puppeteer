/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {EventEmitter} from '../../common/EventEmitter.js';
import {assert} from '../../util/assert.js';

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
  /**
   * Emitted when the user context is destroyed.
   */
  destroyed: {
    /** The user context that was destroyed. */
    userContext: UserContext;
  };
}> {
  static DEFAULT = 'default';

  static create(browser: Browser, id: string): UserContext {
    const context = new UserContext(browser, id);
    context.#initialize();
    return context;
  }

  // keep-sorted start
  // Note these are only top-level contexts.
  readonly #browsingContexts = new Map<string, BrowsingContext>();
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
    // ///////////////////////
    // Session listeners //
    // ///////////////////////
    const session = this.#session;
    session.on('browsingContext.contextCreated', info => {
      if (info.parent) {
        return;
      }

      const browsingContext = BrowsingContext.from(
        this,
        undefined,
        info.context,
        info.url
      );
      browsingContext.on('destroyed', () => {
        this.#browsingContexts.delete(browsingContext.id);
      });

      this.#browsingContexts.set(browsingContext.id, browsingContext);

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
  get id(): string {
    return this.#id;
  }
  // keep-sorted end

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

  async remove(): Promise<void> {
    // TODO: Call `removeUserContext` once available.
    this.emit('destroyed', {userContext: this});
    this.removeAllListeners();
  }
}
