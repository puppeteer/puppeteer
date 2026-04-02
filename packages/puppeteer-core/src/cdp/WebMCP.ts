/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {CDPSession} from '../api/CDPSession.js';
import {EventEmitter} from '../common/EventEmitter.js';

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
  stackTrace?: unknown;
}

interface ProtocolWebMCPToolsAddedEvent {
  tools: ProtocolWebMCPTool[];
}

interface ProtocolWebMCPToolsRemovedEvent {
  tools: ProtocolWebMCPTool[];
}

/**
 * @public
 */
export class WebMCPTool {
  name: string;
  description: string;
  inputSchema?: object;
  annotations?: WebMCPAnnotation;
  frameId: string;
  backendNodeId?: number;
  stackTrace?: unknown;

  /**
   * @internal
   */
  constructor(tool: ProtocolWebMCPTool) {
    this.name = tool.name;
    this.description = tool.description;
    this.inputSchema = tool.inputSchema;
    this.annotations = tool.annotations;
    this.frameId = tool.frameId;
    this.backendNodeId = tool.backendNodeId;
    this.stackTrace = tool.stackTrace;
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
 * The WebMCP class provides an API for the WebMCP API.
 *
 * @public
 */

export class WebMCP extends EventEmitter<{
  /** Emitted when tools are added. */
  toolsadded: WebMCPToolsAddedEvent;
  /** Emitted when tools are removed. */
  toolsremoved: WebMCPToolsRemovedEvent;
}> {
  #client: CDPSession;
  #tools: Map<string, Map<string, WebMCPTool>>;

  #onToolsAdded = (event: ProtocolWebMCPToolsAddedEvent) => {
    const tools: WebMCPTool[] = [];
    event.tools.forEach(tool => {
      const frameTools = this.#tools.get(tool.frameId) ?? new Map();
      if (!this.#tools.has(tool.frameId)) {
        this.#tools.set(tool.frameId, frameTools);
      }
      const addedTool = new WebMCPTool(tool);
      frameTools.set(tool.name, addedTool);
      tools.push(addedTool);
    });
    this.emit('toolsadded', {tools});
  };
  #onToolsRemoved = (event: ProtocolWebMCPToolsRemovedEvent) => {
    const tools = event.tools
      .filter(tool => {
        return this.#tools.get(tool.frameId)?.delete(tool.name);
      })
      .map(tool => {
        return new WebMCPTool(tool);
      });
    this.emit('toolsremoved', {tools});
  };

  /**
   * @internal
   */
  constructor(client: CDPSession) {
    super();
    this.#client = client;
    this.#bindListeners();
    this.#tools = new Map();
  }

  async tools(): Promise<WebMCPTool[]> {
    await this.#client.send('WebMCP.enable' as any);
    return Array.from(this.#tools.values()).flatMap(toolMap => {
      return Array.from(toolMap.values());
    });
  }

  #bindListeners(): void {
    // We use type casting because WebMCP is not yet in the Protocol types.
    this.#client.on('WebMCP.toolsAdded' as any, this.#onToolsAdded as any);
    this.#client.on('WebMCP.toolsRemoved' as any, this.#onToolsRemoved as any);
  }

  /**
   * @internal
   */
  updateClient(client: CDPSession): void {
    this.#client.off('WebMCP.toolsAdded' as any, this.#onToolsAdded as any);
    this.#client.off('WebMCP.toolsRemoved' as any, this.#onToolsRemoved as any);
    this.#client = client;
    this.#bindListeners();
  }
}
