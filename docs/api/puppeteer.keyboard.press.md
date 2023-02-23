---
sidebar_label: Keyboard.press
---

# Keyboard.press() method

Shortcut for [Keyboard.down()](./puppeteer.keyboard.down.md) and [Keyboard.up()](./puppeteer.keyboard.up.md).

#### Signature:

```typescript
class Keyboard {
  press(
    key: KeyInput,
    options?: {
      delay?: number;
      text?: string;
      commands?: string[];
    }
  ): Promise<void>;
}
```

## Parameters

| Parameter | Type                                                      | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| key       | [KeyInput](./puppeteer.keyinput.md)                       | Name of key to press, such as <code>ArrowLeft</code>. See [KeyInput](./puppeteer.keyinput.md) for a list of all key names.                                                                                                                                                                                                                                                                                                                                                                                                  |
| options   | { delay?: number; text?: string; commands?: string\[\]; } | _(Optional)_ An object of options. Accepts text which, if specified, generates an input event with this text. Accepts delay which, if specified, is the time to wait between <code>keydown</code> and <code>keyup</code> in milliseconds. Defaults to 0. Accepts commands which, if specified, is the commands of keyboard shortcuts, see [Chromium Source Code](https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/core/editing/commands/editor_command_names.h) for valid command names. |

**Returns:**

Promise&lt;void&gt;

## Remarks

If `key` is a single character and no modifier keys besides `Shift` are being held down, a `keypress`/`input` event will also generated. The `text` option can be specified to force an input event to be generated.

Modifier keys DO effect [Keyboard.press()](./puppeteer.keyboard.press.md). Holding down `Shift` will type the text in upper case.
