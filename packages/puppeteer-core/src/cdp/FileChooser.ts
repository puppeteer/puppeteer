/**
 * Copyright 2020 Google Inc. All rights reserved.
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

import type Path from 'path';

import type {Protocol} from 'devtools-protocol';

import {FileChooser} from '../api/FileChooser.js';
import {assert} from '../util/assert.js';

import type {CdpElementHandle} from './ElementHandle.js';

/**
 * @internal
 */
export class CdpFileChooser extends FileChooser {
  #element: CdpElementHandle<HTMLInputElement>;
  #multiple: boolean;
  #handled = false;

  /**
   * @internal
   */
  constructor(
    element: CdpElementHandle<HTMLInputElement>,
    event: Protocol.Page.FileChooserOpenedEvent
  ) {
    super();
    this.#element = element;
    this.#multiple = event.mode !== 'selectSingle';
  }

  override get multiple(): boolean {
    return this.#multiple;
  }

  override async accept(paths: string[]): Promise<void> {
    assert(
      !this.#handled,
      'Cannot accept FileChooser which is already handled!'
    );
    this.#handled = true;

    assert(
      paths.length <= 1 || this.#multiple,
      'Multiple file uploads only work with <input type="file" multiple>'
    );

    // Locate all files and confirm that they exist.
    let path: typeof Path;
    try {
      path = await import('path');
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error(
          `JSHandle#uploadFile can only be used in Node-like environments.`
        );
      }
      throw error;
    }

    const files = paths.map(filePath => {
      if (path.win32.isAbsolute(filePath) || path.posix.isAbsolute(filePath)) {
        return filePath;
      } else {
        return path.resolve(filePath);
      }
    });

    /**
     * The zero-length array is a special case, it seems that
     * DOM.setFileInputFiles does not actually update the files in that case, so
     * the solution is to eval the element value to a new FileList directly.
     */
    if (files.length === 0) {
      // XXX: These events should be converted to trusted events. Perhaps do this
      // in `DOM.setFileInputFiles`?
      await this.#element.evaluate(element => {
        element.files = new DataTransfer().files;

        // Dispatch events for this case because it should behave akin to a user action.
        element.dispatchEvent(
          new Event('input', {bubbles: true, composed: true})
        );
        element.dispatchEvent(new Event('change', {bubbles: true}));
      });
      return;
    }

    const {
      node: {backendNodeId},
    } = await this.#element.client.send('DOM.describeNode', {
      objectId: this.#element.id,
    });
    await this.#element.client.send('DOM.setFileInputFiles', {
      objectId: this.#element.id,
      files,
      backendNodeId,
    });
  }

  override async cancel(): Promise<void> {
    assert(
      !this.#handled,
      'Cannot cancel FileChooser which is already handled!'
    );
    this.#handled = true;
    // XXX: These events should be converted to trusted events. Perhaps do this
    // in `DOM.setFileInputFiles`?
    await this.#element.evaluate(element => {
      element.dispatchEvent(new Event('cancel', {bubbles: true}));
    });
  }
}
