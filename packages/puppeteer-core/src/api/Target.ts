/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {Logger} from '../common/Debug.js';

import type {Browser} from './Browser.js';
import type {BrowserContext} from './BrowserContext.js';
import type {CDPSession} from './CDPSession.js';
import type {Page} from './Page.js';
import type {WebWorker} from './WebWorker.js';

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
   * @experimental
   */
  TAB = 'tab',
}

/**
 * Target represents a
 * {@link https://chromedevtools.github.io/devtools-protocol/tot/Target/ | CDP target}.
 * In CDP a target is something that can be debugged, such as a frame, a page or a
 * worker.
 * @public
 */
export abstract class Target {
  /**
   * @internal
   */
  protected constructor(protected logger: Logger) {}

  /**
   * If the target is not of type `"service_worker"` or `"shared_worker"`, returns `null`.
   */
  async worker(): Promise<WebWorker | null> {
    return null;
  }

  /**
   * If the target is not of type `"page"`, `"webview"` or `"background_page"`,
   * or if the target is {@link Target.isDiscarded | discarded}, returns `null`.
   */
  async page(): Promise<Page | null> {
    return null;
  }

  /**
   * Forcefully creates a page for an arbitrary target. It is useful if you
   * want to handle a CDP target of type `other` as a page. If you deal with a
   * regular page target, use {@link Target.page}.
   *
   * @throws Throws if the target is {@link Target.isDiscarded | discarded} or
   * of type {@link TargetType.TAB | "tab"}.
   */
  abstract asPage(): Promise<Page>;

  abstract url(): string;

  /**
   * Creates a Chrome Devtools Protocol session attached to the target.
   */
  abstract createCDPSession(): Promise<CDPSession>;

  /**
   * Identifies what kind of target this is.
   *
   * @remarks
   *
   * See {@link https://developer.chrome.com/extensions/background_pages | docs} for more info about background pages.
   */
  abstract type(): TargetType;

  /**
   * Get the browser the target belongs to.
   */
  abstract browser(): Browser;

  /**
   * Get the browser context the target belongs to.
   */
  abstract browserContext(): BrowserContext;

  /**
   * Get the target that opened this target. Top-level targets return `null`.
   */
  abstract opener(): Target | undefined;

  /**
   * Checks whether this target is discarded.
   *
   * @remarks
   * A target of type {@link TargetType.TAB | "tab"} is discarded while
   * Chrome keeps its tab discarded. A target of type
   * {@link TargetType.PAGE | "page"} is discarded if Chrome closed it because
   * it discarded the tab of the target. When Chrome reloads a discarded tab, it
   * creates new targets that are not discarded.
   *
   * Targets inside a page, such as out-of-process iframes and dedicated
   * workers, close together with the page. Do not use this method to find out
   * why such a target closed: it can return `false` for them even if Chrome
   * discarded their tab.
   *
   * The value of a closed target can change from `false` to `true` after the
   * {@link BrowserEvent.TargetDestroyed | targetdestroyed} event, because Chrome
   * can close the target before it reports that the tab is discarded. In rare
   * cases, a target that closed for another reason, with no target to replace
   * it, is also reported as discarded if Chrome discards its tab later.
   *
   * Currently only supported for Chrome and the CDP protocol.
   *
   * @experimental
   */
  isDiscarded(): boolean {
    return false;
  }
}
