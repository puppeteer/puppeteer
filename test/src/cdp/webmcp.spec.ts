/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';
import {setupSeparateTestBrowserHooks} from '../mocha-utils.js';

describe('Page.webmcp.tools', function () {
  const state = setupSeparateTestBrowserHooks({
    args: ['--enable-features=WebMCPTesting,DevToolsWebMCPSupport'],
    acceptInsecureCerts: true,
  });

  it('should monitor registered and unregistered tools', async () => {
    const {page, httpsServer} = state;
    await page.goto(httpsServer.EMPTY_PAGE);

    expect(page.webmcp).toBeDefined();

    // Register a WebMCP tool.
    await page.evaluate(() => {
      (window as any).controller = new AbortController();

      (window as any).navigator.modelContext.registerTool(
        {
          name: 'test-tool',
          description: 'A test tool',
          inputSchema: {
            type: 'object',
            properties: {
              text: {type: 'string', description: 'Some text'},
            },
            required: ['text'],
          },
          execute: () => {},
          annotations: {readOnlyHint: true},
        },
        {signal: (window as any).controller.signal},
      );
    });

    let tools = await page.webmcp.tools();
    expect(tools.length).toBe(1);
    expect(tools[0]!.name).toBe('test-tool');
    expect(tools[0]!.description).toBe('A test tool');
    expect(tools[0]!.inputSchema).toStrictEqual({
      type: 'object',
      properties: {
        text: {type: 'string', description: 'Some text'},
      },
      required: ['text'],
    });
    expect(tools[0]!.annotations).toStrictEqual({readonly: true});
    expect(tools[0]!.frameId).toBe(page.frames()[0]!._id);
    expect(tools[0]!.stackTrace).toBeDefined();
    expect(tools[0]!.backendNodeId).toBeUndefined();

    // Unregister the WebMCP tool.
    await page.evaluate(() => {
      (window as any).controller.abort();
    });

    tools = await page.webmcp.tools();
    expect(tools.length).toBe(0);
  });
});
