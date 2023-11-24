---
sidebar_label: ElementHandle.type
---

# ElementHandle.type() method

Focuses the element, and then sends a `keydown`, `keypress`/`input`, and `keyup` event for each character in the text.

To press a special key, like `Control` or `ArrowDown`, use [ElementHandle.press()](./puppeteer.elementhandle.press.md).

#### Signature:

```typescript
class ElementHandle &#123;type(text: string, options?: Readonly<KeyboardTypeOptions>): Promise<void>;&#125;
```

## Parameters

| Parameter | Type                                                                      | Description                                        |
| --------- | ------------------------------------------------------------------------- | -------------------------------------------------- |
| text      | string                                                                    |                                                    |
| options   | Readonly&lt;[KeyboardTypeOptions](./puppeteer.keyboardtypeoptions.md)&gt; | _(Optional)_ Delay in milliseconds. Defaults to 0. |

**Returns:**

Promise&lt;void&gt;

## Example 1

```ts
await elementHandle.type('Hello'); // Types instantly
await elementHandle.type('World', &#123;delay: 100&#125;); // Types slower, like a user
```

## Example 2

An example of typing into a text field and then submitting the form:

```ts
const elementHandle = await page.$('input');
await elementHandle.type('some text');
await elementHandle.press('Enter');
```
