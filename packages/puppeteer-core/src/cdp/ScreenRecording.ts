/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {CDPSessionEvent} from '../api/CDPSession.js';
import type {RecordOptions} from '../api/Page.js';
import {ScreenRecording} from '../api/ScreenRecording.js';
import {DEBUG_PREFIXES, type Logger} from '../common/Debug.js';
import {guarded} from '../util/decorators.js';
import {stringToTypedArray} from '../util/encoding.js';

import type {CdpPage} from './Page.js';

/**
 * @internal
 */
export class CdpScreenRecording extends ScreenRecording {
  declare protected page: CdpPage;
  #streamHandle?: string;

  /**
   * @internal
   */
  constructor(page: CdpPage, options: RecordOptions = {}, logger: Logger) {
    super(page, options, logger);

    const {client} = this.page.mainFrame();
    client?.once?.(CDPSessionEvent.Disconnected, () => {
      void this.stop().catch(err => {
        this.logger(DEBUG_PREFIXES.error)?.(err);
      });
    });
  }

  /**
   * @internal
   */
  override async _start(): Promise<void> {
    const {client} = this.page.mainFrame();
    const frameRate = this.options.frameRate ?? this.options.fps;
    // @ts-expect-error Page.startScreenRecording is not yet in devtools-protocol
    const result = (await client.send('Page.startScreenRecording', {
      audio: this.options.audio,
      maxWidth: this.options.maxWidth,
      maxHeight: this.options.maxHeight,
      frameRate,
    })) as {stream: string};
    this.#streamHandle = result.stream;
  }

  /**
   * Stops the screen recording.
   *
   * @public
   */
  @guarded()
  override async stop(): Promise<void> {
    if (this.stopped) {
      return;
    }
    this.stopped = true;

    try {
      const {client} = this.page.mainFrame();
      await client
        // @ts-expect-error Page.stopScreenRecording is not yet in devtools-protocol
        .send('Page.stopScreenRecording')
        .catch(err => {
          this.logger(DEBUG_PREFIXES.error)?.(err);
        });

      if (!this.#streamHandle) {
        throw new Error('Screen recording stream handle is missing.');
      }

      let eof = false;
      while (!eof) {
        const {
          data,
          base64Encoded,
          eof: isEof,
        } = await client.send('IO.read', {handle: this.#streamHandle});
        eof = isEof;
        if (data) {
          const buffer = stringToTypedArray(data, base64Encoded ?? false);
          this.controller.enqueue(buffer);
          for (const dest of this.destinations) {
            dest.write(buffer);
          }
        }
      }
      await client.send('IO.close', {handle: this.#streamHandle}).catch(err => {
        this.logger(DEBUG_PREFIXES.error)?.(err);
      });
    } finally {
      await this.closeDestinations();
    }
  }
}
