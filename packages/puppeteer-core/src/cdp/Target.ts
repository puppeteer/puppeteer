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
import type {CDPSession} from '../api/CDPSession.js';
import {PageEvent, type Page} from '../api/Page.js';
import {Target, TargetType} from '../api/Target.js';
import {WebWorkerEvent} from '../api/WebWorker.js';
import {DEBUG_PREFIXES, type Logger} from '../common/Debug.js';
import {TargetCloseError} from '../common/Errors.js';
import type {Viewport} from '../common/Viewport.js';
import {Deferred} from '../util/Deferred.js';

import type {CdpBrowser} from './Browser.js';
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
  #childTargets = new Set<CdpTarget>();
  #closePromise?: Promise<void>;
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

  override async asPage(): Promise<Page> {
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

  _session(): CdpCDPSession | undefined {
    return this.#session;
  }

  _setSession(session: CdpCDPSession): void {
    this.#session = session;
    this.#session.setTarget(this);
  }

  _addChildTarget(target: CdpTarget): void {
    this.#childTargets.add(target);
  }

  _removeChildTarget(target: CdpTarget): void {
    this.#childTargets.delete(target);
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

  override async close(): Promise<void> {
    // Chrome closes the whole page when it closes the target of a frame.
    if (this.#targetInfo.type === 'iframe') {
      throw new Error('The target of a frame does not support closing');
    }
    if (this._isClosedDeferred.resolved()) {
      return;
    }
    // Concurrent calls share one close operation, because a second
    // `Target.closeTarget` fails if the target is already gone.
    this.#closePromise ??= this.#close().finally(() => {
      this.#closePromise = undefined;
    });
    await this.#closePromise;
  }

  async #close(): Promise<void> {
    await (this.browser() as CdpBrowser)._closeTarget(this._targetId);
    if (this.#targetInfo.type === 'service_worker') {
      // Chrome reports a closed service worker as destroyed only after the
      // sessions attached to it detach.
      const sessions = await this._attachedSessions();
      await Promise.all(
        sessions.map(session => {
          return this.#detach(session);
        }),
      );
    }
    await this._isClosedDeferred.valueOrThrow();
  }

  async #detach(session: CDPSession): Promise<void> {
    if (session.detached) {
      return;
    }
    // `session.detach()` sends the command on the connection, which fails for
    // a session attached through a page. `parentSession()` returns the session
    // itself if it was attached through the connection.
    const parentSession = session.parentSession();
    try {
      await (
        parentSession === session ? session.connection() : parentSession
      )?.send('Target.detachFromTarget', {sessionId: session.id()});
    } catch (error) {
      // Chrome might have detached the session already, for example because
      // its page closed.
      if (!session.detached) {
        throw error;
      }
    }
  }

  /**
   * Returns the sessions that Puppeteer keeps attached to the target.
   */
  protected async _attachedSessions(): Promise<CDPSession[]> {
    return this._targetManager().getAttachedSessions(this._targetId);
  }

  /**
   * Whether `close()` is closing the target.
   */
  protected _isClosing(): boolean {
    return this.#closePromise !== undefined;
  }

  _targetInfoChanged(targetInfo: Protocol.Target.TargetInfo): void {
    this.#targetInfo = targetInfo;
    this._checkIfInitialized();
  }

  _initialize(): void {
    this._initializedDeferred.resolve(InitializationStatus.SUCCESS);
  }

  _isTargetExposed(): boolean {
    return this.type() !== TargetType.TAB && !this._subtype();
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
        if (!openerPage.listenerCount(PageEvent.Popup)) {
          return true;
        }
        const popupPage = await this.page();
        openerPage.emit(PageEvent.Popup, popupPage);
        return true;
      })
      .catch(error => {
        this.logger?.(DEBUG_PREFIXES.error)?.(error);
      });
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
      // `close()` detaches the sessions that are attached when Chrome closes
      // the target, so a session attached later would keep a closed service
      // worker alive.
      if (this._isClosing()) {
        throw new TargetCloseError('Target closed');
      }
      const session = this._session();
      this.#workerPromise = (
        session
          ? Promise.resolve(session)
          : this._sessionFactory()(/* isAutoAttachEmulated=*/ false)
      ).then(client => {
        // Service and shared workers create their own NetworkManager.
        const worker = new CdpWebWorker(
          client,
          this,
          () => {} /* exceptionThrown */,
          this.logger,
        );
        this.#bubbleConsoleMessages(worker);
        return worker;
      });
    }
    return await this.#workerPromise;
  }

  protected override async _attachedSessions(): Promise<CDPSession[]> {
    const sessions = new Set<CDPSession>(await super._attachedSessions());
    // Puppeteer detaches from service workers unless network rules are set,
    // so `worker()` may attach a session of its own. A failed `worker()` call
    // already rejected for its caller.
    const worker = await this.#workerPromise?.catch(() => {
      return undefined;
    });
    if (worker) {
      sessions.add(worker.client);
    }
    return [...sessions];
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
