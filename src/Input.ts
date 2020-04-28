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

import {assert} from './helper';
import {CDPSession} from './Connection';
import {keyDefinitions, KeyDefinition, KeyInput} from './USKeyboardLayout';

type KeyDescription = Required<Pick<KeyDefinition, 'keyCode' | 'key' | 'text' | 'code' | 'location'>>;

export class Keyboard {
  _client: CDPSession;
  _modifiers = 0;
  _pressedKeys = new Set<string>();

  constructor(client: CDPSession) {
    this._client = client;
  }

  async down(key: KeyInput, options: { text?: string } = {text: undefined}): Promise<void> {
    const description = this._keyDescriptionForString(key);

    const autoRepeat = this._pressedKeys.has(description.code);
    this._pressedKeys.add(description.code);
    this._modifiers |= this._modifierBit(description.key);

    const text = options.text === undefined ? description.text : options.text;
    await this._client.send('Input.dispatchKeyEvent', {
      type: text ? 'keyDown' : 'rawKeyDown',
      modifiers: this._modifiers,
      windowsVirtualKeyCode: description.keyCode,
      code: description.code,
      key: description.key,
      text: text,
      unmodifiedText: text,
      autoRepeat,
      location: description.location,
      isKeypad: description.location === 3
    });
  }

  private _modifierBit(key: string): number {
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

  private _keyDescriptionForString(keyString: KeyInput): KeyDescription {
    const shift = this._modifiers & 8;
    const description = {
      key: '',
      keyCode: 0,
      code: '',
      text: '',
      location: 0
    };

    const definition = keyDefinitions[keyString];
    assert(definition, `Unknown key: "${keyString}"`);

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

    return description;
  }

  async up(key: KeyInput): Promise<void> {
    const description = this._keyDescriptionForString(key);

    this._modifiers &= ~this._modifierBit(description.key);
    this._pressedKeys.delete(description.code);
    await this._client.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      modifiers: this._modifiers,
      key: description.key,
      windowsVirtualKeyCode: description.keyCode,
      code: description.code,
      location: description.location
    });
  }

  async sendCharacter(char: string): Promise<void> {
    await this._client.send('Input.insertText', {text: char});
  }

  private charIsKey(char: string): char is KeyInput {
    return !!keyDefinitions[char];
  }

  async type(text: string, options: {delay?: number}): Promise<void> {
    const delay = (options && options.delay) || null;
    for (const char of text) {
      if (this.charIsKey(char)) {
        await this.press(char, {delay});
      } else {
        if (delay)
          await new Promise(f => setTimeout(f, delay));
        await this.sendCharacter(char);
      }
    }
  }

  async press(key: KeyInput, options: {delay?: number; text?: string} = {}): Promise<void> {
    const {delay = null} = options;
    await this.down(key, options);
    if (delay)
      await new Promise(f => setTimeout(f, options.delay));
    await this.up(key);
  }
}

type MouseButton = 'none' | 'left' | 'right' | 'middle';
export type MouseButtonInput = Exclude<MouseButton, 'none'>;

interface MouseOptions {
  button?: MouseButtonInput;
  clickCount?: number;
}

export class Mouse {
  _client: CDPSession;
  _keyboard: Keyboard;
  _x = 0;
  _y = 0;
  _button: MouseButton = 'none';
  /**
   * @param {CDPSession} client
   * @param {!Keyboard} keyboard
   */
  constructor(client: CDPSession, keyboard: Keyboard) {
    this._client = client;
    this._keyboard = keyboard;
  }

  async move(x: number, y: number, options: {steps?: number} = {}): Promise<void> {
    const {steps = 1} = options;
    const fromX = this._x, fromY = this._y;
    this._x = x;
    this._y = y;
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

  async click(x: number, y: number, options: MouseOptions & {delay?: number} = {}): Promise<void> {
    const {delay = null} = options;
    if (delay !== null) {
      await Promise.all([
        this.move(x, y),
        this.down(options),
      ]);
      await new Promise(f => setTimeout(f, delay));
      await this.up(options);
    } else {
      await Promise.all([
        this.move(x, y),
        this.down(options),
        this.up(options),
      ]);
    }
  }

  async down(options: MouseOptions = {}): Promise<void> {
    const {button = 'left', clickCount = 1} = options;
    this._button = button;
    await this._client.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      button,
      x: this._x,
      y: this._y,
      modifiers: this._keyboard._modifiers,
      clickCount
    });
  }

  /**
   * @param {!{button?: "left"|"right"|"middle", clickCount?: number}=} options
   */
  async up(options: MouseOptions = {}): Promise<void> {
    const {button = 'left', clickCount = 1} = options;
    this._button = 'none';
    await this._client.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      button,
      x: this._x,
      y: this._y,
      modifiers: this._keyboard._modifiers,
      clickCount
    });
  }
}

export class Touchscreen {
  _client: CDPSession;
  _keyboard: Keyboard;

  constructor(client: CDPSession, keyboard: Keyboard) {
    this._client = client;
    this._keyboard = keyboard;
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  async tap(x: number, y: number): Promise<void> {
    // Touches appear to be lost during the first frame after navigation.
    // This waits a frame before sending the tap.
    // @see https://crbug.com/613219
    await this._client.send('Runtime.evaluate', {
      expression: 'new Promise(x => requestAnimationFrame(() => requestAnimationFrame(x)))',
      awaitPromise: true
    });

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
