/**
 * Copyright 2017 Google Inc. All rights reserved.
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

class Mouse {
  /**
   * @param {!Connection} client
   */
  constructor(client, dpi) {
    this._client = client;
    this._screenDPI = dpi;
    this._x = 0;
    this._y = 0;
  }

  /**
   * @param {number} x
   * @param {number} y
   * @return {!Promise}
   */
  async move(x, y) {
    this._x = Math.floor(x / this._screenDPI);
    this._y = Math.floor(y / this._screenDPI);
    await this._client.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: this._x,
      y: this._y,
      button: 'left',
      clickCount: 1
    });
  }

  /**
   * @param {string=} button
   */
  async click(button) {
    this.press(button);
    await this.release(button);
  }

  async press(button = 'left') {
    await this._client.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      button,
      x: this._x,
      y: this._y,
      clickCount: 1
    });
  }

  async release(button = 'left') {
    await this._client.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      button,
      x: this._x,
      y: this._y,
      clickCount: 1
    });
  }
}

module.exports = {
  Mouse
};
