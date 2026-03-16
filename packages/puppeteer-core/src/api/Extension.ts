/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
/// <reference types="node"  preserve="true"/>

import {Browser} from './Browser';
import {Page} from './Page';
import {Target} from './Target';
import {WebWorker} from './WebWorker';

/**
 * {@link Extension} represents an Extension instance installed in the browser.
 *
 * @public
 */
export class Extension {
  //needed to access the CDPSession to trigger an extension action
  #browser: Browser;
  #id: string;
  #version: string;
  #name: string;

  #pages: WeakMap<Target, Page> = new WeakMap();

  constructor(id: string, version: string, name: string, browser: Browser) {
    this.#id = id;
    this.#version = version;
    this.#name = name;
    this.#browser = browser;

    if (!id || !version) {
      throw new Error('Extension ID and version are required');
    }
  }

  get version() {
    return this.#version;
  }

  get name() {
    return this.#name;
  }

  get id() {
    return this.#id;
  }

  async workers(): Promise<WebWorker[]> {
    const targets = this.#browser.targets();

    const extensionWorkers = targets.filter((target: Target) => {
      const targetUrl = target.url();
      return (
        target.type() === 'service_worker' &&
        targetUrl.startsWith('chrome-extension://' + this.id) &&
        targetUrl.includes('js')
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
        target.type() === 'page' &&
        targetUrl.startsWith('chrome-extension://' + this.#id)
      );
    });

    const pages: Page[] = [];
    for (const target of extensionPages) {
      if (this.#pages.has(target)) {
        pages.push(this.#pages.get(target)!);
        continue;
      }

      const page = await target.asPage();
      this.#pages.set(target, page);

      pages.push(page);
    }

    return pages;
  }

  async triggerAction(page: Page): Promise<void> {
    const client = await this.#browser.target().createCDPSession();

    //@ts-expect-error - Method not yet public in non Canary version of Chrome
    await client.send('Extensions.triggerAction', {
      extensionId: this.#id,
      targetId: page._tabId,
    });
  }
}
