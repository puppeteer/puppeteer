---
sidebar_label: Page.type
---

# Page.type() method

Sends a `keydown`, `keypress/input`, and `keyup` event for each character in the text.

To press a special key, like `Control` or `ArrowDown`, use [Keyboard.press()](./puppeteer.keyboard.press.md).

#### Signature:

```typescript
class Page &#123;type(selector: string, text: string, options?: Readonly<KeyboardTypeOptions>): Promise<void>;&#125;
```

## Parameters

| Parameter | Type                                                                      | Description                                                                                                                                                                              |
| --------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| selector  | string                                                                    | A [selector](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) of an element to type into. If there are multiple elements satisfying the selector, the first will be used. |
| text      | string                                                                    | A text to type into a focused element.                                                                                                                                                   |
| options   | Readonly&lt;[KeyboardTypeOptions](./puppeteer.keyboardtypeoptions.md)&gt; | _(Optional)_ have property <code>delay</code> which is the Time to wait between key presses in milliseconds. Defaults to <code>0</code>.                                                 |

**Returns:**

Promise&lt;void&gt;

## Example

```ts
await page.type('#mytextarea', 'Hello');
// Types instantly
await page.type('#mytextarea', 'World', &#123;delay: 100&#125;);
// Types slower, like a user
```
