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
 * Sends `Page.startScreencast` and resolves once the first
 * `Page.screencastFrame` event is observed.
 *
 * The frame listener is registered before the CDP command is sent. Registering
 * after the acknowledgement can miss the only frame emitted by a static page,
 * leaving readiness waiting forever.
 *
 * If `Page.startScreencast` rejects, the listener is removed before the error
 * propagates.
 *
 * @internal
 */
export async function startScreencastAndWaitForFirstFrame(
  client: ScreencastClient,
): Promise<void> {
  let onFrame: (() => void) | undefined;
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
    if (onFrame) {
      client.off('Page.screencastFrame', onFrame);
    }
  }
}
