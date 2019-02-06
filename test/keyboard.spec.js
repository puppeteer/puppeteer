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

const utils = require('./utils');
const os = require('os');

module.exports.addTests = function({testRunner, expect, FFOX}) {
  const {describe, xdescribe, fdescribe} = testRunner;
  const {it, fit, xit, it_fails_ffox} = testRunner;
  const {beforeAll, beforeEach, afterAll, afterEach} = testRunner;

  describe('Keyboard', function() {
    it('should type into a textarea', async({page, server}) => {
      await page.evaluate(() => {
        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        textarea.focus();
      });
      const text = 'Hello world. I am the text that was typed!';
      await page.keyboard.type(text);
      expect(await page.evaluate(() => document.querySelector('textarea').value)).toBe(text);
    });
    it('should press the metaKey', async({page}) => {
      await page.evaluate(() => {
        window.keyPromise = new Promise(resolve => document.addEventListener('keydown', event => resolve(event.key)));
      });
      await page.keyboard.press('Meta');
      expect(await page.evaluate('keyPromise')).toBe(FFOX && os.platform() !== 'darwin' ? 'OS' : 'Meta');
    });
    it('should move with the arrow keys', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/textarea.html');
      await page.type('textarea', 'Hello World!');
      expect(await page.evaluate(() => document.querySelector('textarea').value)).toBe('Hello World!');
      for (let i = 0; i < 'World!'.length; i++)
        page.keyboard.press('ArrowLeft');
      await page.keyboard.type('inserted ');
      expect(await page.evaluate(() => document.querySelector('textarea').value)).toBe('Hello inserted World!');
      page.keyboard.down('Shift');
      for (let i = 0; i < 'inserted '.length; i++)
        page.keyboard.press('ArrowLeft');
      page.keyboard.up('Shift');
      await page.keyboard.press('Backspace');
      expect(await page.evaluate(() => document.querySelector('textarea').value)).toBe('Hello World!');
    });
    it_fails_ffox('should send a character with ElementHandle.press', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/textarea.html');
      const textarea = await page.$('textarea');
      await textarea.press('a', {text: 'f'});
      expect(await page.evaluate(() => document.querySelector('textarea').value)).toBe('f');

      await page.evaluate(() => window.addEventListener('keydown', e => e.preventDefault(), true));

      await textarea.press('a', {text: 'y'});
      expect(await page.evaluate(() => document.querySelector('textarea').value)).toBe('f');
    });
    it('should send a character with sendCharacter', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/textarea.html');
      await page.focus('textarea');
      await page.keyboard.sendCharacter('嗨');
      expect(await page.evaluate(() => document.querySelector('textarea').value)).toBe('嗨');
      await page.evaluate(() => window.addEventListener('keydown', e => e.preventDefault(), true));
      await page.keyboard.sendCharacter('a');
      expect(await page.evaluate(() => document.querySelector('textarea').value)).toBe('嗨a');
    });
    it_fails_ffox('should report shiftKey', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/keyboard.html');
      const keyboard = page.keyboard;
      const codeForKey = {'Shift': 16, 'Alt': 18, 'Meta': 91, 'Control': 17};
      for (const modifierKey in codeForKey) {
        await keyboard.down(modifierKey);
        expect(await page.evaluate(() => getResult())).toBe('Keydown: ' + modifierKey + ' ' + modifierKey + 'Left ' + codeForKey[modifierKey] + ' [' + modifierKey + ']');
        await keyboard.down('!');
        // Shift+! will generate a keypress
        if (modifierKey === 'Shift')
          expect(await page.evaluate(() => getResult())).toBe('Keydown: ! Digit1 49 [' + modifierKey + ']\nKeypress: ! Digit1 33 33 [' + modifierKey + ']');
        else
          expect(await page.evaluate(() => getResult())).toBe('Keydown: ! Digit1 49 [' + modifierKey + ']');

        await keyboard.up('!');
        expect(await page.evaluate(() => getResult())).toBe('Keyup: ! Digit1 49 [' + modifierKey + ']');
        await keyboard.up(modifierKey);
        expect(await page.evaluate(() => getResult())).toBe('Keyup: ' + modifierKey + ' ' + modifierKey + 'Left ' + codeForKey[modifierKey] + ' []');
      }
    });
    it_fails_ffox('should report multiple modifiers', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/keyboard.html');
      const keyboard = page.keyboard;
      await keyboard.down('Control');
      expect(await page.evaluate(() => getResult())).toBe('Keydown: Control ControlLeft 17 [Control]');
      await keyboard.down('Meta');
      expect(await page.evaluate(() => getResult())).toBe('Keydown: Meta MetaLeft 91 [Control Meta]');
      await keyboard.down(';');
      expect(await page.evaluate(() => getResult())).toBe('Keydown: ; Semicolon 186 [Control Meta]');
      await keyboard.up(';');
      expect(await page.evaluate(() => getResult())).toBe('Keyup: ; Semicolon 186 [Control Meta]');
      await keyboard.up('Control');
      expect(await page.evaluate(() => getResult())).toBe('Keyup: Control ControlLeft 17 [Meta]');
      await keyboard.up('Meta');
      expect(await page.evaluate(() => getResult())).toBe('Keyup: Meta MetaLeft 91 []');
    });
    it('should send proper codes while typing', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/keyboard.html');
      await page.keyboard.type('!');
      expect(await page.evaluate(() => getResult())).toBe(
          [ 'Keydown: ! Digit1 49 []',
            'Keypress: ! Digit1 33 33 []',
            'Keyup: ! Digit1 49 []'].join('\n'));
      await page.keyboard.type('^');
      expect(await page.evaluate(() => getResult())).toBe(
          [ 'Keydown: ^ Digit6 54 []',
            'Keypress: ^ Digit6 94 94 []',
            'Keyup: ^ Digit6 54 []'].join('\n'));
    });
    it('should send proper codes while typing with shift', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/keyboard.html');
      const keyboard = page.keyboard;
      await keyboard.down('Shift');
      await page.keyboard.type('~');
      expect(await page.evaluate(() => getResult())).toBe(
          [ 'Keydown: Shift ShiftLeft 16 [Shift]',
            'Keydown: ~ Backquote 192 [Shift]', // 192 is ` keyCode
            'Keypress: ~ Backquote 126 126 [Shift]', // 126 is ~ charCode
            'Keyup: ~ Backquote 192 [Shift]'].join('\n'));
      await keyboard.up('Shift');
    });
    it_fails_ffox('should not type canceled events', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/textarea.html');
      await page.focus('textarea');
      await page.evaluate(() => {
        window.addEventListener('keydown', event => {
          event.stopPropagation();
          event.stopImmediatePropagation();
          if (event.key === 'l')
            event.preventDefault();
          if (event.key === 'o')
            Promise.resolve().then(() => event.preventDefault());
        }, false);
      });
      await page.keyboard.type('Hello World!');
      expect(await page.evaluate(() => textarea.value)).toBe('He Wrd!');
    });
    it('should specify repeat property', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/textarea.html');
      await page.focus('textarea');
      await page.evaluate(() => document.querySelector('textarea').addEventListener('keydown', e => window.lastEvent = e, true));
      await page.keyboard.down('a');
      expect(await page.evaluate(() => window.lastEvent.repeat)).toBe(false);
      await page.keyboard.press('a');
      expect(await page.evaluate(() => window.lastEvent.repeat)).toBe(true);

      await page.keyboard.down('b');
      expect(await page.evaluate(() => window.lastEvent.repeat)).toBe(false);
      await page.keyboard.down('b');
      expect(await page.evaluate(() => window.lastEvent.repeat)).toBe(true);

      await page.keyboard.up('a');
      await page.keyboard.down('a');
      expect(await page.evaluate(() => window.lastEvent.repeat)).toBe(false);
    });
    it('should type all kinds of characters', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/textarea.html');
      await page.focus('textarea');
      const text = 'This text goes onto two lines.\nThis character is 嗨.';
      await page.keyboard.type(text);
      expect(await page.evaluate('result')).toBe(text);
    });
    it('should specify location', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/textarea.html');
      await page.evaluate(() => {
        window.addEventListener('keydown', event => window.keyLocation = event.location, true);
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
    it('should throw on unknown keys', async({page, server}) => {
      let error = await page.keyboard.press('NotARealKey').catch(e => e);
      expect(error.message).toBe('Unknown key: "NotARealKey"');

      error = await page.keyboard.press('ё').catch(e => e);
      expect(error && error.message).toBe('Unknown key: "ё"');

      error = await page.keyboard.press('😊').catch(e => e);
      expect(error && error.message).toBe('Unknown key: "😊"');
    });
    it('should type emoji', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/textarea.html');
      await page.type('textarea', '👹 Tokyo street Japan 🇯🇵');
      expect(await page.$eval('textarea', textarea => textarea.value)).toBe('👹 Tokyo street Japan 🇯🇵');
    });
    it('should type emoji into an iframe', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await utils.attachFrame(page, 'emoji-test', server.PREFIX + '/input/textarea.html');
      const frame = page.frames()[1];
      const textarea = await frame.$('textarea');
      await textarea.type('👹 Tokyo street Japan 🇯🇵');
      expect(await frame.$eval('textarea', textarea => textarea.value)).toBe('👹 Tokyo street Japan 🇯🇵');
    });
  });
};
