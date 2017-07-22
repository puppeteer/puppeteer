/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

class Mouse {
  /**
   * @param {!Connection} client
   * @param {!Keyboard} keyboard
   */
  constructor(client, keyboard) {
    this._client = client;
    this._keyboard = keyboard;
    this._x = 0;
    this._y = 0;
    this._button = 'none';
  }

  /**
   * @param {number} x
   * @param {number} y
   * @return {!Promise}
   */
  async move(x, y) {
    this._x = x;
    this._y = y;
    await this._client.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      button: this._button,
      x, y,
      modifiers: this._modifiersMask()
    });
  }

  /**
   * @param {!Object=} options
   */
  async press(options) {
    await this.down(options);
    await this.up(options);
  }

  /**
   * @param {!Object=} options
   */
  async down(options) {
    if (!options)
      options = {};
    this._button = (options.button || 'left');
    await this._client.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      button: this._button,
      x: this._x,
      y: this._y,
      modifiers: this._modifiersMask(),
      clickCount: (options.clickCount || 1)
    });
  }

  /**
   * @param {!Object=} options
   */
  async up(options) {
    if (!options)
      options = {};
    this._button = 'none';
    await this._client.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      button: (options.button || 'left'),
      x: this._x,
      y: this._y,
      modifiers: this._modifiersMask(),
      clickCount: (options.clickCount || 1)
    });
  }

  /**
   * @return {number}
   */
  _modifiersMask() {
    let modifiers = this._keyboard.modifiers();
    let mask = 0;
    if (modifiers.Alt)
      mask += 1;
    if (modifiers.Control)
      mask += 2;
    if (modifiers.Meta)
      mask += 4;
    if (modifiers.Shift)
      mask += 8;
    return mask;
  }
}

module.exports = Mouse;