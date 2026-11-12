/**
 * @license
 * Copyright 2019 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {Protocol} from 'devtools-protocol';

import {BrowserEvent, type Browser} from '../api/Browser.js';
import {
  BrowserContextEvent,
  type BrowserContext,
} from '../api/BrowserContext.js';
import {PageEvent, type Page} from '../api/Page.js';
import {Target, TargetType} from '../api/Target.js';
import {WebWorkerEvent} from '../api/WebWorker.js';
import {DEBUG_PREFIXES, type Logger} from '../common/Debug.js';
import type {Viewport} from '../common/Viewport.js';
import {Deferred} from '../util/Deferred.js';

import type {CdpCDPSession} from './CdpSession.js';
import {CdpPage} from './Page.js';
import type {TargetManager} from './TargetManager.js';
import {CdpWebWorker} from './WebWorker.js';

/**
 * @internal
 */
export enum InitializationStatus {
  SUCCESS = 'success',
  ABORTED = 'aborted',
}

/**
 * @internal
 */
export class CdpTarget extends Target {
  #browserContext?: BrowserContext;
  #session?: CdpCDPSession;
  #targetInfo: Protocol.Target.TargetInfo;
  #targetManager?: TargetManager;
  #sessionFactory:
    ((isAutoAttachEmulated: boolean) => Promise<CdpCDPSession>) | undefined;
  #logger: Logger;
  #parentTarget?: CdpTarget;
  #childTargets = new Set<CdpTarget>();
  /**
   * Pages for which this target is the tab target. A page keeps its tab target
   * for its whole life, but its primary target can change, for example when a
   * prerendered page activates.
   */
  #tabPages = new Set<CdpPage>();
  _initializedDeferred = Deferred.create<InitializationStatus>();
  _isClosedDeferred = Deferred.create<void>();
  _targetId: string;
  _asPagePromise?: Promise<Page>;
  /** @internal */
  pagePromise?: Promise<Page>;

  /**
   * To initialize the target for use, call initialize.
   *
   * @internal
   */
  constructor(
    targetInfo: Protocol.Target.TargetInfo,
    session: CdpCDPSession | undefined,
    browserContext: BrowserContext | undefined,
    targetManager: TargetManager | undefined,
    sessionFactory:
      ((isAutoAttachEmulated: boolean) => Promise<CdpCDPSession>) | undefined,
    logger: Logger,
    parentTarget?: CdpTarget,
  ) {
    super(logger);
    this.#session = session;
    this.#targetManager = targetManager;
    this.#targetInfo = targetInfo;
    this.#browserContext = browserContext;
    this._targetId = targetInfo.targetId;
    this.#sessionFactory = sessionFactory;
    this.#logger = logger;
    this.#parentTarget = parentTarget;
    if (this.#session) {
      this.#session.setTarget(this);
    }
  }

  override async page(): Promise<Page | null> {
    if (this.type() === TargetType.TAB) {
      if (this.isDiscarded()) {
        return null;
      }
      return (await this._primaryChildTarget()?.page()) ?? null;
    }
    return null;
  }

  override async asPage(): Promise<Page> {
    if (this.type() === TargetType.TAB) {
      if (this.isDiscarded()) {
        throw new Error('Cannot create a page for a discarded tab.');
      }
      // Force a page for the content of the tab, like asPage() does for
      // other targets. The child can be a target that page() ignores.
      const child = this._primaryChildTarget();
      if (!child) {
        throw new Error('The tab target has no page.');
      }
      return await child.asPage();
    }
    if (this._subtype() === 'prerender') {
      throw new Error('Cannot create a page for a prerender target.');
    }
    this._adoptExistingPage();
    if (this.pagePromise) {
      const page = await this.pagePromise;
      if (page) {
        return page;
      }
    }
    if (!this._asPagePromise) {
      const session = this._session();
      this._asPagePromise = (
        session
          ? Promise.resolve(session)
          : this._sessionFactory()(/* isAutoAttachEmulated=*/ false)
      ).then(client => {
        return CdpPage._create(client, this, null, this.#logger);
      });
    }
    return (await this._asPagePromise) ?? null;
  }

  _subtype(): string | undefined {
    return this.#targetInfo.subtype;
  }

  override subtype(): string | undefined {
    return this.#targetInfo.subtype;
  }

  override isDiscarded(): boolean {
    return this.type() === TargetType.TAB && this._subtype() === 'discarded';
  }

  override parent(): CdpTarget | undefined {
    return this.#parentTarget;
  }

  _session(): CdpCDPSession | undefined {
    return this.#session;
  }

  _setSession(session: CdpCDPSession): void {
    this.#session = session;
    this.#session.setTarget(this);
  }

  _addChildTarget(target: CdpTarget): void {
    target.#parentTarget ??= this;
    this.#childTargets.add(target);
  }

  _removeChildTarget(target: CdpTarget): void {
    this.#childTargets.delete(target);
  }

  _addTabPage(page: CdpPage): void {
    this.#tabPages.add(page);
  }

  _removeTabPage(page: CdpPage): void {
    this.#tabPages.delete(page);
  }

  /**
   * For a tab target, returns the child target that shows the content of the
   * tab: the child without a subtype. Prerendered children have the
   * `"prerender"` subtype.
   */
  _primaryChildTarget(): CdpTarget | undefined {
    for (const child of this.#childTargets) {
      if (!child._subtype()) {
        return child;
      }
    }
    return undefined;
  }

  /**
   * If an open page already uses this target as its primary target, sets
   * `pagePromise` to that page. This happens when a prerendered target
   * activates: the page stays the same, but its primary target changes to this
   * target. Chrome detaches the old primary target before it activates the
   * prerendered target, so the old target cannot give its page to this target.
   */
  _adoptExistingPage(): void {
    if (this.pagePromise || !this.#parentTarget) {
      return;
    }
    for (const page of this.#parentTarget.#tabPages) {
      if (!page.isClosed() && page.target() === this) {
        this.pagePromise = Promise.resolve(page);
        return;
      }
    }
  }

  _childTargets(): ReadonlySet<CdpTarget> {
    return this.#childTargets;
  }

  protected _sessionFactory(): (
    isAutoAttachEmulated: boolean,
  ) => Promise<CdpCDPSession> {
    if (!this.#sessionFactory) {
      throw new Error('sessionFactory is not initialized');
    }
    return this.#sessionFactory;
  }

  override createCDPSession(): Promise<CdpCDPSession> {
    if (!this.#sessionFactory) {
      throw new Error('sessionFactory is not initialized');
    }
    return this.#sessionFactory(false).then(session => {
      session.setTarget(this);
      return session;
    });
  }

  override url(): string {
    return this.#targetInfo.url;
  }

  override type(): TargetType {
    const type = this.#targetInfo.type;
    switch (type) {
      case 'page':
        return TargetType.PAGE;
      case 'background_page':
        return TargetType.BACKGROUND_PAGE;
      case 'service_worker':
        return TargetType.SERVICE_WORKER;
      case 'shared_worker':
        return TargetType.SHARED_WORKER;
      case 'browser':
        return TargetType.BROWSER;
      case 'webview':
        return TargetType.WEBVIEW;
      case 'tab':
        return TargetType.TAB;
      default:
        return TargetType.OTHER;
    }
  }

  _targetManager(): TargetManager {
    if (!this.#targetManager) {
      throw new Error('targetManager is not initialized');
    }
    return this.#targetManager;
  }

  _getTargetInfo(): Protocol.Target.TargetInfo {
    return this.#targetInfo;
  }

  override browser(): Browser {
    if (!this.#browserContext) {
      throw new Error('browserContext is not initialized');
    }
    return this.#browserContext.browser();
  }

  override browserContext(): BrowserContext {
    if (!this.#browserContext) {
      throw new Error('browserContext is not initialized');
    }
    return this.#browserContext;
  }

  override opener(): Target | undefined {
    const {openerId} = this.#targetInfo;
    if (!openerId) {
      return;
    }
    return this.browser()
      .targets()
      .find(target => {
        return (target as CdpTarget)._targetId === openerId;
      });
  }

  _targetInfoChanged(targetInfo: Protocol.Target.TargetInfo): void {
    this.#targetInfo = targetInfo;
    this._checkIfInitialized();
  }

  _initialize(): void {
    this._initializedDeferred.resolve(InitializationStatus.SUCCESS);
  }

  protected _checkIfInitialized(): void {
    if (!this._initializedDeferred.resolved()) {
      this._initializedDeferred.resolve(InitializationStatus.SUCCESS);
    }
  }
}

/**
 * @internal
 */
export class PageTarget extends CdpTarget {
  #defaultViewport?: Viewport;

  constructor(
    targetInfo: Protocol.Target.TargetInfo,
    session: CdpCDPSession | undefined,
    browserContext: BrowserContext,
    targetManager: TargetManager,
    sessionFactory: (isAutoAttachEmulated: boolean) => Promise<CdpCDPSession>,
    defaultViewport: Viewport | null,
    logger: Logger,
    parentTarget?: CdpTarget,
  ) {
    super(
      targetInfo,
      session,
      browserContext,
      targetManager,
      sessionFactory,
      logger,
      parentTarget,
    );
    this.#defaultViewport = defaultViewport ?? undefined;
  }

  override _initialize(): void {
    void this._initializedDeferred
      .valueOrThrow()
      .then(async result => {
        if (result === InitializationStatus.ABORTED) {
          return;
        }
        const opener = this.opener();
        if (!(opener instanceof PageTarget)) {
          return;
        }
        opener._adoptExistingPage();
        if (!opener || !opener.pagePromise || this.type() !== 'page') {
          return true;
        }
        const openerPage = await opener.pagePromise;
        if (!openerPage.listenerCount(PageEvent.Popup)) {
          return true;
        }
        const popupPage = await this.page();
        if (popupPage) {
          openerPage.emit(PageEvent.Popup, popupPage);
        }
        return true;
      })
      .catch(error => {
        this.logger?.(DEBUG_PREFIXES.error)?.(error);
      });
    this._checkIfInitialized();
  }

  override async page(): Promise<Page | null> {
    if (this._subtype() === 'prerender') {
      return null;
    }
    this._adoptExistingPage();
    if (!this.pagePromise) {
      const session = this._session();
      this.pagePromise = (
        session
          ? Promise.resolve(session)
          : this._sessionFactory()(/* isAutoAttachEmulated=*/ false)
      ).then(client => {
        return CdpPage._create(
          client,
          this,
          this.#defaultViewport ?? null,
          this.logger,
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
export class DevToolsTarget extends PageTarget {}

/**
 * @internal
 */
export class WorkerTarget extends CdpTarget {
  #workerPromise?: Promise<CdpWebWorker>;

  override async worker(): Promise<CdpWebWorker | null> {
    if (!this.#workerPromise) {
      const session = this._session();
      this.#workerPromise = (
        session
          ? Promise.resolve(session)
          : this._sessionFactory()(/* isAutoAttachEmulated=*/ false)
      ).then(client => {
        const worker = new CdpWebWorker(
          client,
          this._getTargetInfo().url,
          this._targetId,
          this.type(),
          () => {} /* exceptionThrown */,
          undefined /* networkManager */,
          this.logger,
        );
        this.#bubbleConsoleMessages(worker);
        return worker;
      });
    }
    return await this.#workerPromise;
  }

  /**
   * Service and shared workers are not owned by a page, so their console
   * messages are bubbled up to the browser context and the browser here.
   */
  #bubbleConsoleMessages(worker: CdpWebWorker): void {
    worker.internalEmitter.on(WebWorkerEvent.Console, message => {
      const context = this.browserContext();
      const browser = this.browser();
      const hasListeners =
        worker.listenerCount(WebWorkerEvent.Console) > 0 ||
        context.listenerCount(BrowserContextEvent.Console) > 0 ||
        browser.listenerCount(BrowserEvent.Console) > 0;

      if (!hasListeners) {
        // eslint-disable-next-line max-len -- The comment is long.
        // eslint-disable-next-line @puppeteer/use-using -- These are not owned by this function.
        for (const arg of message.args()) {
          void arg.dispose().catch(error => {
            this.logger?.(DEBUG_PREFIXES.error)?.(error);
          });
        }
        return;
      }

      context.emit(BrowserContextEvent.Console, message);
      browser.emit(BrowserEvent.Console, message);
    });
  }
}

/**
 * @internal
 */
export class OtherTarget extends CdpTarget {}
