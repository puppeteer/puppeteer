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

import { ElementHandle } from './JSHandle';
import Protocol from './protocol';
import { assert } from './helper';

export class FileChooser {
  private _element: ElementHandle;
  private _multiple: boolean;
  private _handled = false;

  constructor(
    element: ElementHandle,
    event: Protocol.Page.fileChooserOpenedPayload
  ) {
    this._element = element;
    this._multiple = event.mode !== 'selectSingle';
  }

  isMultiple(): boolean {
    return this._multiple;
  }

  async accept(filePaths: string[]): Promise<void> {
    assert(
      !this._handled,
      'Cannot accept FileChooser which is already handled!'
    );
    this._handled = true;
    await this._element.uploadFile(...filePaths);
  }

  async cancel(): Promise<void> {
    assert(
      !this._handled,
      'Cannot cancel FileChooser which is already handled!'
    );
    this._handled = true;
  }
}
