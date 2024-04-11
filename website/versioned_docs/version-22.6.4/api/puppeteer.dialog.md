---
sidebar_label: Dialog
---

# Dialog class

Dialog instances are dispatched by the [Page](./puppeteer.page.md) via the `dialog` event.

#### Signature:

```typescript
export declare abstract class Dialog
```

## Remarks

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Dialog` class.

## Example

```ts
import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('dialog', async dialog => {
    console.log(dialog.message());
    await dialog.dismiss();
    await browser.close();
  });
  page.evaluate(() => alert('1'));
})();
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

[accept(promptText)](./puppeteer.dialog.accept.md)

</td><td>

</td><td>

A promise that resolves when the dialog has been accepted.

</td></tr>
<tr><td>

[defaultValue()](./puppeteer.dialog.defaultvalue.md)

</td><td>

</td><td>

The default value of the prompt, or an empty string if the dialog is not a `prompt`.

</td></tr>
<tr><td>

[dismiss()](./puppeteer.dialog.dismiss.md)

</td><td>

</td><td>

A promise which will resolve once the dialog has been dismissed

</td></tr>
<tr><td>

[message()](./puppeteer.dialog.message.md)

</td><td>

</td><td>

The message displayed in the dialog.

</td></tr>
<tr><td>

[type()](./puppeteer.dialog.type.md)

</td><td>

</td><td>

The type of the dialog.

</td></tr>
</tbody></table>
