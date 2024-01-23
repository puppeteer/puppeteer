/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {EventEmitter} from '../../common/EventEmitter.js';
import {throwIfDisposed} from '../../util/decorators.js';
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
  handled: UserPromptResult;
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
    this.info = info;
    this.browsingContext = context;
    // keep-sorted end
  }

  #initialize() {
    // ///////////////////////
    // Session listeners //
    // ///////////////////////
    const session = this.#disposables.use(new EventEmitter(this.#session));
    session.on('browsingContext.userPromptClosed', parameters => {
      if (parameters.context !== this.browsingContext.id) {
        return;
      }
      this.#result = parameters;
      this.emit('handled', parameters);
      this.dispose('User prompt was handled.');
    });
  }

  // keep-sorted start block=yes
  get #session() {
    return this.browsingContext.userContext.browser.session;
  }
  get disposed(): boolean {
    return Boolean(this.#reason);
  }
  get result(): UserPromptResult | undefined {
    return this.#result;
  }
  // keep-sorted end

  dispose(reason?: string): void {
    this.#reason = reason;
    this[disposeSymbol]();
  }

  @throwIfDisposed((prompt: UserPrompt) => {
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
    super[disposeSymbol]();

    if (this.#reason === undefined) {
      this.#reason =
        'User prompt was destroyed, probably because the associated browsing context was destroyed.';
    }

    this.#disposables.dispose();
  }
}
