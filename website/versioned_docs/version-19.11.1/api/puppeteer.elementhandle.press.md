---
sidebar_label: ElementHandle.press
---

# ElementHandle.press() method

Focuses the element, and then uses [Keyboard.down()](./puppeteer.keyboard.down.md) and [Keyboard.up()](./puppeteer.keyboard.up.md).

#### Signature:

```typescript
class ElementHandle {
  press(key: KeyInput, options?: PressOptions): Promise<void>;
}
```

## Parameters

| Parameter | Type                                        | Description                                                                                                                |
| --------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| key       | [KeyInput](./puppeteer.keyinput.md)         | Name of key to press, such as <code>ArrowLeft</code>. See [KeyInput](./puppeteer.keyinput.md) for a list of all key names. |
| options   | [PressOptions](./puppeteer.pressoptions.md) | _(Optional)_                                                                                                               |

**Returns:**

Promise&lt;void&gt;

## Remarks

If `key` is a single character and no modifier keys besides `Shift` are being held down, a `keypress`/`input` event will also be generated. The `text` option can be specified to force an input event to be generated.

**NOTE** Modifier keys DO affect `elementHandle.press`. Holding down `Shift` will type the text in upper case.
