---
sidebar_label: Dialog
---

# Dialog class

Dialog instances are dispatched by the [Page](./puppeteer.page.md) via the `dialog` event.

### Signature

```typescript
export declare abstract class Dialog
```

## Remarks

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Dialog` class.

## Example

```ts
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();
const page = await browser.newPage();
page.on('dialog', async dialog => {
  console.log(dialog.message());
  await dialog.dismiss();
  await browser.close();
});
await page.evaluate(() => alert('1'));
```

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="accept">[accept(promptText)](./puppeteer.dialog.accept.md)</span>

</td><td>

</td><td>

A promise that resolves when the dialog has been accepted.

</td></tr>
<tr><td>

<span id="defaultvalue">[defaultValue()](./puppeteer.dialog.defaultvalue.md)</span>

</td><td>

</td><td>

The default value of the prompt, or an empty string if the dialog is not a `prompt`.

</td></tr>
<tr><td>

<span id="dismiss">[dismiss()](./puppeteer.dialog.dismiss.md)</span>

</td><td>

</td><td>

A promise which will resolve once the dialog has been dismissed

</td></tr>
<tr><td>

<span id="message">[message()](./puppeteer.dialog.message.md)</span>

</td><td>

</td><td>

The message displayed in the dialog.

</td></tr>
<tr><td>

<span id="type">[type()](./puppeteer.dialog.type.md)</span>

</td><td>

</td><td>

The type of the dialog.

</td></tr>
</tbody></table>
