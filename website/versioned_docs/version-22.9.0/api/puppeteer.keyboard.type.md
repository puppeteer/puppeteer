---
sidebar_label: Keyboard.type
---

# Keyboard.type() method

Sends a `keydown`, `keypress`/`input`, and `keyup` event for each character in the text.

#### Signature:

```typescript
class Keyboard {
  abstract type(
    text: string,
    options?: Readonly<KeyboardTypeOptions>
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

text

</td><td>

string

</td><td>

A text to type into a focused element.

</td></tr>
<tr><td>

options

</td><td>

Readonly&lt;[KeyboardTypeOptions](./puppeteer.keyboardtypeoptions.md)&gt;

</td><td>

_(Optional)_ An object of options. Accepts delay which, if specified, is the time to wait between `keydown` and `keyup` in milliseconds. Defaults to 0.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;

## Remarks

To press a special key, like `Control` or `ArrowDown`, use [Keyboard.press()](./puppeteer.keyboard.press.md).

Modifier keys DO NOT effect `keyboard.type`. Holding down `Shift` will not type the text in upper case.

## Example

```ts
await page.keyboard.type('Hello'); // Types instantly
await page.keyboard.type('World', {delay: 100}); // Types slower, like a user
```
