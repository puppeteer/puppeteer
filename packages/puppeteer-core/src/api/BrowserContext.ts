/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {EventEmitter, type EventType} from '../common/EventEmitter.js';
import {debugError} from '../common/util.js';
import {asyncDisposeSymbol, disposeSymbol} from '../util/disposable.js';

import type {Browser, Permission, WaitForTargetOptions} from './Browser.js';
import type {Page} from './Page.js';
import type {Target} from './Target.js';

/**
 * @public
 */
export const enum BrowserContextEvent {
  /**
   * Emitted when the url of a target inside the browser context changes.
   * Contains a {@link Target} instance.
   */
  TargetChanged = 'targetchanged',

  /**
   * Emitted when a target is created within the browser context, for example
   * when a new page is opened by
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/open | window.open}
   * or by {@link BrowserContext.newPage | browserContext.newPage}
   *
   * Contains a {@link Target} instance.
   */
  TargetCreated = 'targetcreated',
  /**
   * Emitted when a target is destroyed within the browser context, for example
   * when a page is closed. Contains a {@link Target} instance.
   */
  TargetDestroyed = 'targetdestroyed',
}

export {
  /**
   * @deprecated Use {@link BrowserContextEvent}
   */
  BrowserContextEvent as BrowserContextEmittedEvents,
};

/**
 * @public
 */
export interface BrowserContextEvents extends Record<EventType, unknown> {
  [BrowserContextEvent.TargetChanged]: Target;
  [BrowserContextEvent.TargetCreated]: Target;
  [BrowserContextEvent.TargetDestroyed]: Target;
}

/**
 * {@link BrowserContext} represents individual sessions within a
 * {@link Browser | browser}.
 *
 * When a {@link Browser | browser} is launched, it has a single
 * {@link BrowserContext | browser context} by default. Others can be created
 * using {@link Browser.createIncognitoBrowserContext}.
 *
 * {@link BrowserContext} {@link EventEmitter | emits} various events which are
 * documented in the {@link BrowserContextEvent} enum.
 *
 * If a {@link Page | page} opens another {@link Page | page}, e.g. using
 * `window.open`, the popup will belong to the parent {@link Page.browserContext
 * | page's browser context}.
 *
 * @example Creating an incognito {@link BrowserContext | browser context}:
 *
 * ```ts
 * // Create a new incognito browser context
 * const context = await browser.createIncognitoBrowserContext();
 * // Create a new page inside context.
 * const page = await context.newPage();
 * // ... do stuff with page ...
 * await page.goto('https://example.com');
 * // Dispose context once it's no longer needed.
 * await context.close();
 * ```
 *
 * @public
 */

export abstract class BrowserContext extends EventEmitter<BrowserContextEvents> {
  /**
   * @internal
   */
  constructor() {
    super();
  }

  /**
   * Gets all active {@link Target | targets} inside this
   * {@link BrowserContext | browser context}.
   */
  abstract targets(): Target[];

  /**
   * Waits until a {@link Target | target} matching the given `predicate`
   * appears and returns it.
   *
   * This will look all open {@link BrowserContext | browser contexts}.
   *
   * @example Finding a target for a page opened via `window.open`:
   *
   * ```ts
   * await page.evaluate(() => window.open('https://www.example.com/'));
   * const newWindowTarget = await browserContext.waitForTarget(
   *   target => target.url() === 'https://www.example.com/'
   * );
   * ```
   */
  abstract waitForTarget(
    predicate: (x: Target) => boolean | Promise<boolean>,
    options?: WaitForTargetOptions
  ): Promise<Target>;

  /**
   * Gets a list of all open {@link Page | pages} inside this
   * {@link BrowserContext | browser context}.
   *
   * @remarks Non-visible {@link Page | pages}, such as `"background_page"`,
   * will not be listed here. You can find them using {@link Target.page}.
   */
  abstract pages(): Promise<Page[]>;

  /**
   * Whether this {@link BrowserContext | browser context} is incognito.
   *
   * The {@link Browser.defaultBrowserContext | default browser context} is the
   * only non-incognito browser context.
   */
  abstract isIncognito(): boolean;

  /**
   * Grants this {@link BrowserContext | browser context} the given
   * `permissions` within the given `origin`.
   *
   * @example Overriding permissions in the
   * {@link Browser.defaultBrowserContext | default browser context}:
   *
   * ```ts
   * const context = browser.defaultBrowserContext();
   * await context.overridePermissions('https://html5demos.com', [
   *   'geolocation',
   * ]);
   * ```
   *
   * @param origin - The origin to grant permissions to, e.g.
   * "https://example.com".
   * @param permissions - An array of permissions to grant. All permissions that
   * are not listed here will be automatically denied.
   */
  abstract overridePermissions(
    origin: string,
    permissions: Permission[]
  ): Promise<void>;

  /**
   * Clears all permission overrides for this
   * {@link BrowserContext | browser context}.
   *
   * @example Clearing overridden permissions in the
   * {@link Browser.defaultBrowserContext | default browser context}:
   *
   * ```ts
   * const context = browser.defaultBrowserContext();
   * context.overridePermissions('https://example.com', ['clipboard-read']);
   * // do stuff ..
   * context.clearPermissionOverrides();
   * ```
   */
  abstract clearPermissionOverrides(): Promise<void>;

  /**
   * Creates a new {@link Page | page} in this
   * {@link BrowserContext | browser context}.
   */
  abstract newPage(): Promise<Page>;

  /**
   * Gets the {@link Browser | browser} associated with this
   * {@link BrowserContext | browser context}.
   */
  abstract browser(): Browser;

  /**
   * Closes this {@link BrowserContext | browser context} and all associated
   * {@link Page | pages}.
   *
   * @remarks The
   * {@link Browser.defaultBrowserContext | default browser context} cannot be
   * closed.
   */
  abstract close(): Promise<void>;

  /**
   * Whether this {@link BrowserContext | browser context} is closed.
   */
  get closed(): boolean {
    return !this.browser().browserContexts().includes(this);
  }

  /**
   * Identifier for this {@link BrowserContext | browser context}.
   */
  get id(): string | undefined {
    return undefined;
  }

  /** @internal */
  [disposeSymbol](): void {
    return void this.close().catch(debugError);
  }

  /** @internal */
  [asyncDisposeSymbol](): Promise<void> {
    return this.close();
  }
}
