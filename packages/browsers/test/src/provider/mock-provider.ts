/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import sinon from 'sinon';

import type {BrowserProvider, DownloadOptions} from '../../../lib/esm/main.js';

/**
 * Mock provider implementation for testing using sinon stubs.
 * Allows configurable behavior for testing different provider scenarios.
 */
export class MockProvider implements BrowserProvider {
  supportsStub: sinon.SinonStub<[DownloadOptions], boolean>;
  getDownloadUrlStub: sinon.SinonStub<[DownloadOptions], URL | null>;
  getExecutablePathStub: sinon.SinonStub<[DownloadOptions], string>;
  #name: string;

  constructor(
    options: {
      supports?: boolean;
      getDownloadUrlResult?: URL | null;
      getDownloadUrlError?: Error | null;
      getExecutablePath?: string;
      name?: string;
    } = {},
  ) {
    this.supportsStub = sinon.stub<[DownloadOptions], boolean>();
    this.getDownloadUrlStub = sinon.stub<[DownloadOptions], URL | null>();
    this.getExecutablePathStub = sinon.stub<[DownloadOptions], string>();
    this.#name = options.name ?? 'MockProvider';

    // Configure supports behavior
    this.supportsStub.returns(options.supports ?? true);

    // Configure getDownloadUrl behavior
    if (options.getDownloadUrlError) {
      this.getDownloadUrlStub.throws(options.getDownloadUrlError);
    } else {
      this.getDownloadUrlStub.returns(options.getDownloadUrlResult ?? null);
    }

    // Configure getExecutablePath behavior
    this.getExecutablePathStub.returns(
      options.getExecutablePath ?? '/mock/executable/path',
    );
  }

  supports(options: DownloadOptions): boolean {
    return this.supportsStub(options);
  }

  getDownloadUrl(options: DownloadOptions): URL | null {
    return this.getDownloadUrlStub(options);
  }

  getExecutablePath(options: DownloadOptions): string {
    return this.getExecutablePathStub(options);
  }

  getName(): string {
    return this.#name;
  }

  /**
   * Restore all stubs to their original state.
   */
  restore(): void {
    this.supportsStub.restore();
    this.getDownloadUrlStub.restore();
    this.getExecutablePathStub.restore();
  }

  /**
   * Reset all stub call history.
   */
  reset(): void {
    this.supportsStub.resetHistory();
    this.getDownloadUrlStub.resetHistory();
    this.getExecutablePathStub.resetHistory();
  }
}
