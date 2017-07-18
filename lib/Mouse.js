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
   */
  constructor(client) {
    this._client = client;
    this._x = 0;
    this._y = 0;
    this._button = 'none';
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {!Object=} options
   * @return {!Promise}
   */
  async move(x, y, options) {
    this._x = x;
    this._y = y;
    await this._client.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      button: this._button,
      x, y
    });
  }

  /**
   * @param {string} selector
   * @param {!Object=} options
   * @return {!Promise}
   */
  async moveToSelector(selector, options) {
    let center = await this.evaluate(selector => {
      let element = document.querySelector(selector);
      if (!element)
        return null;
      element.scrollIntoViewIfNeeded();
      let rect = element.getBoundingClientRect();
      return {
        x: (rect.left + rect.right) / 2,
        y: (rect.top + rect.bottom) / 2
      };
    }, selector);
    if (!center)
      throw new Error('No node found for selector: ' + selector);
    this.move(center.x, center.y);
    this.hold(options);
    this.release(options);
  }

  /**
   * @param {string} button
   */
  async click(button) {
    this.press(button);
    await this.release(button);
  }

  /**
   * @param {!Object=} options
   */
  async hold(options) {
    if (!options)
      options = {};
    this._button = 'left';
    await this._client.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      button: (options.button || 'left'),
      x: this._x,
      y: this._y,
      clickCount: (options.clickCount || 1)
    });
  }

  /**
   * @param {!Object=} options
   */
  async release(options) {
    if (!options)
      options = {};
    this._button = 'none';
    await this._client.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      button: (options.button || 'left'),
      x: this._x,
      y: this._y,
      clickCount: (options.clickCount || 1)
    });
  }
}

module.exports = Mouse;