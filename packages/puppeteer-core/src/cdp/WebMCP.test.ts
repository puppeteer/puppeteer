/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import expect from 'expect';

import type {CDPSessionEvents} from '../api/CDPSession.js';
import {EventEmitter} from '../common/EventEmitter.js';

import {WebMCP} from './WebMCP.js';

class MockCDPSession extends EventEmitter<CDPSessionEvents> {
  #webmcp?: WebMCP;

  setWebMCP(webmcp: WebMCP): void {
    this.#webmcp = webmcp;
  }

  async send(method: string): Promise<any> {
    if (method === 'WebMCP.enable') {
      return;
    }
    if (method === 'WebMCP.invokeTool') {
      this.emit('WebMCP.toolResponded', {
        invocationId: 'invocation-id',
        status: 'Completed',
        output: 'early-result',
      });
      return {invocationId: 'invocation-id'};
    }
    throw new Error(`Unexpected CDP method: ${method}`);
  }
  connection() {
    return undefined;
  }
  readonly detached = false;
  async detach() {}
  id() {
    return '1';
  }
  parentSession() {
    return undefined;
  }
}

describe('WebMCP', () => {
  it('should resolve execute() when toolresponded fires before the listener is attached', async () => {
    const client = new MockCDPSession();
    const frame = {_id: 'frame-id'};
    const frameManager = {
      on() {},
      frame(frameId: string) {
        return frameId === frame._id ? frame : undefined;
      },
    };

    const webmcp = new WebMCP(client, frameManager as never);
    client.setWebMCP(webmcp);
    client.emit('WebMCP.toolsAdded', {
      tools: [
        {
          name: 'tool-name',
          description: 'tool-description',
          frameId: frame._id,
        },
      ],
    });

    const [tool] = webmcp.tools();
    expect(tool).toBeDefined();

    const result = await Promise.race([
      tool!.execute({value: 1}),
      new Promise(resolve => {
        setTimeout(() => {
          resolve('timeout');
        }, 25);
      }),
    ]);

    expect(result).not.toBe('timeout');
    expect(result).toMatchObject({
      id: 'invocation-id',
      status: 'Completed',
      output: 'early-result',
    });
  });
});
