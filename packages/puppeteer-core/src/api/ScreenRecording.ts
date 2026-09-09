/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {Logger} from '../common/Debug.js';
import {asyncDisposeSymbol} from '../util/disposable.js';

import type {Page, RecordOptions} from './Page.js';

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
export abstract class ScreenRecording extends ReadableStream<Uint8Array> {
  /**
   * @internal
   */
  protected page: Page;
  /**
   * @internal
   */
  protected options: RecordOptions;
  /**
   * @internal
   */
  protected logger: Logger;
  /**
   * @internal
   */
  protected controller!: ReadableStreamDefaultController<Uint8Array>;
  /**
   * @internal
   */
  protected destinations = new Set<WritableDestination>();
  /**
   * @internal
   */
  protected stopped = false;

  /**
   * @internal
   */
  constructor(page: Page, options: RecordOptions = {}, logger: Logger) {
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    super({
      start(c) {
        controller = c;
      },
    });
    this.controller = controller;

    this.page = page;
    this.options = options;
    this.logger = logger;
  }

  /**
   * @internal
   */
  abstract _start(): Promise<void>;

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
    this.destinations.add(dest);
    dest.once?.('unpipe', () => {
      this.destinations.delete(dest);
    });
    dest.once?.('error', () => {
      this.destinations.delete(dest);
    });
    dest.once?.('close', () => {
      this.destinations.delete(dest);
    });
    dest.once?.('finish', () => {
      this.destinations.delete(dest);
    });
    return dest;
  }

  /**
   * Stops the screen recording.
   *
   * @public
   */
  abstract stop(): Promise<void>;

  /**
   * @internal
   */
  protected async closeDestinations(): Promise<void> {
    try {
      this.controller.close();
    } catch {
      // Controller might already be closed.
    }
    for (const dest of this.destinations) {
      dest.end();
    }
    const destinationPromises = Array.from(this.destinations).map(dest => {
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

  async [asyncDisposeSymbol](): Promise<void> {
    await this.stop();
  }
}
