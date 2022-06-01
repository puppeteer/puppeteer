/**
 * Copyright 2018 Google Inc. All rights reserved.
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

import utils from './utils.js';
import os from 'os';
import expect from 'expect';
import {
  getTestState,
  setupTestBrowserHooks,
  setupTestPageAndContextHooks,
  itFailsFirefox,
} from './mocha-utils'; // eslint-disable-line import/extensions
import { KeyInput } from '../lib/cjs/puppeteer/common/USKeyboardLayout.js';

describe('Keyboard', function () {
  setupTestBrowserHooks();
  setupTestPageAndContextHooks();

  it('should type into a textarea', async () => {
    const { page } = getTestState();

    await page.evaluate(() => {
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();
    });
    const text = 'Hello world. I am the text that was typed!';
    await page.keyboard.type(text);
    expect(
      await page.evaluate(() => document.querySelector('textarea').value)
    ).toBe(text);
  });
  itFailsFirefox('should press the metaKey', async () => {
    const { page, isFirefox } = getTestState();

    await page.evaluate(() => {
      (window as any).keyPromise = new Promise((resolve) =>
        document.addEventListener('keydown', (event) => resolve(event.key))
      );
    });
    await page.keyboard.press('Meta');
    expect(await page.evaluate('keyPromise')).toBe(
      isFirefox && os.platform() !== 'darwin' ? 'OS' : 'Meta'
    );
  });
  it('should move with the arrow keys', async () => {
    const { page, server } = getTestState();

    await page.goto(server.PREFIX + '/input/textarea.html');
    await page.type('textarea', 'Hello World!');
    expect(
      await page.evaluate(() => document.querySelector('textarea').value)
    ).toBe('Hello World!');
    for (let i = 0; i < 'World!'.length; i++) page.keyboard.press('ArrowLeft');
    await page.keyboard.type('inserted ');
    expect(
      await page.evaluate(() => document.querySelector('textarea').value)
    ).toBe('Hello inserted World!');
    page.keyboard.down('Shift');
    for (let i = 0; i < 'inserted '.length; i++)
      page.keyboard.press('ArrowLeft');
    page.keyboard.up('Shift');
    await page.keyboard.press('Backspace');
    expect(
      await page.evaluate(() => document.querySelector('textarea').value)
    ).toBe('Hello World!');
  });
  it('should send a character with ElementHandle.press', async () => {
    const { page, server } = getTestState();

    await page.goto(server.PREFIX + '/input/textarea.html');
    const textarea = await page.$('textarea');
    await textarea.press('a');
    expect(
      await page.evaluate(() => document.querySelector('textarea').value)
    ).toBe('a');

    await page.evaluate(() =>
      window.addEventListener('keydown', (e) => e.preventDefault(), true)
    );

    await textarea.press('b');
    expect(
      await page.evaluate(() => document.querySelector('textarea').value)
    ).toBe('a');
  });
  itFailsFirefox(
    'ElementHandle.press should support |text| option',
    async () => {
      const { page, server } = getTestState();

      await page.goto(server.PREFIX + '/input/textarea.html');
      const textarea = await page.$('textarea');
      await textarea.press('a', { text: 'ё' });
      expect(
        await page.evaluate(() => document.querySelector('textarea').value)
      ).toBe('ё');
    }
  );
  itFailsFirefox('should send a character with sendCharacter', async () => {
    const { page, server } = getTestState();

    await page.goto(server.PREFIX + '/input/textarea.html');
    await page.focus('textarea');
    await page.keyboard.sendCharacter('嗨');
    expect(
      await page.evaluate(() => document.querySelector('textarea').value)
    ).toBe('嗨');
    await page.evaluate(() =>
      window.addEventListener('keydown', (e) => e.preventDefault(), true)
    );
    await page.keyboard.sendCharacter('a');
    expect(
      await page.evaluate(() => document.querySelector('textarea').value)
    ).toBe('嗨a');
  });
  itFailsFirefox('should report shiftKey', async () => {
    const { page, server } = getTestState();

    await page.goto(server.PREFIX + '/input/keyboard.html');
    const keyboard = page.keyboard;
    const codeForKey = new Map<KeyInput, number>([
      ['Shift', 16],
      ['Alt', 18],
      ['Control', 17],
    ]);
    for (const [modifierKey, modifierCode] of codeForKey) {
      await keyboard.down(modifierKey);
      expect(await page.evaluate(() => globalThis.getResult())).toBe(
        'Keydown: ' +
          modifierKey +
          ' ' +
          modifierKey +
          'Left ' +
          modifierCode +
          ' [' +
          modifierKey +
          ']'
      );
      await keyboard.down('!');
      // Shift+! will generate a keypress
      if (modifierKey === 'Shift')
        expect(await page.evaluate(() => globalThis.getResult())).toBe(
          'Keydown: ! Digit1 49 [' +
            modifierKey +
            ']\nKeypress: ! Digit1 33 33 [' +
            modifierKey +
            ']'
        );
      else
        expect(await page.evaluate(() => globalThis.getResult())).toBe(
          'Keydown: ! Digit1 49 [' + modifierKey + ']'
        );

      await keyboard.up('!');
      expect(await page.evaluate(() => globalThis.getResult())).toBe(
        'Keyup: ! Digit1 49 [' + modifierKey + ']'
      );
      await keyboard.up(modifierKey);
      expect(await page.evaluate(() => globalThis.getResult())).toBe(
        'Keyup: ' +
          modifierKey +
          ' ' +
          modifierKey +
          'Left ' +
          modifierCode +
          ' []'
      );
    }
  });
  it('should report multiple modifiers', async () => {
    const { page, server } = getTestState();

    await page.goto(server.PREFIX + '/input/keyboard.html');
    const keyboard = page.keyboard;
    await keyboard.down('Control');
    expect(await page.evaluate(() => globalThis.getResult())).toBe(
      'Keydown: Control ControlLeft 17 [Control]'
    );
    await keyboard.down('Alt');
    expect(await page.evaluate(() => globalThis.getResult())).toBe(
      'Keydown: Alt AltLeft 18 [Alt Control]'
    );
    await keyboard.down(';');
    expect(await page.evaluate(() => globalThis.getResult())).toBe(
      'Keydown: ; Semicolon 186 [Alt Control]'
    );
    await keyboard.up(';');
    expect(await page.evaluate(() => globalThis.getResult())).toBe(
      'Keyup: ; Semicolon 186 [Alt Control]'
    );
    await keyboard.up('Control');
    expect(await page.evaluate(() => globalThis.getResult())).toBe(
      'Keyup: Control ControlLeft 17 [Alt]'
    );
    await keyboard.up('Alt');
    expect(await page.evaluate(() => globalThis.getResult())).toBe(
      'Keyup: Alt AltLeft 18 []'
    );
  });
  it('should send proper codes while typing', async () => {
    const { page, server } = getTestState();

    await page.goto(server.PREFIX + '/input/keyboard.html');
    await page.keyboard.type('!');
    expect(await page.evaluate(() => globalThis.getResult())).toBe(
      [
        'Keydown: ! Digit1 49 []',
        'Keypress: ! Digit1 33 33 []',
        'Keyup: ! Digit1 49 []',
      ].join('\n')
    );
    await page.keyboard.type('^');
    expect(await page.evaluate(() => globalThis.getResult())).toBe(
      [
        'Keydown: ^ Digit6 54 []',
        'Keypress: ^ Digit6 94 94 []',
        'Keyup: ^ Digit6 54 []',
      ].join('\n')
    );
  });
  it('should send proper codes while typing with shift', async () => {
    const { page, server } = getTestState();

    await page.goto(server.PREFIX + '/input/keyboard.html');
    const keyboard = page.keyboard;
    await keyboard.down('Shift');
    await page.keyboard.type('~');
    expect(await page.evaluate(() => globalThis.getResult())).toBe(
      [
        'Keydown: Shift ShiftLeft 16 [Shift]',
        'Keydown: ~ Backquote 192 [Shift]', // 192 is ` keyCode
        'Keypress: ~ Backquote 126 126 [Shift]', // 126 is ~ charCode
        'Keyup: ~ Backquote 192 [Shift]',
      ].join('\n')
    );
    await keyboard.up('Shift');
  });
  it('should not type canceled events', async () => {
    const { page, server } = getTestState();

    await page.goto(server.PREFIX + '/input/textarea.html');
    await page.focus('textarea');
    await page.evaluate(() => {
      window.addEventListener(
        'keydown',
        (event) => {
          event.stopPropagation();
          event.stopImmediatePropagation();
          if (event.key === 'l') event.preventDefault();
          if (event.key === 'o') event.preventDefault();
        },
        false
      );
    });
    await page.keyboard.type('Hello World!');
    expect(await page.evaluate(() => globalThis.textarea.value)).toBe(
      'He Wrd!'
    );
  });
  itFailsFirefox('should specify repeat property', async () => {
    const { page, server } = getTestState();

    await page.goto(server.PREFIX + '/input/textarea.html');
    await page.focus('textarea');
    await page.evaluate(() =>
      document
        .querySelector('textarea')
        .addEventListener('keydown', (e) => (globalThis.lastEvent = e), true)
    );
    await page.keyboard.down('a');
    expect(await page.evaluate(() => globalThis.lastEvent.repeat)).toBe(false);
    await page.keyboard.press('a');
    expect(await page.evaluate(() => globalThis.lastEvent.repeat)).toBe(true);

    await page.keyboard.down('b');
    expect(await page.evaluate(() => globalThis.lastEvent.repeat)).toBe(false);
    await page.keyboard.down('b');
    expect(await page.evaluate(() => globalThis.lastEvent.repeat)).toBe(true);

    await page.keyboard.up('a');
    await page.keyboard.down('a');
    expect(await page.evaluate(() => globalThis.lastEvent.repeat)).toBe(false);
  });
  itFailsFirefox('should type all kinds of characters', async () => {
    const { page, server } = getTestState();

    await page.goto(server.PREFIX + '/input/textarea.html');
    await page.focus('textarea');
    const text = 'This text goes onto two lines.\nThis character is 嗨.';
    await page.keyboard.type(text);
    expect(await page.evaluate('result')).toBe(text);
  });
  itFailsFirefox('should specify location', async () => {
    const { page, server } = getTestState();

    await page.goto(server.PREFIX + '/input/textarea.html');
    await page.evaluate(() => {
      window.addEventListener(
        'keydown',
        (event) => (globalThis.keyLocation = event.location),
        true
      );
    });
    const textarea = await page.$('textarea');

    await textarea.press('Digit5');
    expect(await page.evaluate('keyLocation')).toBe(0);

    await textarea.press('ControlLeft');
    expect(await page.evaluate('keyLocation')).toBe(1);

    await textarea.press('ControlRight');
    expect(await page.evaluate('keyLocation')).toBe(2);

    await textarea.press('NumpadSubtract');
    expect(await page.evaluate('keyLocation')).toBe(3);
  });
  it('should throw on unknown keys', async () => {
    const { page } = getTestState();

    let error = await page.keyboard
      // @ts-expect-error bad input
      .press('NotARealKey')
      .catch((error_) => error_);
    expect(error.message).toBe('Unknown key: "NotARealKey"');

    // @ts-expect-error bad input
    error = await page.keyboard.press('ё').catch((error_) => error_);
    expect(error && error.message).toBe('Unknown key: "ё"');

    // @ts-expect-error bad input
    error = await page.keyboard.press('😊').catch((error_) => error_);
    expect(error && error.message).toBe('Unknown key: "😊"');
  });
  itFailsFirefox('should type emoji', async () => {
    const { page, server } = getTestState();

    await page.goto(server.PREFIX + '/input/textarea.html');
    await page.type('textarea', '👹 Tokyo street Japan 🇯🇵');
    expect(
      await page.$eval(
        'textarea',
        (textarea: HTMLInputElement) => textarea.value
      )
    ).toBe('👹 Tokyo street Japan 🇯🇵');
  });
  itFailsFirefox('should type emoji into an iframe', async () => {
    const { page, server } = getTestState();

    await page.goto(server.EMPTY_PAGE);
    await utils.attachFrame(
      page,
      'emoji-test',
      server.PREFIX + '/input/textarea.html'
    );
    const frame = page.frames()[1];
    const textarea = await frame.$('textarea');
    await textarea.type('👹 Tokyo street Japan 🇯🇵');
    expect(
      await frame.$eval(
        'textarea',
        (textarea: HTMLInputElement) => textarea.value
      )
    ).toBe('👹 Tokyo street Japan 🇯🇵');
  });
  itFailsFirefox('should press the meta key', async () => {
    const { page, isFirefox } = getTestState();

    await page.evaluate(() => {
      globalThis.result = null;
      document.addEventListener('keydown', (event) => {
        globalThis.result = [event.key, event.code, event.metaKey];
      });
    });
    await page.keyboard.press('Meta');
    // Have to do this because we lose a lot of type info when evaluating a
    // string not a function. This is why functions are recommended rather than
    // using strings (although we'll leave this test so we have coverage of both
    // approaches.)
    const [key, code, metaKey] = (await page.evaluate('result')) as [
      string,
      string,
      boolean
    ];
    if (isFirefox && os.platform() !== 'darwin') expect(key).toBe('OS');
    else expect(key).toBe('Meta');

    if (isFirefox) expect(code).toBe('OSLeft');
    else expect(code).toBe('MetaLeft');

    if (isFirefox && os.platform() !== 'darwin') expect(metaKey).toBe(false);
    else expect(metaKey).toBe(true);
  });
});
