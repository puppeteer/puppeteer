/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {Protocol} from 'devtools-protocol';

import type {CDPSession} from '../api/CDPSession.js';
import type {ElementHandle} from '../api/ElementHandle.js';
import type {Frame} from '../api/Frame.js';
import type {ConsoleMessageLocation} from '../common/ConsoleMessage.js';
import {EventEmitter} from '../common/EventEmitter.js';
import {debugError} from '../common/util.js';

import type {CdpFrame} from './Frame.js';
import type {FrameManager} from './FrameManager.js';
import {FrameManagerEvent} from './FrameManagerEvents.js';
import {MAIN_WORLD} from './IsolatedWorlds.js';

/**
 * @public
 */
export interface WebMCPAnnotation {
  readOnly?: boolean;
  autosubmit?: boolean;
}

/**
 * @public
 */
export type WebMCPInvocationStatus = 'Success' | 'Canceled' | 'Error';

interface ProtocolWebMCPTool {
  name: string;
  description: string;
  inputSchema?: object;
  annotations?: WebMCPAnnotation;
  frameId: string;
  backendNodeId?: number;
  stackTrace?: Protocol.Runtime.StackTrace;
}

interface ProtocolWebMCPToolsAddedEvent {
  tools: ProtocolWebMCPTool[];
}

interface ProtocolWebMCPToolsRemovedEvent {
  tools: ProtocolWebMCPTool[];
}

interface ProtocolWebMCPToolInvokedEvent {
  toolName: string;
  frameId: string;
  invocationId: string;
  input: string;
}

/**
 * @public
 */
export class WebMCPTool extends EventEmitter<{
  /** Emitted when invocation starts. */
  toolinvoked: WebMCPToolCall;
}> {
  #backendNodeId?: number;
  #formElement?: ElementHandle<HTMLFormElement>;

  name: string;
  description: string;
  inputSchema?: object;
  annotations?: WebMCPAnnotation;
  frame: Frame;
  location?: ConsoleMessageLocation;
  /**
   * @internal
   */
  rawStackTrace?: Protocol.Runtime.StackTrace;

  /**
   * @internal
   */
  constructor(tool: ProtocolWebMCPTool, frame: Frame) {
    super();
    this.name = tool.name;
    this.description = tool.description;
    this.inputSchema = tool.inputSchema;
    this.annotations = tool.annotations;
    this.frame = frame;
    this.#backendNodeId = tool.backendNodeId;
    if (tool.stackTrace?.callFrames.length) {
      this.location = {
        url: tool.stackTrace.callFrames[0]!.url,
        lineNumber: tool.stackTrace.callFrames[0]!.lineNumber,
        columnNumber: tool.stackTrace.callFrames[0]!.columnNumber,
      };
    }
    this.rawStackTrace = tool.stackTrace;
  }

  get formElement(): Promise<ElementHandle<HTMLFormElement> | undefined> {
    return (async () => {
      if (this.#formElement && !this.#formElement.disposed) {
        return this.#formElement;
      }
      if (!this.#backendNodeId) {
        return undefined;
      }
      this.#formElement = (await (this.frame as CdpFrame).worlds[
        MAIN_WORLD
      ].adoptBackendNode(
        this.#backendNodeId,
      )) as ElementHandle<HTMLFormElement>;
      return this.#formElement;
    })();
  }
}

/**
 * @public
 */
export interface WebMCPToolsAddedEvent {
  tools: WebMCPTool[];
}

/**
 * @public
 */
export interface WebMCPToolsRemovedEvent {
  tools: WebMCPTool[];
}

/**
 * @public
 */
export class WebMCPToolCall {
  id: string;
  tool: WebMCPTool;
  input: object;

  /**
   * @internal
   */
  constructor(invocationId: string, tool: WebMCPTool, input: string) {
    this.id = invocationId;
    this.tool = tool;
    try {
      this.input = JSON.parse(input);
    } catch (error) {
      this.input = {};
      debugError(error);
    }
  }
}

/**
 * The WebMCP class provides an API for the WebMCP API.
 *
 * @public
 */
export class WebMCP extends EventEmitter<{
  /** Emitted when tools are added. */
  toolsadded: WebMCPToolsAddedEvent;
  /** Emitted when tools are removed. */
  toolsremoved: WebMCPToolsRemovedEvent;
  /** Emitted when a tool invocation starts. */
  toolinvoked: WebMCPToolCall;
}> {
  #client: CDPSession;
  #frameManager: FrameManager;
  #tools: Map<string, Map<string, WebMCPTool>>;

  #onToolsAdded = (event: ProtocolWebMCPToolsAddedEvent) => {
    const tools: WebMCPTool[] = [];
    for (const tool of event.tools) {
      const frame = this.#frameManager.frame(tool.frameId);
      if (!frame) {
        continue;
      }

      const frameTools = this.#tools.get(tool.frameId) ?? new Map();
      if (!this.#tools.has(tool.frameId)) {
        this.#tools.set(tool.frameId, frameTools);
      }

      const addedTool = new WebMCPTool(tool, frame);
      frameTools.set(tool.name, addedTool);
      tools.push(addedTool);
    }

    this.emit('toolsadded', {tools});
  };

  #onToolsRemoved = (event: ProtocolWebMCPToolsRemovedEvent) => {
    const tools: WebMCPTool[] = [];
    event.tools.forEach(tool => {
      const removedTool = this.#tools.get(tool.frameId)?.get(tool.name);
      if (removedTool) {
        tools.push(removedTool);
      }
      this.#tools.get(tool.frameId)?.delete(tool.name);
    });
    this.emit('toolsremoved', {tools});
  };

  #onToolInvoked = (event: ProtocolWebMCPToolInvokedEvent) => {
    const tool = this.#tools.get(event.frameId)?.get(event.toolName);
    if (!tool) {
      return;
    }
    const call = new WebMCPToolCall(event.invocationId, tool, event.input);
    tool.emit('toolinvoked', call);
    this.emit('toolinvoked', call);
  };

  #onFrameNavigated = (frame: Frame) => {
    const frameTools = this.#tools.get(frame._id);
    if (!frameTools) {
      return;
    }
    const tools = Array.from(frameTools.values());
    this.#tools.delete(frame._id);
    if (tools.length) {
      this.emit('toolsremoved', {tools});
    }
  };

  /**
   * @internal
   */
  constructor(client: CDPSession, frameManager: FrameManager) {
    super();
    this.#client = client;
    this.#frameManager = frameManager;
    this.#frameManager.on(
      FrameManagerEvent.FrameNavigated,
      this.#onFrameNavigated,
    );
    this.#bindListeners();
    this.#tools = new Map();
  }

  async initialize(): Promise<void> {
    return await this.#client.send('WebMCP.enable' as any).catch(debugError);
  }

  tools(): WebMCPTool[] {
    return Array.from(this.#tools.values()).flatMap(toolMap => {
      return Array.from(toolMap.values());
    });
  }

  #bindListeners(): void {
    // TODO: Remove type-casting. We use type casting because WebMCP is not yet in the
    // Protocol types.
    this.#client.on('WebMCP.toolsAdded' as any, this.#onToolsAdded as any);
    this.#client.on('WebMCP.toolsRemoved' as any, this.#onToolsRemoved as any);
    this.#client.on('WebMCP.toolInvoked' as any, this.#onToolInvoked as any);
  }

  /**
   * @internal
   */
  updateClient(client: CDPSession): void {
    this.#client.off('WebMCP.toolsAdded' as any, this.#onToolsAdded as any);
    this.#client.off('WebMCP.toolsRemoved' as any, this.#onToolsRemoved as any);
    this.#client.off('WebMCP.toolInvoked' as any, this.#onToolInvoked as any);
    this.#client = client;
    this.#bindListeners();
  }
}
