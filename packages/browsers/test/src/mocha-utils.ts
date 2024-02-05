/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import debug from 'debug';

export const mochaHooks = {
  async beforeAll(): Promise<void> {
    // Enable logging for Debug
    debug.enable('puppeteer:*');
  },
};
