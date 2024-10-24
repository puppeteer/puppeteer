---
sidebar_label: Keyboard.press
---

# Keyboard.press() method

Shortcut for [Keyboard.down()](./puppeteer.keyboard.down.md) and [Keyboard.up()](./puppeteer.keyboard.up.md).

### Signature

```typescript
class Keyboard {
  abstract press(
    key: KeyInput,
    options?: Readonly<KeyPressOptions>,
  ): Promise<void>;
}
```

## Parameters

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

key

</td><td>

[KeyInput](./puppeteer.keyinput.md)

</td><td>

Name of key to press, such as `ArrowLeft`. See [KeyInput](./puppeteer.keyinput.md) for a list of all key names.

</td></tr>
<tr><td>

options

</td><td>

Readonly&lt;[KeyPressOptions](./puppeteer.keypressoptions.md)&gt;

</td><td>

_(Optional)_ An object of options. Accepts text which, if specified, generates an input event with this text. Accepts delay which, if specified, is the time to wait between `keydown` and `keyup` in milliseconds. Defaults to 0. Accepts commands which, if specified, is the commands of keyboard shortcuts, see [Chromium Source Code](https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/core/editing/commands/editor_command_names.h) for valid command names.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;

## Remarks

If `key` is a single character and no modifier keys besides `Shift` are being held down, a `keypress`/`input` event will also generated. The `text` option can be specified to force an input event to be generated.

Modifier keys DO effect [Keyboard.press()](./puppeteer.keyboard.press.md). Holding down `Shift` will type the text in upper case.
