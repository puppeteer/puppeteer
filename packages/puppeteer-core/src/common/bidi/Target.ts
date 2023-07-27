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
import {BrowsingContext, CDPSessionWrapper} from './BrowsingContext.js';
import {Page} from './Page.js';

export class BiDiTarget extends Target {
  protected _browserContext: BrowserContext;

  constructor(browserContext: BrowserContext) {
    super();
    this._browserContext = browserContext;
  }

  override async worker(): Promise<WebWorker | null> {
    return null;
  }

  override browser(): Browser {
    return this._browserContext.browser();
  }

  override browserContext(): BrowserContext {
    return this._browserContext;
  }

  override opener(): Target | undefined {
    throw new Error('Not implemented');
  }

  _setBrowserContext(browserContext: BrowserContext): void {
    this._browserContext = browserContext;
  }
}

/**
 * @internal
 */
export class BiDiBrowserTarget extends BiDiTarget {
  override url(): string {
    return '';
  }

  override type(): TargetType {
    return TargetType.BROWSER;
  }
}

/**
 * @internal
 */
export class BiDiBrowsingContextTarget extends BiDiTarget {
  protected _browsingContext: BrowsingContext;

  constructor(
    browserContext: BrowserContext,
    browsingContext: BrowsingContext
  ) {
    super(browserContext);

    this._browsingContext = browsingContext;
  }

  override url(): string {
    return this._browsingContext.url;
  }

  override async createCDPSession(): Promise<CDPSession> {
    const {sessionId} = await this._browsingContext.cdpSession.send(
      'Target.attachToTarget',
      {
        targetId: this._browsingContext.id,
        flatten: true,
      }
    );
    return new CDPSessionWrapper(this._browsingContext, sessionId);
  }

  override type(): TargetType {
    return TargetType.PAGE;
  }
}

/**
 * @internal
 */
export class BiDiPageTarget extends BiDiBrowsingContextTarget {
  #page: Page;

  constructor(
    browserContext: BrowserContext,
    browsingContext: BrowsingContext
  ) {
    super(browserContext, browsingContext);

    this.#page = new Page(browsingContext, browserContext);
  }

  override async page(): Promise<Page | null> {
    return this.#page;
  }

  override _setBrowserContext(browserContext: BrowserContext): void {
    super._setBrowserContext(browserContext);
    this.#page._setBrowserContext(browserContext);
  }
}
