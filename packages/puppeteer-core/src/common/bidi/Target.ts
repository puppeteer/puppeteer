/**
 * Copyright 2023 Google Inc. All rights reserved.
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

import {Target, TargetType} from '../../api/Target.js';
import {CDPSession} from '../Connection.js';
import type {WebWorker} from '../WebWorker.js';
import {Browser} from './Browser.js';
import {BrowserContext} from './BrowserContext.js';
import {BrowsingContext} from './BrowsingContext.js';
import {Page} from './Page.js';

export class BiDiTarget extends Target {
  #browsingContext: BrowsingContext;

  constructor(browsingContext: BrowsingContext) {
    super();

    this.#browsingContext = browsingContext;
  }

  override async worker(): Promise<WebWorker | null> {
    return null;
  }

  /**
   * If the target is not of type `"page"`, `"webview"` or `"background_page"`,
   * returns `null`.
   */
  override async page(): Promise<Page | null> {
    return null;
  }

  override url(): string {
    return this.#browsingContext.url;
  }

  /**
   * Creates a Chrome Devtools Protocol session attached to the target.
   */
  override createCDPSession(): Promise<CDPSession> {
    throw new Error('Not implemented');
  }

  /**
   * Identifies what kind of target this is.
   *
   * @remarks
   *
   * See {@link https://developer.chrome.com/extensions/background_pages | docs} for more info about background pages.
   */
  override type(): TargetType {
    return TargetType.PAGE;
  }

  /**
   * Get the browser the target belongs to.
   */
  override browser(): Browser {
    throw new Error('No implemented');
  }

  /**
   * Get the browser context the target belongs to.
   */
  override browserContext(): BrowserContext {
    throw new Error('not implemented');
  }

  /**
   * Get the target that opened this target. Top-level targets return `null`.
   */
  override opener(): Target | undefined {
    throw new Error('not implemented');
  }
}
