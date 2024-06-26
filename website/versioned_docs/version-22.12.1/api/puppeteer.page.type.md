---
sidebar_label: Page.type
---

# Page.type() method

Sends a `keydown`, `keypress/input`, and `keyup` event for each character in the text.

To press a special key, like `Control` or `ArrowDown`, use [Keyboard.press()](./puppeteer.keyboard.press.md).

#### Signature:

```typescript
class Page {
  type(
    selector: string,
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

selector

</td><td>

string

</td><td>

A [selector](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) of an element to type into. If there are multiple elements satisfying the selector, the first will be used.

</td></tr>
<tr><td>

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

_(Optional)_ have property `delay` which is the Time to wait between key presses in milliseconds. Defaults to `0`.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;

## Example

```ts
await page.type('#mytextarea', 'Hello');
// Types instantly
await page.type('#mytextarea', 'World', {delay: 100});
// Types slower, like a user
```
