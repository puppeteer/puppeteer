/**
 * @license
 * Copyright 2019 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {Protocol} from 'devtools-protocol';

import {
  BrowserEvent,
  type Browser,
  type TargetOptions,
} from '../api/Browser.js';
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
  #discarded = false;
  #childTargets = new Set<CdpTarget>();
  /**
   * Child targets that detached from this tab while it was active and left it
   * without a primary (non-speculative) child. Chrome can detach the page
   * targets of a tab before it reports the `discarded` subtype, so these
   * targets are marked as discarded when this tab becomes discarded. A new
   * child target clears this set.
   *
   * A page target that detached for another reason and had no replacement is
   * also marked as discarded if the tab is discarded later. This only changes
   * `isDiscarded()` of a target that is already gone, but it makes sure that
   * the page of a discarded tab always closes.
   */
  #detachedChildTargets = new Set<CdpTarget>();
  _initializedDeferred = Deferred.create<InitializationStatus>();
  _isClosedDeferred = Deferred.create<void>();
  _targetId: string;
  _asPagePromise?: Promise<Page>;
  /** @internal */
  pagePromise?: Promise<Page | null>;

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
  ) {
    super(logger);
    this.#session = session;
    this.#targetManager = targetManager;
    this.#targetInfo = targetInfo;
    this.#browserContext = browserContext;
    this._targetId = targetInfo.targetId;
    this.#sessionFactory = sessionFactory;
    this.#logger = logger;
    if (this.#session) {
      this.#session.setTarget(this);
    }
  }

  #throwIfDiscarded(): void {
    if (this.isDiscarded()) {
      throw new Error('Cannot create a page for a discarded target.');
    }
  }

  override async asPage(): Promise<Page> {
    this.#throwIfDiscarded();
    if (this.type() === TargetType.TAB) {
      throw new Error('Cannot create a page for a tab target.');
    }
    if (this.pagePromise) {
      let page: Page | null;
      try {
        page = await this.pagePromise;
      } catch (error) {
        this.#throwIfDiscarded();
        throw error;
      }
      this.#throwIfDiscarded();
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
        this.#throwIfDiscarded();
        return CdpPage._create(client, this, null, this.#logger);
      });
    }
    let page: Page;
    try {
      page = await this._asPagePromise;
    } catch (error) {
      this.#throwIfDiscarded();
      throw error;
    }
    this.#throwIfDiscarded();
    return page;
  }

  _subtype(): string | undefined {
    return this.#targetInfo.subtype;
  }

  _session(): CdpCDPSession | undefined {
    return this.#session;
  }

  _setSession(session: CdpCDPSession): void {
    this.#session = session;
    this.#session.setTarget(this);
  }

  _addChildTarget(target: CdpTarget): void {
    this.#detachedChildTargets.clear();
    this.#childTargets.add(target);
  }

  _removeChildTarget(target: CdpTarget): void {
    if (!this.#childTargets.delete(target)) {
      return;
    }
    if (this.type() !== TargetType.TAB || this.isDiscarded()) {
      return;
    }
    // A prerender activation detaches the old primary page target. If Chrome
    // activates the prerendered target first, that target has no subtype
    // anymore and this check skips the detach. If Chrome detaches the old
    // target first, the prerendered target still has its subtype and the old
    // target is recorded here. `TargetManager` then calls
    // `_clearDetachedChildTargets()` when the prerendered target becomes
    // primary.
    const hasPrimaryChild = Array.from(this.#childTargets).some(child => {
      return !child._subtype();
    });
    if (!hasPrimaryChild) {
      this.#detachedChildTargets.add(target);
    }
  }

  /**
   * Returns and forgets the child targets that detached without a
   * replacement since the last child target attached.
   */
  _takeDetachedChildTargets(): CdpTarget[] {
    const targets = Array.from(this.#detachedChildTargets);
    this.#detachedChildTargets.clear();
    return targets;
  }

  /**
   * Forgets the child targets that detached without a replacement, for
   * example when a prerendered child target replaces them.
   */
  _clearDetachedChildTargets(): void {
    this.#detachedChildTargets.clear();
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

  override isDiscarded(): boolean {
    if (this.type() === TargetType.TAB) {
      return this._subtype() === 'discarded';
    }
    // Non-tab targets only become discarded when their tab transitions from
    // active to discarded (see `_onDiscarded`). A target that attaches to a
    // tab after that transition belongs to the reloaded tab.
    return this.#discarded;
  }

  _onDiscarded(): void {
    if (this.type() !== TargetType.TAB) {
      this.#discarded = true;
    }
    this.pagePromise = undefined;
    this._asPagePromise = undefined;
  }

  _targetInfoChanged(targetInfo: Protocol.Target.TargetInfo): void {
    this.#targetInfo = targetInfo;
    this._checkIfInitialized();
  }

  _initialize(): void {
    this._initializedDeferred.resolve(InitializationStatus.SUCCESS);
  }

  _isTargetExposed(options?: TargetOptions): boolean {
    if (this.type() === TargetType.TAB) {
      // Expose a discarded tab only while it has no active child target. A
      // reloaded child can attach before the tab clears its discarded subtype.
      return Boolean(
        options?.includeDiscarded &&
        this.isDiscarded() &&
        Array.from(this.#childTargets).every(child => {
          return child.isDiscarded();
        }),
      );
    }
    return !this._subtype() && !this.isDiscarded();
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
  ) {
    super(
      targetInfo,
      session,
      browserContext,
      targetManager,
      sessionFactory,
      logger,
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
        if (!opener || !opener.pagePromise || this.type() !== 'page') {
          return true;
        }
        const openerPage = await opener.pagePromise;
        if (!openerPage || !openerPage.listenerCount(PageEvent.Popup)) {
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
    if (this.isDiscarded() || this.type() === TargetType.TAB) {
      return null;
    }
    if (!this.pagePromise) {
      const session = this._session();
      this.pagePromise = (
        session
          ? Promise.resolve(session)
          : this._sessionFactory()(/* isAutoAttachEmulated=*/ false)
      ).then(client => {
        if (this.isDiscarded()) {
          return null;
        }
        return CdpPage._create(
          client,
          this,
          this.#defaultViewport ?? null,
          this.logger,
        );
      });
    }
    try {
      const page = (await this.pagePromise) ?? null;
      if (this.isDiscarded()) {
        return null;
      }
      return page;
    } catch (error) {
      if (this.isDiscarded()) {
        return null;
      }
      throw error;
    }
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
