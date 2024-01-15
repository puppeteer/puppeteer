/**
 * Copyright 2017 Google Inc. All rights reserved.
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

import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {EventEmitter} from '../../common/EventEmitter.js';

import type BrowsingContext from './BrowsingContext.js';

export type HandleOptions = Omit<
  Bidi.BrowsingContext.HandleUserPromptParameters,
  'context'
>;

export type UserPromptResult = Omit<
  Bidi.BrowsingContext.UserPromptClosedParameters,
  'context'
>;

/**
 * @internal
 */
export default class UserPrompt extends EventEmitter<{
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
  #result?: UserPromptResult;
  readonly info: Bidi.BrowsingContext.UserPromptOpenedParameters;
  readonly browsingContext: BrowsingContext;
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
    // Connection listeners //
    // ///////////////////////
    this.#connection.on('browsingContext.userPromptClosed', parameters => {
      if (parameters.context !== this.browsingContext.id) {
        return;
      }
      this.#result = parameters;
      this.emit('handled', parameters);
      this.removeAllListeners();
    });
  }

  // keep-sorted start block=yes
  get #connection() {
    return this.browsingContext.userContext.browser.session.connection;
  }
  get result(): UserPromptResult | undefined {
    return this.#result;
  }
  // keep-sorted end

  async handle(options: HandleOptions = {}): Promise<UserPromptResult> {
    await this.#connection.send('browsingContext.handleUserPrompt', {
      ...options,
      context: this.info.context,
    });
    // SAFETY: `handled` is triggered before the above promise resolved.
    return this.#result!;
  }
}
