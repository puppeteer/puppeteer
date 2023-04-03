---
sidebar_label: Dialog
---

# Dialog class

Dialog instances are dispatched by the [Page](./puppeteer.page.md) via the `dialog` event.

#### Signature:

```typescript
export declare class Dialog
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

| Method                                               | Modifiers | Description                                                                                     |
| ---------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------- |
| [accept(promptText)](./puppeteer.dialog.accept.md)   |           | A promise that resolves when the dialog has been accepted.                                      |
| [defaultValue()](./puppeteer.dialog.defaultvalue.md) |           | The default value of the prompt, or an empty string if the dialog is not a <code>prompt</code>. |
| [dismiss()](./puppeteer.dialog.dismiss.md)           |           | A promise which will resolve once the dialog has been dismissed                                 |
| [message()](./puppeteer.dialog.message.md)           |           | The message displayed in the dialog.                                                            |
| [type()](./puppeteer.dialog.type.md)                 |           | The type of the dialog.                                                                         |
