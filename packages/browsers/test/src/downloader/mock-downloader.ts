/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  BrowserDownloader,
  DownloadOptions,
} from '../../../lib/esm/downloader.js';

/**
 * Mock downloader implementation for testing.
 * Allows configurable behavior for testing different downloader scenarios.
 */
export class MockDownloader implements BrowserDownloader {
  #supportsResult: boolean | ((options: DownloadOptions) => boolean);
  #getDownloadUrlResult?: URL | null;
  #getDownloadUrlError?: Error;
  #getExecutablePathResult?: string;

  constructor(
    options: {
      supports?: boolean | ((options: DownloadOptions) => boolean);
      getDownloadUrlResult?: URL | null;
      getDownloadUrlError?: Error;
      getExecutablePath?: string;
    } = {},
  ) {
    this.#supportsResult = options.supports ?? true;
    this.#getDownloadUrlResult = options.getDownloadUrlResult;
    this.#getDownloadUrlError = options.getDownloadUrlError;
    this.#getExecutablePathResult = options.getExecutablePath;
  }

  supports(options: DownloadOptions): boolean {
    if (typeof this.#supportsResult === 'function') {
      return this.#supportsResult(options);
    }
    return this.#supportsResult;
  }

  getDownloadUrl(_options: DownloadOptions): URL | null {
    if (this.#getDownloadUrlError) {
      throw this.#getDownloadUrlError;
    }
    return this.#getDownloadUrlResult ?? null;
  }

  getExecutablePath?(_options: {
    browser: any;
    buildId: string;
    platform: any;
  }): string {
    if (!this.#getExecutablePathResult) {
      throw new Error('MockDownloader: getExecutablePath not configured');
    }
    return this.#getExecutablePathResult;
  }
}
