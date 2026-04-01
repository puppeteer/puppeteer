/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';
import {getTestState, setupTestBrowserHooks} from '../mocha-utils.js';

describe('Page.webmcp.tools', function () {
  setupTestBrowserHooks();

  it('should monitor registered and unregistered tools', async () => {
    const {page} = await getTestState();

    expect(page.webmcp).toBeDefined();

    // Register a WebMCP tool.
    await page.evaluate(() => {
      (window as any).controller = new AbortController();

      // @ts-expect-error type missing
      navigator.modelContext.registerTool(
        {
          name: 'test-tool',
          description: 'A test tool',
          execute: () => {},
        },
        {signal: (window as any).controller.signal},
      );
    });

    let tools = await page.webmcp.tools();
    expect(tools.length).toBe(1);
    expect(tools[0]!.name).toBe('test-tool');
    expect(tools[0]!.description).toBe('A test tool');

    // Unregister the WebMCP tool.
    await page.evaluate(() => {
      (window as any).controller.abort();
    });

    tools = await page.webmcp.tools();
    expect(tools.length).toBe(0);
  });
});
