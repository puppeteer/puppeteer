/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';
import {getTestState, setupTestBrowserHooks} from '../mocha-utils.js';

describe('WebMCP', function () {
  setupTestBrowserHooks();

  it('should enable and disable WebMCP domain', async () => {
    const {page} = await getTestState();

    // Verify properties are available
    expect(page.webMCP).toBeDefined();

    // Should not throw on enable/disable
    await page.webMCP.enable();
    await page.webMCP.disable();
  });
});
