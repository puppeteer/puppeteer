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

import os from 'os';

import expect from 'expect';
import {KeyInput} from 'puppeteer-core/internal/common/USKeyboardLayout.js';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';
import {attachFrame} from './utils.js';

describe('Keyboard', function () {
  setupTestBrowserHooks();

  it('should type into a textarea', async () => {
    const {page} = await getTestState();

    await page.evaluate(() => {
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();
    });
    const text = 'Hello world. I am the text that was typed!';
    await page.keyboard.type(text);
    expect(
      await page.evaluate(() => {
        return document.querySelector('textarea')!.value;
      })
    ).toBe(text);
  });
  it('should press the metaKey', async () => {
    const {page, isFirefox} = await getTestState();

    await page.evaluate(() => {
      (window as any).keyPromise = new Promise(resolve => {
        return document.addEventListener('keydown', event => {
          return resolve(event.key);
        });
      });
    });
    await page.keyboard.press('Meta');
    expect(await page.evaluate('keyPromise')).toBe(
      isFirefox && os.platform() !== 'darwin' ? 'OS' : 'Meta'
    );
  });
  it('should move with the arrow keys', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/textarea.html');
    await page.type('textarea', 'Hello World!');
    expect(
      await page.evaluate(() => {
        return document.querySelector('textarea')!.value;
      })
    ).toBe('Hello World!');
    for (const _ of 'World!') {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.type('inserted ');
    expect(
      await page.evaluate(() => {
        return document.querySelector('textarea')!.value;
      })
    ).toBe('Hello inserted World!');
    await page.keyboard.down('Shift');
    for (const _ of 'inserted ') {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.up('Shift');
    await page.keyboard.press('Backspace');
    expect(
      await page.evaluate(() => {
        return document.querySelector('textarea')!.value;
      })
    ).toBe('Hello World!');
  });
  // @see https://github.com/puppeteer/puppeteer/issues/1313
  it('should trigger commands of keyboard shortcuts', async () => {
    const {page, server} = await getTestState();
    const cmdKey = os.platform() === 'darwin' ? 'Meta' : 'Control';

    await page.goto(server.PREFIX + '/input/textarea.html');
    await page.type('textarea', 'hello');

    await page.keyboard.down(cmdKey);
    await page.keyboard.press('a', {commands: ['SelectAll']});
    await page.keyboard.up(cmdKey);

    await page.keyboard.down(cmdKey);
    await page.keyboard.down('c', {commands: ['Copy']});
    await page.keyboard.up('c');
    await page.keyboard.up(cmdKey);

    await page.keyboard.down(cmdKey);
    await page.keyboard.press('v', {commands: ['Paste']});
    await page.keyboard.press('v', {commands: ['Paste']});
    await page.keyboard.up(cmdKey);

    expect(
      await page.evaluate(() => {
        return document.querySelector('textarea')!.value;
      })
    ).toBe('hellohello');
  });
  it('should send a character with ElementHandle.press', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/textarea.html');
    using textarea = (await page.$('textarea'))!;
    await textarea.press('a');
    expect(
      await page.evaluate(() => {
        return document.querySelector('textarea')!.value;
      })
    ).toBe('a');

    await page.evaluate(() => {
      return window.addEventListener(
        'keydown',
        e => {
          return e.preventDefault();
        },
        true
      );
    });

    await textarea.press('b');
    expect(
      await page.evaluate(() => {
        return document.querySelector('textarea')!.value;
      })
    ).toBe('a');
  });
  it('ElementHandle.press should not support |text| option', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/textarea.html');
    using textarea = (await page.$('textarea'))!;
    await textarea.press('a', {text: 'ё'});
    expect(
      await page.evaluate(() => {
        return document.querySelector('textarea')!.value;
      })
    ).toBe('a');
  });
  it('should send a character with sendCharacter', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/textarea.html');
    await page.focus('textarea');
    await page.keyboard.sendCharacter('嗨');
    expect(
      await page.evaluate(() => {
        return document.querySelector('textarea')!.value;
      })
    ).toBe('嗨');
    await page.evaluate(() => {
      return window.addEventListener(
        'keydown',
        e => {
          return e.preventDefault();
        },
        true
      );
    });
    await page.keyboard.sendCharacter('a');
    expect(
      await page.evaluate(() => {
        return document.querySelector('textarea')!.value;
      })
    ).toBe('嗨a');
  });
  it('should report shiftKey', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/keyboard.html');
    const keyboard = page.keyboard;
    const codeForKey = new Map<KeyInput, number>([
      ['Shift', 16],
      ['Alt', 18],
      ['Control', 17],
    ]);
    for (const [modifierKey, modifierCode] of codeForKey) {
      await keyboard.down(modifierKey);
      expect(
        await page.evaluate(() => {
          return (globalThis as any).getResult();
        })
      ).toBe(
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
      if (modifierKey === 'Shift') {
        expect(
          await page.evaluate(() => {
            return (globalThis as any).getResult();
          })
        ).toBe(
          'Keydown: ! Digit1 49 [' +
            modifierKey +
            ']\nKeypress: ! Digit1 33 33 [' +
            modifierKey +
            ']'
        );
      } else {
        expect(
          await page.evaluate(() => {
            return (globalThis as any).getResult();
          })
        ).toBe('Keydown: ! Digit1 49 [' + modifierKey + ']');
      }

      await keyboard.up('!');
      expect(
        await page.evaluate(() => {
          return (globalThis as any).getResult();
        })
      ).toBe('Keyup: ! Digit1 49 [' + modifierKey + ']');
      await keyboard.up(modifierKey);
      expect(
        await page.evaluate(() => {
          return (globalThis as any).getResult();
        })
      ).toBe(
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
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/keyboard.html');
    const keyboard = page.keyboard;
    await keyboard.down('Control');
    expect(
      await page.evaluate(() => {
        return (globalThis as any).getResult();
      })
    ).toBe('Keydown: Control ControlLeft 17 [Control]');
    await keyboard.down('Alt');
    expect(
      await page.evaluate(() => {
        return (globalThis as any).getResult();
      })
    ).toBe('Keydown: Alt AltLeft 18 [Alt Control]');
    await keyboard.down(';');
    expect(
      await page.evaluate(() => {
        return (globalThis as any).getResult();
      })
    ).toBe('Keydown: ; Semicolon 186 [Alt Control]');
    await keyboard.up(';');
    expect(
      await page.evaluate(() => {
        return (globalThis as any).getResult();
      })
    ).toBe('Keyup: ; Semicolon 186 [Alt Control]');
    await keyboard.up('Control');
    expect(
      await page.evaluate(() => {
        return (globalThis as any).getResult();
      })
    ).toBe('Keyup: Control ControlLeft 17 [Alt]');
    await keyboard.up('Alt');
    expect(
      await page.evaluate(() => {
        return (globalThis as any).getResult();
      })
    ).toBe('Keyup: Alt AltLeft 18 []');
  });
  it('should send proper codes while typing', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/keyboard.html');
    await page.keyboard.type('!');
    expect(
      await page.evaluate(() => {
        return (globalThis as any).getResult();
      })
    ).toBe(
      [
        'Keydown: ! Digit1 49 []',
        'Keypress: ! Digit1 33 33 []',
        'Keyup: ! Digit1 49 []',
      ].join('\n')
    );
    await page.keyboard.type('^');
    expect(
      await page.evaluate(() => {
        return (globalThis as any).getResult();
      })
    ).toBe(
      [
        'Keydown: ^ Digit6 54 []',
        'Keypress: ^ Digit6 94 94 []',
        'Keyup: ^ Digit6 54 []',
      ].join('\n')
    );
  });
  it('should send proper codes while typing with shift', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/keyboard.html');
    const keyboard = page.keyboard;
    await keyboard.down('Shift');
    await page.keyboard.type('~');
    expect(
      await page.evaluate(() => {
        return (globalThis as any).getResult();
      })
    ).toBe(
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
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/textarea.html');
    await page.focus('textarea');
    await page.evaluate(() => {
      window.addEventListener(
        'keydown',
        event => {
          event.stopPropagation();
          event.stopImmediatePropagation();
          if (event.key === 'l') {
            event.preventDefault();
          }
          if (event.key === 'o') {
            event.preventDefault();
          }
        },
        false
      );
    });
    await page.keyboard.type('Hello World!');
    expect(
      await page.evaluate(() => {
        return (globalThis as any).textarea.value;
      })
    ).toBe('He Wrd!');
  });
  it('should specify repeat property', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/textarea.html');
    await page.focus('textarea');
    await page.evaluate(() => {
      return document.querySelector('textarea')!.addEventListener(
        'keydown',
        e => {
          return ((globalThis as any).lastEvent = e);
        },
        true
      );
    });
    await page.keyboard.down('a');
    expect(
      await page.evaluate(() => {
        return (globalThis as any).lastEvent.repeat;
      })
    ).toBe(false);
    await page.keyboard.press('a');
    expect(
      await page.evaluate(() => {
        return (globalThis as any).lastEvent.repeat;
      })
    ).toBe(true);

    await page.keyboard.down('b');
    expect(
      await page.evaluate(() => {
        return (globalThis as any).lastEvent.repeat;
      })
    ).toBe(false);
    await page.keyboard.down('b');
    expect(
      await page.evaluate(() => {
        return (globalThis as any).lastEvent.repeat;
      })
    ).toBe(true);

    await page.keyboard.up('a');
    await page.keyboard.down('a');
    expect(
      await page.evaluate(() => {
        return (globalThis as any).lastEvent.repeat;
      })
    ).toBe(false);
  });
  it('should type all kinds of characters', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/textarea.html');
    await page.focus('textarea');
    const text = 'This text goes onto two lines.\nThis character is 嗨.';
    await page.keyboard.type(text);
    expect(await page.evaluate('result')).toBe(text);
  });
  it('should specify location', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/textarea.html');
    await page.evaluate(() => {
      window.addEventListener(
        'keydown',
        event => {
          return ((globalThis as any).keyLocation = event.location);
        },
        true
      );
    });
    using textarea = (await page.$('textarea'))!;

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
    const {page} = await getTestState();

    const error = await page.keyboard
      // @ts-expect-error bad input
      .press('NotARealKey')
      .catch(error_ => {
        return error_;
      });
    expect(error.message).toBe('Unknown key: "NotARealKey"');
  });
  it('should type emoji', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/textarea.html');
    await page.type('textarea', '👹 Tokyo street Japan 🇯🇵');
    expect(
      await page.$eval('textarea', textarea => {
        return textarea.value;
      })
    ).toBe('👹 Tokyo street Japan 🇯🇵');
  });
  it('should type emoji into an iframe', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.EMPTY_PAGE);
    await attachFrame(
      page,
      'emoji-test',
      server.PREFIX + '/input/textarea.html'
    );
    const frame = page.frames()[1]!;
    using textarea = (await frame.$('textarea'))!;
    await textarea.type('👹 Tokyo street Japan 🇯🇵');
    expect(
      await frame.$eval('textarea', textarea => {
        return textarea.value;
      })
    ).toBe('👹 Tokyo street Japan 🇯🇵');
  });
  it('should press the meta key', async () => {
    const {page, isFirefox} = await getTestState();

    await page.evaluate(() => {
      (globalThis as any).result = null;
      document.addEventListener('keydown', event => {
        (globalThis as any).result = [event.key, event.code, event.metaKey];
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
      boolean,
    ];
    if (isFirefox && os.platform() !== 'darwin') {
      expect(key).toBe('OS');
    } else {
      expect(key).toBe('Meta');
    }

    if (isFirefox) {
      expect(code).toBe('OSLeft');
    } else {
      expect(code).toBe('MetaLeft');
    }

    if (isFirefox && os.platform() !== 'darwin') {
      expect(metaKey).toBe(false);
    } else {
      expect(metaKey).toBe(true);
    }
  });
});
