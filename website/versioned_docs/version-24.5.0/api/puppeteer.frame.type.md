---
sidebar_label: Frame.type
---

# Frame.type() method

Sends a `keydown`, `keypress`/`input`, and `keyup` event for each character in the text.

### Signature

```typescript
class Frame {
  type(
    selector: string,
    text: string,
    options?: Readonly<KeyboardTypeOptions>,
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

selector

</td><td>

string

</td><td>

the selector for the element to type into. If there are multiple the first will be used.

</td></tr>
<tr><td>

text

</td><td>

string

</td><td>

text to type into the element

</td></tr>
<tr><td>

options

</td><td>

Readonly&lt;[KeyboardTypeOptions](./puppeteer.keyboardtypeoptions.md)&gt;

</td><td>

_(Optional)_ takes one option, `delay`, which sets the time to wait between key presses in milliseconds. Defaults to `0`.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;

## Remarks

To press a special key, like `Control` or `ArrowDown`, use [Keyboard.press()](./puppeteer.keyboard.press.md).

## Example

```ts
await frame.type('#mytextarea', 'Hello'); // Types instantly
await frame.type('#mytextarea', 'World', {delay: 100}); // Types slower, like a user
```
