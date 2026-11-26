/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type {Protocol} from 'devtools-protocol';

import {type CDPSession, CDPSessionEvent} from '../api/CDPSession.js';
import {TargetCloseError} from '../common/Errors.js';
import {stringToTypedArray} from '../util/encoding.js';

/**
 * Streams the body of a response that is still loading, using
 * `Network.streamResourceContent` for the data received so far and
 * `Network.dataReceived` events for the rest.
 *
 * @internal
 */
export async function createResponseBodyStream(
  client: CDPSession,
  requestId: string,
): Promise<ReadableStream<Uint8Array>> {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  // Events received before the buffered data is enqueued.
  let pending: Array<() => void> | null = [];
  const run = (action: () => void) => {
    if (pending) {
      pending.push(action);
    } else {
      action();
    }
  };

  const onDataReceived = (event: Protocol.Network.DataReceivedEvent) => {
    if (event.requestId !== requestId || !event.data) {
      return;
    }
    const chunk = stringToTypedArray(event.data, true);
    run(() => {
      controller.enqueue(chunk);
    });
  };
  const onLoadingFinished = (event: Protocol.Network.LoadingFinishedEvent) => {
    if (event.requestId !== requestId) {
      return;
    }
    cleanup();
    run(() => {
      controller.close();
    });
  };
  const onLoadingFailed = (event: Protocol.Network.LoadingFailedEvent) => {
    if (event.requestId !== requestId) {
      return;
    }
    cleanup();
    run(() => {
      controller.error(new Error(`Loading failed: ${event.errorText}`));
    });
  };
  const onDisconnected = () => {
    cleanup();
    run(() => {
      controller.error(new TargetCloseError('Session closed.'));
    });
  };
  const cleanup = () => {
    client.off('Network.dataReceived', onDataReceived);
    client.off('Network.loadingFinished', onLoadingFinished);
    client.off('Network.loadingFailed', onLoadingFailed);
    client.off(CDPSessionEvent.Disconnected, onDisconnected);
  };

  const stream = new ReadableStream<Uint8Array>({
    start(streamController) {
      controller = streamController;
    },
    cancel() {
      cleanup();
    },
  });
  client.on('Network.dataReceived', onDataReceived);
  client.on('Network.loadingFinished', onLoadingFinished);
  client.on('Network.loadingFailed', onLoadingFailed);
  client.on(CDPSessionEvent.Disconnected, onDisconnected);

  let bufferedData: string;
  try {
    ({bufferedData} = await client.send('Network.streamResourceContent', {
      requestId,
    }));
  } catch (error) {
    cleanup();
    throw error;
  }

  if (bufferedData) {
    controller.enqueue(stringToTypedArray(bufferedData, true));
  }
  const actions = pending;
  pending = null;
  for (const action of actions) {
    action();
  }
  return stream;
}
