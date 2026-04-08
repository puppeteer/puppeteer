/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';
import type {
  WebMCPTool,
  WebMCPToolCall,
} from 'puppeteer-core/internal/cdp/WebMCP.js';

import {setupSeparateTestBrowserHooks} from '../mocha-utils.js';

describe('Page.webmcp', function () {
  const state = setupSeparateTestBrowserHooks({
    args: ['--enable-features=WebMCPTesting,DevToolsWebMCPSupport'],
    acceptInsecureCerts: true,
  });

  it('should list tools', async () => {
    const {page, httpsServer} = state;
    await page.goto(httpsServer.EMPTY_PAGE);

    expect(page.webmcp).toBeDefined();

    const toolsAddedPromise = new Promise<void>(resolve => {
      let count = 0;
      page.webmcp.on('toolsadded', () => {
        count++;
        if (count === 2) {
          resolve();
        }
      });
    });

    // Register an imperative WebMCP tool.
    await page.evaluate(() => {
      (window as any).navigator.modelContext.registerTool({
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
      });
    });
    // Register a declarative WebMCP tool.
    await page.evaluate(() => {
      const form = document.createElement('form');
      form.setAttribute('toolname', 'declarative tool name');
      form.setAttribute('tooldescription', 'tool description');
      (window as any).document.body.appendChild(form);
    });

    await toolsAddedPromise;

    const tools = page.webmcp.tools();
    expect(tools.length).toBe(2);

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
    expect(await tools[0]!.formElement).toBeUndefined();
    expect(tools[0]!.location).toBeDefined();

    expect(tools[1]!.name).toBe('declarative tool name');
    expect(tools[1]!.description).toBe('tool description');
    expect(tools[1]!.inputSchema).toStrictEqual({});
    expect(tools[1]!.frame).toBe(page.mainFrame());
    expect(await tools[1]!.formElement).toBeDefined();
    expect(tools[1]!.location).toBeUndefined();
  });

  it('should fire toolsadded events', async () => {
    const {page, httpsServer} = state;
    await page.goto(httpsServer.EMPTY_PAGE);

    expect(page.webmcp).toBeDefined();

    const imperativeToolAdded = new Promise<WebMCPTool[]>(resolve => {
      page.webmcp.once('toolsadded', event => {
        return resolve(event.tools);
      });
    });

    // Register an imperative WebMCP tool.
    await page.evaluate(() => {
      (window as any).navigator.modelContext.registerTool({
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
      });
    });

    let addedTools = await imperativeToolAdded;
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
    expect(await addedTools[0]!.formElement).toBeUndefined();
    expect(addedTools[0]!.location).toBeDefined();

    const declarativeToolAdded = new Promise<WebMCPTool[]>(resolve => {
      page.webmcp.once('toolsadded', event => {
        return resolve(event.tools);
      });
    });

    // Register a declarative WebMCP tool.
    await page.evaluate(() => {
      const form = document.createElement('form');
      form.setAttribute('toolname', 'declarative tool name');
      form.setAttribute('tooldescription', 'tool description');
      (window as any).document.body.appendChild(form);
    });

    addedTools = await declarativeToolAdded;
    expect(addedTools.length).toBe(1);
    expect(addedTools[0]!.name).toBe('declarative tool name');
    expect(addedTools[0]!.description).toBe('tool description');
    expect(addedTools[0]!.inputSchema).toStrictEqual({});
    expect(addedTools[0]!.frame).toBe(page.mainFrame());
    expect(await addedTools[0]!.formElement).toBeDefined();
    expect(addedTools[0]!.location).toBeUndefined();
  });

  it('should fire toolsremoved events', async () => {
    const {page, httpsServer} = state;
    await page.goto(httpsServer.EMPTY_PAGE);

    expect(page.webmcp).toBeDefined();

    // Register an imperative WebMCP tool.
    using controllerHandle = await page.evaluateHandle(() => {
      const controller = new AbortController();
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
        {signal: controller.signal},
      );
      return controller;
    });

    // Register a declarative WebMCP tool.
    await page.evaluate(() => {
      const form = document.createElement('form');
      form.setAttribute('toolname', 'declarative tool name');
      form.setAttribute('tooldescription', 'tool description');
      (window as any).document.body.appendChild(form);
    });

    const imperativeToolRemoved = new Promise<WebMCPTool[]>(resolve => {
      page.webmcp.once('toolsremoved', event => {
        return resolve(event.tools);
      });
    });

    // Unregister imperative WebMCP tool.
    await controllerHandle.evaluate(el => {
      (window as any).navigator.modelContext.unregisterTool?.('test-tool-1');
      el.abort();
    });

    let removedTools = await imperativeToolRemoved;
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
    expect(await removedTools[0]!.formElement).toBeUndefined();
    expect(removedTools[0]!.location).toBeDefined();

    const declarativeToolRemoved = new Promise<WebMCPTool[]>(resolve => {
      page.webmcp.once('toolsremoved', event => {
        return resolve(event.tools);
      });
    });

    // Unregister declarative WebMCP tool.
    await page.evaluate(() => {
      document.querySelector('form')!.remove();
    });

    removedTools = await declarativeToolRemoved;
    expect(removedTools.length).toBe(1);
    expect(removedTools[0]!.name).toBe('declarative tool name');
    expect(removedTools[0]!.description).toBe('tool description');
    expect(removedTools[0]!.inputSchema).toStrictEqual({});
    expect(removedTools[0]!.frame).toBe(page.mainFrame());
    expect(await removedTools[0]!.formElement).toBeDefined();
    expect(removedTools[0]!.location).toBeUndefined();
  });

  it('should remove tools on frame navigation', async () => {
    const {page, httpsServer} = state;
    await page.goto(httpsServer.EMPTY_PAGE);

    const toolsAddedPromise = new Promise<void>(resolve => {
      page.webmcp.once('toolsadded', () => {
        resolve();
      });
    });

    // Register a declarative WebMCP tool.
    await page.evaluate(() => {
      const form = document.createElement('form');
      form.setAttribute('toolname', 'declarative tool name');
      form.setAttribute('tooldescription', 'tool description');
      document.body.appendChild(form);
    });

    await toolsAddedPromise;

    const toolsRemovedPromise = new Promise<WebMCPTool[]>(resolve => {
      page.webmcp.once('toolsremoved', event => {
        return resolve(event.tools);
      });
    });

    // Reload page forces frame navigation.
    await page.goto(httpsServer.EMPTY_PAGE);

    const removedTools = await toolsRemovedPromise;
    expect(removedTools.length).toBe(1);
    expect(removedTools[0]!.name).toBe('declarative tool name');
    expect(page.webmcp.tools().length).toBe(0);
  });

  it('should fire toolinvoked events', async () => {
    const {page, httpsServer} = state;
    await page.goto(httpsServer.EMPTY_PAGE);

    expect(page.webmcp).toBeDefined();

    const toolAdded = new Promise<WebMCPTool[]>(resolve => {
      page.webmcp.once('toolsadded', event => {
        return resolve(event.tools);
      });
    });

    // Register a WebMCP tool.
    await page.evaluate(() => {
      (window as any).navigator.modelContext.registerTool({
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
      });
    });

    const [addedTool] = await toolAdded;

    const addedToolCalled = new Promise<WebMCPToolCall>(resolve => {
      addedTool!.once('toolinvoked', resolve);
    });

    const toolCalled = new Promise<WebMCPToolCall>(resolve => {
      page.webmcp.once('toolinvoked', resolve);
    });

    // Execute WebMCP tool.
    await page.evaluate(() => {
      (window as any).navigator.modelContextTesting.executeTool(
        'test-tool-1',
        JSON.stringify({text: 'test'}),
      );
    });

    const [addedToolCall, toolCall] = await Promise.all([
      addedToolCalled,
      toolCalled,
    ]);

    async function expectToolCall(call: WebMCPToolCall) {
      expect(call.id).toBeDefined();
      expect(call.tool).toBeDefined();
      expect(call.tool.name).toBe('test-tool-1');
      expect(call.tool.description).toBe('A test tool 1');
      expect(call.tool.inputSchema).toStrictEqual({
        type: 'object',
        properties: {
          text: {type: 'string', description: 'Some text'},
        },
        required: ['text'],
      });
      expect(call.tool.frame).toBe(page.mainFrame());
      expect(await call.tool.formElement).toBeUndefined();
      expect(call.tool.location).toBeDefined();
      expect(call.input).toStrictEqual({text: 'test'});
    }
    await expectToolCall(addedToolCall);
    await expectToolCall(toolCall);
  });
});
