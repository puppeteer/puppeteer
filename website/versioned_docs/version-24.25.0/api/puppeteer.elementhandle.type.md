---
sidebar_label: ElementHandle.type
---

# ElementHandle.type() method

Focuses the element, and then sends a `keydown`, `keypress`/`input`, and `keyup` event for each character in the text.

To press a special key, like `Control` or `ArrowDown`, use [ElementHandle.press()](./puppeteer.elementhandle.press.md).

### Signature

```typescript
class ElementHandle {
  type(text: string, options?: Readonly<KeyboardTypeOptions>): Promise<void>;
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

</td></tr>
<tr><td>

options

</td><td>

Readonly&lt;[KeyboardTypeOptions](./puppeteer.keyboardtypeoptions.md)&gt;

</td><td>

_(Optional)_ Delay in milliseconds. Defaults to 0.

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;

## Example 1

```ts
await elementHandle.type('Hello'); // Types instantly
await elementHandle.type('World', {delay: 100}); // Types slower, like a user
```

## Example 2

An example of typing into a text field and then submitting the form:

```ts
const elementHandle = await page.$('input');
await elementHandle.type('some text');
await elementHandle.press('Enter');
```
