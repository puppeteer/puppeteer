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
   * A browser tab. With CDP, a tab target is the parent of the page target
   * that shows the tab content.
   */
  TAB = 'tab',
}

/**
 * Target represents a
 * {@link https://chromedevtools.github.io/devtools-protocol/tot/Target/ | CDP target}.
 * In CDP a target is something that can be debugged, such as a frame, a page or a
 * worker.
 *
 * @remarks
 *
 * With CDP, Puppeteer reports all targets that it attaches to. This includes
 * `"tab"` targets and targets with a {@link Target.subtype | subtype}, such as
 * prerendered pages. Each tab has a `"tab"` target and a `"page"` target with
 * the same URL. To find the target that shows the content of a tab, check the
 * type and the subtype:
 *
 * ```ts
 * const target = await browser.waitForTarget(target => {
 *   return (
 *     target.type() === 'page' &&
 *     !target.subtype() &&
 *     target.url() === 'https://www.example.com/'
 *   );
 * });
 * ```
 *
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
   * Returns the {@link Page} of the target, or `null` if the target has no
   * page.
   *
   * @remarks
   *
   * - A `"tab"` target and its primary `"page"` target return the same
   *   {@link Page}.
   * - A target with the `"prerender"` {@link Target.subtype | subtype} returns
   *   `null`. After Chrome activates the prerendered page, the target returns
   *   the {@link Page} of the tab.
   * - Targets that are not of type `"page"`, `"tab"`, `"webview"` or
   *   `"background_page"` return `null`.
   */
  async page(): Promise<Page | null> {
    return null;
  }

  /**
   * Forcefully creates a page for a target of any type. It is useful if you
   * want to handle a CDP target of type `other` as a page. If you deal with a
   * regular page target, use {@link Target.page}.
   *
   * @remarks
   *
   * For a `"tab"` target, forces a page for the child target that shows the
   * content of the tab, and throws if the tab has no such child yet. Throws
   * for a target with the `"prerender"` {@link Target.subtype | subtype}.
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
   * Returns the subtype of the target, as CDP reports it. For example,
   * a prerendered page has the subtype `"prerender"`. Returns `undefined` if
   * the target has no subtype.
   *
   * @remarks
   *
   * Only supported for Chrome and the CDP protocol. With WebDriver BiDi,
   * returns `undefined`.
   */
  subtype(): string | undefined {
    return undefined;
  }

  /**
   * Returns the target that Puppeteer attached this target through. For
   * example, the parent of a `"page"` target is the `"tab"` target of its tab.
   * Returns `undefined` for top-level targets, such as `"tab"` targets.
   *
   * @remarks
   *
   * Only supported for Chrome and the CDP protocol. With WebDriver BiDi,
   * returns `undefined`.
   */
  parent(): Target | undefined {
    return undefined;
  }
}
