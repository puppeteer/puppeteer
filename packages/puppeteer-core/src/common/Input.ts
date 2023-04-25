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

import {Protocol} from 'devtools-protocol';

import {Point} from '../api/ElementHandle.js';
import {assert} from '../util/assert.js';

import {CDPSession} from './Connection.js';
import {_keyDefinitions, KeyDefinition, KeyInput} from './USKeyboardLayout.js';

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
 * On macOS, keyboard shortcuts like `⌘ A` -\> Select All do not work.
 * See {@link https://github.com/puppeteer/puppeteer/issues/1313 | #1313}.
 *
 * @example
 * An example of holding down `Shift` in order to select and delete some text:
 *
 * ```ts
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
 *
 * ```ts
 * await page.keyboard.down('Shift');
 * await page.keyboard.press('KeyA');
 * await page.keyboard.up('Shift');
 * ```
 *
 * @public
 */
export class Keyboard {
  #client: CDPSession;
  #pressedKeys = new Set<string>();

  /**
   * @internal
   */
  _modifiers = 0;

  /**
   * @internal
   */
  constructor(client: CDPSession) {
    this.#client = client;
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
   * generates an input event with this text. Accepts commands which, if specified,
   * is the commands of keyboard shortcuts,
   * see {@link https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/core/editing/commands/editor_command_names.h | Chromium Source Code} for valid command names.
   */
  async down(
    key: KeyInput,
    options: {text?: string; commands?: string[]} = {
      text: undefined,
      commands: [],
    }
  ): Promise<void> {
    const description = this.#keyDescriptionForString(key);

    const autoRepeat = this.#pressedKeys.has(description.code);
    this.#pressedKeys.add(description.code);
    this._modifiers |= this.#modifierBit(description.key);

    const text = options.text === undefined ? description.text : options.text;
    await this.#client.send('Input.dispatchKeyEvent', {
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
      commands: options.commands,
    });
  }

  #modifierBit(key: string): number {
    if (key === 'Alt') {
      return 1;
    }
    if (key === 'Control') {
      return 2;
    }
    if (key === 'Meta') {
      return 4;
    }
    if (key === 'Shift') {
      return 8;
    }
    return 0;
  }

  #keyDescriptionForString(keyString: KeyInput): KeyDescription {
    const shift = this._modifiers & 8;
    const description = {
      key: '',
      keyCode: 0,
      code: '',
      text: '',
      location: 0,
    };

    const definition = _keyDefinitions[keyString];
    assert(definition, `Unknown key: "${keyString}"`);

    if (definition.key) {
      description.key = definition.key;
    }
    if (shift && definition.shiftKey) {
      description.key = definition.shiftKey;
    }

    if (definition.keyCode) {
      description.keyCode = definition.keyCode;
    }
    if (shift && definition.shiftKeyCode) {
      description.keyCode = definition.shiftKeyCode;
    }

    if (definition.code) {
      description.code = definition.code;
    }

    if (definition.location) {
      description.location = definition.location;
    }

    if (description.key.length === 1) {
      description.text = description.key;
    }

    if (definition.text) {
      description.text = definition.text;
    }
    if (shift && definition.shiftText) {
      description.text = definition.shiftText;
    }

    // if any modifiers besides shift are pressed, no text should be sent
    if (this._modifiers & ~8) {
      description.text = '';
    }

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
    const description = this.#keyDescriptionForString(key);

    this._modifiers &= ~this.#modifierBit(description.key);
    this.#pressedKeys.delete(description.code);
    await this.#client.send('Input.dispatchKeyEvent', {
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
   *
   * ```ts
   * page.keyboard.sendCharacter('嗨');
   * ```
   *
   * @param char - Character to send into the page.
   */
  async sendCharacter(char: string): Promise<void> {
    await this.#client.send('Input.insertText', {text: char});
  }

  private charIsKey(char: string): char is KeyInput {
    return !!_keyDefinitions[char as KeyInput];
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
   *
   * ```ts
   * await page.keyboard.type('Hello'); // Types instantly
   * await page.keyboard.type('World', {delay: 100}); // Types slower, like a user
   * ```
   *
   * @param text - A text to type into a focused element.
   * @param options - An object of options. Accepts delay which,
   * if specified, is the time to wait between `keydown` and `keyup` in milliseconds.
   * Defaults to 0.
   */
  async type(text: string, options: {delay?: number} = {}): Promise<void> {
    const delay = options.delay || undefined;
    for (const char of text) {
      if (this.charIsKey(char)) {
        await this.press(char, {delay});
      } else {
        if (delay) {
          await new Promise(f => {
            return setTimeout(f, delay);
          });
        }
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
   * Defaults to 0. Accepts commands which, if specified,
   * is the commands of keyboard shortcuts,
   * see {@link https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/core/editing/commands/editor_command_names.h | Chromium Source Code} for valid command names.
   */
  async press(
    key: KeyInput,
    options: {delay?: number; text?: string; commands?: string[]} = {}
  ): Promise<void> {
    const {delay = null} = options;
    await this.down(key, options);
    if (delay) {
      await new Promise(f => {
        return setTimeout(f, options.delay);
      });
    }
    await this.up(key);
  }
}

/**
 * @public
 */
export interface MouseOptions {
  /**
   * Determines which button will be pressed.
   *
   * @defaultValue `'left'`
   */
  button?: MouseButton;
  /**
   * @deprecated Use {@link MouseClickOptions.count}.
   *
   * Determines the click count for the mouse event. This does not perform
   * multiple clicks.
   *
   * @defaultValue `1`
   */
  clickCount?: number;
}

/**
 * @public
 */
export interface MouseClickOptions extends MouseOptions {
  /**
   * Time (in ms) to delay the mouse release after the mouse press.
   */
  delay?: number;
  /**
   * Number of clicks to perform.
   *
   * @defaultValue `1`
   */
  count?: number;
}

/**
 * @public
 */
export interface MouseWheelOptions {
  deltaX?: number;
  deltaY?: number;
}

/**
 * @public
 */
export interface MouseMoveOptions {
  /**
   * Determines the number of movements to make from the current mouse position
   * to the new one.
   *
   * @defaultValue `1`
   */
  steps?: number;
}

/**
 * Enum of valid mouse buttons.
 *
 * @public
 */
export const MouseButton = Object.freeze({
  Left: 'left',
  Right: 'right',
  Middle: 'middle',
  Back: 'back',
  Forward: 'forward',
}) satisfies Record<string, Protocol.Input.MouseButton>;

/**
 * @public
 */
export type MouseButton = (typeof MouseButton)[keyof typeof MouseButton];

/**
 * This must follow {@link Protocol.Input.DispatchMouseEventRequest.buttons}.
 */
const enum MouseButtonFlag {
  None = 0,
  Left = 1,
  Right = 1 << 1,
  Middle = 1 << 2,
  Back = 1 << 3,
  Forward = 1 << 4,
}

const getFlag = (button: MouseButton): MouseButtonFlag => {
  switch (button) {
    case MouseButton.Left:
      return MouseButtonFlag.Left;
    case MouseButton.Right:
      return MouseButtonFlag.Right;
    case MouseButton.Middle:
      return MouseButtonFlag.Middle;
    case MouseButton.Back:
      return MouseButtonFlag.Back;
    case MouseButton.Forward:
      return MouseButtonFlag.Forward;
  }
};

/**
 * This should match
 * https://source.chromium.org/chromium/chromium/src/+/refs/heads/main:content/browser/renderer_host/input/web_input_event_builders_mac.mm;drc=a61b95c63b0b75c1cfe872d9c8cdf927c226046e;bpv=1;bpt=1;l=221.
 */
const getButtonFromPressedButtons = (
  buttons: number
): Protocol.Input.MouseButton => {
  if (buttons & MouseButtonFlag.Left) {
    return MouseButton.Left;
  } else if (buttons & MouseButtonFlag.Right) {
    return MouseButton.Right;
  } else if (buttons & MouseButtonFlag.Middle) {
    return MouseButton.Middle;
  } else if (buttons & MouseButtonFlag.Back) {
    return MouseButton.Back;
  } else if (buttons & MouseButtonFlag.Forward) {
    return MouseButton.Forward;
  }
  return 'none';
};

interface MouseState {
  /**
   * The current position of the mouse.
   */
  position: Point;
  /**
   * The buttons that are currently being pressed.
   */
  buttons: number;
}

/**
 * The Mouse class operates in main-frame CSS pixels
 * relative to the top-left corner of the viewport.
 * @remarks
 * Every `page` object has its own Mouse, accessible with [`page.mouse`](#pagemouse).
 *
 * @example
 *
 * ```ts
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
 *
 * ```ts
 * await page.evaluate(
 *   (from, to) => {
 *     const selection = from.getRootNode().getSelection();
 *     const range = document.createRange();
 *     range.setStartBefore(from);
 *     range.setEndAfter(to);
 *     selection.removeAllRanges();
 *     selection.addRange(range);
 *   },
 *   fromJSHandle,
 *   toJSHandle
 * );
 * ```
 *
 * If you then would want to copy-paste your selection, you can use the clipboard api:
 *
 * ```ts
 * // The clipboard api does not allow you to copy, unless the tab is focused.
 * await page.bringToFront();
 * await page.evaluate(() => {
 *   // Copy the selected content to the clipboard
 *   document.execCommand('copy');
 *   // Obtain the content of the clipboard as a string
 *   return navigator.clipboard.readText();
 * });
 * ```
 *
 * **Note**: If you want access to the clipboard API,
 * you have to give it permission to do so:
 *
 * ```ts
 * await browser
 *   .defaultBrowserContext()
 *   .overridePermissions('<your origin>', [
 *     'clipboard-read',
 *     'clipboard-write',
 *   ]);
 * ```
 *
 * @public
 */
export class Mouse {
  #client: CDPSession;
  #keyboard: Keyboard;

  /**
   * @internal
   */
  constructor(client: CDPSession, keyboard: Keyboard) {
    this.#client = client;
    this.#keyboard = keyboard;
  }

  #_state: Readonly<MouseState> = {
    position: {x: 0, y: 0},
    buttons: MouseButtonFlag.None,
  };
  get #state(): MouseState {
    return Object.assign({...this.#_state}, ...this.#transactions);
  }

  // Transactions can run in parallel, so we store each of thme in this array.
  #transactions: Array<Partial<MouseState>> = [];
  #createTransaction(): {
    update: (updates: Partial<MouseState>) => void;
    commit: () => void;
    rollback: () => void;
  } {
    const transaction: Partial<MouseState> = {};
    this.#transactions.push(transaction);
    const popTransaction = () => {
      this.#transactions.splice(this.#transactions.indexOf(transaction), 1);
    };
    return {
      update: (updates: Partial<MouseState>) => {
        Object.assign(transaction, updates);
      },
      commit: () => {
        this.#_state = {...this.#_state, ...transaction};
        popTransaction();
      },
      rollback: popTransaction,
    };
  }

  /**
   * This is a shortcut for a typical update, commit/rollback lifecycle based on
   * the error of the action.
   */
  async #withTransaction(
    action: (update: (updates: Partial<MouseState>) => void) => Promise<unknown>
  ): Promise<void> {
    const {update, commit, rollback} = this.#createTransaction();
    try {
      await action(update);
      commit();
    } catch (error) {
      rollback();
      throw error;
    }
  }

  /**
   * Moves the mouse to the given coordinate.
   *
   * @param x - Horizontal position of the mouse.
   * @param y - Vertical position of the mouse.
   * @param options - Options to configure behavior.
   */
  async move(
    x: number,
    y: number,
    options: MouseMoveOptions = {}
  ): Promise<void> {
    const {steps = 1} = options;
    const from = this.#state.position;
    const to = {x, y};
    for (let i = 1; i <= steps; i++) {
      await this.#withTransaction(updateState => {
        updateState({
          position: {
            x: from.x + (to.x - from.x) * (i / steps),
            y: from.y + (to.y - from.y) * (i / steps),
          },
        });
        const {buttons, position} = this.#state;
        return this.#client.send('Input.dispatchMouseEvent', {
          type: 'mouseMoved',
          modifiers: this.#keyboard._modifiers,
          buttons,
          button: getButtonFromPressedButtons(buttons),
          ...position,
        });
      });
    }
  }

  /**
   * Presses the mouse.
   *
   * @param options - Options to configure behavior.
   */
  async down(options: MouseOptions = {}): Promise<void> {
    const {button = MouseButton.Left, clickCount = 1} = options;
    const flag = getFlag(button);
    if (!flag) {
      throw new Error(`Unsupported mouse button: ${button}`);
    }
    if (this.#state.buttons & flag) {
      throw new Error(`'${button}' is already pressed.`);
    }
    await this.#withTransaction(updateState => {
      updateState({
        buttons: this.#state.buttons | flag,
      });
      const {buttons, position} = this.#state;
      return this.#client.send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        modifiers: this.#keyboard._modifiers,
        clickCount,
        buttons,
        button,
        ...position,
      });
    });
  }

  /**
   * Releases the mouse.
   *
   * @param options - Options to configure behavior.
   */
  async up(options: MouseOptions = {}): Promise<void> {
    const {button = MouseButton.Left, clickCount = 1} = options;
    const flag = getFlag(button);
    if (!flag) {
      throw new Error(`Unsupported mouse button: ${button}`);
    }
    if (!(this.#state.buttons & flag)) {
      throw new Error(`'${button}' is not pressed.`);
    }
    await this.#withTransaction(updateState => {
      updateState({
        buttons: this.#state.buttons & ~flag,
      });
      const {buttons, position} = this.#state;
      return this.#client.send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        modifiers: this.#keyboard._modifiers,
        clickCount,
        buttons,
        button,
        ...position,
      });
    });
  }

  /**
   * Shortcut for `mouse.move`, `mouse.down` and `mouse.up`.
   *
   * @param x - Horizontal position of the mouse.
   * @param y - Vertical position of the mouse.
   * @param options - Options to configure behavior.
   */
  async click(
    x: number,
    y: number,
    options: Readonly<MouseClickOptions> = {}
  ): Promise<void> {
    const {delay, count = 1, clickCount = count} = options;
    if (count < 1) {
      throw new Error('Click must occur a positive number of times.');
    }
    const actions: Array<Promise<void>> = [this.move(x, y)];
    if (clickCount === count) {
      for (let i = 1; i < count; ++i) {
        actions.push(
          this.down({...options, clickCount: i}),
          this.up({...options, clickCount: i})
        );
      }
    }
    actions.push(this.down({...options, clickCount}));
    if (typeof delay === 'number') {
      await Promise.all(actions);
      actions.length = 0;
      await new Promise(resolve => {
        setTimeout(resolve, delay);
      });
    }
    actions.push(this.up({...options, clickCount}));
    await Promise.all(actions);
  }

  /**
   * Dispatches a `mousewheel` event.
   * @param options - Optional: `MouseWheelOptions`.
   *
   * @example
   * An example of zooming into an element:
   *
   * ```ts
   * await page.goto(
   *   'https://mdn.mozillademos.org/en-US/docs/Web/API/Element/wheel_event$samples/Scaling_an_element_via_the_wheel?revision=1587366'
   * );
   *
   * const elem = await page.$('div');
   * const boundingBox = await elem.boundingBox();
   * await page.mouse.move(
   *   boundingBox.x + boundingBox.width / 2,
   *   boundingBox.y + boundingBox.height / 2
   * );
   *
   * await page.mouse.wheel({deltaY: -100});
   * ```
   */
  async wheel(options: MouseWheelOptions = {}): Promise<void> {
    const {deltaX = 0, deltaY = 0} = options;
    const {position, buttons} = this.#state;
    await this.#client.send('Input.dispatchMouseEvent', {
      type: 'mouseWheel',
      pointerType: 'mouse',
      modifiers: this.#keyboard._modifiers,
      deltaY,
      deltaX,
      buttons,
      ...position,
    });
  }

  /**
   * Dispatches a `drag` event.
   * @param start - starting point for drag
   * @param target - point to drag to
   */
  async drag(start: Point, target: Point): Promise<Protocol.Input.DragData> {
    const promise = new Promise<Protocol.Input.DragData>(resolve => {
      this.#client.once('Input.dragIntercepted', event => {
        return resolve(event.data);
      });
    });
    await this.move(start.x, start.y);
    await this.down();
    await this.move(target.x, target.y);
    return promise;
  }

  /**
   * Dispatches a `dragenter` event.
   * @param target - point for emitting `dragenter` event
   * @param data - drag data containing items and operations mask
   */
  async dragEnter(target: Point, data: Protocol.Input.DragData): Promise<void> {
    await this.#client.send('Input.dispatchDragEvent', {
      type: 'dragEnter',
      x: target.x,
      y: target.y,
      modifiers: this.#keyboard._modifiers,
      data,
    });
  }

  /**
   * Dispatches a `dragover` event.
   * @param target - point for emitting `dragover` event
   * @param data - drag data containing items and operations mask
   */
  async dragOver(target: Point, data: Protocol.Input.DragData): Promise<void> {
    await this.#client.send('Input.dispatchDragEvent', {
      type: 'dragOver',
      x: target.x,
      y: target.y,
      modifiers: this.#keyboard._modifiers,
      data,
    });
  }

  /**
   * Performs a dragenter, dragover, and drop in sequence.
   * @param target - point to drop on
   * @param data - drag data containing items and operations mask
   */
  async drop(target: Point, data: Protocol.Input.DragData): Promise<void> {
    await this.#client.send('Input.dispatchDragEvent', {
      type: 'drop',
      x: target.x,
      y: target.y,
      modifiers: this.#keyboard._modifiers,
      data,
    });
  }

  /**
   * Performs a drag, dragenter, dragover, and drop in sequence.
   * @param start - point to drag from
   * @param target - point to drop on
   * @param options - An object of options. Accepts delay which,
   * if specified, is the time to wait between `dragover` and `drop` in milliseconds.
   * Defaults to 0.
   */
  async dragAndDrop(
    start: Point,
    target: Point,
    options: {delay?: number} = {}
  ): Promise<void> {
    const {delay = null} = options;
    const data = await this.drag(start, target);
    await this.dragEnter(target, data);
    await this.dragOver(target, data);
    if (delay) {
      await new Promise(resolve => {
        return setTimeout(resolve, delay);
      });
    }
    await this.drop(target, data);
    await this.up();
  }
}

/**
 * The Touchscreen class exposes touchscreen events.
 * @public
 */
export class Touchscreen {
  #client: CDPSession;
  #keyboard: Keyboard;

  /**
   * @internal
   */
  constructor(client: CDPSession, keyboard: Keyboard) {
    this.#client = client;
    this.#keyboard = keyboard;
  }

  /**
   * Dispatches a `touchstart` and `touchend` event.
   * @param x - Horizontal position of the tap.
   * @param y - Vertical position of the tap.
   */
  async tap(x: number, y: number): Promise<void> {
    await this.touchStart(x, y);
    await this.touchEnd();
  }

  /**
   * Dispatches a `touchstart` event.
   * @param x - Horizontal position of the tap.
   * @param y - Vertical position of the tap.
   */
  async touchStart(x: number, y: number): Promise<void> {
    const touchPoints = [{x: Math.round(x), y: Math.round(y)}];
    await this.#client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints,
      modifiers: this.#keyboard._modifiers,
    });
  }
  /**
   * Dispatches a `touchMove` event.
   * @param x - Horizontal position of the move.
   * @param y - Vertical position of the move.
   */
  async touchMove(x: number, y: number): Promise<void> {
    const movePoints = [{x: Math.round(x), y: Math.round(y)}];
    await this.#client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: movePoints,
      modifiers: this.#keyboard._modifiers,
    });
  }
  /**
   * Dispatches a `touchend` event.
   */
  async touchEnd(): Promise<void> {
    await this.#client.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
      modifiers: this.#keyboard._modifiers,
    });
  }
}
