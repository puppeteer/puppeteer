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

| Method                                               | Modifiers | Description |
| ---------------------------------------------------- | --------- | ----------- |
| [accept(promptText)](./puppeteer.dialog.accept.md)   |           |             |
| [defaultValue()](./puppeteer.dialog.defaultvalue.md) |           |             |
| [dismiss()](./puppeteer.dialog.dismiss.md)           |           |             |
| [message()](./puppeteer.dialog.message.md)           |           |             |
| [type()](./puppeteer.dialog.type.md)                 |           |             |
