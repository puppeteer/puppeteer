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

const path = require('path');
const utils = require('./utils');

module.exports.addTests = function({testRunner, expect, DeviceDescriptors}) {
  const {describe, xdescribe, fdescribe} = testRunner;
  const {it, fit, xit} = testRunner;
  const {beforeAll, beforeEach, afterAll, afterEach} = testRunner;
  const iPhone = DeviceDescriptors['iPhone 6'];
  describe('input', function() {
    it('should click the button', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/button.html');
      await page.click('button');
      expect(await page.evaluate(() => result)).toBe('Clicked');
    });

    it('should click offscreen buttons', async({page, server}) => {
      await page.goto(server.PREFIX + '/offscreenbuttons.html');
      const messages = [];
      page.on('console', msg => messages.push(msg.text()));
      for (let i = 0; i < 10; ++i) {
        // We might've scrolled to click a button - reset to (0, 0).
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.click(`#btn${i}`);
      }
      expect(messages).toEqual([
        'button #0 clicked',
        'button #1 clicked',
        'button #2 clicked',
        'button #3 clicked',
        'button #4 clicked',
        'button #5 clicked',
        'button #6 clicked',
        'button #7 clicked',
        'button #8 clicked',
        'button #9 clicked'
      ]);
    });

    it('should click on checkbox input and toggle', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/checkbox.html');
      expect(await page.evaluate(() => result.check)).toBe(null);
      await page.click('input#agree');
      expect(await page.evaluate(() => result.check)).toBe(true);
      expect(await page.evaluate(() => result.events)).toEqual([
        'mouseover',
        'mouseenter',
        'mousemove',
        'mousedown',
        'mouseup',
        'click',
        'input',
        'change',
      ]);
      await page.click('input#agree');
      expect(await page.evaluate(() => result.check)).toBe(false);
    });

    it('should click on checkbox label and toggle', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/checkbox.html');
      expect(await page.evaluate(() => result.check)).toBe(null);
      await page.click('label[for="agree"]');
      expect(await page.evaluate(() => result.check)).toBe(true);
      expect(await page.evaluate(() => result.events)).toEqual([
        'click',
        'input',
        'change',
      ]);
      await page.click('label[for="agree"]');
      expect(await page.evaluate(() => result.check)).toBe(false);
    });

    it('should fail to click a missing button', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/button.html');
      let error = null;
      await page.click('button.does-not-exist').catch(e => error = e);
      expect(error.message).toBe('No node found for selector: button.does-not-exist');
    });
    // @see https://github.com/GoogleChrome/puppeteer/issues/161
    it('should not hang with touch-enabled viewports', async({page, server}) => {
      await page.setViewport(iPhone.viewport);
      await page.mouse.down();
      await page.mouse.move(100, 10);
      await page.mouse.up();
    });
    it('should type into the textarea', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/textarea.html');

      const textarea = await page.$('textarea');
      await textarea.type('Type in this text!');
      expect(await page.evaluate(() => result)).toBe('Type in this text!');
    });
    it('should click the button after navigation ', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/button.html');
      await page.click('button');
      await page.goto(server.PREFIX + '/input/button.html');
      await page.click('button');
      expect(await page.evaluate(() => result)).toBe('Clicked');
    });
    it('should upload the file', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/fileupload.html');
      const filePath = path.relative(process.cwd(), __dirname + '/assets/file-to-upload.txt');
      const input = await page.$('input');
      await input.uploadFile(filePath);
      expect(await page.evaluate(e => e.files[0].name, input)).toBe('file-to-upload.txt');
      expect(await page.evaluate(e => {
        const reader = new FileReader();
        const promise = new Promise(fulfill => reader.onload = fulfill);
        reader.readAsText(e.files[0]);
        return promise.then(() => reader.result);
      }, input)).toBe('contents of the file');
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
    it('should send a character with ElementHandle.press', async({page, server}) => {
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
    it('should report shiftKey', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/keyboard.html');
      const keyboard = page.keyboard;
      const codeForKey = {'Shift': 16, 'Alt': 18, 'Meta': 91, 'Control': 17};
      for (const modifierKey in codeForKey) {
        await keyboard.down(modifierKey);
        expect(await page.evaluate(() => getResult())).toBe('Keydown: ' + modifierKey + ' ' + modifierKey + 'Left ' + codeForKey[modifierKey] + ' [' + modifierKey + ']');
        await keyboard.down('!');
        // Shift+! will generate a keypress
        if (modifierKey === 'Shift')
          expect(await page.evaluate(() => getResult())).toBe('Keydown: ! Digit1 49 [' + modifierKey + ']\nKeypress: ! Digit1 33 33 33 [' + modifierKey + ']');
        else
          expect(await page.evaluate(() => getResult())).toBe('Keydown: ! Digit1 49 [' + modifierKey + ']');

        await keyboard.up('!');
        expect(await page.evaluate(() => getResult())).toBe('Keyup: ! Digit1 49 [' + modifierKey + ']');
        await keyboard.up(modifierKey);
        expect(await page.evaluate(() => getResult())).toBe('Keyup: ' + modifierKey + ' ' + modifierKey + 'Left ' + codeForKey[modifierKey] + ' []');
      }
    });
    it('should report multiple modifiers', async({page, server}) => {
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
            'Keypress: ! Digit1 33 33 33 []',
            'Keyup: ! Digit1 49 []'].join('\n'));
      await page.keyboard.type('^');
      expect(await page.evaluate(() => getResult())).toBe(
          [ 'Keydown: ^ Digit6 54 []',
            'Keypress: ^ Digit6 94 94 94 []',
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
            'Keypress: ~ Backquote 126 126 126 [Shift]', // 126 is ~ charCode
            'Keyup: ~ Backquote 192 [Shift]'].join('\n'));
      await keyboard.up('Shift');
    });
    it('should not type canceled events', async({page, server}) => {
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
    it('keyboard.modifiers()', async({page, server}) => {
      const keyboard = page.keyboard;
      expect(keyboard._modifiers).toBe(0);
      await keyboard.down('Shift');
      expect(keyboard._modifiers).toBe(8);
      await keyboard.down('Alt');
      expect(keyboard._modifiers).toBe(9);
      await keyboard.up('Shift');
      await keyboard.up('Alt');
      expect(keyboard._modifiers).toBe(0);
    });
    it('should resize the textarea', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/textarea.html');
      const {x, y, width, height} = await page.evaluate(dimensions);
      const mouse = page.mouse;
      await mouse.move(x + width - 4, y + height - 4);
      await mouse.down();
      await mouse.move(x + width + 100, y + height + 100);
      await mouse.up();
      const newDimensions = await page.evaluate(dimensions);
      expect(newDimensions.width).toBe(width + 104);
      expect(newDimensions.height).toBe(height + 104);
    });
    it('should scroll and click the button', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/scrollable.html');
      await page.click('#button-5');
      expect(await page.evaluate(() => document.querySelector('#button-5').textContent)).toBe('clicked');
      await page.click('#button-80');
      expect(await page.evaluate(() => document.querySelector('#button-80').textContent)).toBe('clicked');
    });
    it('should double click the button', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/button.html');
      await page.evaluate(() => {
        window.double = false;
        const button = document.querySelector('button');
        button.addEventListener('dblclick', event => {
          window.double = true;
        });
      });
      const button = await page.$('button');
      await button.click({ clickCount: 2 });
      expect(await page.evaluate('double')).toBe(true);
      expect(await page.evaluate('result')).toBe('Clicked');
    });
    it('should click a partially obscured button', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/button.html');
      await page.evaluate(() => {
        const button = document.querySelector('button');
        button.textContent = 'Some really long text that will go offscreen';
        button.style.position = 'absolute';
        button.style.left = '368px';
      });
      await page.click('button');
      expect(await page.evaluate(() => window.result)).toBe('Clicked');
    });
    it('should select the text with mouse', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/textarea.html');
      await page.focus('textarea');
      const text = 'This is the text that we are going to try to select. Let\'s see how it goes.';
      await page.keyboard.type(text);
      await page.evaluate(() => document.querySelector('textarea').scrollTop = 0);
      const {x, y} = await page.evaluate(dimensions);
      await page.mouse.move(x + 2,y + 2);
      await page.mouse.down();
      await page.mouse.move(100,100);
      await page.mouse.up();
      expect(await page.evaluate(() => window.getSelection().toString())).toBe(text);
    });
    it('should select the text by triple clicking', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/textarea.html');
      await page.focus('textarea');
      const text = 'This is the text that we are going to try to select. Let\'s see how it goes.';
      await page.keyboard.type(text);
      await page.click('textarea');
      await page.click('textarea', {clickCount: 2});
      await page.click('textarea', {clickCount: 3});
      expect(await page.evaluate(() => window.getSelection().toString())).toBe(text);
    });
    it('should trigger hover state', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/scrollable.html');
      await page.hover('#button-6');
      expect(await page.evaluate(() => document.querySelector('button:hover').id)).toBe('button-6');
      await page.hover('#button-2');
      expect(await page.evaluate(() => document.querySelector('button:hover').id)).toBe('button-2');
      await page.hover('#button-91');
      expect(await page.evaluate(() => document.querySelector('button:hover').id)).toBe('button-91');
    });
    it('should fire contextmenu event on right click', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/scrollable.html');
      await page.click('#button-8', {button: 'right'});
      expect(await page.evaluate(() => document.querySelector('#button-8').textContent)).toBe('context menu');
    });
    it('should set modifier keys on click', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/scrollable.html');
      await page.evaluate(() => document.querySelector('#button-3').addEventListener('mousedown', e => window.lastEvent = e, true));
      const modifiers = {'Shift': 'shiftKey', 'Control': 'ctrlKey', 'Alt': 'altKey', 'Meta': 'metaKey'};
      for (const modifier in modifiers) {
        await page.keyboard.down(modifier);
        await page.click('#button-3');
        if (!(await page.evaluate(mod => window.lastEvent[mod], modifiers[modifier])))
          fail(modifiers[modifier] + ' should be true');
        await page.keyboard.up(modifier);
      }
      await page.click('#button-3');
      for (const modifier in modifiers) {
        if ((await page.evaluate(mod => window.lastEvent[mod], modifiers[modifier])))
          fail(modifiers[modifier] + ' should be false');
      }
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
    // @see https://github.com/GoogleChrome/puppeteer/issues/206
    it('should click links which cause navigation', async({page, server}) => {
      await page.setContent(`<a href="${server.EMPTY_PAGE}">empty.html</a>`);
      // This await should not hang.
      await page.click('a');
    });
    it('should tween mouse movement', async({page, server}) => {
      await page.mouse.move(100, 100);
      await page.evaluate(() => {
        window.result = [];
        document.addEventListener('mousemove', event => {
          window.result.push([event.clientX, event.clientY]);
        });
      });
      await page.mouse.move(200, 300, {steps: 5});
      expect(await page.evaluate('result')).toEqual([
        [120, 140],
        [140, 180],
        [160, 220],
        [180, 260],
        [200, 300]
      ]);
    });
    it('should tap the button', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/button.html');
      await page.tap('button');
      expect(await page.evaluate(() => result)).toBe('Clicked');
    });
    xit('should report touches', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/touches.html');
      const button = await page.$('button');
      await button.tap();
      expect(await page.evaluate(() => getResult())).toEqual(['Touchstart: 0', 'Touchend: 0']);
    });
    it('should click the button inside an iframe', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await page.setContent('<div style="width:100px;height:100px">spacer</div>');
      await utils.attachFrame(page, 'button-test', server.PREFIX + '/input/button.html');
      const frame = page.frames()[1];
      const button = await frame.$('button');
      await button.click();
      expect(await frame.evaluate(() => window.result)).toBe('Clicked');
    });
    it('should click the button with deviceScaleFactor set', async({page, server}) => {
      await page.setViewport({width: 400, height: 400, deviceScaleFactor: 5});
      expect(await page.evaluate(() => window.devicePixelRatio)).toBe(5);
      await page.setContent('<div style="width:100px;height:100px">spacer</div>');
      await utils.attachFrame(page, 'button-test', server.PREFIX + '/input/button.html');
      const frame = page.frames()[1];
      const button = await frame.$('button');
      await button.click();
      expect(await frame.evaluate(() => window.result)).toBe('Clicked');
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
    function dimensions() {
      const rect = document.querySelector('textarea').getBoundingClientRect();
      return {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      };
    }
  });
};
