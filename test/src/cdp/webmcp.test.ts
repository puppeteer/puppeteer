/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="webmcp-types" />

import {assert} from 'chai';
import type {Issue} from 'puppeteer';
import type {
  WebMCPTool,
  WebMCPToolCall,
  WebMCPToolCallResult,
} from 'puppeteer-core/internal/cdp/WebMCP.js';

import {setupSeparateTestBrowserHooks} from '../mocha-utils.js';
import {html, waitEvent} from '../utils.js';

describe('Page.webmcp', function () {
  const state = setupSeparateTestBrowserHooks({
    args: ['--enable-features=WebMCP'],
    acceptInsecureCerts: true,
  });

  it('should list tools', async () => {
    const {page, httpsServer} = state;
    await page.goto(httpsServer.EMPTY_PAGE);

    assert.isDefined(page.webmcp);

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
    await page.evaluate(async () => {
      await document.modelContext?.registerTool({
        name: 'test-tool-1',
        description: 'A test tool 1',
        inputSchema: {
          type: 'object',
          properties: {
            text: {type: 'string', description: 'Some text'},
          },
          required: ['text'],
        },
        execute: ({text}) => {
          return `hello ${text}`;
        },
        annotations: {readOnlyHint: true, untrustedContentHint: true},
      });
    });
    // Register a declarative WebMCP tool.
    await page.evaluate(() => {
      const form = document.createElement('form');
      form.setAttribute('toolname', 'declarative tool name');
      form.setAttribute('tooldescription', 'tool description');
      form.setAttribute('toolautosubmit', '');
      (window as any).document.body.appendChild(form);
    });

    await toolsAddedPromise;

    const tools = page.webmcp.tools();
    assert.strictEqual(tools.length, 2);

    assert.strictEqual(tools[0]!.name, 'test-tool-1');
    assert.strictEqual(tools[0]!.description, 'A test tool 1');
    assert.deepEqual(tools[0]!.inputSchema, {
      type: 'object',
      properties: {
        text: {type: 'string', description: 'Some text'},
      },
      required: ['text'],
    });
    assert.isDefined(tools[0]!.annotations);
    assert.isTrue(tools[0]!.annotations!.readOnly);
    assert.isTrue(tools[0]!.annotations!.untrustedContent);
    assert.strictEqual(tools[0]!.frame, page.mainFrame());
    assert.isUndefined(await tools[0]!.formElement);
    assert.isDefined(tools[0]!.location);

    assert.strictEqual(tools[1]!.name, 'declarative tool name');
    assert.strictEqual(tools[1]!.description, 'tool description');
    assert.deepEqual(tools[1]!.inputSchema, {
      type: 'object',
      properties: {},
      required: [],
    });
    assert.isDefined(tools[1]!.annotations);
    assert.isTrue(tools[1]!.annotations!.autosubmit);
    assert.strictEqual(tools[1]!.frame, page.mainFrame());
    assert.isDefined(await tools[1]!.formElement);
    assert.isUndefined(tools[1]!.location);
  });

  it('should fire toolsadded events', async () => {
    const {page, httpsServer} = state;
    await page.goto(httpsServer.EMPTY_PAGE);

    assert.isDefined(page.webmcp);

    const imperativeToolAdded = new Promise<WebMCPTool[]>(resolve => {
      page.webmcp.once('toolsadded', event => {
        return resolve(event.tools);
      });
    });

    // Register an imperative WebMCP tool.
    await page.evaluate(async () => {
      await document.modelContext?.registerTool({
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

    let addedTools = await imperativeToolAdded;
    assert.strictEqual(addedTools.length, 1);
    assert.strictEqual(addedTools[0]!.name, 'test-tool-1');
    assert.strictEqual(addedTools[0]!.description, 'A test tool 1');
    assert.deepEqual(addedTools[0]!.inputSchema, {
      type: 'object',
      properties: {
        text: {type: 'string', description: 'Some text'},
      },
      required: ['text'],
    });
    assert.isUndefined(addedTools[0]!.annotations);
    assert.strictEqual(addedTools[0]!.frame, page.mainFrame());
    assert.isUndefined(await addedTools[0]!.formElement);
    assert.isDefined(addedTools[0]!.location);

    // Register a declarative WebMCP tool.
    await page.evaluate(() => {
      const form = document.createElement('form');
      form.setAttribute('toolname', 'declarative tool name');
      form.setAttribute('tooldescription', 'tool description');
      (window as any).document.body.appendChild(form);
    });

    const declarativeToolAdded = new Promise<WebMCPTool[]>(resolve => {
      page.webmcp.once('toolsadded', event => {
        return resolve(event.tools);
      });
    });

    addedTools = await declarativeToolAdded;
    assert.strictEqual(addedTools.length, 1);
    assert.strictEqual(addedTools[0]!.name, 'declarative tool name');
    assert.strictEqual(addedTools[0]!.description, 'tool description');
    assert.isUndefined(addedTools[0]!.annotations);
    assert.deepEqual(addedTools[0]!.inputSchema, {
      type: 'object',
      properties: {},
      required: [],
    });
    assert.strictEqual(addedTools[0]!.frame, page.mainFrame());
    assert.isDefined(await addedTools[0]!.formElement);
    assert.isUndefined(addedTools[0]!.location);
  });

  it('should fire toolsremoved events', async () => {
    const {page, httpsServer} = state;
    await page.goto(httpsServer.EMPTY_PAGE);

    assert.isDefined(page.webmcp);

    // Register an imperative WebMCP tool.
    using controllerHandle = await page.evaluateHandle(async () => {
      const controller = new AbortController();
      await document.modelContext?.registerTool(
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
        },
        {signal: controller.signal},
      );
      return controller;
    });

    const imperativeToolRemoved = new Promise<WebMCPTool[]>(resolve => {
      page.webmcp.once('toolsremoved', event => {
        return resolve(event.tools);
      });
    });

    // Unregister imperative WebMCP tool.
    await controllerHandle.evaluate(el => {
      el.abort();
    });

    let removedTools = await imperativeToolRemoved;
    assert.strictEqual(removedTools.length, 1);
    assert.strictEqual(removedTools[0]!.name, 'test-tool-1');
    assert.strictEqual(removedTools[0]!.description, 'A test tool 1');
    assert.deepEqual(removedTools[0]!.inputSchema, {
      type: 'object',
      properties: {
        text: {type: 'string', description: 'Some text'},
      },
      required: ['text'],
    });
    assert.isUndefined(removedTools[0]!.annotations);
    assert.strictEqual(removedTools[0]!.frame, page.mainFrame());
    assert.isUndefined(await removedTools[0]!.formElement);
    assert.isDefined(removedTools[0]!.location);

    // Register a declarative WebMCP tool.
    await page.evaluate(() => {
      const form = document.createElement('form');
      form.setAttribute('toolname', 'declarative tool name');
      form.setAttribute('tooldescription', 'tool description');
      (window as any).document.body.appendChild(form);
    });

    await new Promise<WebMCPTool[]>(resolve => {
      page.webmcp.once('toolsadded', event => {
        return resolve(event.tools);
      });
    });

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
    assert.strictEqual(removedTools.length, 1);
    assert.strictEqual(removedTools[0]!.name, 'declarative tool name');
    assert.strictEqual(removedTools[0]!.description, 'tool description');
    assert.deepEqual(removedTools[0]!.inputSchema, {
      type: 'object',
      properties: {},
      required: [],
    });
    assert.isUndefined(removedTools[0]!.annotations);
    assert.strictEqual(removedTools[0]!.frame, page.mainFrame());
    assert.isDefined(await removedTools[0]!.formElement);
    assert.isUndefined(removedTools[0]!.location);
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
    assert.strictEqual(removedTools.length, 1);
    assert.strictEqual(removedTools[0]!.name, 'declarative tool name');
    assert.strictEqual(page.webmcp.tools().length, 0);
  });

  it('should handle multiple navigations and report tools correctly', async () => {
    const {page, httpsServer} = state;
    await page.goto(httpsServer.EMPTY_PAGE);

    // 1. Register tool on C1
    let toolsAddedPromise = new Promise<void>(resolve => {
      page.webmcp.once('toolsadded', () => {
        return resolve();
      });
    });
    await page.evaluate(() => {
      const form = document.createElement('form');
      form.setAttribute('toolname', 'tool-1');
      form.setAttribute('tooldescription', 'desc-1');
      document.body.appendChild(form);
    });
    await toolsAddedPromise;
    assert.strictEqual(page.webmcp.tools().length, 1);
    assert.strictEqual(page.webmcp.tools()[0]!.name, 'tool-1');

    // 2. Navigate to C2
    let toolsRemovedPromise = new Promise<void>(resolve => {
      page.webmcp.once('toolsremoved', () => {
        return resolve();
      });
    });
    await page.goto(httpsServer.EMPTY_PAGE);
    await toolsRemovedPromise;
    assert.strictEqual(page.webmcp.tools().length, 0);

    // 3. Register tool on C2
    toolsAddedPromise = new Promise<void>(resolve => {
      page.webmcp.once('toolsadded', () => {
        return resolve();
      });
    });
    await page.evaluate(() => {
      const form = document.createElement('form');
      form.setAttribute('toolname', 'tool-2');
      form.setAttribute('tooldescription', 'desc-2');
      document.body.appendChild(form);
    });
    await toolsAddedPromise;
    assert.strictEqual(page.webmcp.tools().length, 1);
    assert.strictEqual(page.webmcp.tools()[0]!.name, 'tool-2');

    // 4. Navigate to C3
    toolsRemovedPromise = new Promise<void>(resolve => {
      page.webmcp.once('toolsremoved', () => {
        return resolve();
      });
    });
    await page.goto(httpsServer.EMPTY_PAGE);
    await toolsRemovedPromise;
    assert.strictEqual(page.webmcp.tools().length, 0);
  });

  it('should not reset tools on same-document navigation', async () => {
    const {page, httpsServer} = state;
    await page.goto(httpsServer.EMPTY_PAGE);

    const toolsAddedPromise = new Promise<void>(resolve => {
      page.webmcp.once('toolsadded', () => {
        return resolve();
      });
    });
    await page.evaluate(() => {
      const form = document.createElement('form');
      form.setAttribute('toolname', 'declarative tool name');
      form.setAttribute('tooldescription', 'tool description');
      document.body.appendChild(form);
    });
    await toolsAddedPromise;
    assert.strictEqual(page.webmcp.tools().length, 1);

    // Same document/hash navigation should not reset tools.
    await page.goto(httpsServer.EMPTY_PAGE + '#hash');

    // Tools should still be present because context was not destroyed.
    assert.strictEqual(page.webmcp.tools().length, 1);
    assert.strictEqual(page.webmcp.tools()[0]!.name, 'declarative tool name');
  });

  it('should fire toolinvoked events', async () => {
    const {page, httpsServer} = state;
    await page.goto(httpsServer.EMPTY_PAGE);

    assert.isDefined(page.webmcp);

    const toolAdded = new Promise<WebMCPTool[]>(resolve => {
      page.webmcp.once('toolsadded', event => {
        return resolve(event.tools);
      });
    });

    // Register a WebMCP tool.
    await page.evaluate(async () => {
      await document.modelContext?.registerTool({
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
    await page.evaluate(async () => {
      const [tool] = await document.modelContext!.getTools();
      (document as any).modelContext.executeTool(
        tool,
        JSON.stringify({text: 'test'}),
      );
    });

    const [addedToolCall, toolCall] = await Promise.all([
      addedToolCalled,
      toolCalled,
    ]);

    async function expectToolCall(call: WebMCPToolCall) {
      assert.isDefined(call.id);
      assert.isDefined(call.tool);
      assert.strictEqual(call.tool.name, 'test-tool-1');
      assert.strictEqual(call.tool.description, 'A test tool 1');
      assert.deepEqual(call.tool.inputSchema, {
        type: 'object',
        properties: {
          text: {type: 'string', description: 'Some text'},
        },
        required: ['text'],
      });
      assert.strictEqual(call.tool.frame, page.mainFrame());
      assert.isUndefined(await call.tool.formElement);
      assert.isDefined(call.tool.location);
      assert.deepEqual(call.input, {text: 'test'});
    }
    await expectToolCall(addedToolCall);
    await expectToolCall(toolCall);
  });

  it('should fire toolresponded event with success', async () => {
    const {page, httpsServer} = state;
    await page.goto(httpsServer.EMPTY_PAGE);

    assert.isDefined(page.webmcp);

    // Register a WebMCP tool.
    await page.evaluate(async () => {
      await document.modelContext?.registerTool({
        name: 'test-tool-1',
        description: 'A test tool 1',
        inputSchema: {
          type: 'object',
          properties: {
            text: {type: 'string', description: 'Some text'},
          },
          required: ['text'],
        },
        execute: ({text}) => {
          return `hello ${text}`;
        },
      });
    });

    const toolCalled = new Promise<WebMCPToolCall>(resolve => {
      page.webmcp.once('toolinvoked', resolve);
    });

    const toolResponded = new Promise<WebMCPToolCallResult>(resolve => {
      page.webmcp.once('toolresponded', resolve);
    });

    // Execute WebMCP tool.
    await page.evaluate(async () => {
      const [tool] = await document.modelContext!.getTools();
      (document as any).modelContext.executeTool(
        tool,
        JSON.stringify({text: 'world'}),
      );
    });

    const call = await toolCalled;
    const response = await toolResponded;

    assert.strictEqual(response.id, call.id);
    assert.strictEqual(response.call, call);
    assert.strictEqual(response.status, 'Completed');
    assert.strictEqual(response.output, 'hello world');
    assert.isUndefined(response.errorText);
    assert.isUndefined(response.exception);
  });

  it('should fire toolresponded event with exception', async () => {
    const {page, httpsServer} = state;
    await page.goto(httpsServer.EMPTY_PAGE);

    assert.isDefined(page.webmcp);

    // Register a WebMCP tool.
    await page.evaluate(async () => {
      await document.modelContext?.registerTool({
        name: 'raise-exception-tool',
        description: 'A tool that raises JS exception',
        execute: () => {
          throw new Error('sorry!');
        },
      });
    });

    const toolCalled = new Promise<WebMCPToolCall>(resolve => {
      page.webmcp.once('toolinvoked', resolve);
    });

    const toolResponded = new Promise<WebMCPToolCallResult>(resolve => {
      page.webmcp.once('toolresponded', resolve);
    });

    // Execute WebMCP tool.
    await page.evaluate(async () => {
      const [tool] = await document.modelContext!.getTools();
      (document as any).modelContext.executeTool(tool, '{}');
    });

    const call = await toolCalled;
    const response = await toolResponded;

    assert.strictEqual(response.id, call.id);
    assert.strictEqual(response.call, call);
    assert.strictEqual(response.status, 'Error');
    assert.isUndefined(response.output);
    assert.strictEqual(response.errorText, '');
    assert.isDefined(response.exception);
    assert.include(response.exception?.description, 'sorry');
  });

  it('should fire toolresponded event with errorText', async () => {
    const {page, httpsServer} = state;
    await page.goto(httpsServer.EMPTY_PAGE);

    assert.isDefined(page.webmcp);

    // Register a WebMCP tool.
    await page.evaluate(async () => {
      await document.modelContext?.registerTool({
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

    const toolCalled = new Promise<WebMCPToolCall>(resolve => {
      page.webmcp.once('toolinvoked', resolve);
    });

    const toolResponded = new Promise<WebMCPToolCallResult>(resolve => {
      page.webmcp.once('toolresponded', resolve);
    });

    // Execute unknown WebMCP tool.
    await page.evaluate(async () => {
      const [tool] = await document.modelContext!.getTools();
      (document as any).modelContext.executeTool(tool, 'invalid json');
    });

    const call = await toolCalled;
    const response = await toolResponded;

    assert.strictEqual(response.id, call.id);
    assert.strictEqual(response.call, call);
    assert.strictEqual(response.status, 'Error');
    assert.isUndefined(response.output);
    assert.strictEqual(response.errorText, 'Failed to parse input arguments');
    assert.isUndefined(response.exception);
  });

  it('should invoke tool', async () => {
    const {page, httpsServer} = state;
    await page.goto(httpsServer.EMPTY_PAGE);

    assert.isDefined(page.webmcp);

    const toolAddedPromise = new Promise<any>(resolve => {
      page.webmcp.on('toolsadded', resolve);
    });

    // Register an imperative WebMCP tool.
    await page.evaluate(async () => {
      await document.modelContext?.registerTool({
        name: 'test-tool-1',
        description: 'A test tool 1',
        inputSchema: {
          type: 'object',
          properties: {
            text: {type: 'string', description: 'Some text'},
          },
          required: ['text'],
        },
        execute: ({text}) => {
          return `hello ${text}`;
        },
      });
    });

    await toolAddedPromise;

    const [tool] = page.webmcp.tools();

    const toolCalled = new Promise<WebMCPToolCall>(resolve => {
      page.webmcp.once('toolinvoked', resolve);
    });

    // Invoke WebMCP tool.
    const response = await tool!.execute({text: 'world'});

    const call = await toolCalled;

    assert.strictEqual(response.id, call.id);
    assert.strictEqual(response.call, call);
    assert.strictEqual(response.status, 'Completed');
    assert.strictEqual(response.output, 'hello world');
    assert.isUndefined(response.errorText);
    assert.isUndefined(response.exception);
  });

  it('should cancel tool execution', async () => {
    const {page, httpsServer} = state;
    await page.goto(httpsServer.EMPTY_PAGE);

    assert.isDefined(page.webmcp);

    const toolAddedPromise = new Promise<any>(resolve => {
      page.webmcp.on('toolsadded', resolve);
    });

    // Register an imperative WebMCP tool with a delayed response.
    await page.evaluate(async () => {
      await document.modelContext?.registerTool({
        name: 'test-tool-1',
        description: 'A test tool 1',
        inputSchema: {
          type: 'object',
          properties: {
            text: {type: 'string', description: 'Some text'},
          },
          required: ['text'],
        },
        execute: () => {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve('done');
            }, 5000);
          });
        },
      });
    });

    await toolAddedPromise;

    const [tool] = page.webmcp.tools();

    const toolCalled = new Promise<WebMCPToolCall>(resolve => {
      page.webmcp.once('toolinvoked', resolve);
    });

    const controller = new AbortController();
    const executePromise = tool!.execute(
      {text: 'world'},
      {signal: controller.signal},
    );

    const call = await toolCalled;
    controller.abort();

    const response = await executePromise;

    assert.strictEqual(response.id, call.id);
    assert.strictEqual(response.call, call);
    assert.strictEqual(response.status, 'Canceled');
    assert.isUndefined(response.output);
    assert.strictEqual(response.errorText, '');
    assert.isUndefined(response.exception);
  });

  it('should cancel tool execution with already aborted signal', async () => {
    const {page, httpsServer} = state;
    await page.goto(httpsServer.EMPTY_PAGE);

    assert.isDefined(page.webmcp);

    const toolAddedPromise = new Promise<any>(resolve => {
      page.webmcp.on('toolsadded', resolve);
    });

    // Register an imperative WebMCP tool with a delayed response.
    await page.evaluate(async () => {
      await document.modelContext?.registerTool({
        name: 'test-tool-1',
        description: 'A test tool 1',
        inputSchema: {
          type: 'object',
          properties: {
            text: {type: 'string', description: 'Some text'},
          },
          required: ['text'],
        },
        execute: () => {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve('done');
            }, 5000);
          });
        },
      });
    });

    await toolAddedPromise;

    const [tool] = page.webmcp.tools();

    const toolCalled = new Promise<WebMCPToolCall>(resolve => {
      page.webmcp.once('toolinvoked', resolve);
    });

    const controller = new AbortController();
    controller.abort();
    const response = await tool!.execute(
      {text: 'world'},
      {signal: controller.signal},
    );

    const call = await toolCalled;

    assert.strictEqual(response.id, call.id);
    assert.strictEqual(response.call, call);
    assert.strictEqual(response.status, 'Canceled');
    assert.isUndefined(response.output);
    assert.strictEqual(response.errorText, '');
    assert.isUndefined(response.exception);
  });

  it('should emit issue event from WebMCP form missing tooldescription', async () => {
    const {page, httpsServer} = state;
    await page.goto(httpsServer.EMPTY_PAGE);

    const issuePromise = waitEvent<Issue>(page, 'issue');

    await page.setContent(html`<form toolname="mytool"></form>`);

    const issue = await issuePromise;
    assert.ok(issue);
    assert.strictEqual(issue.code, 'GenericIssue');
    assert.ok(issue.details.genericIssueDetails);
    assert.strictEqual(
      issue.details.genericIssueDetails!.errorType,
      'FormModelContextMissingToolDescription',
    );
  });
});
