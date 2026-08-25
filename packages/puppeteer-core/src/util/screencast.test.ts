/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import expect from 'expect';

import {
  startScreencastAndWaitForFirstFrame,
  type ScreencastClient,
} from './screencast.js';

class FakeScreencastClient implements ScreencastClient {
  frameListeners: Array<() => void> = [];
  emitFrameDuringSend = false;
  failSend = false;
  #resolveSend: (() => void) | undefined;

  send(
    _method?: 'Page.startScreencast',
    _params?: {format: 'png'},
  ): Promise<unknown> {
    if (this.failSend) {
      return Promise.reject(new Error('startScreencast failed'));
    }
    if (this.emitFrameDuringSend) {
      this.emitFrame();
    }
    return new Promise(resolve => {
      this.#resolveSend = () => {
        resolve(undefined);
      };
    });
  }

  on(_event: 'Page.screencastFrame', handler: () => void): this {
    this.frameListeners.push(handler);
    return this;
  }

  off(_event: 'Page.screencastFrame', handler: () => void): this {
    this.frameListeners = this.frameListeners.filter(
      listener => listener !== handler,
    );
    return this;
  }

  ackStart(): void {
    this.#resolveSend?.();
  }

  emitFrame(): void {
    const listeners = [...this.frameListeners];
    for (const listener of listeners) {
      listener();
    }
  }
}

describe('startScreencastAndWaitForFirstFrame', () => {
  it('does not miss a frame emitted during Page.startScreencast', async () => {
    const client = new FakeScreencastClient();
    client.emitFrameDuringSend = true;

    const ready = startScreencastAndWaitForFirstFrame(client);
    client.ackStart();
    await ready;

    expect(client.frameListeners).toHaveLength(0);
  });

  it('waits for a later frame when none arrives during start', async () => {
    const client = new FakeScreencastClient();
    let settled = false;
    const ready = startScreencastAndWaitForFirstFrame(client).then(() => {
      settled = true;
    });

    client.ackStart();
    await Promise.resolve();
    expect(settled).toBe(false);
    expect(client.frameListeners).toHaveLength(1);

    client.emitFrame();
    await ready;
    expect(settled).toBe(true);
    expect(client.frameListeners).toHaveLength(0);
  });

  it('removes the frame listener if Page.startScreencast rejects', async () => {
    const client = new FakeScreencastClient();
    client.failSend = true;

    await expect(startScreencastAndWaitForFirstFrame(client)).rejects.toThrow(
      'startScreencast failed',
    );
    expect(client.frameListeners).toHaveLength(0);
  });

  it('reproduces a missed first frame when the listener is attached after ack', async () => {
    const client = new FakeScreencastClient();
    client.emitFrameDuringSend = true;

    let settled = false;
    void (async () => {
      await client.send('Page.startScreencast', {format: 'png'});
      await new Promise<void>(resolve => {
        client.on('Page.screencastFrame', () => {
          resolve();
        });
      });
      settled = true;
    })();

    client.ackStart();
    await Promise.resolve();
    expect(settled).toBe(false);
    expect(client.frameListeners).toHaveLength(1);
  });
});
