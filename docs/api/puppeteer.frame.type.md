---
sidebar_label: Frame.type
---

# Frame.type() method

Sends a `keydown`, `keypress`/`input`, and `keyup` event for each character in the text.

#### Signature:

```typescript
class Frame &#123;type(selector: string, text: string, options?: Readonly<KeyboardTypeOptions>): Promise<void>;&#125;
```

## Parameters

| Parameter | Type                                                                      | Description                                                                                                                                     |
| --------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| selector  | string                                                                    | the selector for the element to type into. If there are multiple the first will be used.                                                        |
| text      | string                                                                    | text to type into the element                                                                                                                   |
| options   | Readonly&lt;[KeyboardTypeOptions](./puppeteer.keyboardtypeoptions.md)&gt; | _(Optional)_ takes one option, <code>delay</code>, which sets the time to wait between key presses in milliseconds. Defaults to <code>0</code>. |

**Returns:**

Promise&lt;void&gt;

## Remarks

To press a special key, like `Control` or `ArrowDown`, use [Keyboard.press()](./puppeteer.keyboard.press.md).

## Example

```ts
await frame.type('#mytextarea', 'Hello'); // Types instantly
await frame.type('#mytextarea', 'World', &#123;delay: 100&#125;); // Types slower, like a user
```
