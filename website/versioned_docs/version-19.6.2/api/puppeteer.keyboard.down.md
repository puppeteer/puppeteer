---
sidebar_label: Keyboard.down
---

# Keyboard.down() method

Dispatches a `keydown` event.

#### Signature:

```typescript
class Keyboard {
  down(
    key: KeyInput,
    options?: {
      text?: string;
      commands?: string[];
    }
  ): Promise<void>;
}
```

## Parameters

| Parameter | Type                                      | Description                                                                                                                                                                                                                                                                                                                                                                           |
| --------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| key       | [KeyInput](./puppeteer.keyinput.md)       | Name of key to press, such as <code>ArrowLeft</code>. See [KeyInput](./puppeteer.keyinput.md) for a list of all key names.                                                                                                                                                                                                                                                            |
| options   | { text?: string; commands?: string\[\]; } | <i>(Optional)</i> An object of options. Accepts text which, if specified, generates an input event with this text. Accepts commands which, if specified, is the commands of keyboard shortcuts, see [Chromium Source Code](https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/core/editing/commands/editor_command_names.h) for valid command names. |

**Returns:**

Promise&lt;void&gt;

## Remarks

If `key` is a single character and no modifier keys besides `Shift` are being held down, a `keypress`/`input` event will also generated. The `text` option can be specified to force an input event to be generated. If `key` is a modifier key, `Shift`, `Meta`, `Control`, or `Alt`, subsequent key presses will be sent with that modifier active. To release the modifier key, use [Keyboard.up()](./puppeteer.keyboard.up.md).

After the key is pressed once, subsequent calls to [Keyboard.down()](./puppeteer.keyboard.down.md) will have [repeat](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/repeat) set to true. To release the key, use [Keyboard.up()](./puppeteer.keyboard.up.md).

Modifier keys DO influence [Keyboard.down()](./puppeteer.keyboard.down.md). Holding down `Shift` will type the text in upper case.
