/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {EventEmitter} from '../../common/EventEmitter.js';
import {inertIfDisposed, throwIfDisposed} from '../../util/decorators.js';
import {DisposableStack, disposeSymbol} from '../../util/disposable.js';

import type {BrowsingContext} from './BrowsingContext.js';

/**
 * @internal
 */
export type HandleOptions = Omit<
  Bidi.BrowsingContext.HandleUserPromptParameters,
  'context'
>;

/**
 * @internal
 */
export type UserPromptResult = Omit<
  Bidi.BrowsingContext.UserPromptClosedParameters,
  'context'
>;

/**
 * @internal
 */
export class UserPrompt extends EventEmitter<{
  /** Emitted when the user prompt is handled. */
  handled: UserPromptResult;
  /** Emitted when the user prompt is closed. */
  closed: {
    /** The reason the user prompt was closed. */
    reason: string;
  };
}> {
  static from(
    browsingContext: BrowsingContext,
    info: Bidi.BrowsingContext.UserPromptOpenedParameters
  ): UserPrompt {
    const userPrompt = new UserPrompt(browsingContext, info);
    userPrompt.#initialize();
    return userPrompt;
  }

  // keep-sorted start
  #reason?: string;
  #result?: UserPromptResult;
  readonly #disposables = new DisposableStack();
  readonly browsingContext: BrowsingContext;
  readonly info: Bidi.BrowsingContext.UserPromptOpenedParameters;
  // keep-sorted end

  private constructor(
    context: BrowsingContext,
    info: Bidi.BrowsingContext.UserPromptOpenedParameters
  ) {
    super();
    // keep-sorted start
    this.browsingContext = context;
    this.info = info;
    // keep-sorted end
  }

  #initialize() {
    const browserContextEmitter = this.#disposables.use(
      new EventEmitter(this.browsingContext)
    );
    browserContextEmitter.once('closed', ({reason}) => {
      this.dispose(`User prompt already closed: ${reason}`);
    });

    const sessionEmitter = this.#disposables.use(
      new EventEmitter(this.#session)
    );
    sessionEmitter.on('browsingContext.userPromptClosed', parameters => {
      if (parameters.context !== this.browsingContext.id) {
        return;
      }
      this.#result = parameters;
      this.emit('handled', parameters);
      this.dispose('User prompt already handled.');
    });
  }

  // keep-sorted start block=yes
  get #session() {
    return this.browsingContext.userContext.browser.session;
  }
  get closed(): boolean {
    return this.#reason !== undefined;
  }
  get disposed(): boolean {
    return this.closed;
  }
  get handled(): boolean {
    return this.#result !== undefined;
  }
  get result(): UserPromptResult | undefined {
    return this.#result;
  }
  // keep-sorted end

  @inertIfDisposed
  private dispose(reason?: string): void {
    this.#reason = reason;
    this[disposeSymbol]();
  }

  @throwIfDisposed<UserPrompt>(prompt => {
    // SAFETY: Disposal implies this exists.
    return prompt.#reason!;
  })
  async handle(options: HandleOptions = {}): Promise<UserPromptResult> {
    await this.#session.send('browsingContext.handleUserPrompt', {
      ...options,
      context: this.info.context,
    });
    // SAFETY: `handled` is triggered before the above promise resolved.
    return this.#result!;
  }

  [disposeSymbol](): void {
    this.#reason ??=
      'User prompt already closed, probably because the associated browsing context was destroyed.';
    this.emit('closed', {reason: this.#reason});

    this.#disposables.dispose();
    super[disposeSymbol]();
  }
}
