/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {type TouchHandle, Touchscreen as ApiTouchscreen} from '../api/Input.js';
import {createIncrementalIdGenerator} from '../util/incremental-id-generator.js';

import {TouchError} from './Errors.js';

/**
 * @internal
 */
export abstract class Touchscreen<
  TTouchHandle extends TouchHandle,
> extends ApiTouchscreen {
  #idGenerator = createIncrementalIdGenerator();
  protected touches: TTouchHandle[] = [];

  protected abstract createTouch(
    x: number,
    y: number,
    id: number,
  ): Promise<TTouchHandle>;

  removeHandle(handle: TTouchHandle): void {
    const index = this.touches.indexOf(handle);
    if (index === -1) {
      return;
    }
    this.touches.splice(index, 1);
  }

  override async touchStart(x: number, y: number): Promise<TouchHandle> {
    const id = this.#idGenerator();
    const touch = await this.createTouch(x, y, id);
    this.touches.push(touch);
    return touch;
  }

  override async touchMove(x: number, y: number): Promise<void> {
    const touch = this.touches[0];
    if (!touch) {
      throw new TouchError('Must start a new Touch first');
    }
    return await touch.move(x, y);
  }

  override async touchEnd(): Promise<void> {
    const touch = this.touches.shift();
    if (!touch) {
      throw new TouchError('Must start a new Touch first');
    }
    await touch.end();
  }
}
