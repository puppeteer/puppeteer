/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import os from 'node:os';

import {assert} from 'chai';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';
import {assertMatchObject, attachFrame, html} from './utils.js';

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
    assert.strictEqual(
      await page.evaluate(() => {
        return document.querySelector('textarea')!.value;
      }),
      text,
    );
  });
  it('should move with the arrow keys', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/textarea.html');
    await page.type('textarea', 'Hello World!');
    assert.strictEqual(
      await page.evaluate(() => {
        return document.querySelector('textarea')!.value;
      }),
      'Hello World!',
    );
    for (const _ of 'World!') {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.type('inserted ');
    assert.strictEqual(
      await page.evaluate(() => {
        return document.querySelector('textarea')!.value;
      }),
      'Hello inserted World!',
    );
    await page.keyboard.down('Shift');
    for (const _ of 'inserted ') {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.up('Shift');
    await page.keyboard.press('Backspace');
    assert.strictEqual(
      await page.evaluate(() => {
        return document.querySelector('textarea')!.value;
      }),
      'Hello World!',
    );
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

    assert.strictEqual(
      await page.evaluate(() => {
        return document.querySelector('textarea')!.value;
      }),
      'hellohello',
    );
  });
  it('should send a character with ElementHandle.press', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/textarea.html');
    using textarea = (await page.$('textarea'))!;
    await textarea.press('a');
    assert.strictEqual(
      await page.evaluate(() => {
        return document.querySelector('textarea')!.value;
      }),
      'a',
    );

    await page.evaluate(() => {
      return window.addEventListener(
        'keydown',
        e => {
          return e.preventDefault();
        },
        true,
      );
    });

    await textarea.press('b');
    assert.strictEqual(
      await page.evaluate(() => {
        return document.querySelector('textarea')!.value;
      }),
      'a',
    );
  });
  it('ElementHandle.press should not support |text| option', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/textarea.html');
    using textarea = (await page.$('textarea'))!;
    await textarea.press('a', {text: 'ё'});
    assert.strictEqual(
      await page.evaluate(() => {
        return document.querySelector('textarea')!.value;
      }),
      'a',
    );
  });
  it('should send a character with sendCharacter', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/textarea.html');
    await page.focus('textarea');

    await page.evaluate(() => {
      (globalThis as any).inputCount = 0;
      (globalThis as any).keyDownCount = 0;
      window.addEventListener(
        'input',
        () => {
          (globalThis as any).inputCount += 1;
        },
        true,
      );
      window.addEventListener(
        'keydown',
        () => {
          (globalThis as any).keyDownCount += 1;
        },
        true,
      );
    });

    await page.keyboard.sendCharacter('嗨');
    assertMatchObject(
      await page.$eval('textarea', textarea => {
        return {
          value: textarea.value,
          inputs: (globalThis as any).inputCount,
          keyDowns: (globalThis as any).keyDownCount,
        };
      }),
      {value: '嗨', inputs: 1, keyDowns: 0},
    );

    await page.keyboard.sendCharacter('a');
    assertMatchObject(
      await page.$eval('textarea', textarea => {
        return {
          value: textarea.value,
          inputs: (globalThis as any).inputCount,
          keyDowns: (globalThis as any).keyDownCount,
        };
      }),
      {value: '嗨a', inputs: 2, keyDowns: 0},
    );
  });
  it('should send a character with sendCharacter in iframe', async () => {
    this.timeout(2000);

    const {page} = await getTestState();

    await page.setContent(html`
      <iframe
        srcdoc="<iframe name='test' srcdoc='<textarea></textarea>'></iframe>"
      ></iframe>
    `);
    const frame = await page.waitForFrame(async frame => {
      using element = await frame.frameElement();
      if (!element) {
        return false;
      }
      const name = await element.evaluate(frame => {
        return frame.name;
      });
      return name === 'test';
    });
    await frame.focus('textarea');

    await frame.evaluate(() => {
      (globalThis as any).inputCount = 0;
      (globalThis as any).keyDownCount = 0;
      window.addEventListener(
        'input',
        () => {
          (globalThis as any).inputCount += 1;
        },
        true,
      );
      window.addEventListener(
        'keydown',
        () => {
          (globalThis as any).keyDownCount += 1;
        },
        true,
      );
    });

    await page.keyboard.sendCharacter('嗨');
    assertMatchObject(
      await frame.$eval('textarea', textarea => {
        return {
          value: textarea.value,
          inputs: (globalThis as any).inputCount,
          keyDowns: (globalThis as any).keyDownCount,
        };
      }),
      {value: '嗨', inputs: 1, keyDowns: 0},
    );

    await page.keyboard.sendCharacter('a');
    assertMatchObject(
      await frame.$eval('textarea', textarea => {
        return {
          value: textarea.value,
          inputs: (globalThis as any).inputCount,
          keyDowns: (globalThis as any).keyDownCount,
        };
      }),
      {value: '嗨a', inputs: 2, keyDowns: 0},
    );
  });
  it('should report modifiers', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/keyboard.html');
    const keyboard = page.keyboard;

    // Shift modifier
    await keyboard.down('Shift');
    assert.strictEqual(
      await page.evaluate(() => {
        return (globalThis as any).getResult();
      }),
      'Keydown: Shift ShiftLeft [Shift]',
    );
    await keyboard.down('!');
    // Shift + ! produces an input event.
    assert.strictEqual(
      await page.evaluate(() => {
        return (globalThis as any).getResult();
      }),
      `Keydown: ! Digit1 [Shift]\n` + `input: ! insertText false`,
    );
    await keyboard.up('!');
    assert.strictEqual(
      await page.evaluate(() => {
        return (globalThis as any).getResult();
      }),
      'Keyup: ! Digit1 [Shift]',
    );
    await keyboard.up('Shift');
    assert.strictEqual(
      await page.evaluate(() => {
        return (globalThis as any).getResult();
      }),
      'Keyup: Shift ShiftLeft []',
    );

    // Alt modifier
    await keyboard.down('Alt');
    assert.strictEqual(
      await page.evaluate(() => {
        return (globalThis as any).getResult();
      }),
      'Keydown: Alt AltLeft [Alt]',
    );
    await keyboard.down('!');
    // Alt + ! should NOT produce an input event in Puppeteer for cross-platform
    // consistency.
    assert.strictEqual(
      await page.evaluate(() => {
        return (globalThis as any).getResult();
      }),
      'Keydown: ! Digit1 [Alt]',
    );
    await keyboard.up('!');
    assert.strictEqual(
      await page.evaluate(() => {
        return (globalThis as any).getResult();
      }),
      'Keyup: ! Digit1 [Alt]',
    );
    await keyboard.up('Alt');
    assert.strictEqual(
      await page.evaluate(() => {
        return (globalThis as any).getResult();
      }),
      'Keyup: Alt AltLeft []',
    );

    // Control modifier
    await keyboard.down('Control');
    assert.strictEqual(
      await page.evaluate(() => {
        return (globalThis as any).getResult();
      }),
      'Keydown: Control ControlLeft [Control]',
    );
    await keyboard.down('!');
    // Control + ! should NOT produce an input event.
    assert.strictEqual(
      await page.evaluate(() => {
        return (globalThis as any).getResult();
      }),
      'Keydown: ! Digit1 [Control]',
    );
    await keyboard.up('!');
    assert.strictEqual(
      await page.evaluate(() => {
        return (globalThis as any).getResult();
      }),
      'Keyup: ! Digit1 [Control]',
    );
    await keyboard.up('Control');
    assert.strictEqual(
      await page.evaluate(() => {
        return (globalThis as any).getResult();
      }),
      'Keyup: Control ControlLeft []',
    );
  });
  it('should report multiple modifiers', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/keyboard.html');
    const keyboard = page.keyboard;
    await keyboard.down('Control');
    assert.strictEqual(
      await page.evaluate(() => {
        return (globalThis as any).getResult();
      }),
      'Keydown: Control ControlLeft [Control]',
    );
    await keyboard.down('Alt');
    assert.strictEqual(
      await page.evaluate(() => {
        return (globalThis as any).getResult();
      }),
      'Keydown: Alt AltLeft [Alt Control]',
    );
    await keyboard.down(';');
    assert.strictEqual(
      await page.evaluate(() => {
        return (globalThis as any).getResult();
      }),
      'Keydown: ; Semicolon [Alt Control]',
    );
    await keyboard.up(';');
    assert.strictEqual(
      await page.evaluate(() => {
        return (globalThis as any).getResult();
      }),
      'Keyup: ; Semicolon [Alt Control]',
    );
    await keyboard.up('Control');
    assert.strictEqual(
      await page.evaluate(() => {
        return (globalThis as any).getResult();
      }),
      'Keyup: Control ControlLeft [Alt]',
    );
    await keyboard.up('Alt');
    assert.strictEqual(
      await page.evaluate(() => {
        return (globalThis as any).getResult();
      }),
      'Keyup: Alt AltLeft []',
    );
  });
  it('should send proper codes while typing', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/keyboard.html');
    await page.keyboard.type('!');
    assert.strictEqual(
      await page.evaluate(() => {
        return (globalThis as any).getResult();
      }),
      [
        'Keydown: ! Digit1 []',
        'input: ! insertText false',
        'Keyup: ! Digit1 []',
      ].join('\n'),
    );
    await page.keyboard.type('^');
    assert.strictEqual(
      await page.evaluate(() => {
        return (globalThis as any).getResult();
      }),
      [
        'Keydown: ^ Digit6 []',
        'input: ^ insertText false',
        'Keyup: ^ Digit6 []',
      ].join('\n'),
    );
  });
  it('should send proper codes while typing with shift', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/keyboard.html');
    const keyboard = page.keyboard;
    await keyboard.down('Shift');
    await page.keyboard.type('~');
    assert.strictEqual(
      await page.evaluate(() => {
        return (globalThis as any).getResult();
      }),
      [
        'Keydown: Shift ShiftLeft [Shift]',
        'Keydown: ~ Backquote [Shift]',
        'input: ~ insertText false',
        'Keyup: ~ Backquote [Shift]',
      ].join('\n'),
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
        false,
      );
    });
    await page.keyboard.type('Hello World!');
    assert.strictEqual(
      await page.evaluate(() => {
        return (globalThis as any).textarea.value;
      }),
      'He Wrd!',
    );
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
        true,
      );
    });
    await page.keyboard.down('a');
    assert.isFalse(
      await page.evaluate(() => {
        return (globalThis as any).lastEvent.repeat;
      }),
    );
    await page.keyboard.press('a');
    assert.isTrue(
      await page.evaluate(() => {
        return (globalThis as any).lastEvent.repeat;
      }),
    );

    await page.keyboard.down('b');
    assert.isFalse(
      await page.evaluate(() => {
        return (globalThis as any).lastEvent.repeat;
      }),
    );
    await page.keyboard.down('b');
    assert.isTrue(
      await page.evaluate(() => {
        return (globalThis as any).lastEvent.repeat;
      }),
    );

    await page.keyboard.up('a');
    await page.keyboard.down('a');
    assert.isFalse(
      await page.evaluate(() => {
        return (globalThis as any).lastEvent.repeat;
      }),
    );
  });
  it('should type all kinds of characters', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/textarea.html');
    await page.focus('textarea');
    const text = 'This text goes onto two lines.\nThis character is 嗨.';
    await page.keyboard.type(text);
    assert.strictEqual(await page.evaluate('result'), text);
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
        true,
      );
    });
    using textarea = (await page.$('textarea'))!;

    await textarea.press('Digit5');
    assert.strictEqual(await page.evaluate('keyLocation'), 0);

    await textarea.press('ControlLeft');
    assert.strictEqual(await page.evaluate('keyLocation'), 1);

    await textarea.press('ControlRight');
    assert.strictEqual(await page.evaluate('keyLocation'), 2);

    await textarea.press('NumpadSubtract');
    assert.strictEqual(await page.evaluate('keyLocation'), 3);
  });
  it('should throw on unknown keys', async () => {
    const {page} = await getTestState();

    const error = await page.keyboard
      // @ts-expect-error bad input
      .press('NotARealKey')
      .catch(error_ => {
        return error_;
      });
    assert.strictEqual(error.message, 'Unknown key: "NotARealKey"');
  });
  it('should type emoji', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.PREFIX + '/input/textarea.html');
    await page.type('textarea', '👹 Tokyo street Japan 🇯🇵');
    assert.strictEqual(
      await page.$eval('textarea', textarea => {
        return textarea.value;
      }),
      '👹 Tokyo street Japan 🇯🇵',
    );
  });
  it('should type emoji into an iframe', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.EMPTY_PAGE);
    await attachFrame(
      page,
      'emoji-test',
      server.PREFIX + '/input/textarea.html',
    );
    const frame = page.frames()[1]!;
    using textarea = (await frame.$('textarea'))!;
    await textarea.type('👹 Tokyo street Japan 🇯🇵');
    assert.strictEqual(
      await frame.$eval('textarea', textarea => {
        return textarea.value;
      }),
      '👹 Tokyo street Japan 🇯🇵',
    );
  });
  it('should press the meta key', async () => {
    // This test only makes sense on macOS.
    if (os.platform() !== 'darwin') {
      return;
    }
    const {page} = await getTestState();

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
    assert.strictEqual(key, 'Meta');
    assert.strictEqual(code, 'MetaLeft');
    assert.isTrue(metaKey);
  });
});
