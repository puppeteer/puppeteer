/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type {Viewport} from '../common/Viewport.js';

import type {BrowsingContext} from './BrowsingContext.js';

/**
 * @internal
 */
export class EmulationManager {
  #browsingContext: BrowsingContext;

  constructor(browsingContext: BrowsingContext) {
    this.#browsingContext = browsingContext;
  }

  async emulateViewport(viewport: Viewport): Promise<void> {
    await this.#browsingContext.connection.send('browsingContext.setViewport', {
      context: this.#browsingContext.id,
      viewport:
        viewport.width && viewport.height
          ? {
              width: viewport.width,
              height: viewport.height,
            }
          : null,
      devicePixelRatio: viewport.deviceScaleFactor
        ? viewport.deviceScaleFactor
        : null,
    });
  }
}
