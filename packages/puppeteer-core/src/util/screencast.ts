/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Minimal CDP client surface used to start a screencast and observe frames.
 *
 * @internal
 */
export interface ScreencastClient {
  send(
    method: 'Page.startScreencast',
    params: {format: 'png'},
  ): Promise<unknown>;
  on(event: 'Page.screencastFrame', handler: () => void): unknown;
  off(event: 'Page.screencastFrame', handler: () => void): unknown;
}

/**
 * Starts a screencast and resolves on the first frame. The listener is
 * registered before `Page.startScreencast` is sent, and removed on settle
 * or reject.
 *
 * @internal
 */
export async function startScreencastAndWaitForFirstFrame(
  client: ScreencastClient,
): Promise<void> {
  let onFrame = (): void => {};
  try {
    const firstFrame = new Promise<void>(resolve => {
      onFrame = () => {
        resolve();
      };
      client.on('Page.screencastFrame', onFrame);
    });
    await client.send('Page.startScreencast', {format: 'png'});
    await firstFrame;
  } finally {
    client.off('Page.screencastFrame', onFrame);
  }
}
