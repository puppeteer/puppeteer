/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {EventEmitter} from '../../common/EventEmitter.js';
import {Deferred} from '../../util/Deferred.js';

import type BrowsingContext from './BrowsingContext.js';
import type Request from './Request.js';

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
export default class Navigation extends EventEmitter<{
  fragment: NavigationInfo;
  failed: NavigationInfo;
  aborted: NavigationInfo;
}> {
  static from(context: BrowsingContext, url: string): Navigation {
    const navigation = new Navigation(context, url);
    navigation.#initialize();
    return navigation;
  }

  // keep-sorted start
  #context: BrowsingContext;
  #id = new Deferred<string>();
  #request: Request | undefined;
  #url: string;
  // keep-sorted end

  private constructor(context: BrowsingContext, url: string) {
    super();

    // keep-sorted start
    this.#context = context;
    this.#url = url;
    // keep-sorted end
  }

  #initialize() {
    // ///////////////////////
    // Connection listeners //
    // ///////////////////////
    const connection = this.#connection;
    for (const [bidiEvent, event] of [
      ['browsingContext.fragmentNavigated', 'fragment'],
      ['browsingContext.navigationFailed', 'failed'],
      ['browsingContext.navigationAborted', 'aborted'],
    ] as const) {
      connection.on(bidiEvent, (info: Bidi.BrowsingContext.NavigationInfo) => {
        if (info.context !== this.#context.id) {
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
        this.#url = info.url;
        this.emit(event, {
          url: this.#url,
          timestamp: new Date(info.timestamp),
        });
      });
    }

    // ///////////////////
    // Parent listeners //
    // ///////////////////
    this.#context.on('request', ({request}) => {
      if (request.navigation === this.#id.value()) {
        this.#request = request;
      }
    });
  }

  get #connection() {
    return this.#context.userContext.browser.session.connection;
  }

  get url(): string {
    return this.#url;
  }

  request(): Request | undefined {
    return this.#request;
  }
}
