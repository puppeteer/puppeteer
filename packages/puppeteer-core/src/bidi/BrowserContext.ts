/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import type {BrowserContextEvents} from '../api/BrowserContext.js';
import {BrowserContext, BrowserContextEvent} from '../api/BrowserContext.js';
import {PageEvent, type Page} from '../api/Page.js';
import type {Target} from '../api/Target.js';
import {UnsupportedOperation} from '../common/Errors.js';
import {EventEmitter} from '../common/EventEmitter.js';
import {debugError} from '../common/util.js';
import type {Viewport} from '../common/Viewport.js';
import {bubble} from '../util/decorators.js';

import type {BidiBrowser} from './Browser.js';
import type {BrowsingContext} from './core/BrowsingContext.js';
import {UserContext} from './core/UserContext.js';
import type {BidiFrame} from './Frame.js';
import {BidiPage} from './Page.js';
import {BidiWorkerTarget} from './Target.js';
import {BidiFrameTarget, BidiPageTarget} from './Target.js';
import type {BidiWebWorker} from './WebWorker.js';

/**
 * @internal
 */
export interface BidiBrowserContextOptions {
  defaultViewport: Viewport | null;
}

/**
 * @internal
 */
export class BidiBrowserContext extends BrowserContext {
  static from(
    browser: BidiBrowser,
    userContext: UserContext,
    options: BidiBrowserContextOptions
  ): BidiBrowserContext {
    const context = new BidiBrowserContext(browser, userContext, options);
    context.#initialize();
    return context;
  }

  @bubble()
  accessor trustedEmitter = new EventEmitter<BrowserContextEvents>();

  readonly #browser: BidiBrowser;
  readonly #defaultViewport: Viewport | null;
  // This is public because of cookies.
  readonly userContext: UserContext;
  readonly #pages = new WeakMap<BrowsingContext, BidiPage>();
  readonly #targets = new Map<
    BidiPage,
    [
      BidiPageTarget,
      Map<BidiFrame | BidiWebWorker, BidiFrameTarget | BidiWorkerTarget>,
    ]
  >();

  private constructor(
    browser: BidiBrowser,
    userContext: UserContext,
    options: BidiBrowserContextOptions
  ) {
    super();
    this.#browser = browser;
    this.userContext = userContext;
    this.#defaultViewport = options.defaultViewport;
  }

  #initialize() {
    // Create targets for existing browsing contexts.
    for (const browsingContext of this.userContext.browsingContexts) {
      this.#createPage(browsingContext);
    }

    this.userContext.on('browsingcontext', ({browsingContext}) => {
      this.#createPage(browsingContext);
    });
    this.userContext.on('closed', () => {
      this.trustedEmitter.removeAllListeners();
    });
  }

  #createPage(browsingContext: BrowsingContext): BidiPage {
    const page = BidiPage.from(this, browsingContext);
    this.#pages.set(browsingContext, page);
    page.trustedEmitter.on(PageEvent.Close, () => {
      this.#pages.delete(browsingContext);
    });

    // -- Target stuff starts here --
    const pageTarget = new BidiPageTarget(page);
    const pageTargets = new Map();
    this.#targets.set(page, [pageTarget, pageTargets]);

    page.trustedEmitter.on(PageEvent.FrameAttached, frame => {
      const bidiFrame = frame as BidiFrame;
      const target = new BidiFrameTarget(bidiFrame);
      pageTargets.set(bidiFrame, target);
      this.trustedEmitter.emit(BrowserContextEvent.TargetCreated, target);
    });
    page.trustedEmitter.on(PageEvent.FrameNavigated, frame => {
      const bidiFrame = frame as BidiFrame;
      const target = pageTargets.get(bidiFrame);
      // If there is no target, then this is the page's frame.
      if (target === undefined) {
        this.trustedEmitter.emit(BrowserContextEvent.TargetChanged, pageTarget);
      } else {
        this.trustedEmitter.emit(BrowserContextEvent.TargetChanged, target);
      }
    });
    page.trustedEmitter.on(PageEvent.FrameDetached, frame => {
      const bidiFrame = frame as BidiFrame;
      const target = pageTargets.get(bidiFrame);
      if (target === undefined) {
        return;
      }
      pageTargets.delete(bidiFrame);
      this.trustedEmitter.emit(BrowserContextEvent.TargetDestroyed, target);
    });

    page.trustedEmitter.on(PageEvent.WorkerCreated, worker => {
      const bidiWorker = worker as BidiWebWorker;
      const target = new BidiWorkerTarget(bidiWorker);
      pageTargets.set(bidiWorker, target);
      this.trustedEmitter.emit(BrowserContextEvent.TargetCreated, target);
    });
    page.trustedEmitter.on(PageEvent.WorkerDestroyed, worker => {
      const bidiWorker = worker as BidiWebWorker;
      const target = pageTargets.get(bidiWorker);
      if (target === undefined) {
        return;
      }
      pageTargets.delete(worker);
      this.trustedEmitter.emit(BrowserContextEvent.TargetDestroyed, target);
    });

    page.trustedEmitter.on(PageEvent.Close, () => {
      this.#targets.delete(page);
      this.trustedEmitter.emit(BrowserContextEvent.TargetDestroyed, pageTarget);
    });
    this.trustedEmitter.emit(BrowserContextEvent.TargetCreated, pageTarget);
    // -- Target stuff ends here --

    return page;
  }

  override targets(): Target[] {
    return [...this.#targets.values()].flatMap(([target, frames]) => {
      return [target, ...frames.values()];
    });
  }

  override async newPage(): Promise<Page> {
    const context = await this.userContext.createBrowsingContext(
      Bidi.BrowsingContext.CreateType.Tab
    );
    const page = this.#pages.get(context)!;
    if (!page) {
      throw new Error('Page is not found');
    }
    if (this.#defaultViewport) {
      try {
        await page.setViewport(this.#defaultViewport);
      } catch {
        // No support for setViewport in Firefox.
      }
    }

    return page;
  }

  override async close(): Promise<void> {
    if (!this.isIncognito()) {
      throw new Error('Default context cannot be closed!');
    }

    try {
      await this.userContext.remove();
    } catch (error) {
      debugError(error);
    }
  }

  override browser(): BidiBrowser {
    return this.#browser;
  }

  override async pages(): Promise<BidiPage[]> {
    return [...this.userContext.browsingContexts].map(context => {
      return this.#pages.get(context)!;
    });
  }

  override isIncognito(): boolean {
    return this.userContext.id !== UserContext.DEFAULT;
  }

  override overridePermissions(): never {
    throw new UnsupportedOperation();
  }

  override clearPermissionOverrides(): never {
    throw new UnsupportedOperation();
  }

  override get id(): string | undefined {
    if (this.userContext.id === UserContext.DEFAULT) {
      return undefined;
    }
    return this.userContext.id;
  }
}
