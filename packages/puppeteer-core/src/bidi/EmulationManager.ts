/**
 * Copyright 2023 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
