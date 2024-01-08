/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {Dialog} from '../api/Dialog.js';

import type {BrowsingContext} from './BrowsingContext.js';

/**
 * @internal
 */
export class BidiDialog extends Dialog {
  #context: BrowsingContext;

  /**
   * @internal
   */
  constructor(
    context: BrowsingContext,
    type: Bidi.BrowsingContext.UserPromptOpenedParameters['type'],
    message: string,
    defaultValue?: string
  ) {
    super(type, message, defaultValue);
    this.#context = context;
  }

  /**
   * @internal
   */
  override async handle(options: {
    accept: boolean;
    text?: string;
  }): Promise<void> {
    await this.#context.connection.send('browsingContext.handleUserPrompt', {
      context: this.#context.id,
      accept: options.accept,
      userText: options.text,
    });
  }
}
