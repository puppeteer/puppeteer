---
sidebar_label: ElementHandle.press
---

# ElementHandle.press() method

Focuses the element, and then uses [Keyboard.down()](./puppeteer.keyboard.down.md) and [Keyboard.up()](./puppeteer.keyboard.up.md).

#### Signature:

```typescript
class ElementHandle {
  press(key: KeyInput, options?: Readonly<KeyPressOptions>): Promise<void>;
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

_(Optional)_

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;

## Remarks

If `key` is a single character and no modifier keys besides `Shift` are being held down, a `keypress`/`input` event will also be generated. The `text` option can be specified to force an input event to be generated.

**NOTE** Modifier keys DO affect `elementHandle.press`. Holding down `Shift` will type the text in upper case.
