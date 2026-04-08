/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type {Page, Target, WebWorker} from '../api/api.js';
import {Extension} from '../api/api.js';

import type {CdpBrowser} from './Browser.js';

export class CdpExtension extends Extension {
  // needed to access the CDPSession to trigger an extension action.
  #browser: CdpBrowser;
  #pages = new WeakMap<Target, Page>();

  /*
   * @internal
   */
  constructor(id: string, version: string, name: string, browser: CdpBrowser) {
    super(id, version, name);
    this.#browser = browser;
  }

  async workers(): Promise<WebWorker[]> {
    const targets = this.#browser.targets();

    const extensionWorkers = targets.filter((target: Target) => {
      const targetUrl = target.url();
      return (
        target.type() === 'service_worker' &&
        targetUrl.startsWith('chrome-extension://' + this.id)
      );
    });

    const workers: WebWorker[] = [];
    for (const target of extensionWorkers) {
      const worker = await target.worker();

      if (worker) {
        workers.push(worker);
      }
    }

    return workers;
  }

  async pages(): Promise<Page[]> {
    const targets = this.#browser.targets();

    const extensionPages = targets.filter((target: Target) => {
      const targetUrl = target.url();
      return (
        (target.type() === 'page' || target.type() === 'background_page') &&
        targetUrl.startsWith('chrome-extension://' + this.id)
      );
    });

    const pages: Page[] = [];
    for (const target of extensionPages) {
      let page = this.#pages.get(target);
      if (!page) {
        // TODO: asPage should return always the same instance
        // issue: https://github.com/puppeteer/puppeteer/issues/14843
        page = await target.asPage();
        if (page) {
          this.#pages.set(target, page);
        }
      }

      if (page) {
        pages.push(page);
      }
    }

    return pages;
  }

  async triggerAction(page: Page): Promise<void> {
    await this.#browser._connection.send('Extensions.triggerAction', {
      id: this.id,
      targetId: page._tabId,
    });
  }
}
