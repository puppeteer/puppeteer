---
sidebar_label: Page.type
---

# Page.type() method

Sends a `keydown`, `keypress/input`, and `keyup` event for each character in the text.

To press a special key, like `Control` or `ArrowDown`, use [Keyboard.press()](./puppeteer.keyboard.press.md).

### Signature

```typescript
class Page {
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

[selector](https://pptr.dev/guides/page-interactions#selectors) to query the page for. [CSS selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) can be passed as-is and a [Puppeteer-specific selector syntax](https://pptr.dev/guides/page-interactions#non-css-selectors) allows quering by [text](https://pptr.dev/guides/page-interactions#text-selectors--p-text), [a11y role and name](https://pptr.dev/guides/page-interactions#aria-selectors--p-aria), and [xpath](https://pptr.dev/guides/page-interactions#xpath-selectors--p-xpath) and [combining these queries across shadow roots](https://pptr.dev/guides/page-interactions#querying-elements-in-shadow-dom). Alternatively, you can specify the selector type using a [prefix](https://pptr.dev/guides/page-interactions#prefixed-selector-syntax).

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
