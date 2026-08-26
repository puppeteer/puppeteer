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
  failSend = false;
  #resolveSend: (() => void) | undefined;

  send(
    _method?: 'Page.startScreencast',
    _params?: {format: 'png'},
  ): Promise<unknown> {
    if (this.failSend) {
      return Promise.reject(new Error('startScreencast failed'));
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

/**
 * Real CDP delivers the command result and `Page.screencastFrame` as
 * separate tasks. Emitting a frame inside `send()` is not a faithful
 * model of that transport.
 */
function afterTimeout(callback: () => void): Promise<void> {
  return new Promise(resolve => {
    setTimeout(() => {
      callback();
      resolve();
    }, 0);
  });
}

async function dispatchFrameThenResult(
  client: FakeScreencastClient,
): Promise<void> {
  await afterTimeout(() => {
    client.emitFrame();
  });
  await afterTimeout(() => {
    client.ackStart();
  });
}

async function dispatchResultThenFrame(
  client: FakeScreencastClient,
): Promise<void> {
  await afterTimeout(() => {
    client.ackStart();
  });
  await afterTimeout(() => {
    client.emitFrame();
  });
}

async function startAfterAck(client: FakeScreencastClient): Promise<void> {
  await client.send('Page.startScreencast', {format: 'png'});
  await new Promise<void>(resolve => {
    client.on('Page.screencastFrame', () => {
      resolve();
    });
  });
}

describe('startScreencastAndWaitForFirstFrame', () => {
  it('does not miss a frame dispatched before the command result', async () => {
    const client = new FakeScreencastClient();

    const ready = startScreencastAndWaitForFirstFrame(client);
    await dispatchFrameThenResult(client);
    await ready;

    expect(client.frameListeners).toHaveLength(0);
  });

  it('waits for a later frame when the result arrives first', async () => {
    const client = new FakeScreencastClient();
    let settled = false;
    const ready = startScreencastAndWaitForFirstFrame(client).then(() => {
      settled = true;
    });

    await afterTimeout(() => {
      client.ackStart();
    });
    await Promise.resolve();
    expect(settled).toBe(false);
    expect(client.frameListeners).toHaveLength(1);

    await afterTimeout(() => {
      client.emitFrame();
    });
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

  it('reproduces a missed first frame when listen happens after the result', async () => {
    const client = new FakeScreencastClient();
    let settled = false;
    void startAfterAck(client).then(() => {
      settled = true;
    });

    await dispatchFrameThenResult(client);
    await afterTimeout(() => {});

    expect(settled).toBe(false);
    expect(client.frameListeners).toHaveLength(1);
  });

  it('still resolves after-ack when the result task runs before the frame task', async () => {
    const client = new FakeScreencastClient();

    const ready = startAfterAck(client);
    await dispatchResultThenFrame(client);
    await ready;
  });
});
