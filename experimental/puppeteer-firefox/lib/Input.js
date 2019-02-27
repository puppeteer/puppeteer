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

const keyDefinitions = require('./USKeyboardLayout');
const os = require('os');

/**
 * @typedef {Object} KeyDescription
 * @property {number} keyCode
 * @property {string} key
 * @property {string} text
 * @property {string} code
 * @property {number} location
 */

class Keyboard {
  constructor(client) {
    this._client = client;
    this._modifiers = 0;
    this._pressedKeys = new Set();
  }

  /**
   * @param {string} key
   */
  async down(key) {
    const description = this._keyDescriptionForString(key);

    const repeat = this._pressedKeys.has(description.code);
    this._pressedKeys.add(description.code);
    this._modifiers |= this._modifierBit(description.key);

    await this._client.send('Page.dispatchKeyEvent', {
      type: 'keydown',
      keyCode: description.keyCode,
      code: description.code,
      key: description.key,
      repeat,
      location: description.location
    });
  }

  /**
   * @param {string} key
   * @return {number}
   */
  _modifierBit(key) {
    if (key === 'Alt')
      return 1;
    if (key === 'Control')
      return 2;
    if (key === 'Shift')
      return 4;
    if (key === 'Meta')
      return 8;
    return 0;
  }

  /**
   * @param {string} keyString
   * @return {KeyDescription}
   */
  _keyDescriptionForString(keyString) {
    const shift = this._modifiers & 8;
    const description = {
      key: '',
      keyCode: 0,
      code: '',
      text: '',
      location: 0
    };
    const definition = keyDefinitions[keyString];
    if (!definition)
      throw new Error(`Unknown key: "${keyString}"`);

    if (definition.key)
      description.key = definition.key;
    if (shift && definition.shiftKey)
      description.key = definition.shiftKey;

    if (definition.keyCode)
      description.keyCode = definition.keyCode;
    if (shift && definition.shiftKeyCode)
      description.keyCode = definition.shiftKeyCode;

    if (definition.code)
      description.code = definition.code;

    if (definition.location)
      description.location = definition.location;

    if (description.key.length === 1)
      description.text = description.key;

    if (definition.text)
      description.text = definition.text;
    if (shift && definition.shiftText)
      description.text = definition.shiftText;

    // if any modifiers besides shift are pressed, no text should be sent
    if (this._modifiers & ~8)
      description.text = '';

    if (description.code === 'MetaLeft')
      description.code = 'OSLeft';
    if (description.code === 'MetaRight')
      description.code = 'OSRight';
    return description;
  }

  /**
   * @param {string} key
   */
  async up(key) {
    const description = this._keyDescriptionForString(key);

    this._modifiers &= ~this._modifierBit(description.key);
    this._pressedKeys.delete(description.code);
    await this._client.send('Page.dispatchKeyEvent', {
      type: 'keyup',
      key: description.key,
      keyCode: description.keyCode,
      code: description.code,
      location: description.location,
      repeat: false
    });
  }

  /**
   * @param {string} char
   */
  async sendCharacter(char) {
    await this._client.send('Page.insertText', {
      text: char
    });
  }

  /**
   * @param {string} text
   * @param {!{delay?: number}=} options
   */
  async type(text, options = {}) {
    const {delay = null} = options;
    for (const char of text) {
      if (keyDefinitions[char])
        await this.press(char, {delay});
      else
        await this.sendCharacter(char);
      if (delay !== null)
        await new Promise(f => setTimeout(f, delay));
    }
  }

  /**
   * @param {string} key
   * @param {!{delay?: number}=} options
   */
  async press(key, options = {}) {
    const {delay = null} = options;
    await this.down(key);
    if (delay !== null)
      await new Promise(f => setTimeout(f, options.delay));
    await this.up(key);
  }
}

class Mouse {
  /**
   * @param {!Keyboard} keyboard
   */
  constructor(client, keyboard) {
    this._client = client;
    this._keyboard = keyboard;
    this._x = 0;
    this._y = 0;
    this._buttons = 0;
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {{steps?: number}=} options
   */
  async move(x, y, options = {}) {
    const {steps = 1} = options;
    const fromX = this._x, fromY = this._y;
    this._x = x;
    this._y = y;
    for (let i = 1; i <= steps; i++) {
      await this._client.send('Page.dispatchMouseEvent', {
        type: 'mousemove',
        button: 0,
        x: fromX + (this._x - fromX) * (i / steps),
        y: fromY + (this._y - fromY) * (i / steps),
        modifiers: this._keyboard._modifiers,
        buttons: this._buttons,
      });
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {!{delay?: number, button?: string, clickCount?: number}=} options
   */
  async click(x, y, options = {}) {
    const {delay = null} = options;
    this.move(x, y);
    this.down(options);
    if (delay !== null)
      await new Promise(f => setTimeout(f, delay));
    await this.up(options);
  }

  /**
   * @param {!{button?: string, clickCount?: number}=} options
   */
  async down(options = {}) {
    const {
      button = "left",
      clickCount = 1
    } = options;
    if (button === 'left')
      this._buttons |= 1;
    if (button === 'right')
      this._buttons |= 2;
    if (button === 'middle')
      this._buttons |= 4;
    await this._client.send('Page.dispatchMouseEvent', {
      type: 'mousedown',
      button: this._buttonNameToButton(button),
      x: this._x,
      y: this._y,
      modifiers: this._keyboard._modifiers,
      clickCount,
      buttons: this._buttons,
    });
  }

  /**
   * @param {string} buttonName
   * @return {number}
   */
  _buttonNameToButton(buttonName) {
    if (buttonName === 'left')
      return 0;
    if (buttonName === 'middle')
      return 1;
    if (buttonName === 'right')
      return 2;
  }

  /**
   * @param {!{button?: string, clickCount?: number}=} options
   */
  async up(options = {}) {
    const {
      button = "left",
      clickCount = 1
    } = options;
    if (button === 'left')
      this._buttons &= ~1;
    if (button === 'right')
      this._buttons &= ~2;
    if (button === 'middle')
      this._buttons &= ~4;
    await this._client.send('Page.dispatchMouseEvent', {
      type: 'mouseup',
      button: this._buttonNameToButton(button),
      x: this._x,
      y: this._y,
      modifiers: this._keyboard._modifiers,
      clickCount: clickCount,
      buttons: this._buttons,
    });
  }
}

class Touchscreen {
  /**
   * @param {Puppeteer.JugglerSession} client
   * @param {Keyboard} keyboard
   * @param {Mouse} mouse
   */
  constructor(client, keyboard, mouse) {
    this._client = client;
    this._keyboard = keyboard;
    this._mouse = mouse;
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  async tap(x, y) {
    const touchPoints = [{x: Math.round(x), y: Math.round(y)}];
    let {defaultPrevented} = (await this._client.send('Page.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints,
      modifiers: this._keyboard._modifiers
    }));
    defaultPrevented = (await this._client.send('Page.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints,
      modifiers: this._keyboard._modifiers
    })).defaultPrevented || defaultPrevented;
    // Do not dispatch related mouse events if either of touch events
    // were prevented.
    // See https://developer.mozilla.org/en-US/docs/Web/API/Touch_events/Supporting_both_TouchEvent_and_MouseEvent#Event_order
    if (defaultPrevented)
      return;
    await this._mouse.move(x, y);
    await this._mouse.down();
    await this._mouse.up();
  }
}

module.exports = { Keyboard, Mouse, Touchscreen };
