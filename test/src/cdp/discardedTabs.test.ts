/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'node:path';

import expect from 'expect';
import type {Browser} from 'puppeteer-core/internal/api/Browser.js';
import type {Page} from 'puppeteer-core/internal/api/Page.js';
import type {Target} from 'puppeteer-core/internal/api/Target.js';
import type {WebWorker} from 'puppeteer-core/internal/api/WebWorker.js';

import {setupSeparateTestBrowserHooks} from '../mocha-utils.js';
import {waitEvent} from '../utils.js';

const extensionPath = path.join(
  import.meta.dirname,
  '..',
  '..',
  'assets',
  'tab-discard-extension',
);

declare const globalThis: {
  discardTab(url: string): Promise<void>;
  reloadTab(url: string): Promise<void>;
  closeTabs(url: string): Promise<void>;
};

describe('Discarded tabs', function () {
  const state = setupSeparateTestBrowserHooks(
    {
      enableExtensions: true,
    },
    {createContext: false},
  );

  let extensionWorker: WebWorker;
  const openPages: Page[] = [];
  const discardedUrls: string[] = [];

  before(async () => {
    const {browser} = state;
    const extensionId = await browser.installExtension(extensionPath);
    const workerTarget = await browser.waitForTarget(target => {
      return (
        target.type() === 'service_worker' && target.url().includes(extensionId)
      );
    });
    extensionWorker = (await workerTarget.worker())!;
  });

  afterEach(async () => {
    await Promise.all(
      openPages.splice(0).map(page => {
        return page.isClosed() ? undefined : page.close();
      }),
    );
    // Close the tabs that are still discarded. They have no page to close.
    await Promise.all(
      discardedUrls.splice(0).map(url => {
        return extensionWorker.evaluate(url => {
          return globalThis.closeTabs(url);
        }, url);
      }),
    );
  });

  async function newPage(browser: Browser, url: string): Promise<Page> {
    const page = await browser.newPage();
    openPages.push(page);
    await page.goto(url);
    return page;
  }

  /**
   * Opens a page in a tab, and opens a second tab, because Chrome does not
   * discard the active tab. Returns the page and its tab target.
   */
  async function openBackgroundTab(
    url: string,
  ): Promise<{page: Page; tabTarget: Target}> {
    const {browser} = state;
    const page = await newPage(browser, url);
    await newPage(browser, state.server.EMPTY_PAGE);
    return {page, tabTarget: page.target().parent()!};
  }

  async function discard(tabTarget: Target, url: string): Promise<void> {
    discardedUrls.push(url);
    await Promise.all([
      waitEvent<Target>(state.browser, 'targetchanged', target => {
        return target === tabTarget && target.isDiscarded();
      }),
      extensionWorker.evaluate(url => {
        return globalThis.discardTab(url);
      }, url),
    ]);
  }

  it('should report a discarded tab', async () => {
    const {browser, server} = state;
    const url = `${server.EMPTY_PAGE}?discard`;
    const {page, tabTarget} = await openBackgroundTab(url);
    expect(tabTarget.isDiscarded()).toBe(false);
    expect(page.target().isDiscarded()).toBe(false);

    const pageClosed = waitEvent(page, 'close');
    await discard(tabTarget, url);
    await pageClosed;

    expect(tabTarget.isDiscarded()).toBe(true);
    expect(tabTarget.subtype()).toBe('discarded');
    expect(tabTarget.url()).toBe(url);
    expect(browser.targets()).toContain(tabTarget);
    await expect(tabTarget.page()).resolves.toBeNull();
    await expect(tabTarget.asPage()).rejects.toThrow(
      'Cannot create a page for a discarded tab.',
    );
    const pages = await browser.pages();
    expect(pages).not.toContain(page);
    expect(
      pages.map(page => {
        return page.url();
      }),
    ).not.toContain(url);
  });

  it('should connect to a browser with a discarded tab', async () => {
    const {browser, server, puppeteer} = state;
    const url = `${server.EMPTY_PAGE}?connect`;
    const {tabTarget} = await openBackgroundTab(url);
    await discard(tabTarget, url);

    // Disposing a connected browser disconnects it.
    using remoteBrowser = await puppeteer.connect({
      browserWSEndpoint: browser.wsEndpoint(),
      protocol: browser.protocol,
    });
    const remoteTab = remoteBrowser.targets().find(target => {
      return target.isDiscarded();
    });
    expect(remoteTab?.type()).toBe('tab');
    expect(remoteTab?.url()).toBe(url);
    await expect(remoteTab!.page()).resolves.toBeNull();
  });

  it('should give a new page to a discarded tab that loads again', async () => {
    const {browser, server} = state;
    const url = `${server.EMPTY_PAGE}?reload`;
    const {page, tabTarget} = await openBackgroundTab(url);
    await discard(tabTarget, url);

    const [pageTarget] = await Promise.all([
      browser.waitForTarget(target => {
        return target.parent() === tabTarget && !target.subtype();
      }),
      waitEvent<Target>(browser, 'targetchanged', target => {
        return target === tabTarget && !target.isDiscarded();
      }),
      extensionWorker.evaluate(url => {
        return globalThis.reloadTab(url);
      }, url),
    ]);

    expect(tabTarget.isDiscarded()).toBe(false);
    const newPage = (await tabTarget.page())!;
    openPages.push(newPage);
    expect(newPage).not.toBeNull();
    expect(newPage).not.toBe(page);
    expect(newPage.target()).toBe(pageTarget);
    await expect(browser.pages()).resolves.toContain(newPage);
  });
});
