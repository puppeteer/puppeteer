/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {BrowserProvider, DownloadOptions} from '../../../lib/esm/main.js';

/**
 * Mock downloader implementation for testing.
 * Allows configurable behavior for testing different downloader scenarios.
 */
export class MockProvider implements BrowserProvider {
  supportsResult = true;
  getDownloadUrlResult: URL | null = null;
  getDownloadUrlError: Error | null = null;
  getExecutablePathResult: string | undefined = undefined;

  constructor(
    options: {
      supports?: boolean;
      getDownloadUrlResult?: URL | null;
      getDownloadUrlError?: Error | null;
      getExecutablePath?: string;
    } = {},
  ) {
    if (options.supports !== undefined) {
      this.supportsResult = options.supports;
    }
    if (options.getDownloadUrlResult !== undefined) {
      this.getDownloadUrlResult = options.getDownloadUrlResult;
    }
    if (options.getDownloadUrlError !== undefined) {
      this.getDownloadUrlError = options.getDownloadUrlError;
    }
    if (options.getExecutablePath !== undefined) {
      this.getExecutablePathResult = options.getExecutablePath;
    }
  }

  supports(_options: DownloadOptions): boolean {
    return this.supportsResult;
  }

  getDownloadUrl(_options: DownloadOptions): URL | null {
    if (this.getDownloadUrlError) {
      throw this.getDownloadUrlError;
    }
    return this.getDownloadUrlResult;
  }

  getExecutablePath(_options: DownloadOptions): string {
    if (this.getExecutablePathResult) {
      return this.getExecutablePathResult;
    }
    throw new Error('getExecutablePath not implemented in MockProvider');
  }
}
