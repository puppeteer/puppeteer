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

import type {Browser} from '../api/Browser.js';
import type {BrowserContext} from '../api/BrowserContext.js';
import {Page} from '../api/Page.js';
import {CDPSession} from '../common/Connection.js';
import {WebWorker} from '../common/WebWorker.js';

/**
 * @public
 */
export enum TargetType {
  PAGE = 'page',
  BACKGROUND_PAGE = 'background_page',
  SERVICE_WORKER = 'service_worker',
  SHARED_WORKER = 'shared_worker',
  BROWSER = 'browser',
  WEBVIEW = 'webview',
  OTHER = 'other',
  /**
   * @internal
   */
  TAB = 'tab',
}

/**
 * Target represents a
 * {@link https://chromedevtools.github.io/devtools-protocol/tot/Target/ | CDP target}.
 * In CDP a target is something that can be debugged such a frame, a page or a
 * worker.
 * @public
 */
export class Target {
  /**
   * @internal
   */
  protected constructor() {}

  /**
   * If the target is not of type `"service_worker"` or `"shared_worker"`, returns `null`.
   */
  async worker(): Promise<WebWorker | null> {
    return null;
  }

  /**
   * If the target is not of type `"page"`, `"webview"` or `"background_page"`,
   * returns `null`.
   */
  async page(): Promise<Page | null> {
    return null;
  }

  url(): string {
    throw new Error('not implemented');
  }

  /**
   * Creates a Chrome Devtools Protocol session attached to the target.
   */
  createCDPSession(): Promise<CDPSession> {
    throw new Error('not implemented');
  }

  /**
   * Identifies what kind of target this is.
   *
   * @remarks
   *
   * See {@link https://developer.chrome.com/extensions/background_pages | docs} for more info about background pages.
   */
  type(): TargetType {
    throw new Error('not implemented');
  }

  /**
   * Get the browser the target belongs to.
   */
  browser(): Browser {
    throw new Error('not implemented');
  }

  /**
   * Get the browser context the target belongs to.
   */
  browserContext(): BrowserContext {
    throw new Error('not implemented');
  }

  /**
   * Get the target that opened this target. Top-level targets return `null`.
   */
  opener(): Target | undefined {
    throw new Error('not implemented');
  }
}
