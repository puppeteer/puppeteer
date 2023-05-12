/**
 * Copyright 2019 Google Inc. All rights reserved.
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

import {Protocol} from 'devtools-protocol';

import type {Browser} from '../api/Browser.js';
import type {BrowserContext} from '../api/BrowserContext.js';
import {Page, PageEmittedEvents} from '../api/Page.js';

import {CDPSession} from './Connection.js';
import {CDPPage} from './Page.js';
import {Viewport} from './PuppeteerViewport.js';
import {TargetManager} from './TargetManager.js';
import {TaskQueue} from './TaskQueue.js';
import {debugError} from './util.js';
import {WebWorker} from './WebWorker.js';

/**
 * Target represents a
 * {@link https://chromedevtools.github.io/devtools-protocol/tot/Target/ | CDP target}.
 * In CDP a target is something that can be debugged such a frame, a page or a
 * worker.
 *
 * @public
 */
export class Target {
  #browserContext: BrowserContext;
  #session?: CDPSession;
  #targetInfo: Protocol.Target.TargetInfo;
  #sessionFactory: (isAutoAttachEmulated: boolean) => Promise<CDPSession>;
  #workerPromise?: Promise<WebWorker>;

  /**
   * @internal
   */
  _initializedPromise: Promise<boolean>;
  /**
   * @internal
   */
  _initializedCallback!: (x: boolean) => void;
  /**
   * @internal
   */
  _isClosedPromise: Promise<void>;
  /**
   * @internal
   */
  _closedCallback!: () => void;
  /**
   * @internal
   */
  _isInitialized = false;
  /**
   * @internal
   */
  _targetId: string;

  #targetManager: TargetManager;

  /**
   * @internal
   */
  constructor(
    targetInfo: Protocol.Target.TargetInfo,
    session: CDPSession | undefined,
    browserContext: BrowserContext,
    targetManager: TargetManager,
    sessionFactory: (isAutoAttachEmulated: boolean) => Promise<CDPSession>
  ) {
    this.#session = session;
    this.#targetManager = targetManager;
    this.#targetInfo = targetInfo;
    this.#browserContext = browserContext;
    this._targetId = targetInfo.targetId;
    this.#sessionFactory = sessionFactory;
    this._initializedPromise = new Promise<boolean>(fulfill => {
      return (this._initializedCallback = fulfill);
    });
    this._isClosedPromise = new Promise<void>(fulfill => {
      return (this._closedCallback = fulfill);
    });
    this._initialize();
  }

  /**
   * @internal
   */
  _session(): CDPSession | undefined {
    return this.#session;
  }

  /**
   * @internal
   */
  protected _sessionFactory(): (
    isAutoAttachEmulated: boolean
  ) => Promise<CDPSession> {
    return this.#sessionFactory;
  }

  /**
   * Creates a Chrome Devtools Protocol session attached to the target.
   */
  createCDPSession(): Promise<CDPSession> {
    return this.#sessionFactory(false);
  }

  /**
   * @internal
   */
  _targetManager(): TargetManager {
    return this.#targetManager;
  }

  /**
   * @internal
   */
  _getTargetInfo(): Protocol.Target.TargetInfo {
    return this.#targetInfo;
  }

  /**
   * If the target is not of type `"service_worker"` or `"shared_worker"`, returns `null`.
   */
  async worker(): Promise<WebWorker | null> {
    if (
      this.#targetInfo.type !== 'service_worker' &&
      this.#targetInfo.type !== 'shared_worker'
    ) {
      return null;
    }
    if (!this.#workerPromise) {
      // TODO(einbinder): Make workers send their console logs.
      this.#workerPromise = (
        this.#session
          ? Promise.resolve(this.#session)
          : this.#sessionFactory(false)
      ).then(client => {
        return new WebWorker(
          client,
          this.#targetInfo.url,
          () => {} /* consoleAPICalled */,
          () => {} /* exceptionThrown */
        );
      });
    }
    return this.#workerPromise;
  }

  url(): string {
    return this.#targetInfo.url;
  }

  /**
   * Identifies what kind of target this is.
   *
   * @remarks
   *
   * See {@link https://developer.chrome.com/extensions/background_pages | docs} for more info about background pages.
   */
  type():
    | 'page'
    | 'background_page'
    | 'service_worker'
    | 'shared_worker'
    | 'other'
    | 'browser'
    | 'webview' {
    const type = this.#targetInfo.type;
    if (
      type === 'page' ||
      type === 'background_page' ||
      type === 'service_worker' ||
      type === 'shared_worker' ||
      type === 'browser' ||
      type === 'webview'
    ) {
      return type;
    }
    return 'other';
  }

  /**
   * Get the browser the target belongs to.
   */
  browser(): Browser {
    return this.#browserContext.browser();
  }

  /**
   * Get the browser context the target belongs to.
   */
  browserContext(): BrowserContext {
    return this.#browserContext;
  }

  /**
   * Get the target that opened this target. Top-level targets return `null`.
   */
  opener(): Target | undefined {
    const {openerId} = this.#targetInfo;
    if (!openerId) {
      return;
    }
    return this.browser()._targets.get(openerId);
  }

  /**
   * @internal
   */
  _targetInfoChanged(targetInfo: Protocol.Target.TargetInfo): void {
    this.#targetInfo = targetInfo;
    this._checkIfInitialized();
  }

  /**
   * @internal
   */
  protected _initialize(): void {
    // TODO: refactor to deferred promises.
    this._isInitialized = true;
    if (this._isInitialized) {
      this._initializedCallback(true);
    }
  }

  /**
   * @internal
   */
  protected _checkIfInitialized(): void {
    if (!this._isInitialized) {
      this._isInitialized = true;
      this._initializedCallback(true);
      return;
    }
  }

  /**
   * If the target is not of type `"page"`, `"webview"` or `"background_page"`,
   * returns `null`.
   */
  async page(): Promise<Page | null> {
    return null;
  }
}

/**
 * @internal
 */
export class PageTarget extends Target {
  #defaultViewport?: Viewport;
  protected pagePromise?: Promise<Page>;
  #screenshotTaskQueue: TaskQueue;
  #ignoreHTTPSErrors: boolean;

  /**
   * @internal
   */
  constructor(
    targetInfo: Protocol.Target.TargetInfo,
    session: CDPSession | undefined,
    browserContext: BrowserContext,
    targetManager: TargetManager,
    sessionFactory: (isAutoAttachEmulated: boolean) => Promise<CDPSession>,
    ignoreHTTPSErrors: boolean,
    defaultViewport: Viewport | null,
    screenshotTaskQueue: TaskQueue
  ) {
    super(targetInfo, session, browserContext, targetManager, sessionFactory);
    this.#ignoreHTTPSErrors = ignoreHTTPSErrors;
    this.#defaultViewport = defaultViewport ?? undefined;
    this.#screenshotTaskQueue = screenshotTaskQueue;
  }

  protected override _initialize(): void {
    this._initializedPromise
      .then(async success => {
        if (!success) {
          return false;
        }
        const opener = this.opener();
        if (!(opener instanceof PageTarget)) {
          return true;
        }
        if (!opener || !opener.pagePromise || this.type() !== 'page') {
          return true;
        }
        const openerPage = await opener.pagePromise;
        if (!openerPage.listenerCount(PageEmittedEvents.Popup)) {
          return true;
        }
        const popupPage = await this.page();
        openerPage.emit(PageEmittedEvents.Popup, popupPage);
        return true;
      })
      .catch(debugError);
    this._checkIfInitialized();
  }

  override async page(): Promise<Page | null> {
    if (!this.pagePromise) {
      const session = this._session();
      this.pagePromise = (
        session ? Promise.resolve(session) : this._sessionFactory()(true)
      ).then(client => {
        return CDPPage._create(
          client,
          this,
          this.#ignoreHTTPSErrors,
          this.#defaultViewport ?? null,
          this.#screenshotTaskQueue
        );
      });
    }
    return (await this.pagePromise) ?? null;
  }

  override _checkIfInitialized(): void {
    if (this._isInitialized) {
      return;
    }
    this._isInitialized = this._getTargetInfo().url !== '';
    if (this._isInitialized) {
      this._initializedCallback(true);
    }
  }
}
