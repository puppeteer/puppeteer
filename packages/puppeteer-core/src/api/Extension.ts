/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {Page} from './Page.js';
import type {WebWorker} from './WebWorker.js';

/**
 * {@link Extension} represents an Extension instance installed in the browser.
 *
 * @experimental
 * @public
 */
export abstract class Extension {
  #id: string;
  #version: string;
  #name: string;

  /*
   * @internal
   */
  constructor(id: string, version: string, name: string) {
    if (!id || !version) {
      throw new Error('Extension ID and version are required');
    }

    this.#id = id;
    this.#version = version;
    this.#name = name;
  }

  /*
   * The version of the extension.
   *
   * @public
   */
  get version(): string {
    return this.#version;
  }

  /*
   * The name of the extension.
   *
   * @public
   */
  get name(): string {
    return this.#name;
  }

  /*
   * The id of the extension.
   *
   * @public
   */
  get id(): string {
    return this.#id;
  }

  /*
   * Returns the list of the currently active service workers of the extension.
   *
   * @public
   */
  abstract workers(): Promise<WebWorker[]>;

  /*
   * Returns the list of the visible pages of the extension.
   *
   * @public
   */
  abstract pages(): Promise<Page[]>;

  /*
   * Triggers an extension default action.
   *
   * @public
   */
  abstract triggerAction(page: Page): Promise<void>;
}
