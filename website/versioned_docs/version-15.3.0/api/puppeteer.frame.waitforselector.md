---
sidebar_label: Frame.waitForSelector
---

# Frame.waitForSelector() method

**Signature:**

```typescript
class Frame {
  waitForSelector<Selector extends keyof HTMLElementTagNameMap>(
    selector: Selector,
    options?: WaitForSelectorOptions
  ): Promise<ElementHandle<HTMLElementTagNameMap[Selector]> | null>;
}
```

## Parameters

| Parameter | Type                                                            | Description                                                                                                  |
| --------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| selector  | Selector                                                        | the selector to wait for.                                                                                    |
| options   | [WaitForSelectorOptions](./puppeteer.waitforselectoroptions.md) | <i>(Optional)</i> options to define if the element should be visible and how long to wait before timing out. |

**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;HTMLElementTagNameMap\[Selector\]&gt; \| null&gt;

a promise which resolves when an element matching the selector string is added to the DOM.

## Remarks

Wait for the `selector` to appear in page. If at the moment of calling the method the `selector` already exists, the method will return immediately. If the selector doesn't appear after the `timeout` milliseconds of waiting, the function will throw.

This method works across navigations.

## Example

```ts
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  let currentURL;
  page
    .mainFrame()
    .waitForSelector('img')
    .then(() => console.log('First URL with image: ' + currentURL));

  for (currentURL of [
    'https://example.com',
    'https://google.com',
    'https://bbc.com',
  ]) {
    await page.goto(currentURL);
  }
  await browser.close();
})();
```
