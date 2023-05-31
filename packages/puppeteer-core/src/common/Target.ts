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
import {Deferred} from '../util/Deferred.js';

import {CDPSession} from './Connection.js';
import {CDPPage} from './Page.js';
import {Viewport} from './PuppeteerViewport.js';
import {TargetManager} from './TargetManager.js';
import {TaskQueue} from './TaskQueue.js';
import {debugError} from './util.js';
import {WebWorker} from './WebWorker.js';

/**
 * @internal
 */
export enum InitializationStatus {
  SUCCESS = 'success',
  ABORTED = 'aborted',
}

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
  #targetManager: TargetManager;
  #sessionFactory: (isAutoAttachEmulated: boolean) => Promise<CDPSession>;

  /**
   * @internal
   */
  _initializedDeferred = Deferred.create<InitializationStatus>();
  /**
   * @internal
   */
  _isClosedDeferred = Deferred.create<void>();
  /**
   * @internal
   */
  _targetId: string;

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
    return null;
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
    this._initializedDeferred.resolve(InitializationStatus.SUCCESS);
  }

  /**
   * @internal
   */
  protected _checkIfInitialized(): void {
    if (!this._initializedDeferred.resolved()) {
      this._initializedDeferred.resolve(InitializationStatus.SUCCESS);
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
    this._initializedDeferred
      .valueOrThrow()
      .then(async result => {
        if (result === InitializationStatus.ABORTED) {
          return;
        }
        const opener = this.opener();
        if (!(opener instanceof PageTarget)) {
          return;
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
        session
          ? Promise.resolve(session)
          : this._sessionFactory()(/* isAutoAttachEmulated=*/ false)
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
    if (this._initializedDeferred.resolved()) {
      return;
    }
    if (this._getTargetInfo().url !== '') {
      this._initializedDeferred.resolve(InitializationStatus.SUCCESS);
    }
  }
}

/**
 * @internal
 */
export class WorkerTarget extends Target {
  #workerPromise?: Promise<WebWorker>;

  override async worker(): Promise<WebWorker | null> {
    if (!this.#workerPromise) {
      const session = this._session();
      // TODO(einbinder): Make workers send their console logs.
      this.#workerPromise = (
        session
          ? Promise.resolve(session)
          : this._sessionFactory()(/* isAutoAttachEmulated=*/ false)
      ).then(client => {
        return new WebWorker(
          client,
          this._getTargetInfo().url,
          () => {} /* consoleAPICalled */,
          () => {} /* exceptionThrown */
        );
      });
    }
    return this.#workerPromise;
  }
}

/**
 * @internal
 */
export class OtherTarget extends Target {}
