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

import { assert } from './assert.js';
import { CDPSession } from './Connection.js';
import { keyDefinitions, KeyDefinition, KeyInput } from './USKeyboardLayout.js';

type KeyDescription = Required<
  Pick<KeyDefinition, 'keyCode' | 'key' | 'text' | 'code' | 'location'>
>;

/**
 * Keyboard provides an api for managing a virtual keyboard.
 * The high level api is {@link Keyboard."type"},
 * which takes raw characters and generates proper keydown, keypress/input,
 * and keyup events on your page.
 *
 * @remarks
 * For finer control, you can use {@link Keyboard.down},
 * {@link Keyboard.up}, and {@link Keyboard.sendCharacter}
 * to manually fire events as if they were generated from a real keyboard.
 *
 * On MacOS, keyboard shortcuts like `⌘ A` -\> Select All do not work.
 * See {@link https://github.com/puppeteer/puppeteer/issues/1313 | #1313}.
 *
 * @example
 * An example of holding down `Shift` in order to select and delete some text:
 * ```js
 * await page.keyboard.type('Hello World!');
 * await page.keyboard.press('ArrowLeft');
 *
 * await page.keyboard.down('Shift');
 * for (let i = 0; i < ' World'.length; i++)
 *   await page.keyboard.press('ArrowLeft');
 * await page.keyboard.up('Shift');
 *
 * await page.keyboard.press('Backspace');
 * // Result text will end up saying 'Hello!'
 * ```
 *
 * @example
 * An example of pressing `A`
 * ```js
 * await page.keyboard.down('Shift');
 * await page.keyboard.press('KeyA');
 * await page.keyboard.up('Shift');
 * ```
 *
 * @public
 */
export class Keyboard {
  private _client: CDPSession;
  /** @internal */
  _modifiers = 0;
  private _pressedKeys = new Set<string>();

  /** @internal */
  constructor(client: CDPSession) {
    this._client = client;
  }

  /**
   * Dispatches a `keydown` event.
   *
   * @remarks
   * If `key` is a single character and no modifier keys besides `Shift`
   * are being held down, a `keypress`/`input` event will also generated.
   * The `text` option can be specified to force an input event to be generated.
   * If `key` is a modifier key, `Shift`, `Meta`, `Control`, or `Alt`,
   * subsequent key presses will be sent with that modifier active.
   * To release the modifier key, use {@link Keyboard.up}.
   *
   * After the key is pressed once, subsequent calls to
   * {@link Keyboard.down} will have
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/repeat | repeat}
   * set to true. To release the key, use {@link Keyboard.up}.
   *
   * Modifier keys DO influence {@link Keyboard.down}.
   * Holding down `Shift` will type the text in upper case.
   *
   * @param key - Name of key to press, such as `ArrowLeft`.
   * See {@link KeyInput} for a list of all key names.
   *
   * @param options - An object of options. Accepts text which, if specified,
   * generates an input event with this text.
   */
  async down(
    key: KeyInput,
    options: { text?: string } = { text: undefined }
  ): Promise<void> {
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
      isKeypad: description.location === 3,
    });
  }

  private _modifierBit(key: string): number {
    if (key === 'Alt') return 1;
    if (key === 'Control') return 2;
    if (key === 'Meta') return 4;
    if (key === 'Shift') return 8;
    return 0;
  }

  private _keyDescriptionForString(keyString: KeyInput): KeyDescription {
    const shift = this._modifiers & 8;
    const description = {
      key: '',
      keyCode: 0,
      code: '',
      text: '',
      location: 0,
    };

    const definition = keyDefinitions[keyString];
    assert(definition, `Unknown key: "${keyString}"`);

    if (definition.key) description.key = definition.key;
    if (shift && definition.shiftKey) description.key = definition.shiftKey;

    if (definition.keyCode) description.keyCode = definition.keyCode;
    if (shift && definition.shiftKeyCode)
      description.keyCode = definition.shiftKeyCode;

    if (definition.code) description.code = definition.code;

    if (definition.location) description.location = definition.location;

    if (description.key.length === 1) description.text = description.key;

    if (definition.text) description.text = definition.text;
    if (shift && definition.shiftText) description.text = definition.shiftText;

    // if any modifiers besides shift are pressed, no text should be sent
    if (this._modifiers & ~8) description.text = '';

    return description;
  }

  /**
   * Dispatches a `keyup` event.
   *
   * @param key - Name of key to release, such as `ArrowLeft`.
   * See {@link KeyInput | KeyInput}
   * for a list of all key names.
   */
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
      location: description.location,
    });
  }

  /**
   * Dispatches a `keypress` and `input` event.
   * This does not send a `keydown` or `keyup` event.
   *
   * @remarks
   * Modifier keys DO NOT effect {@link Keyboard.sendCharacter | Keyboard.sendCharacter}.
   * Holding down `Shift` will not type the text in upper case.
   *
   * @example
   * ```js
   * page.keyboard.sendCharacter('嗨');
   * ```
   *
   * @param char - Character to send into the page.
   */
  async sendCharacter(char: string): Promise<void> {
    await this._client.send('Input.insertText', { text: char });
  }

  private charIsKey(char: string): char is KeyInput {
    return !!keyDefinitions[char];
  }

  /**
   * Sends a `keydown`, `keypress`/`input`,
   * and `keyup` event for each character in the text.
   *
   * @remarks
   * To press a special key, like `Control` or `ArrowDown`,
   * use {@link Keyboard.press}.
   *
   * Modifier keys DO NOT effect `keyboard.type`.
   * Holding down `Shift` will not type the text in upper case.
   *
   * @example
   * ```js
   * await page.keyboard.type('Hello'); // Types instantly
   * await page.keyboard.type('World', {delay: 100}); // Types slower, like a user
   * ```
   *
   * @param text - A text to type into a focused element.
   * @param options - An object of options. Accepts delay which,
   * if specified, is the time to wait between `keydown` and `keyup` in milliseconds.
   * Defaults to 0.
   */
  async type(text: string, options: { delay?: number } = {}): Promise<void> {
    const delay = options.delay || null;
    for (const char of text) {
      if (this.charIsKey(char)) {
        await this.press(char, { delay });
      } else {
        if (delay) await new Promise((f) => setTimeout(f, delay));
        await this.sendCharacter(char);
      }
    }
  }

  /**
   * Shortcut for {@link Keyboard.down}
   * and {@link Keyboard.up}.
   *
   * @remarks
   * If `key` is a single character and no modifier keys besides `Shift`
   * are being held down, a `keypress`/`input` event will also generated.
   * The `text` option can be specified to force an input event to be generated.
   *
   * Modifier keys DO effect {@link Keyboard.press}.
   * Holding down `Shift` will type the text in upper case.
   *
   * @param key - Name of key to press, such as `ArrowLeft`.
   * See {@link KeyInput} for a list of all key names.
   *
   * @param options - An object of options. Accepts text which, if specified,
   * generates an input event with this text. Accepts delay which,
   * if specified, is the time to wait between `keydown` and `keyup` in milliseconds.
   * Defaults to 0.
   */
  async press(
    key: KeyInput,
    options: { delay?: number; text?: string } = {}
  ): Promise<void> {
    const { delay = null } = options;
    await this.down(key, options);
    if (delay) await new Promise((f) => setTimeout(f, options.delay));
    await this.up(key);
  }
}

/**
 * @public
 */
export type MouseButton = 'left' | 'right' | 'middle';

/**
 * @public
 */
export interface MouseOptions {
  button?: MouseButton;
  clickCount?: number;
}

/**
 * @public
 */
export interface MouseWheelOptions {
  deltaX?: number;
  deltaY?: number;
}

/**
 * The Mouse class operates in main-frame CSS pixels
 * relative to the top-left corner of the viewport.
 * @remarks
 * Every `page` object has its own Mouse, accessible with [`page.mouse`](#pagemouse).
 *
 * @example
 * ```js
 * // Using ‘page.mouse’ to trace a 100x100 square.
 * await page.mouse.move(0, 0);
 * await page.mouse.down();
 * await page.mouse.move(0, 100);
 * await page.mouse.move(100, 100);
 * await page.mouse.move(100, 0);
 * await page.mouse.move(0, 0);
 * await page.mouse.up();
 * ```
 *
 * **Note**: The mouse events trigger synthetic `MouseEvent`s.
 * This means that it does not fully replicate the functionality of what a normal user
 * would be able to do with their mouse.
 *
 * For example, dragging and selecting text is not possible using `page.mouse`.
 * Instead, you can use the {@link https://developer.mozilla.org/en-US/docs/Web/API/DocumentOrShadowRoot/getSelection | `DocumentOrShadowRoot.getSelection()`} functionality implemented in the platform.
 *
 * @example
 * For example, if you want to select all content between nodes:
 * ```js
 * await page.evaluate((from, to) => {
 *   const selection = from.getRootNode().getSelection();
 *   const range = document.createRange();
 *   range.setStartBefore(from);
 *   range.setEndAfter(to);
 *   selection.removeAllRanges();
 *   selection.addRange(range);
 * }, fromJSHandle, toJSHandle);
 * ```
 * If you then would want to copy-paste your selection, you can use the clipboard api:
 * ```js
 * // The clipboard api does not allow you to copy, unless the tab is focused.
 * await page.bringToFront();
 * await page.evaluate(() => {
 *   // Copy the selected content to the clipboard
 *   document.execCommand('copy');
 *   // Obtain the content of the clipboard as a string
 *   return navigator.clipboard.readText();
 * });
 * ```
 * **Note**: If you want access to the clipboard API,
 * you have to give it permission to do so:
 * ```js
 * await browser.defaultBrowserContext().overridePermissions(
 *   '<your origin>', ['clipboard-read', 'clipboard-write']
 * );
 * ```
 * @public
 */
export class Mouse {
  private _client: CDPSession;
  private _keyboard: Keyboard;
  private _x = 0;
  private _y = 0;
  private _button: MouseButton | 'none' = 'none';

  /**
   * @internal
   */
  constructor(client: CDPSession, keyboard: Keyboard) {
    this._client = client;
    this._keyboard = keyboard;
  }

  /**
   * Dispatches a `mousemove` event.
   * @param x - Horizontal position of the mouse.
   * @param y - Vertical position of the mouse.
   * @param options - Optional object. If specified, the `steps` property
   * sends intermediate `mousemove` events when set to `1` (default).
   */
  async move(
    x: number,
    y: number,
    options: { steps?: number } = {}
  ): Promise<void> {
    const { steps = 1 } = options;
    const fromX = this._x,
      fromY = this._y;
    this._x = x;
    this._y = y;
    for (let i = 1; i <= steps; i++) {
      await this._client.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        button: this._button,
        x: fromX + (this._x - fromX) * (i / steps),
        y: fromY + (this._y - fromY) * (i / steps),
        modifiers: this._keyboard._modifiers,
      });
    }
  }

  /**
   * Shortcut for `mouse.move`, `mouse.down` and `mouse.up`.
   * @param x - Horizontal position of the mouse.
   * @param y - Vertical position of the mouse.
   * @param options - Optional `MouseOptions`.
   */
  async click(
    x: number,
    y: number,
    options: MouseOptions & { delay?: number } = {}
  ): Promise<void> {
    const { delay = null } = options;
    if (delay !== null) {
      await this.move(x, y);
      await this.down(options);
      await new Promise((f) => setTimeout(f, delay));
      await this.up(options);
    } else {
      await this.move(x, y);
      await this.down(options);
      await this.up(options);
    }
  }

  /**
   * Dispatches a `mousedown` event.
   * @param options - Optional `MouseOptions`.
   */
  async down(options: MouseOptions = {}): Promise<void> {
    const { button = 'left', clickCount = 1 } = options;
    this._button = button;
    await this._client.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      button,
      x: this._x,
      y: this._y,
      modifiers: this._keyboard._modifiers,
      clickCount,
    });
  }

  /**
   * Dispatches a `mouseup` event.
   * @param options - Optional `MouseOptions`.
   */
  async up(options: MouseOptions = {}): Promise<void> {
    const { button = 'left', clickCount = 1 } = options;
    this._button = 'none';
    await this._client.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      button,
      x: this._x,
      y: this._y,
      modifiers: this._keyboard._modifiers,
      clickCount,
    });
  }

  /**
   * Dispatches a `mousewheel` event.
   * @param options - Optional: `MouseWheelOptions`.
   *
   * @example
   * An example of zooming into an element:
   * ```js
   * await page.goto('https://mdn.mozillademos.org/en-US/docs/Web/API/Element/wheel_event$samples/Scaling_an_element_via_the_wheel?revision=1587366');
   *
   * const elem = await page.$('div');
   * const boundingBox = await elem.boundingBox();
   * await page.mouse.move(
   *   boundingBox.x + boundingBox.width / 2,
   *   boundingBox.y + boundingBox.height / 2
   * );
   *
   * await page.mouse.wheel({ deltaY: -100 })
   * ```
   */
  async wheel(options: MouseWheelOptions = {}): Promise<void> {
    const { deltaX = 0, deltaY = 0 } = options;
    await this._client.send('Input.dispatchMouseEvent', {
      type: 'mouseWheel',
      x: this._x,
      y: this._y,
      deltaX,
      deltaY,
      modifiers: this._keyboard._modifiers,
      pointerType: 'mouse',
    });
  }
}

/**
 * The Touchscreen class exposes touchscreen events.
 * @public
 */
export class Touchscreen {
  private _client: CDPSession;
  private _keyboard: Keyboard;

  /**
   * @internal
   */
  constructor(client: CDPSession, keyboard: Keyboard) {
    this._client = client;
    this._keyboard = keyboard;
  }

  /**
   * Dispatches a `touchstart` and `touchend` event.
   * @param x - Horizontal position of the tap.
   * @param y - Vertical position of the tap.
   */
  async tap(x: number, y: number): Promise<void> {
    const touchPoints = [{ x: Math.round(x), y: Math.round(y) }];
    await this._client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints,
      modifiers: this._keyboard._modifiers,
    });
    await this._client.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
      modifiers: this._keyboard._modifiers,
    });
  }
}
