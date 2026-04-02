/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';
import type {WebMCPTool} from 'puppeteer-core/internal/cdp/WebMCP.js';

import {setupSeparateTestBrowserHooks} from '../mocha-utils.js';

describe('Page.webmcp.tools', function () {
  const state = setupSeparateTestBrowserHooks({
    args: ['--enable-features=WebMCPTesting,DevToolsWebMCPSupport'],
    acceptInsecureCerts: true,
  });

  it.only('should monitor registered and unregistered tools', async () => {
    const {page, httpsServer} = state;
    await page.goto(httpsServer.EMPTY_PAGE);

    expect(page.webmcp).toBeDefined();

    let toolsAdded = new Promise<WebMCPTool[]>(resolve => {
      page.webmcp.on('toolsadded', event => {
        return resolve(event.tools);
      });
    });
    const toolsRemoved = new Promise<WebMCPTool[]>(resolve => {
      page.webmcp.once('toolsremoved', event => {
        return resolve(event.tools);
      });
    });

    // Register one WebMCP tool.
    await page.evaluate(() => {
      (window as any).controller = new AbortController();

      (window as any).navigator.modelContext.registerTool(
        {
          name: 'test-tool-1',
          description: 'A test tool 1',
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
    expect(tools[0]!.name).toBe('test-tool-1');
    expect(tools[0]!.description).toBe('A test tool 1');
    expect(tools[0]!.inputSchema).toStrictEqual({
      type: 'object',
      properties: {
        text: {type: 'string', description: 'Some text'},
      },
      required: ['text'],
    });
    expect(tools[0]!.frame).toBe(page.mainFrame());
    expect(tools[0]!.stackTrace).toBeDefined();
    expect(tools[0]!.formElement).toBeUndefined();

    let addedTools = await toolsAdded;
    expect(addedTools.length).toBe(1);
    expect(addedTools[0]!.name).toBe('test-tool-1');
    expect(addedTools[0]!.description).toBe('A test tool 1');
    expect(addedTools[0]!.inputSchema).toStrictEqual({
      type: 'object',
      properties: {
        text: {type: 'string', description: 'Some text'},
      },
      required: ['text'],
    });
    expect(addedTools[0]!.frame).toBe(page.mainFrame());
    expect(addedTools[0]!.stackTrace).toBeDefined();
    expect(addedTools[0]!.formElement).toBeUndefined();

    toolsAdded = new Promise<WebMCPTool[]>(resolve => {
      page.webmcp.on('toolsadded', event => {
        console.log(event);
        return resolve(event.tools);
      });
    });

    // Register a second WebMCP tool.
    await page.evaluate(() => {
      const form = document.createElement('form');
      form.setAttribute('toolname', 'declarative tool name');
      form.setAttribute('tooldescription', 'tool description');
      (window as any).document.body.appendChild(form);
    });

    addedTools = await toolsAdded;
    expect(addedTools.length).toBe(1);
    expect(addedTools[0]!.name).toBe('declarative tool name');
    expect(addedTools[0]!.description).toBe('tool description');
    expect(addedTools[0]!.inputSchema).toStrictEqual({});
    expect(addedTools[0]!.frame).toBe(page.mainFrame());
    expect(addedTools[0]!.stackTrace).toBeUndefined();
    expect(addedTools[0]!.formElement).toBeDefined();

    // Unregister first WebMCP tool.
    await page.evaluate(() => {
      (window as any).controller.abort();
    });

    const removedTools = await toolsRemoved;
    expect(removedTools.length).toBe(1);
    expect(removedTools[0]!.name).toBe('test-tool-1');
    expect(removedTools[0]!.description).toBe('A test tool 1');
    expect(removedTools[0]!.inputSchema).toStrictEqual({
      type: 'object',
      properties: {
        text: {type: 'string', description: 'Some text'},
      },
      required: ['text'],
    });
    expect(removedTools[0]!.frame).toBe(page.mainFrame());
    expect(removedTools[0]!.stackTrace).toBeDefined();
    expect(removedTools[0]!.formElement).toBeUndefined();

    tools = await page.webmcp.tools();
    expect(tools.length).toBe(1);
    expect(tools[0]!.name).toBe('declarative tool name');
    expect(tools[0]!.description).toBe('tool description');
    expect(tools[0]!.inputSchema).toStrictEqual({});
    expect(tools[0]!.frame).toBe(page.mainFrame());
    expect(tools[0]!.stackTrace).toBeUndefined();
    expect(tools[0]!.formElement).toBeDefined();
  });
});
