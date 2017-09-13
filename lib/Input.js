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

const {helper} = require('./helper');

class Keyboard {
  /**
   * @param {!Session} client
   */
  constructor(client) {
    this._client = client;
    this._modifiers = 0;
    this._pressedKeys = new Set();
  }

  /**
   * @param {string} key
   * @param {{text: (string|undefined)}} options
   */
  async down(key, options = {}) {
    const text = options.text;
    const autoRepeat = this._pressedKeys.has(key);
    this._pressedKeys.add(key);
    this._modifiers |= this._modifierBit(key);
    await this._client.send('Input.dispatchKeyEvent', {
      type: text ? 'keyDown' : 'rawKeyDown',
      modifiers: this._modifiers,
      windowsVirtualKeyCode: codeForKey(key),
      key,
      text,
      unmodifiedText: text,
      autoRepeat
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
    if (key === 'Meta')
      return 4;
    if (key === 'Shift')
      return 8;
    return 0;
  }

  /**
   * @param {string} key
   */
  async up(key) {
    this._modifiers &= ~this._modifierBit(key);
    this._pressedKeys.delete(key);
    await this._client.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      modifiers: this._modifiers,
      key,
      windowsVirtualKeyCode: codeForKey(key),
    });
  }

  /**
   * @param {string} char
   */
  async sendCharacter(char) {
    await this._client.send('Input.dispatchKeyEvent', {
      type: 'char',
      modifiers: this._modifiers,
      text: char,
      key: char,
      unmodifiedText: char
    });
  }
}

class Mouse {
  /**
   * @param {!Session} client
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
   * @param {Object=} options
   * @return {!Promise}
   */
  async move(x, y, options = {}) {
    const fromX = this._x, fromY = this._y;
    this._x = x;
    this._y = y;
    const steps = options.steps || 1;
    for (let i = 1; i <= steps; i++) {
      await this._client.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        button: this._button,
        x: fromX + (this._x - fromX) * (i / steps),
        y: fromY + (this._y - fromY) * (i / steps),
        modifiers: this._keyboard._modifiers
      });
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {!Object=} options
   */
  async click(x, y, options = {}) {
    this.move(x, y);
    this.down(options);
    if (typeof options.delay === 'number')
      await new Promise(f => setTimeout(f, options.delay));
    await this.up(options);
  }

  /**
   * @param {!Object=} options
   */
  async down(options = {}) {
    this._button = (options.button || 'left');
    await this._client.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      button: this._button,
      x: this._x,
      y: this._y,
      modifiers: this._keyboard._modifiers,
      clickCount: (options.clickCount || 1)
    });
  }

  /**
   * @param {!Object=} options
   */
  async up(options = {}) {
    this._button = 'none';
    await this._client.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      button: (options.button || 'left'),
      x: this._x,
      y: this._y,
      modifiers: this._keyboard._modifiers,
      clickCount: (options.clickCount || 1)
    });
  }
}

class Touchscreen {
  /**
   * @param {Session} client
   * @param {Keyboard} keyboard
   */
  constructor(client, keyboard) {
    this._client = client;
    this._keyboard = keyboard;
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  async tap(x, y) {
    const touchPoints = [{x: Math.round(x), y: Math.round(y)}];
    await this._client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints,
      modifiers: this._keyboard._modifiers
    });
    await this._client.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
      modifiers: this._keyboard._modifiers
    });
  }
}

const keys = {
  'Cancel': 3,
  'Help': 6,
  'Backspace': 8,
  'Tab': 9,
  'Clear': 12,
  'Enter': 13,
  'Shift': 16,
  'Control': 17,
  'Alt': 18,
  'Pause': 19,
  'CapsLock': 20,
  'Escape': 27,
  'Convert': 28,
  'NonConvert': 29,
  'Accept': 30,
  'ModeChange': 31,
  'PageUp': 33,
  'PageDown': 34,
  'End': 35,
  'Home': 36,
  'ArrowLeft': 37,
  'ArrowUp': 38,
  'ArrowRight': 39,
  'ArrowDown': 40,
  'Select': 41,
  'Print': 42,
  'Execute': 43,
  'PrintScreen': 44,
  'Insert': 45,
  'Delete': 46,
  ')': 48,
  '!': 49,
  '@': 50,
  '#': 51,
  '$': 52,
  '%': 53,
  '^': 54,
  '&': 55,
  '*': 56,
  '(': 57,
  'Meta': 91,
  'ContextMenu': 93,
  'F1': 112,
  'F2': 113,
  'F3': 114,
  'F4': 115,
  'F5': 116,
  'F6': 117,
  'F7': 118,
  'F8': 119,
  'F9': 120,
  'F10': 121,
  'F11': 122,
  'F12': 123,
  'F13': 124,
  'F14': 125,
  'F15': 126,
  'F16': 127,
  'F17': 128,
  'F18': 129,
  'F19': 130,
  'F20': 131,
  'F21': 132,
  'F22': 133,
  'F23': 134,
  'F24': 135,
  'NumLock': 144,
  'ScrollLock': 145,
  'AudioVolumeMute': 173,
  'AudioVolumeDown': 174,
  'AudioVolumeUp': 175,
  'MediaTrackNext': 176,
  'MediaTrackPrevious': 177,
  'MediaStop': 178,
  'MediaPlayPause': 179,
  ';': 186,
  ':': 186,
  '=': 187,
  '+': 187,
  ',': 188,
  '<': 188,
  '-': 189,
  '_': 189,
  '.': 190,
  '>': 190,
  '/': 191,
  '?': 191,
  '`': 192,
  '~': 192,
  '[': 219,
  '{': 219,
  '\\': 220,
  '|': 220,
  ']': 221,
  '}': 221,
  '\'': 222,
  '"': 222,
  'AltGraph': 225,
  'Attn': 246,
  'CrSel': 247,
  'ExSel': 248,
  'EraseEof': 249,
  'Play': 250,
  'ZoomOut': 251
};

/**
 * @param {string} key
 * @return {number}
 */
function codeForKey(key) {
  if (keys[key])
    return keys[key];
  if (key.length === 1)
    return key.toUpperCase().charCodeAt(0);
  return 0;
}

module.exports = { Keyboard, Mouse, Touchscreen};
helper.tracePublicAPI(Keyboard);
helper.tracePublicAPI(Mouse);
helper.tracePublicAPI(Touchscreen);
