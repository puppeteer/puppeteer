/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {CDPSessionEvent} from '../api/CDPSession.js';
import type {Page, RecordOptions} from '../api/Page.js';
import {DEBUG_PREFIXES, type Logger} from '../common/Debug.js';
import {guarded} from '../util/decorators.js';
import {asyncDisposeSymbol} from '../util/disposable.js';
import {stringToTypedArray} from '../util/encoding.js';

/**
 * @public
 */
export interface WritableDestination {
  write(chunk: Uint8Array): boolean;
  end(): unknown;
  writableFinished?: boolean;
  closed?: boolean;
  destroyed?: boolean;
  once?(event: string, cb: (arg?: unknown) => void): unknown;
}

/**
 * @public
 */
export class ScreenRecording extends ReadableStream<Uint8Array> {
  #page: Page;
  #options: RecordOptions;
  #logger?: Logger;
  #streamHandle?: string;
  #controller!: ReadableStreamDefaultController<Uint8Array>;
  #destinations = new Set<WritableDestination>();
  #stopped = false;

  /**
   * @internal
   */
  constructor(page: Page, options: RecordOptions = {}, logger?: Logger) {
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    super({
      start(c) {
        controller = c;
      },
    });
    this.#controller = controller;

    this.#page = page;
    this.#options = options;
    this.#logger = logger;

    const {client} = this.#page.mainFrame();
    client.once(CDPSessionEvent.Disconnected, () => {
      void this.stop().catch(err => {
        this.#logger?.(DEBUG_PREFIXES.error)?.(err);
      });
    });
  }

  /**
   * @internal
   */
  async _start(): Promise<void> {
    const {client} = this.#page.mainFrame();
    const frameRate = this.#options.frameRate ?? this.#options.fps;
    // @ts-expect-error Page.startScreenRecording is not yet in devtools-protocol
    const result = (await client.send('Page.startScreenRecording', {
      audio: this.#options.audio,
      maxWidth: this.#options.maxWidth,
      maxHeight: this.#options.maxHeight,
      frameRate,
    })) as {stream?: string} | undefined;
    if (result && typeof result.stream === 'string') {
      this.#streamHandle = result.stream;
    }
  }

  /**
   * Pipes the recorded stream to a destination stream.
   *
   * @public
   */
  pipe<T extends WritableStream<Uint8Array>>(destination: T): Promise<void>;
  pipe<T extends WritableDestination>(destination: T): T;
  pipe(
    destination: WritableStream<Uint8Array> | WritableDestination,
  ): Promise<void> | WritableDestination {
    if (
      'getWriter' in destination &&
      typeof destination.getWriter === 'function'
    ) {
      return this.pipeTo(destination as WritableStream<Uint8Array>);
    }
    const dest = destination as WritableDestination;
    this.#destinations.add(dest);
    dest.once?.('unpipe', () => {
      this.#destinations.delete(dest);
    });
    dest.once?.('error', () => {
      this.#destinations.delete(dest);
    });
    dest.once?.('close', () => {
      this.#destinations.delete(dest);
    });
    dest.once?.('finish', () => {
      this.#destinations.delete(dest);
    });
    return dest;
  }

  /**
   * Stops the screen recording.
   *
   * @public
   */
  @guarded()
  async stop(): Promise<void> {
    if (this.#stopped) {
      return;
    }
    this.#stopped = true;

    try {
      const {client} = this.#page.mainFrame();
      const result = (await client
        // @ts-expect-error Page.stopScreenRecording is not yet in devtools-protocol
        .send('Page.stopScreenRecording')
        .catch(err => {
          this.#logger?.(DEBUG_PREFIXES.error)?.(err);
          return undefined;
        })) as {stream?: string} | undefined;

      const handle = result?.stream ?? this.#streamHandle;

      if (handle) {
        let eof = false;
        while (!eof) {
          const {
            data,
            base64Encoded,
            eof: isEof,
          } = await client.send('IO.read', {handle});
          eof = isEof;
          if (data) {
            const buffer = stringToTypedArray(data, base64Encoded ?? false);
            this.#controller.enqueue(buffer);
            for (const dest of this.#destinations) {
              dest.write(buffer);
            }
          }
        }
        await client.send('IO.close', {handle}).catch(err => {
          this.#logger?.(DEBUG_PREFIXES.error)?.(err);
        });
      }
    } finally {
      try {
        this.#controller.close();
      } catch {
        // Controller might already be closed.
      }
      for (const dest of this.#destinations) {
        dest.end();
      }
      const destinationPromises = Array.from(this.#destinations).map(dest => {
        return new Promise(resolve => {
          if (dest.writableFinished || dest.closed || dest.destroyed) {
            resolve(undefined);
          } else {
            dest.once?.('finish', resolve);
            dest.once?.('close', resolve);
            dest.once?.('error', resolve);
          }
        });
      });

      await Promise.all(destinationPromises);
    }
  }

  async [asyncDisposeSymbol](): Promise<void> {
    await this.stop();
  }
}
