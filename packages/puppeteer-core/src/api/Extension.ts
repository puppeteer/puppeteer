/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
/// <reference types="node"  preserve="true"/>

import type {Browser} from './Browser.js';
import type {Page} from './Page.js';
import type {Target} from './Target.js';
import type {WebWorker} from './WebWorker.js';

/**
 * {@link Extension} represents an Extension instance installed in the browser.
 *
 * @public
 */
export class Extension {
  // needed to access the CDPSession to trigger an extension action.
  #browser: Browser;
  #id: string;
  #version: string;
  #name: string;

  #pages = new WeakMap<Target, Page>();

  constructor(id: string, version: string, name: string, browser: Browser) {
    this.#id = id;
    this.#version = version;
    this.#name = name;
    this.#browser = browser;

    if (!id || !version) {
      throw new Error('Extension ID and version are required');
    }
  }

  get version(): string {
    return this.#version;
  }

  get name(): string {
    return this.#name;
  }

  get id(): string {
    return this.#id;
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
      if (this.#pages.has(target)) {
        return this.#pages.get(target);
      }

      const targetUrl = target.url();
      return (
        (target.type() === 'page' || target.type() === 'background_page') &&
        targetUrl.startsWith('chrome-extension://' + this.#id)
      );
    });

    const pages: Page[] = [];
    for (const target of extensionPages) {
      let page = this.#pages.get(target);
      if (!page) {
        page = await target.asPage();
        this.#pages.set(target, page);
      }

      pages.push(page);
    }

    return pages;
  }

  async triggerAction(page: Page): Promise<void> {
    const client = await this.#browser.target().createCDPSession();

    await client.send('Extensions.triggerAction', {
      id: this.#id,
      targetId: page._tabId,
    });
  }
}
