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

/**
 * @public
 */
export interface WebMCPTool {
  name: string;
  description: string;
  inputSchema?: object;
  annotations?: WebMCPAnnotation;
  frameId: string;
  backendNodeId?: number;
  stackTrace?: unknown;
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
export interface WebMCPToolInvokedEvent {
  toolName: string;
  frameId: string;
  invocationId: string;
  input: string;
}

/**
 * @public
 */
export interface WebMCPToolRespondedEvent {
  invocationId: string;
  status: WebMCPInvocationStatus;
  output?: unknown;
  errorText?: string;
  exception?: unknown;
}

/**
 * @public
 */
export interface WebMCPEvents extends Record<PropertyKey, unknown> {
  toolsAdded: WebMCPToolsAddedEvent;
  toolsRemoved: WebMCPToolsRemovedEvent;
  toolInvoked: WebMCPToolInvokedEvent;
  toolResponded: WebMCPToolRespondedEvent;
}

/**
 * The WebMCP class provides an API for the WebMCP CDP domain.
 *
 * @public
 */
export class WebMCP extends EventEmitter<WebMCPEvents> {
  #client: CDPSession;

  #onToolsAdded = (event: any) => {
    this.emit('toolsAdded', event);
  };
  #onToolsRemoved = (event: any) => {
    this.emit('toolsRemoved', event);
  };
  #onToolInvoked = (event: any) => {
    this.emit('toolInvoked', event);
  };
  #onToolResponded = (event: any) => {
    this.emit('toolResponded', event);
  };

  /**
   * @internal
   */
  constructor(client: CDPSession) {
    super();
    this.#client = client;
    this.#bindListeners();
  }

  #bindListeners(): void {
    // We use type casting because WebMCP is not yet in the Protocol types.
    this.#client.on('WebMCP.toolsAdded' as any, this.#onToolsAdded);
    this.#client.on('WebMCP.toolsRemoved' as any, this.#onToolsRemoved);
    this.#client.on('WebMCP.toolInvoked' as any, this.#onToolInvoked);
    this.#client.on('WebMCP.toolResponded' as any, this.#onToolResponded);
  }

  /**
   * @internal
   */
  updateClient(client: CDPSession): void {
    this.#client.off('WebMCP.toolsAdded' as any, this.#onToolsAdded);
    this.#client.off('WebMCP.toolsRemoved' as any, this.#onToolsRemoved);
    this.#client.off('WebMCP.toolInvoked' as any, this.#onToolInvoked);
    this.#client.off('WebMCP.toolResponded' as any, this.#onToolResponded);
    this.#client = client;
    this.#bindListeners();
  }

  /**
   * Enables the WebMCP domain.
   */
  async enable(): Promise<void> {
    await this.#client.send('WebMCP.enable' as any);
  }

  /**
   * Disables the WebMCP domain.
   */
  async disable(): Promise<void> {
    await this.#client.send('WebMCP.disable' as any);
  }
}
