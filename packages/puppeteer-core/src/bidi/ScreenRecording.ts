/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {RecordOptions} from '../api/Page.js';
import {ScreenRecording} from '../api/ScreenRecording.js';
import {DEBUG_PREFIXES, type Logger} from '../common/Debug.js';
import {environment} from '../environment.js';
import {guarded} from '../util/decorators.js';

import type {BidiPage} from './Page.js';

/**
 * @internal
 */
export class BidiScreenRecording extends ScreenRecording {
  declare protected page: BidiPage;
  #screencastId?: string;
  #path?: string;

  /**
   * @internal
   */
  constructor(page: BidiPage, options: RecordOptions = {}, logger: Logger) {
    super(page, options, logger);

    const browsingContext = this.page.mainFrame().browsingContext;
    browsingContext?.once?.('closed', () => {
      void this.stop().catch(err => {
        this.logger(DEBUG_PREFIXES.error)?.(err);
      });
    });
  }

  /**
   * @internal
   */
  override async _start(): Promise<void> {
    const frameRate = this.options.frameRate ?? this.options.fps;
    const video =
      this.options.maxWidth !== undefined ||
      this.options.maxHeight !== undefined ||
      frameRate !== undefined
        ? {
            width: this.options.maxWidth,
            height: this.options.maxHeight,
            frameRate,
          }
        : undefined;

    const result = await this.page.mainFrame().browsingContext.startScreencast({
      audio: this.options.audio,
      video,
    });
    this.#screencastId = result.screencast;
    this.#path = result.path;
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
      if (!this.#screencastId) {
        return;
      }

      const result = await this.page
        .mainFrame()
        .browsingContext.stopScreencast(this.#screencastId)
        .catch(err => {
          this.logger(DEBUG_PREFIXES.error)?.(err);
          return undefined;
        });

      if (result?.error) {
        this.logger(DEBUG_PREFIXES.error)?.(result.error);
      }

      const filePath = result?.path ?? this.#path;
      if (filePath) {
        try {
          const buffer = await environment.value.readFile(filePath);
          this.controller.enqueue(buffer);
          for (const dest of this.destinations) {
            dest.write(buffer);
          }
        } catch (err) {
          this.logger(DEBUG_PREFIXES.error)?.(err);
        }
      }
    } finally {
      await this.closeDestinations();
    }
  }
}
